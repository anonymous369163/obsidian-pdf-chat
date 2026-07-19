const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function pdfKey(pathname) {
  return ["pdf", pathname].join(":");
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
    conversationKey: pdfKey("papers/reader.pdf"),
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
  const migratedSession = plain(migrated.settings.conversationSessions["session-reader"]);
  assert.equal(migratedSession.version, 3);
  assert.equal(migratedSession.id, legacySessions["session-reader"].id);
  assert.equal(migratedSession.conversationKey, legacySessions["session-reader"].conversationKey);
  assert.equal(migratedSession.title, legacySessions["session-reader"].title);
  assert.equal(migratedSession.sourceStatus, "available");
  assert.equal(migratedSession.pinned, false);
  assert.deepEqual(migratedSession.tags, []);
  assert.deepEqual(
    migratedSession.messages.map(({ role, content, status }) => ({ role, content, status })),
    legacySessions["session-reader"].messages,
  );
  assert.ok(migratedSession.messages.every((message) => message.id && message.createdAt));
  assert.deepEqual(plain(DEFAULT_SETTINGS.contextBudget), {
    maxInputChars: 60000,
    minRecentTurns: 6,
    maxSelectionChars: 20000,
  });
  assert.equal(DEFAULT_SETTINGS.readerDataVersion, 0);
  assert.equal(migrated.settings.readerDataVersion, 0);
  assert.deepEqual(plain(DEFAULT_SETTINGS.paperCacheQuota), {
    maxEntries: 100,
    maxBytes: 100 * 1024 * 1024,
  });
  assert.deepEqual(plain(migrated.settings.paperCacheQuota), plain(DEFAULT_SETTINGS.paperCacheQuota));
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

test("paper cache quotas repair invalid values and preserve valid limits", () => {
  const { migrateSettings } = loadBundle();
  const repaired = migrateSettings({ paperCacheQuota: { maxEntries: 0, maxBytes: -1 } });
  assert.deepEqual(plain(repaired.settings.paperCacheQuota), {
    maxEntries: 100,
    maxBytes: 100 * 1024 * 1024,
  });
  assert.equal(repaired.needsSave, true);

  const custom = migrateSettings({ paperCacheQuota: { maxEntries: 25, maxBytes: 8 * 1024 * 1024 } });
  assert.deepEqual(plain(custom.settings.paperCacheQuota), {
    maxEntries: 25,
    maxBytes: 8 * 1024 * 1024,
  });
});

function makeReaderState() {
  const primary = legacySession();
  const referenced = {
    ...legacySession(),
    id: "session-reference",
    conversationKey: pdfKey("papers/other.pdf"),
    referencedPdfPaths: ["papers/old.pdf", "papers/third.pdf"],
    updatedAt: 300,
  };
  return {
    conversationSessions: {
      [primary.id]: {
        ...primary,
        conversationKey: pdfKey("papers/old.pdf"),
      },
      [referenced.id]: referenced,
    },
    activeConversationSessionIds: {
      "pdf:papers/old.pdf": primary.id,
      "pdf:papers/other.pdf": referenced.id,
    },
    conversationHistories: {
      "pdf:papers/old.pdf": {
        version: 1,
        updatedAt: 200,
        messages: primary.messages,
      },
    },
    docSummaries: {
      "papers/old.pdf": {
        mtime: 1,
        summary: "old summary",
        generatedAt: 10,
        fullLength: 100,
        truncated: false,
      },
    },
    docChunks: {
      "papers/old.pdf": {
        mtime: 1,
        chunks: [{ idx: 0, page: 1, text: "evidence" }],
        fullTextLength: 100,
        generatedAt: 10,
      },
    },
  };
}

test("PDF rename migrates sessions, active mappings, references, histories, and caches", () => {
  const { reconcilePdfRenameState } = loadBundle();
  assert.equal(typeof reconcilePdfRenameState, "function");

  const result = reconcilePdfRenameState(
    makeReaderState(),
    "papers/old.pdf",
    "archive/new.pdf"
  );

  assert.equal(result.conversationSessions["session-reader"].conversationKey, "pdf:archive/new.pdf");
  assert.equal(result.conversationSessions["session-reader"].sourceStatus, "available");
  assert.deepEqual(
    plain(result.conversationSessions["session-reference"].referencedPdfPaths),
    ["archive/new.pdf", "papers/third.pdf"]
  );
  assert.equal(result.activeConversationSessionIds["pdf:papers/old.pdf"], undefined);
  assert.equal(result.activeConversationSessionIds["pdf:archive/new.pdf"], "session-reader");
  assert.equal(result.conversationHistories["pdf:papers/old.pdf"], undefined);
  assert.ok(result.conversationHistories["pdf:archive/new.pdf"]);
  assert.equal(result.docSummaries["papers/old.pdf"], undefined);
  assert.equal(result.docSummaries["archive/new.pdf"].summary, "old summary");
  assert.equal(result.docChunks["papers/old.pdf"], undefined);
  assert.equal(result.docChunks["archive/new.pdf"].chunks[0].text, "evidence");
});

test("PDF delete removes only regenerable caches and marks primary sessions missing", () => {
  const { reconcilePdfDeleteState } = loadBundle();
  assert.equal(typeof reconcilePdfDeleteState, "function");

  const result = reconcilePdfDeleteState(makeReaderState(), "papers/old.pdf");

  assert.equal(result.docSummaries["papers/old.pdf"], undefined);
  assert.equal(result.docChunks["papers/old.pdf"], undefined);
  assert.equal(result.conversationSessions["session-reader"].sourceStatus, "missing");
  assert.equal(result.conversationSessions["session-reader"].messages.length, 2);
  assert.deepEqual(
    plain(result.conversationSessions["session-reference"].referencedPdfPaths),
    ["papers/old.pdf", "papers/third.pdf"]
  );
  assert.ok(result.conversationHistories["pdf:papers/old.pdf"]);
});

test("vault lifecycle service registers PDF rename and delete handlers and persists serialized updates", async () => {
  const { VaultLifecycleService } = loadBundle();
  assert.equal(typeof VaultLifecycleService, "function");
  const callbacks = new Map();
  const registered = [];
  const vault = {
    on(name, callback) {
      callbacks.set(name, callback);
      return { name };
    },
  };
  let settings = makeReaderState();
  let saves = 0;
  const service = new VaultLifecycleService(
    vault,
    () => settings,
    (next) => {
      settings = next;
    },
    async () => {
      saves += 1;
    }
  );
  service.attach((event) => registered.push(event.name));

  assert.deepEqual(registered, ["rename", "delete"]);
  callbacks.get("rename")({ path: "archive/new.pdf" }, "papers/old.pdf");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settings.conversationSessions["session-reader"].conversationKey, "pdf:archive/new.pdf");
  assert.equal(saves, 1);

  callbacks.get("delete")({ path: "archive/new.pdf" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settings.conversationSessions["session-reader"].sourceStatus, "missing");
  assert.equal(saves, 2);
});
