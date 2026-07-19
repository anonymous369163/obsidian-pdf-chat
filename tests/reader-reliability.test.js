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
  const filename = path.join(projectRoot, "main.js");
  const source = fs.readFileSync(filename, "utf8");
  class Plugin {}
  class Modal {
    constructor(app) {
      this.app = app;
      this.contentEl = { empty() {} };
    }
  }
  class PluginSettingTab {}
  class Notice {}
  class Setting {}
  const sandbox = {
    AbortController,
    TextDecoder,
    URL,
    clearTimeout,
    console,
    fetch: async () => {
      throw new Error("Unexpected fetch in unit test");
    },
    module: { exports: {} },
    require(request) {
      if (request === "obsidian") {
        return {
          MarkdownRenderer: {},
          Modal,
          Notice,
          Plugin,
          PluginSettingTab,
          Setting,
          requestUrl: async () => ({}),
        };
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    window: {},
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(source, sandbox, { filename });
  return sandbox.module.exports;
}

function legacySession() {
  return {
    version: 2,
    id: "session-reader",
    conversationKey: "pdf:papers/reader.pdf",
    title: "Reader discussion",
    mode: "chat",
    messages: [
      { role: "user", content: "What is the contribution?", status: "complete" },
      { role: "assistant", content: "A concise answer.", status: "complete" },
    ],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    createdAt: 100,
    updatedAt: 200,
  };
}

test("0.8.2 settings add bounded context defaults without deleting legacy state", () => {
  const { DEFAULT_SETTINGS, migrateSettings } = loadBundle();
  const legacySessions = { "session-reader": legacySession() };

  const migrated = migrateSettings({ conversationSessions: legacySessions });

  assert.deepEqual(plain(migrated.settings.contextBudget), {
    maxInputChars: 60000,
    minRecentTurns: 6,
    maxSelectionChars: 20000,
  });
  assert.deepEqual(plain(migrated.settings.conversationSessions), legacySessions);
  assert.deepEqual(plain(DEFAULT_SETTINGS.contextBudget), {
    maxInputChars: 60000,
    minRecentTurns: 6,
    maxSelectionChars: 20000,
  });
  assert.equal(migrated.needsSave, true);
});

test("invalid context budgets are repaired while valid custom values are preserved", () => {
  const { migrateSettings } = loadBundle();

  const repaired = migrateSettings({
    contextBudget: { maxInputChars: -1, minRecentTurns: 0, maxSelectionChars: 1.5 },
  });
  assert.deepEqual(plain(repaired.settings.contextBudget), {
    maxInputChars: 60000,
    minRecentTurns: 6,
    maxSelectionChars: 20000,
  });
  assert.equal(repaired.needsSave, true);

  const custom = migrateSettings({
    contextBudget: { maxInputChars: 80000, minRecentTurns: 8, maxSelectionChars: 12000 },
  });
  assert.deepEqual(plain(custom.settings.contextBudget), {
    maxInputChars: 80000,
    minRecentTurns: 8,
    maxSelectionChars: 12000,
  });
});
