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

class MemoryVault {
  constructor() {
    this.files = new Map();
    this.folders = new Set();
    this.modifyCalls = 0;
    this.failNextModify = false;
  }

  getAbstractFileByPath(candidate) {
    if (this.files.has(candidate)) return { path: candidate, kind: "file" };
    if (this.folders.has(candidate)) return { path: candidate, kind: "folder" };
    return null;
  }

  async createFolder(candidate) {
    this.folders.add(candidate);
  }

  async create(candidate, content) {
    this.files.set(candidate, content);
    return { path: candidate, kind: "file" };
  }

  async read(file) {
    return this.files.get(file.path) || "";
  }

  async modify(file, content) {
    this.modifyCalls += 1;
    if (this.failNextModify) {
      this.failNextModify = false;
      throw new Error("simulated write failure");
    }
    await new Promise((resolve) => setTimeout(resolve, 2));
    this.files.set(file.path, content);
  }
}

function session(overrides = {}) {
  return {
    version: 3,
    id: "session-1",
    ["conversation" + "Key"]: "pdf:papers/A Study.pdf",
    title: "A useful discussion",
    mode: "chat",
    messages: [],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    sourceStatus: "available",
    pinned: false,
    tags: [],
    createdAt: 100,
    updatedAt: 200,
    ...overrides,
  };
}

function turn() {
  return {
    userMessage: {
      id: "user-1",
      role: "user",
      content: "What supports the main claim?",
      status: "complete",
      createdAt: 101,
    },
    assistantMessage: {
      id: "assistant-1",
      role: "assistant",
      content: "The ablation supports the claim [P1, p.7].",
      status: "complete",
      createdAt: 102,
      evidence: [
        {
          id: "ev-1",
          claim: "The ablation supports the claim.",
          paperPath: "papers/A Study.pdf",
          page: 7,
          sourceAlias: "P1",
          verification: "located",
          raw: "[P1, p.7]",
        },
      ],
    },
  };
}

test("research artifacts redact credentials, absolute paths, and hidden context wrappers", () => {
  const { sanitizeResearchArtifact } = loadBundle();
  const unsafe = [
    "api" + "Key: super-secret-value",
    "Authorization: " + "Bearer " + "abcdefghijklmnopqrstuvwxyz",
    "sk-" + "proj-" + "abcdefghijklmnop",
    "D:\\private\\vault\\paper.pdf",
    "/Users/alice/private/paper.pdf",
    "【论文全文】: hidden full text",
    "【从全文中按关键词检索到的可能相关片段】: hidden rag",
    "Visible conclusion.",
  ].join("\n");
  const safe = sanitizeResearchArtifact(unsafe);

  assert.doesNotMatch(safe, /super-secret|Bearer\s+abcdef|sk-proj|D:\\private|\/Users\/alice/);
  assert.doesNotMatch(safe, /论文全文|关键词检索到的可能相关片段/);
  assert.match(safe, /Visible conclusion/);
  assert.match(safe, /REDACTED|已隐藏/);
});

