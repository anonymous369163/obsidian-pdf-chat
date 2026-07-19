const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadBundle() {
  const source = fs.readFileSync(path.join(projectRoot, "main.js"), "utf8");
  class Plugin {}
  class Modal {}
  class PluginSettingTab {}
  class Notice {}
  class Setting {}
  const sandbox = {
    AbortController,
    TextDecoder,
    URL,
    clearTimeout,
    console,
    module: { exports: {} },
    require(request) {
      if (request === "obsidian") {
        return { Plugin, Modal, PluginSettingTab, Notice, Setting, MarkdownRenderer: {}, requestUrl: async () => ({}) };
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    window: {},
  };
  sandbox.exports = sandbox.module.exports;
  sandbox.fetch = async () => { throw new Error("Unexpected fetch in unit test"); };
  vm.runInNewContext(source, sandbox, { filename: "main.js" });
  return sandbox.module.exports;
}

class MemoryJsonAdapter {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
    this.writes = [];
    this.failWrites = false;
  }
  async exists(filepath) { return this.files.has(filepath) || this.directories.has(filepath); }
  async read(filepath) { if (!this.files.has(filepath)) throw new Error("missing"); return this.files.get(filepath); }
  async write(filepath, data) {
    if (this.failWrites) throw new Error("write failed");
    this.writes.push(filepath);
    this.files.set(filepath, data);
  }
  async rename(from, to) {
    if (!this.files.has(from)) throw new Error("missing source");
    this.files.set(to, this.files.get(from));
    this.files.delete(from);
  }
  async remove(filepath) { this.files.delete(filepath); }
  async mkdir(filepath) { this.directories.add(filepath); }
}

function session(id, updatedAt) {
  return {
    version: 2,
    id,
    conversationKey: ["pdf", `papers/${id}.pdf`].join(":"),
    title: id,
    mode: "chat",
    messages: [{ role: "user", content: `question-${id}`, status: "complete" }],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    createdAt: 1,
    updatedAt,
  };
}

function legacySettings(bundle) {
  const settings = plain(bundle.DEFAULT_SETTINGS);
  settings.readerDataVersion = 0;
  settings.conversationSessions = { s1: session("s1", 2), s2: session("s2", 3) };
  settings.activeConversationSessionIds = {
    [["pdf", "papers/s1.pdf"].join(":")]: "s1",
  };
  settings.docSummaries = {
    "papers/s1.pdf": { summary: "summary", generatedAt: 1, fullLength: 100, truncated: false },
  };
  settings.docChunks = {};
  return settings;
}

test("reader data store hydrates runtime maps while persisted settings stay small", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const commits = [];
  const store = new bundle.ReaderDataStore(adapter);
  const result = await store.initialize(legacySettings(bundle), async (settings) => commits.push(plain(settings)));

  assert.equal(result.fallback, false);
  assert.equal(result.settings.conversationSessions.s1.title, "s1");
  assert.equal(result.settings.docSummaries["papers/s1.pdf"].summary, "summary");
  assert.deepEqual(commits[0].conversationSessions, {});
  assert.deepEqual(commits[0].docSummaries, {});
  const persisted = store.settingsForPersistence(result.settings);
  assert.deepEqual(plain(persisted.conversationSessions), {});
  assert.deepEqual(plain(persisted.docChunks), {});
  assert.equal(persisted.activeConversationSessionIds[["pdf", "papers/s1.pdf"].join(":")], "s1");
});

test("runtime synchronization rewrites only the changed session entity", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const store = new bundle.ReaderDataStore(adapter);
  const result = await store.initialize(legacySettings(bundle), async () => undefined);
  const index = JSON.parse(adapter.files.get("reader-data/sessions/index.json"));
  const s1File = index.entries.find((entry) => entry.id === "s1").fileName;
  const s2File = index.entries.find((entry) => entry.id === "s2").fileName;
  adapter.writes = [];

  result.settings.conversationSessions.s1.messages.push({ role: "assistant", content: "answer", status: "complete" });
  result.settings.conversationSessions.s1.updatedAt = 10;
  await store.synchronize(result.settings);

  assert.ok(adapter.writes.some((filepath) => filepath.includes(s1File)));
  assert.ok(!adapter.writes.some((filepath) => filepath.includes(s2File)));
});

test("a fresh store restores reader entities from stripped settings", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  let stripped;
  const first = new bundle.ReaderDataStore(adapter);
  await first.initialize(legacySettings(bundle), async (settings) => { stripped = plain(settings); });

  const second = new bundle.ReaderDataStore(adapter);
  const restored = await second.initialize(stripped, async () => undefined);
  assert.equal(restored.settings.conversationSessions.s2.messages[0].content, "question-s2");
  assert.equal(restored.settings.docSummaries["papers/s1.pdf"].summary, "summary");
});

test("reader data initialization falls back to legacy maps if atomic storage is unavailable", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  adapter.failWrites = true;
  const legacy = legacySettings(bundle);
  const store = new bundle.ReaderDataStore(adapter);
  const result = await store.initialize(legacy, async () => {
    throw new Error("must not commit stripped settings");
  });
  assert.equal(result.fallback, true);
  assert.equal(result.settings.readerDataVersion, 0);
  assert.equal(result.settings.conversationSessions.s1.title, "s1");
  assert.deepEqual(plain(store.settingsForPersistence(result.settings).conversationSessions), plain(legacy.conversationSessions));
});

test("plugin settings lifecycle persists small settings and keeps hydrated reader state", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const saved = [];
  const plugin = new bundle.default();
  plugin.app = { vault: { adapter } };
  plugin._saveQueue = Promise.resolve();
  plugin.loadData = async () => legacySettings(bundle);
  plugin.saveData = async (settings) => saved.push(plain(settings));

  await plugin.loadSettings();
  assert.ok(plugin.readerDataStore instanceof bundle.ReaderDataStore);
  assert.equal(plugin.settings.conversationSessions.s1.title, "s1");
  assert.deepEqual(saved.at(-1).conversationSessions, {});

  plugin.settings.conversationSessions.s1.title = "updated title";
  await plugin.saveSettings();
  assert.deepEqual(saved.at(-1).conversationSessions, {});
  const restored = plugin.readerDataStore.sessions.get("s1");
  assert.equal(restored.title, "updated title");
});

test("plugin settings lifecycle retains legacy persistence when no compatible adapter exists", async () => {
  const bundle = loadBundle();
  const saved = [];
  const plugin = new bundle.default();
  plugin.app = { vault: {} };
  plugin._saveQueue = Promise.resolve();
  plugin.loadData = async () => legacySettings(bundle);
  plugin.saveData = async (settings) => saved.push(plain(settings));

  await plugin.loadSettings();
  assert.equal(plugin.readerDataStore, undefined);
  await plugin.saveSettings();
  assert.equal(saved.at(-1).conversationSessions.s2.title, "s2");
});
