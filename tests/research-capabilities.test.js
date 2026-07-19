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
  vm.runInNewContext(source, sandbox, { filename: "main.js" });
  return sandbox.module.exports;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeContext(overrides = {}) {
  return {
    papers: [{ vaultPath: "papers/A.pdf", name: "A.pdf", role: "current", ignored: "drop-me" }],
    evidence: [{ claim: "A claim", paperPath: "papers/A.pdf", page: 7, verification: "located", raw: "hidden" }],
    visibleAnswers: ["Visible Codex answer"],
    ...overrides,
  };
}

test("empty research capability registry keeps optional UI actions hidden", async () => {
  const {
    ResearchCapabilityRegistry,
    createResearchActionRegistry,
    registerAvailableResearchCapabilityActions,
  } = loadBundle();
  const capabilities = new ResearchCapabilityRegistry();
  const actions = createResearchActionRegistry();

  assert.deepEqual(plain(await capabilities.listAvailable()), []);
  await registerAvailableResearchCapabilityActions(actions, capabilities, {
    onRelatedPapers: async () => {},
    onPresentation: async () => {},
  });

  assert.deepEqual(plain(actions.list().map((action) => action.id)), ["translate"]);
});

test("research capability registry lists only available provider-neutral adapters", async () => {
  const { ResearchCapabilityRegistry } = loadBundle();
  const registry = new ResearchCapabilityRegistry()
    .registerRelatedPaperSearch({
      id: "search-ready",
      label: "Ready search",
      isAvailable: async () => true,
      search: async () => [],
    })
    .registerRelatedPaperSearch({
      id: "search-offline",
      label: "Offline search",
      isAvailable: async () => false,
      search: async () => [],
    })
    .registerPresentationGenerator({
      id: "slides-ready",
      label: "Ready slides",
      isAvailable: async () => true,
      generate: async () => ({ kind: "file", path: "exports/talk.pptx" }),
    });

  assert.deepEqual(plain(await registry.listAvailable()), [
    { kind: "related-papers", id: "search-ready", label: "Ready search" },
    { kind: "presentation", id: "slides-ready", label: "Ready slides" },
  ]);
});

test("research request projection retains only vault papers, located evidence, and visible answers", () => {
  const { projectResearchCapabilityContext } = loadBundle();
  const projected = projectResearchCapabilityContext(safeContext());

  assert.deepEqual(plain(projected), {
    papers: [{ vaultPath: "papers/A.pdf", name: "A.pdf", role: "current" }],
    evidence: [{ claim: "A claim", paperPath: "papers/A.pdf", page: 7, verification: "located" }],
    visibleAnswers: ["Visible Codex answer"],
  });
  assert.equal(JSON.stringify(projected).includes("drop-me"), false);
  assert.equal(JSON.stringify(projected).includes("hidden"), false);
});

test("research request projection rejects settings, credentials, endpoints, and absolute paths", () => {
  const { projectResearchCapabilityContext } = loadBundle();
  for (const unsafe of [
    { ...safeContext(), settings: { models: [] } },
    { ...safeContext(), ["api" + "Key"]: "not-a-real-secret" },
    { ...safeContext(), nested: { ["access" + "Token"]: "not-a-real-token" } },
    { ...safeContext(), endpoint: "https://private.invalid" },
    safeContext({ papers: [{ vaultPath: "D:/vault/papers/A.pdf", name: "A.pdf", role: "current" }] }),
    safeContext({ papers: [{ vaultPath: "../outside.pdf", name: "outside.pdf", role: "current" }] }),
    safeContext({ papers: [{ vaultPath: "https://example.invalid/A.pdf", name: "A.pdf", role: "current" }] }),
    safeContext({ papers: [{ vaultPath: "~/papers/A.pdf", name: "A.pdf", role: "current" }] }),
  ]) {
    assert.throws(() => projectResearchCapabilityContext(unsafe), /unsafe|credential|settings|relative|path/i);
  }
});

test("adapter execution receives only the safe projected request", async () => {
  const { ResearchCapabilityRegistry } = loadBundle();
  let searchRequest;
  let presentationRequest;
  const registry = new ResearchCapabilityRegistry()
    .registerRelatedPaperSearch({
      id: "search",
      label: "Search",
      isAvailable: async () => true,
      search: async (request) => {
        searchRequest = request;
        return [{ title: "Related paper", url: "https://example.invalid/paper" }];
      },
    })
    .registerPresentationGenerator({
      id: "slides",
      label: "Slides",
      isAvailable: async () => true,
      generate: async (request) => {
        presentationRequest = request;
        return { kind: "file", path: "exports/talk.pptx" };
      },
    });

  const results = await registry.searchRelatedPapers("search", {
    query: "Find related methods",
    context: safeContext(),
  });
  const artifact = await registry.generatePresentation("slides", {
    title: "Paper talk",
    context: safeContext(),
  });

  assert.equal(results[0].title, "Related paper");
  assert.equal(artifact.path, "exports/talk.pptx");
  assert.deepEqual(Object.keys(searchRequest).sort(), ["context", "query"]);
  assert.deepEqual(Object.keys(searchRequest.context).sort(), ["evidence", "papers", "visibleAnswers"]);
  assert.deepEqual(Object.keys(presentationRequest).sort(), ["context", "title"]);
});
