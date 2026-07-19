const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

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
  constructor(initial = {}) {
    this.files = new Map(Object.entries(initial));
    this.directories = new Set();
    this.failRenameOnce = false;
    this.writeDelay = 0;
  }

  async exists(filepath) {
    return this.files.has(filepath) || this.directories.has(filepath);
  }

  async read(filepath) {
    if (!this.files.has(filepath)) throw new Error("missing");
    return this.files.get(filepath);
  }

  async write(filepath, data) {
    if (this.writeDelay) await new Promise((resolve) => setTimeout(resolve, this.writeDelay));
    this.files.set(filepath, data);
  }

  async rename(from, to) {
    if (this.failRenameOnce) {
      this.failRenameOnce = false;
      throw new Error("rename failed");
    }
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

function validateDocument(value) {
  if (!value || typeof value !== "object" || value.version !== 1 || typeof value.value !== "string") {
    throw new Error("invalid document");
  }
  return { version: 1, value: value.value };
}

test("atomic store keeps the last good document when replacement fails", async () => {
  const { AtomicJsonStore } = loadBundle();
  assert.equal(typeof AtomicJsonStore, "function");
  const adapter = new MemoryJsonAdapter({ "reader/item.json": '{"version":1,"value":"old"}' });
  const store = new AtomicJsonStore(adapter, "reader/item.json", validateDocument);
  adapter.failRenameOnce = true;

  await assert.rejects(store.write({ version: 1, value: "new" }), /replace|write/i);

  assert.equal((await store.read()).value, "old");
  assert.equal(adapter.files.has("reader/item.json.tmp"), false);
});

test("atomic store restores a validated backup when the primary is corrupt", async () => {
  const { AtomicJsonStore } = loadBundle();
  const adapter = new MemoryJsonAdapter({
    "reader/item.json": "{broken",
    "reader/item.json.bak": '{"version":1,"value":"last-good"}',
  });
  const store = new AtomicJsonStore(adapter, "reader/item.json", validateDocument);

  const value = await store.readWithBackup();

  assert.deepEqual(JSON.parse(JSON.stringify(value)), { version: 1, value: "last-good" });
  assert.equal(JSON.parse(adapter.files.get("reader/item.json")).value, "last-good");
});

test("atomic store serializes concurrent writes and keeps the latest value", async () => {
  const { AtomicJsonStore } = loadBundle();
  const adapter = new MemoryJsonAdapter();
  adapter.writeDelay = 2;
  const store = new AtomicJsonStore(adapter, "reader/item.json", validateDocument);

  await Promise.all([
    store.write({ version: 1, value: "first" }),
    store.write({ version: 1, value: "second" }),
    store.write({ version: 1, value: "third" }),
  ]);

  assert.equal((await store.read()).value, "third");
});

test("atomic store validates before replacing and redacts absolute paths from errors", async () => {
  const { AtomicJsonStore } = loadBundle();
  const adapter = new MemoryJsonAdapter();
  const store = new AtomicJsonStore(adapter, "C:/private-vault/reader/item.json", validateDocument);

  await assert.rejects(
    store.write({ version: 2, value: "bad" }),
    (error) => !String(error.message).includes("private-vault") && /validation|write/i.test(error.message)
  );
});
