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
  sandbox.fetch = async () => {
    throw new Error("Unexpected fetch in unit test");
  };
  vm.runInNewContext(source, sandbox, { filename: "main.js" });
  return sandbox.module.exports;
}

class MemoryJsonAdapter {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
  }
  async exists(filepath) {
    return this.files.has(filepath) || this.directories.has(filepath);
  }
  async read(filepath) {
    if (!this.files.has(filepath)) throw new Error("missing");
    return this.files.get(filepath);
  }
  async write(filepath, data) {
    this.files.set(filepath, data);
  }
  async rename(from, to) {
    if (!this.files.has(from)) throw new Error("missing source");
    this.files.set(to, this.files.get(from));
    this.files.delete(from);
  }
  async remove(filepath) {
    this.files.delete(filepath);
  }
  async mkdir(filepath) {
    this.directories.add(filepath);
  }
}

function session(id, pathname, updatedAt) {
  return {
    version: 2,
    id,
    conversationKey: pdfKey(pathname),
    title: `Discussion ${id}`,
    mode: "chat",
    messages: [
      { role: "user", content: `Question ${id}`, status: "complete" },
      { role: "assistant", content: `Answer ${id}`, status: "complete" },
    ],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    api: { modelId: "model", presetId: "__default__" },
    createdAt: updatedAt - 1,
    updatedAt,
  };
}

test("session repository writes independent sanitized entities and ordered index entries", async () => {
  const { SessionRepository } = loadBundle();
  assert.equal(typeof SessionRepository, "function");
  const adapter = new MemoryJsonAdapter();
  const repository = new SessionRepository(adapter);
  await repository.initialize();
  const first = {
    ...session("s1", "papers/one.pdf", 10),
    ["api" + "Key"]: "not-stored",
    ["end" + "point"]: "not-stored",
  };
  const second = { ...session("s2", "papers/two.pdf", 20), hiddenContext: "not-stored" };

  await repository.save(first);
  await repository.save(second);

  assert.deepEqual(Array.from(repository.list(), (entry) => entry.id), ["s2", "s1"]);
  assert.equal(repository.get("s1").messages[0].content, "Question s1");
  const serialized = Array.from(adapter.files.values()).join("\n");
  assert.doesNotMatch(serialized, /apiKey|endpoint|hiddenContext|not-stored/);

  const reloaded = new SessionRepository(adapter);
  const all = await reloaded.initialize();
  assert.deepEqual(Object.keys(all).sort(), ["s1", "s2"]);
  await reloaded.remove("s1");
  assert.equal(reloaded.get("s1"), null);
  assert.equal(reloaded.get("s2").id, "s2");
});

test("session repository repairs an index entry whose entity is missing", async () => {
  const { SessionRepository } = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const repository = new SessionRepository(adapter);
  await repository.initialize();
  await repository.save(session("missing", "papers/missing.pdf", 10));
  const index = JSON.parse(adapter.files.get("reader-data/sessions/index.json"));
  adapter.files.delete(`reader-data/sessions/${index.entries[0].fileName}`);

  const reloaded = new SessionRepository(adapter);
  const all = await reloaded.initialize();

  assert.deepEqual(Object.keys(all), []);
  assert.deepEqual(JSON.parse(adapter.files.get("reader-data/sessions/index.json")).entries, []);
});

test("session repository rekeys primary and referenced PDF paths without changing session IDs", async () => {
  const { SessionRepository } = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const repository = new SessionRepository(adapter);
  await repository.initialize();
  const primary = session("primary", "papers/old.pdf", 10);
  const referenced = {
    ...session("referenced", "papers/other.pdf", 20),
    referencedPdfPaths: ["papers/old.pdf"],
  };
  await repository.save(primary);
  await repository.save(referenced);

  await repository.rekeyPdf("papers/old.pdf", "archive/new.pdf");

  assert.equal(repository.get("primary").conversationKey, pdfKey("archive/new.pdf"));
  assert.deepEqual(Array.from(repository.get("referenced").referencedPdfPaths), ["archive/new.pdf"]);
});

test("paper repository supports exact-path lookup, rename, delete, and usage accounting", async () => {
  const { PaperAssetRepository } = loadBundle();
  assert.equal(typeof PaperAssetRepository, "function");
  const adapter = new MemoryJsonAdapter();
  let now = 100;
  const repository = new PaperAssetRepository(adapter, undefined, () => now++);
  await repository.initialize();
  await repository.save("papers/one.pdf", {
    summary: { summary: "Summary", generatedAt: 1, fullLength: 100, truncated: false },
    chunks: { chunks: [{ page: 1, text: "Evidence", idx: 0 }], fullTextLength: 100, generatedAt: 1 },
  });

  assert.equal(repository.get("papers/one.pdf").summary.summary, "Summary");
  assert.ok(repository.usage().bytes > 0);
  await repository.rename("papers/one.pdf", "archive/renamed.pdf");
  assert.equal(repository.get("papers/one.pdf"), null);
  assert.equal(repository.get("archive/renamed.pdf").vaultPath, "archive/renamed.pdf");
  await repository.remove("archive/renamed.pdf");
  assert.equal(repository.usage().entries, 0);
});

test("paper cache eviction is deterministic and protects requested paths", async () => {
  const { PaperAssetRepository } = loadBundle();
  const adapter = new MemoryJsonAdapter();
  let clock = 1;
  const repository = new PaperAssetRepository(adapter, undefined, () => clock++);
  await repository.initialize();
  for (const pathname of ["papers/old.pdf", "papers/middle.pdf", "papers/new.pdf"]) {
    await repository.save(pathname, {
      summary: { summary: `${pathname} ${"text ".repeat(40)}`, generatedAt: clock, fullLength: 500, truncated: false },
    });
  }

  const evicted = await repository.evict({
    maxEntries: 1,
    maxBytes: Number.MAX_SAFE_INTEGER,
    protectedPaths: ["papers/old.pdf"],
  });

  assert.deepEqual(Array.from(evicted), ["papers/middle.pdf", "papers/new.pdf"]);
  assert.equal(repository.get("papers/old.pdf").vaultPath, "papers/old.pdf");
  assert.equal(repository.usage().entries, 1);
});

test("reader repositories reject absolute vault paths", async () => {
  const { PaperAssetRepository, SessionRepository } = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const papers = new PaperAssetRepository(adapter);
  const sessions = new SessionRepository(adapter);
  await papers.initialize();
  await sessions.initialize();

  await assert.rejects(papers.save("C:/private/paper.pdf", { summary: null }), /relative|vault/i);
  await assert.rejects(
    sessions.save({ ...session("absolute", "papers/a.pdf", 1), conversationKey: pdfKey("C:/private/a.pdf") }),
    /relative|vault/i
  );
});
