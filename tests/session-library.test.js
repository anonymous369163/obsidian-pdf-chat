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
        return {
          Plugin,
          Modal,
          PluginSettingTab,
          Notice,
          Setting,
          MarkdownRenderer: {},
          requestUrl: async () => ({}),
        };
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    window: {},
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(source, sandbox, { filename: "main.js" });
  return sandbox.module.exports;
}

function makeSession(id, overrides = {}) {
  return {
    version: 3,
    id,
    ["conversation" + "Key"]: "pdf:papers/A.pdf",
    title: `Session ${id}`,
    mode: "chat",
    messages: [
      { id: `${id}-u`, role: "user", content: "research question", status: "complete", createdAt: 10 },
      { id: `${id}-a`, role: "assistant", content: "visible answer", status: "complete", createdAt: 11 },
    ],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    sourceStatus: "available",
    pinned: false,
    tags: [],
    createdAt: 10,
    updatedAt: 20,
    ...overrides,
  };
}

function operationsHarness(initialSessions) {
  const sessions = new Map(initialSessions.map((session) => [session.id, JSON.parse(JSON.stringify(session))]));
  const calls = [];
  return {
    calls,
    sessions,
    operations: {
      listSessions: () => Array.from(sessions.values()).map((session) => JSON.parse(JSON.stringify(session))),
      getSession: (id) => sessions.get(id) || null,
      updateSessionMetadata: async (id, patch) => {
        calls.push({ type: "update", id, patch });
        Object.assign(sessions.get(id), patch);
        if (patch.archivedAt === null) delete sessions.get(id).archivedAt;
      },
      archiveSession: async (id) => {
        calls.push({ type: "archive", id });
        sessions.get(id).archivedAt = 500;
      },
      resumeSession: (id) => {
        calls.push({ type: "resume", id });
        const session = sessions.get(id);
        delete session.archivedAt;
        return session;
      },
      rebindSessionSource: async (id, newPath) => {
        calls.push({ type: "rebind", id, newPath });
        const session = sessions.get(id);
        session.conversationKey = `pdf:${newPath}`;
        session.sourceStatus = "available";
      },
      clearSession: async (id) => {
        calls.push({ type: "delete", id });
        sessions.delete(id);
      },
    },
  };
}

test("session library searches visible content and applies scope, mode, archive, and date filters", () => {
  const { SessionLibraryService } = loadBundle();
  const a = makeSession("a", { title: "Current methods", pinned: true, updatedAt: 100 });
  const b = makeSession("b", {
    title: "Codex evidence",
    mode: "codex",
    conversationKey: "pdf:papers/B.pdf",
    tags: ["evidence"],
    updatedAt: 90,
  });
  const c = makeSession("c", { title: "Archived", archivedAt: 80, updatedAt: 80 });
  const harness = operationsHarness([b, c, a]);
  const service = new SessionLibraryService({ conversations: harness.operations });

  assert.deepEqual(
    Array.from(service.query({ text: "", scope: "all", mode: "all", archived: "active" })).map((item) => item.id),
    ["a", "b"],
  );
  assert.deepEqual(
    Array.from(service.query({ text: "evidence", scope: "all", mode: "codex", archived: "all" })).map((item) => item.id),
    ["b"],
  );
  assert.deepEqual(
    Array.from(service.query({
      text: "research question",
      scope: "current",
      currentConversationKey: "pdf:papers/A.pdf",
      mode: "chat",
      archived: "all",
      updatedAfter: 90,
    })).map((item) => item.id),
    ["a"],
  );
  assert.deepEqual(
    Array.from(service.query({ text: "", scope: "all", mode: "all", archived: "archived" })).map((item) => item.id),
    ["c"],
  );
});

test("rename, tags, pin, archive, and reactivate use normalized per-session updates", async () => {
  const { SessionLibraryService } = loadBundle();
  const harness = operationsHarness([makeSession("a")]);
  const service = new SessionLibraryService({ conversations: harness.operations });

  await assert.rejects(service.rename("a", "   "), /不能为空|empty/i);
  await service.rename("a", "  Better title  ");
  await service.setTags("a", [" Methods ", "methods", "Evidence", ""]);
  await service.setPinned("a", true);
  await service.archive("a");
  service.reactivate("a");

  assert.equal(harness.sessions.get("a").title, "Better title");
  assert.deepEqual(Array.from(harness.sessions.get("a").tags), ["methods", "evidence"]);
  assert.equal(harness.sessions.get("a").pinned, true);
  assert.equal(harness.sessions.get("a").archivedAt, undefined);
});

test("export delegates visible session Markdown without changing the entity", async () => {
  const { SessionLibraryService } = loadBundle();
  const original = makeSession("a");
  const harness = operationsHarness([original]);
  const exports = [];
  const service = new SessionLibraryService({
    conversations: harness.operations,
    artifacts: {
      exportSessionMarkdown: async (session, targetPath) => {
        exports.push({ session, targetPath });
        return { path: targetPath || "PDF Chat/Exports/a.md", created: true };
      },
    },
  });

  const result = await service.export("a", "Exports/custom.md");
  assert.equal(result.path, "Exports/custom.md");
  assert.equal(exports[0].session.id, "a");
  assert.deepEqual(harness.sessions.get("a"), original);
});

test("missing-source rebind changes the primary path and invalidates old evidence", async () => {
  const { ConversationStore, SessionLibraryService } = loadBundle();
  const legacy = makeSession("missing", {
    sourceStatus: "missing",
    messages: [
      {
        id: "assistant-old",
        role: "assistant",
        content: "Old evidence [P1, p.2].",
        status: "complete",
        createdAt: 11,
        evidence: [{
          id: "ev-old",
          claim: "Old evidence.",
          paperPath: "papers/A.pdf",
          page: 2,
          sourceAlias: "P1",
          verification: "located",
          raw: "[P1, p.2]",
        }],
      },
    ],
  });
  const settings = {
    conversationHistories: {},
    conversationSessions: { missing: legacy },
    activeConversationSessionIds: { "pdf:papers/A.pdf": "missing" },
  };
  const store = new ConversationStore(() => settings, async () => {});
  const service = new SessionLibraryService({ conversations: store });

  await service.rebind("missing", "papers/Renamed.pdf");

  const rebound = store.getSession("missing");
  assert.equal(rebound.conversationKey, "pdf:papers/Renamed.pdf");
  assert.equal(rebound.sourceStatus, "available");
  assert.equal(rebound.messages[0].evidence[0].verification, "unverified");
  assert.equal(rebound.messages[0].evidence[0].paperPath, "papers/A.pdf");
});

test("running Codex work blocks deletion and confirmed deletion preserves external artifacts", async () => {
  const { SessionLibraryService } = loadBundle();
  const harness = operationsHarness([makeSession("a"), makeSession("b")]);
  let confirmations = 0;
  const service = new SessionLibraryService({
    conversations: harness.operations,
    codex: {
      getSnapshot: (id) => ({ sessionId: id, status: id === "a" ? "running" : "idle", attachedPdfPaths: [], selectionChars: 0 }),
    },
    confirmDelete: async () => {
      confirmations += 1;
      return confirmations > 1;
    },
  });

  await assert.rejects(service.delete("a"), /运行|running/i);
  assert.equal(await service.delete("b"), false);
  assert.equal(harness.sessions.has("b"), true);
  assert.equal(await service.delete("b"), true);
  assert.equal(harness.sessions.has("b"), false);
  assert.deepEqual(harness.calls.filter((call) => call.type === "delete").map((call) => call.id), ["b"]);
});