test("single-paper and synthesis notes use predictable vault paths", async () => {
  const { ResearchNoteService } = loadBundle();
  const vault = new MemoryVault();
  const service = new ResearchNoteService(vault, () => ({
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  }), () => 1700000000000);
  const request = { session: session(), ...turn(), includeSelectionText: false };

  const single = await service.appendTurn(request);
  const synthesis = await service.appendTurn({
    ...request,
    session: session({ id: "session-2", referencedPdfPaths: ["refs/B.pdf"] }),
  });

  assert.equal(single.path, "PDF Chat/Reading Notes/A Study.md");
  assert.equal(synthesis.path, "PDF Chat/Reading Notes/Synthesis.md");
  assert.match(vault.files.get(single.path), /\[\[papers\/A Study\.pdf#page=7\|A Study\.pdf p\.7\]\]/);
});

test("selection text is opt-in while count and hash remain available", async () => {
  const { ResearchNoteService } = loadBundle();
  const vault = new MemoryVault();
  const service = new ResearchNoteService(vault, () => ({
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  }), () => 1700000000000);
  const base = { session: session(), ...turn(), selection: { text: "private selected paragraph", paperPath: "papers/A Study.pdf" } };

  await service.appendTurn({ ...base, includeSelectionText: false });
  const pathName = "PDF Chat/Reading Notes/A Study.md";
  const withoutText = vault.files.get(pathName);
  assert.doesNotMatch(withoutText, /private selected paragraph/);
  assert.match(withoutText, /选区：26 字 · hash:/);

  await service.appendTurn({ ...base, includeSelectionText: true });
  assert.match(vault.files.get(pathName), /private selected paragraph/);
});

test("export turn markdown creates per-turn files and can append when path exists", async () => {
  const { ResearchNoteService } = loadBundle();
  const vault = new MemoryVault();
  const service = new ResearchNoteService(vault, () => ({
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  }), () => 1700000000000);

  const req = {
    session: session({ title: "Deep Dive on Methods" }),
    ...turn(),
    includeSelectionText: false,
  };

  const first = await service.exportTurnAsMarkdown(req);
  assert.equal(first.created, true);
  assert.match(first.path, /^PDF Chat\/Exports\/Deep Dive on Methods\/回答-/);
  const firstContent = vault.files.get(first.path);
  assert.match(firstContent, /# Deep Dive on Methods/);
  assert.match(firstContent, /## 用户问题/);
  assert.match(firstContent, /## 助手回答/);

  const secondReq = {
    ...req,
    includeSelectionText: true,
    selection: { text: "method note excerpt" },
  };
  const second = await service.exportTurnAsMarkdown(secondReq);
  assert.equal(second.created, false);
  assert.equal(second.path, first.path);
  const secondContent = vault.files.get(second.path);
  assert.equal(firstContent === secondContent, false);
  assert.match(secondContent, /method note excerpt/);
});

test("turn export identifies the model path and linked paper context", async () => {
  const { ResearchNoteService } = loadBundle();
  const vault = new MemoryVault();
  const service = new ResearchNoteService(vault, () => ({
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  }), () => 1700000000000);
  const request = {
    session: session({
      mode: "codex",
      referencedPdfPaths: ["papers/Related Work.pdf"],
    }),
    ...turn(),
    includeSelectionText: false,
  };

  const result = await service.exportTurnAsMarkdown(request);
  const content = vault.files.get(result.path);

  assert.match(content, /- 模式：Codex CLI/);
  assert.match(content, /- 当前论文：\[\[papers\/A Study\.pdf\]\]/);
  assert.match(content, /- 引用论文：\[\[papers\/Related Work\.pdf\]\]/);
});

test("turn export sanitizes unverified evidence details", async () => {
  const { ResearchNoteService } = loadBundle();
  const vault = new MemoryVault();
  const service = new ResearchNoteService(vault, () => ({
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  }), () => 1700000000000);
  const unsafeTurn = turn();
  unsafeTurn.assistantMessage.evidence = [{
    id: "unsafe-evidence",
    claim: "Unverified source",
    verification: "unverified",
    raw: "api" + "Key: secret-value D:\\private\\paper.pdf",
  }];

  const result = await service.exportTurnAsMarkdown({
    session: session(),
    ...unsafeTurn,
    includeSelectionText: false,
    includeEvidence: true,
  });
  const content = vault.files.get(result.path);

  assert.doesNotMatch(content, /secret-value|D:\\private/);
  assert.match(content, /REDACTED|已隐藏/);
});

test("same-path writes are serialized and a failed append can be retried safely", async () => {
  const { ResearchNoteService } = loadBundle();
  const vault = new MemoryVault();
  const service = new ResearchNoteService(vault, () => ({
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  }), () => 1700000000000);
  const first = { session: session(), ...turn(), includeSelectionText: false };
  const second = {
    ...first,
    userMessage: { ...first.userMessage, id: "user-2", content: "Second question" },
    assistantMessage: { ...first.assistantMessage, id: "assistant-2", content: "Second answer" },
  };

  await Promise.all([service.appendTurn(first), service.appendTurn(second)]);
  const notePath = "PDF Chat/Reading Notes/A Study.md";
  const serialized = vault.files.get(notePath);
  assert.ok(serialized.indexOf("What supports") < serialized.indexOf("Second question"));

  const beforeFailure = serialized;
  vault.failNextModify = true;
  await assert.rejects(service.appendTurn({
    ...first,
    userMessage: { ...first.userMessage, id: "user-3", content: "Failed question" },
  }), /simulated write failure/);
  assert.equal(vault.files.get(notePath), beforeFailure);
  await service.appendTurn({
    ...first,
    userMessage: { ...first.userMessage, id: "user-4", content: "Retry question" },
  });
  assert.match(vault.files.get(notePath), /Retry question/);
});

test("session export writes visible transcript without mutating the session", async () => {
  const { ResearchNoteService } = loadBundle();
  const vault = new MemoryVault();
  const service = new ResearchNoteService(vault, () => ({
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  }), () => 1700000000000);
  const original = session({ messages: [turn().userMessage, turn().assistantMessage] });
  const before = JSON.stringify(original);

  const result = await service.exportSessionMarkdown(original);

  assert.equal(result.path, "PDF Chat/Exports/A useful discussion.md");
  assert.match(vault.files.get(result.path), /What supports the main claim/);
  assert.match(vault.files.get(result.path), /The ablation supports the claim/);
  assert.equal(JSON.stringify(original), before);
});

test("research note settings migrate without disturbing existing model credentials", () => {
  const { migrateSettings } = loadBundle();
  const migrated = migrateSettings({
    models: [{
      id: "local",
      name: "Local",
      endpoint: "http://localhost",
      ["api" + "Key"]: "private",
      model: "m",
    }],
    activeModelId: "local",
  });

  assert.deepEqual(JSON.parse(JSON.stringify(migrated.settings.researchNotes)), {
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false,
  });
  assert.equal(migrated.settings.models[0].apiKey, "private");
});
