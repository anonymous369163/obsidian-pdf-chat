const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const pdfKey = (pathname) => ["pdf", pathname].join(":");

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
  constructor() { this.files = new Map(); this.directories = new Set(); }
  async exists(filepath) { return this.files.has(filepath) || this.directories.has(filepath); }
  async read(filepath) { if (!this.files.has(filepath)) throw new Error("missing"); return this.files.get(filepath); }
  async write(filepath, data) { this.files.set(filepath, data); }
  async rename(from, to) { if (!this.files.has(from)) throw new Error("missing source"); this.files.set(to, this.files.get(from)); this.files.delete(from); }
  async remove(filepath) { this.files.delete(filepath); }
  async mkdir(filepath) { this.directories.add(filepath); }
}

class FakeSessionRepository {
  constructor() { this.entities = new Map(); this.saveCalls = 0; this.failSave = false; this.corruptReads = false; }
  async initialize() { return Object.fromEntries(this.entities); }
  async save(session) { this.saveCalls += 1; if (this.failSave) throw new Error("session write failed"); this.entities.set(session.id, plain(session)); }
  get(id) { if (this.corruptReads) return null; return this.entities.has(id) ? plain(this.entities.get(id)) : null; }
}

class FakePaperRepository {
  constructor() { this.entities = new Map(); this.saveCalls = 0; }
  async initialize() { return Object.fromEntries(this.entities); }
  async save(pathname, entry) { this.saveCalls += 1; this.entities.set(pathname, { vaultPath: pathname, ...plain(entry) }); }
  get(pathname) { return this.entities.has(pathname) ? plain(this.entities.get(pathname)) : null; }
}

function legacySettings(bundle) {
  const settings = plain(bundle.DEFAULT_SETTINGS);
  settings.models = [{ id: "private-model", ["api" + "Key"]: "local-only", ["end" + "point"]: "local-only" }];
  settings.systemPrompt = "private prompt";
  settings.readerDataVersion = 0;
  settings.conversationSessions = {
    s1: {
      version: 2,
      id: "s1",
      conversationKey: pdfKey("papers/demo.pdf"),
      title: "Discussion",
      mode: "chat",
      messages: [
        { role: "user", content: "Question", status: "complete" },
        { role: "assistant", content: "Answer", status: "complete" },
      ],
      referencedPdfPaths: [],
      includeCurrentPdfInCodex: true,
      createdAt: 1,
      updatedAt: 2,
    },
  };
  settings.activeConversationSessionIds = { [pdfKey("papers/demo.pdf")]: "s1" };
  settings.conversationHistories = {};
  settings.docSummaries = { "papers/demo.pdf": { summary: "Summary", generatedAt: 1, fullLength: 100, truncated: false } };
  settings.docChunks = { "papers/demo.pdf": { chunks: [{ page: 1, text: "Evidence", idx: 0 }], fullTextLength: 100, generatedAt: 1 } };
  return settings;
}

test("checkpointed migration writes validated reader entities before stripping legacy settings", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const sessions = new FakeSessionRepository();
  const papers = new FakePaperRepository();
  const committed = [];
  const migrator = new bundle.ReaderDataMigrator(adapter, sessions, papers, async (settings) => committed.push(plain(settings)), () => 100);
  const result = await migrator.migrate(legacySettings(bundle));
  assert.equal(result.migrated, true);
  assert.equal(result.fallback, false);
  assert.equal(sessions.get("s1").messages[1].content, "Answer");
  assert.equal(sessions.get("s1").version, 3);
  assert.ok(sessions.get("s1").messages.every((message) => message.id && Number.isFinite(message.createdAt)));
  assert.equal(papers.get("papers/demo.pdf").summary.summary, "Summary");
  assert.equal(committed.length, 1);
  assert.equal(committed[0].readerDataVersion, 1);
  assert.deepEqual(committed[0].conversationSessions, {});
  assert.deepEqual(committed[0].docChunks, {});
  assert.equal(committed[0].models[0]["api" + "Key"], "local-only");
  const snapshot = adapter.files.get("reader-data/migration/legacy-reader-data.json");
  assert.doesNotMatch(snapshot, /apiKey|endpoint|Bearer|systemPrompt|local-only/);
  assert.equal(JSON.parse(adapter.files.get("reader-data/meta.json")).migration.state, "complete");
});

test("completed migration is idempotent and does not rewrite entities", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const sessions = new FakeSessionRepository();
  const papers = new FakePaperRepository();
  let latest;
  const migrator = new bundle.ReaderDataMigrator(adapter, sessions, papers, async (settings) => { latest = plain(settings); });
  await migrator.migrate(legacySettings(bundle));
  const sessionWrites = sessions.saveCalls;
  const paperWrites = papers.saveCalls;
  const second = await migrator.migrate(latest);
  assert.equal(second.migrated, false);
  assert.equal(second.fallback, false);
  assert.equal(sessions.saveCalls, sessionWrites);
  assert.equal(papers.saveCalls, paperWrites);
});

test("migration failure before settings strip keeps all legacy maps usable", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const sessions = new FakeSessionRepository();
  sessions.failSave = true;
  let commits = 0;
  const migrator = new bundle.ReaderDataMigrator(adapter, sessions, new FakePaperRepository(), async () => { commits += 1; });
  const legacy = legacySettings(bundle);
  const before = plain(legacy);
  const result = await migrator.migrate(legacy);
  assert.equal(result.fallback, true);
  assert.equal(commits, 0);
  assert.deepEqual(plain(legacy.conversationSessions), before.conversationSessions);
  assert.deepEqual(plain(legacy.docSummaries), before.docSummaries);
});

test("migration retries after interruption during the final settings checkpoint", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const sessions = new FakeSessionRepository();
  const papers = new FakePaperRepository();
  let failCommit = true;
  let committed;
  const migrator = new bundle.ReaderDataMigrator(adapter, sessions, papers, async (settings) => {
    if (failCommit) throw new Error("settings save interrupted");
    committed = plain(settings);
  });
  const legacy = legacySettings(bundle);
  const first = await migrator.migrate(legacy);
  assert.equal(first.fallback, true);
  assert.equal(JSON.parse(adapter.files.get("reader-data/meta.json")).migration.state, "validated");
  failCommit = false;
  const second = await migrator.migrate(legacy);
  assert.equal(second.migrated, true);
  assert.equal(committed.readerDataVersion, 1);
  assert.equal(JSON.parse(adapter.files.get("reader-data/meta.json")).migration.state, "complete");
});

test("migration refuses to strip settings when a written entity cannot be read back", async () => {
  const bundle = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const sessions = new FakeSessionRepository();
  sessions.corruptReads = true;
  let commits = 0;
  const migrator = new bundle.ReaderDataMigrator(adapter, sessions, new FakePaperRepository(), async () => { commits += 1; });
  const result = await migrator.migrate(legacySettings(bundle));
  assert.equal(result.fallback, true);
  assert.equal(commits, 0);
});
