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

function translationSettings(overrides = {}) {
  return {
    targetLanguage: "zh-CN",
    temperature: 0.1,
    maxTokens: 4000,
    chunkChars: 6,
    additionalInstruction: "",
    ...overrides,
  };
}

const model = (id, name, modelName = "") => ({
  id,
  name,
  endpoint: "",
  apiKey: "",
  model: modelName,
});

test("Task 5 settings preserve legacy chunk size while keeping credential-free 0.7 defaults", () => {
  const { DEFAULT_SETTINGS, migrateSettings } = loadBundle();

  assert.equal(DEFAULT_SETTINGS.quickTranslateMarkerEnabled, true);
  assert.equal(DEFAULT_SETTINGS.translateModelId, "");
  assert.equal(DEFAULT_SETTINGS.continueModelId, "");
  assert.equal(DEFAULT_SETTINGS.translation.chunkChars, 8000);
  assert.equal(DEFAULT_SETTINGS.models[0].endpoint, "");
  assert.equal(DEFAULT_SETTINGS.models[0].apiKey, "");
  assert.equal(DEFAULT_SETTINGS.models[0].model, "");
  assert.deepEqual(plain(DEFAULT_SETTINGS.codexDeepAnalysis), {
    enabled: false,
    command: "codex",
    profile: "",
    model: "gpt-5.5",
    reasoningEffort: "medium",
    verbosity: "medium",
    inputMode: "pdf-only",
    outputMode: "markdown",
    modelPresets: [
      { model: "gpt-5.5", reasoningEffort: "medium", label: "gpt-5.5 · medium" },
      { model: "gpt-5.5", reasoningEffort: "high", label: "gpt-5.5 · high" },
      { model: "gpt-5.6-sol", reasoningEffort: "medium", label: "gpt-5.6-sol · medium" },
      { model: "gpt-5.6-sol", reasoningEffort: "xhigh", label: "gpt-5.6-sol · xhigh" },
    ],
    timeoutMs: 1800000,
    keepTempFiles: false,
    includeSelectionContext: true,
  });
  assert.deepEqual(plain(DEFAULT_SETTINGS.promptHistory), []);
  assert.deepEqual(plain(DEFAULT_SETTINGS.conversationSessions), {});
  assert.deepEqual(plain(DEFAULT_SETTINGS.activeConversationSessionIds), {});

  const legacy = migrateSettings({ translateChunkMaxChars: 3000 }).settings;
  assert.equal(legacy.translation.chunkChars, 3000);
  assert.equal(legacy.codexDeepAnalysis.command, "codex");
  assert.equal(legacy.codexDeepAnalysis.model, "gpt-5.5");
  assert.equal(legacy.codexDeepAnalysis.reasoningEffort, "medium");
  assert.equal(legacy.codexDeepAnalysis.enabled, false);
  assert.equal(legacy.codexDeepAnalysis.timeoutMs, 1800000);
  assert.equal(legacy.codexDeepAnalysis.inputMode, "pdf-only");
  assert.equal(legacy.codexDeepAnalysis.outputMode, "markdown");
  assert.equal(legacy.codexDeepAnalysis.includeSelectionContext, true);
  assert.equal(Object.hasOwn(legacy, "translateChunkMaxChars"), false);

  const oldCodexDefault = migrateSettings({ codexDeepAnalysis: { timeoutMs: 600000 } });
  assert.equal(oldCodexDefault.settings.codexDeepAnalysis.timeoutMs, 1800000);
  assert.equal(oldCodexDefault.needsSave, true);

  const customCodexTimeout = migrateSettings({ codexDeepAnalysis: { timeoutMs: 900000 } });
  assert.equal(customCodexTimeout.settings.codexDeepAnalysis.timeoutMs, 900000);

  const customCodexInputMode = migrateSettings({ codexDeepAnalysis: { inputMode: "debug-full" } });
  assert.equal(customCodexInputMode.settings.codexDeepAnalysis.inputMode, "debug-full");

  const invalidCodexInputMode = migrateSettings({ codexDeepAnalysis: { inputMode: "everything" } });
  assert.equal(invalidCodexInputMode.settings.codexDeepAnalysis.inputMode, "pdf-only");

  const jsonCodexOutputMode = migrateSettings({ codexDeepAnalysis: { outputMode: "json-schema" } });
  assert.equal(jsonCodexOutputMode.settings.codexDeepAnalysis.outputMode, "json-schema");

  const invalidCodexOutputMode = migrateSettings({ codexDeepAnalysis: { outputMode: "everything" } });
  assert.equal(invalidCodexOutputMode.settings.codexDeepAnalysis.outputMode, "markdown");

  const nestedWins = migrateSettings({
    translateChunkMaxChars: 3000,
    translation: { chunkChars: 6123 },
  }).settings;
  assert.equal(nestedWins.translation.chunkChars, 6123);

  const missingNestedChunkUsesLegacy = migrateSettings({
    translateChunkMaxChars: 3000,
    translation: { targetLanguage: "ja" },
  }).settings;
  assert.equal(missingNestedChunkUsesLegacy.translation.chunkChars, 3000);
  assert.equal(missingNestedChunkUsesLegacy.translation.targetLanguage, "ja");

  const fractionalLegacy = migrateSettings({ translateChunkMaxChars: 3000.5 });
  assert.equal(fractionalLegacy.settings.translation.chunkChars, 8000);
  const fractionalNested = migrateSettings({ translation: { chunkChars: 6123.5 } });
  assert.equal(fractionalNested.settings.translation.chunkChars, 8000);
});

test("installation identity is generated randomly once and then remains stable", () => {
  const { DEFAULT_SETTINGS, migrateSettings } = loadBundle();
  assert.equal(DEFAULT_SETTINGS.installationId, "");

  let generated = 0;
  const first = migrateSettings({}, () => 123, () => {
    generated += 1;
    return "install-random-abc123";
  });
  assert.equal(first.settings.installationId, "install-random-abc123");
  assert.equal(first.needsSave, true);
  assert.equal(generated, 1);
  assert.doesNotMatch(first.settings.installationId, /vault|documents|pdf/i);

  const second = migrateSettings(first.settings, () => 456, () => {
    throw new Error("stable installation identity must not be regenerated");
  });
  assert.equal(second.settings.installationId, "install-random-abc123");
});

test("RAG settings normalization preserves valid boundaries and repairs invalid persisted pairs", () => {
  const { migrateSettings, normalizeRagChunkSettings } = loadBundle();

  assert.deepEqual(plain(normalizeRagChunkSettings(8, 0)), {
    ragChunkSize: 8,
    ragChunkOverlap: 0,
    changed: false,
  });
  assert.deepEqual(plain(normalizeRagChunkSettings(8, 7)), {
    ragChunkSize: 8,
    ragChunkOverlap: 7,
    changed: false,
  });
  assert.deepEqual(plain(normalizeRagChunkSettings(4, 4)), {
    ragChunkSize: 4,
    ragChunkOverlap: 3,
    changed: true,
  });

  const invalidSize = migrateSettings({
    translation: {},
    ragChunkSize: -1,
    ragChunkOverlap: 999,
  });
  assert.equal(invalidSize.settings.ragChunkSize, 700);
  assert.equal(invalidSize.settings.ragChunkOverlap, 100);
  assert.equal(invalidSize.needsSave, true);

  const invalidOverlap = migrateSettings({
    translation: {},
    ragChunkSize: 50,
    ragChunkOverlap: 50,
  });
  assert.equal(invalidOverlap.settings.ragChunkSize, 50);
  assert.equal(invalidOverlap.settings.ragChunkOverlap, 49);
  assert.equal(invalidOverlap.needsSave, true);
});

test("PDF chunking is lossless at overlap boundaries and rejects invalid invariants", () => {
  const { chunkPdfPages } = loadBundle();
  const source = "ABCDEFGHIJKL";
  const pages = [{ page: 1, text: source }];
  const reconstruct = (chunks, overlap) =>
    chunks[0].text + chunks.slice(1).map((chunk) => chunk.text.slice(overlap)).join("");

  const noOverlap = chunkPdfPages(pages, 4, 0);
  assert.equal(noOverlap.map((chunk) => chunk.text).join(""), source);
  const maximumOverlap = chunkPdfPages(pages, 4, 3);
  assert.equal(reconstruct(maximumOverlap, 3), source);

  for (const [size, overlap] of [
    [0, 0],
    [-1, 0],
    [4.5, 0],
    [4, -1],
    [4, 1.5],
    [4, 4],
    [4, 5],
  ]) {
    assert.throws(
      () => chunkPdfPages([], size, overlap),
      (error) => error?.name === "RangeError"
    );
  }
});

test("translation and continue model routing are explicit, keyword-based, and independent", () => {
  const { resolveContinueModelId, resolveTranslateModelId } = loadBundle();
  const models = [
    model("active", "General"),
    model("one", "Translator", "vendor/DeepSeek-V3"),
    model("two-glm-route", "Reasoner"),
  ];
  const settings = {
    models,
    activeModelId: "active",
    translateModelId: "",
    continueModelId: "",
  };

  assert.equal(resolveTranslateModelId(settings), "one");
  assert.equal(resolveContinueModelId(settings), "two-glm-route");
  assert.equal(resolveTranslateModelId({ ...settings, translateModelId: "active" }), "active");
  assert.equal(resolveContinueModelId({ ...settings, continueModelId: "one" }), "one");
  assert.equal(
    resolveTranslateModelId({ ...settings, translateModelId: "missing", models: [models[0]] }),
    "active"
  );
  assert.equal(
    resolveContinueModelId({ ...settings, continueModelId: "missing", models: [models[0]] }),
    "active"
  );
});

test("optional conversation kind preserves chat keys exactly and isolates translation", () => {
  const { getConversationKey } = loadBundle();
  const file = { path: "papers/demo.pdf" };

  assert.equal(getConversationKey(file, "ignored"), "pdf:papers/demo.pdf");
  assert.equal(getConversationKey(file, "ignored", "chat"), "pdf:papers/demo.pdf");
  assert.equal(
    getConversationKey(null, "  Same text\r\n"),
    getConversationKey(null, "Same text", "chat")
  );
  assert.notEqual(
    getConversationKey(file, "ignored", "translate"),
    getConversationKey(file, "ignored", "chat")
  );
  assert.notEqual(
    getConversationKey(null, "Same text", "translate"),
    getConversationKey(null, "Same text", "chat")
  );
});

test("robust translation retries empty output, preserves failed chunks, and reports progress", async () => {
  const { TranslationService } = loadBundle();
  const calls = [];
  const progress = [];
  const outcomes = ["", "Translated A", new Error("provider detail must stay internal")];
  const service = new TranslationService({
    async chat(request) {
      calls.push(plain(request.messages));
      const outcome = outcomes.shift();
      if (outcome instanceof Error) throw outcome;
      return outcome;
    },
  });

  const result = await service.translate({
    source: "AAAA\n\nBBBB",
    settings: translationSettings(),
    modelProfile: model("translator", "Translator"),
    onChunk: (update) => progress.push(plain(update)),
  });

  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map((messages) => messages.map((message) => message.role)), [
    ["system", "user"],
    ["system", "user"],
    ["system", "user"],
  ]);
  assert.equal(result.text, "Translated A\n\n[翻译失败，保留原文]\nBBBB");
  assert.equal(result.chunkCount, 2);
  assert.equal(result.stoppedEarly, false);
  assert.deepEqual(plain(result.failedChunkIndexes), [1]);
  assert.equal(progress.length, 2);
  assert.equal(progress[1].combinedText, result.text);
});

test("all-failed translation throws a generic sanitized error", async () => {
  const { TranslationService } = loadBundle();
  const secretSource = "SOURCE_SHOULD_NOT_LEAK";
  const service = new TranslationService({
    async chat() {
      throw new Error(
        "provider rejected SOURCE_SHOULD_NOT_LEAK at https://runtime.invalid using endpoint credential"
      );
    },
  });

  await assert.rejects(
    service.translate({
      source: secretSource,
      settings: translationSettings({ chunkChars: 100 }),
      modelProfile: model("translator", "Translator"),
    }),
    (error) => {
      assert.match(String(error && error.message), /translation failed/i);
      assert.doesNotMatch(
        String(error && error.message),
        /SOURCE_SHOULD_NOT_LEAK|runtime\.invalid|credential|provider rejected|source_text/i
      );
      return true;
    }
  );
});

test("abort before or during a request returns stopped output and never starts another chunk", async () => {
  const { TranslationService } = loadBundle();
  const profile = model("translator", "Translator");
  const before = new AbortController();
  before.abort();
  let beforeCalls = 0;
  const beforeResult = await new TranslationService({
    async chat() {
      beforeCalls += 1;
      return "ignored";
    },
  }).translate({
    source: "AAAA\n\nBBBB",
    settings: translationSettings(),
    modelProfile: profile,
    signal: before.signal,
  });
  assert.equal(beforeCalls, 0);
  assert.deepEqual(plain(beforeResult), {
    text: "",
    chunkCount: 2,
    stoppedEarly: true,
    failedChunkIndexes: [],
  });

  const during = new AbortController();
  let duringCalls = 0;
  const duringResult = await new TranslationService({
    async chat() {
      duringCalls += 1;
      during.abort();
      return "must be ignored";
    },
  }).translate({
    source: "AAAA\n\nBBBB\n\nCCCC",
    settings: translationSettings(),
    modelProfile: profile,
    signal: during.signal,
  });
  assert.equal(duringCalls, 1);
  assert.equal(duringResult.text, "");
  assert.equal(duringResult.stoppedEarly, true);
  assert.deepEqual(plain(duringResult.failedChunkIndexes), []);
});

function createSyntheticDocument() {
  const listeners = new Map();
  const appended = [];
  let selection = null;
  const add = (target, type, callback) => {
    const key = `${target}:${type}`;
    const callbacks = listeners.get(key) || [];
    callbacks.push(callback);
    listeners.set(key, callbacks);
  };
  const remove = (target, type, callback) => {
    const key = `${target}:${type}`;
    listeners.set(
      key,
      (listeners.get(key) || []).filter((candidate) => candidate !== callback)
    );
  };
  const dispatch = (target, type, event = {}) => {
    for (const callback of listeners.get(`${target}:${type}`) || []) callback(event);
  };
  const doc = {
    body: {
      appendChild(element) {
        appended.push(element);
        element.isConnected = true;
      },
    },
    defaultView: {
      innerHeight: 100,
      innerWidth: 200,
      getSelection: () => selection,
    },
    createElement() {
      const elementListeners = new Map();
      return {
        attributes: {},
        className: "",
        hidden: false,
        isConnected: false,
        style: {},
        textContent: "",
        type: "",
        addEventListener(type, callback) {
          elementListeners.set(type, [...(elementListeners.get(type) || []), callback]);
        },
        contains(target) {
          return target === this;
        },
        dispatch(type, event = {}) {
          for (const callback of elementListeners.get(type) || []) callback(event);
        },
        getBoundingClientRect() {
          return { width: 32, height: 28 };
        },
        remove() {
          this.isConnected = false;
          this.hidden = true;
        },
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
      };
    },
    addEventListener(type, callback) {
      add("doc", type, callback);
    },
    removeEventListener(type, callback) {
      remove("doc", type, callback);
    },
    dispatch(type, event) {
      dispatch("doc", type, event);
    },
    listenerCount(type) {
      return (listeners.get(`doc:${type}`) || []).length;
    },
    setSelection(value) {
      selection = value;
    },
    appended,
  };
  return doc;
}

function selectionFor(text, rectangles) {
  return {
    isCollapsed: false,
    rangeCount: 1,
    toString: () => text,
    getRangeAt: () => ({
      getBoundingClientRect: () => rectangles.at(-1),
      getClientRects: () => rectangles,
    }),
  };
}

test("quick marker is debounced, clamped, selection-safe, disposable, and opens fresh auto translation", () => {
  const { QuickTranslateMarker } = loadBundle();
  const doc = createSyntheticDocument();
  const file = { path: "papers/demo.pdf" };
  const timers = [];
  const opened = [];
  let enabled = true;
  const marker = new QuickTranslateMarker({
    isEnabled: () => enabled,
    getActivePdfFile: () => file,
    openModal: (request) => opened.push(plain(request)),
    setTimer(callback, delay) {
      const timer = { callback, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) {
      timer.cancelled = true;
    },
  });
  doc.setSelection(selectionFor("  Alpha beta  ", [
    { left: 10, top: 10, right: 20, bottom: 20, width: 10, height: 10 },
    { left: 190, top: 90, right: 198, bottom: 98, width: 8, height: 8 },
  ]));

  marker.attach(doc);
  doc.dispatch("selectionchange");
  assert.equal(timers.at(-1).delay, 150);
  timers.at(-1).callback();

  const button = doc.appended[0];
  assert.equal(button.textContent, "译");
  assert.equal(button.type, "button");
  assert.match(button.attributes["aria-label"], /翻译/);
  assert.equal(button.attributes.title, undefined);
  assert.equal(button.hidden, false);
  assert.ok(parseFloat(button.style.left) <= 160);
  assert.ok(parseFloat(button.style.top) <= 64);

  let prevented = false;
  let stopped = false;
  button.dispatch("mousedown", {
    preventDefault() { prevented = true; },
    stopPropagation() { stopped = true; },
  });
  assert.equal(prevented, true);
  assert.equal(stopped, true);
  button.dispatch("click", { preventDefault() {}, stopPropagation() {} });
  assert.deepEqual(opened, [{
    file: plain(file),
    selectedText: "Alpha beta",
    startFresh: true,
    autoTranslateOnOpen: true,
  }]);

  doc.dispatch("mousedown", { target: {} });
  assert.equal(button.hidden, true);
  doc.dispatch("selectionchange");
  timers.at(-1).callback();
  doc.dispatch("scroll");
  assert.equal(button.hidden, true);
  doc.dispatch("selectionchange");
  timers.at(-1).callback();
  doc.dispatch("keydown", { key: "Escape" });
  assert.equal(button.hidden, true);

  enabled = false;
  doc.dispatch("selectionchange");
  timers.at(-1).callback();
  assert.equal(button.hidden, true);

  marker.destroy();
  assert.equal(button.isConnected, false);
  for (const type of ["selectionchange", "mousedown", "scroll", "keydown"]) {
    assert.equal(doc.listenerCount(type), 0);
  }
});

test("quick marker requires the selection to belong to the active PDF view", () => {
  const { QuickTranslateMarker } = loadBundle();
  const doc = createSyntheticDocument();
  const timers = [];
  let selectionInsidePdf = false;
  const marker = new QuickTranslateMarker({
    isEnabled: () => true,
    getActivePdfFile: () => ({ path: "papers/demo.pdf" }),
    isSelectionInsideActivePdf: () => selectionInsidePdf,
    openModal() {},
    setTimer(callback, delay) {
      const timer = { callback, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) {
      timer.cancelled = true;
    },
  });

  doc.setSelection(selectionFor("Alpha beta", [
    { left: 10, top: 20, right: 40, bottom: 30, width: 30, height: 10 },
  ]));
  marker.attach(doc);

  doc.dispatch("selectionchange");
  timers.at(-1).callback();
  assert.equal(doc.appended.length, 0);

  selectionInsidePdf = true;
  doc.dispatch("selectionchange");
  timers.at(-1).callback();
  assert.equal(doc.appended.length, 1);
  assert.equal(doc.appended[0].hidden, false);
  marker.destroy();
});

test("quick marker detaches a closed workspace document without affecting other windows", () => {
  const { QuickTranslateMarker } = loadBundle();
  const first = createSyntheticDocument();
  const second = createSyntheticDocument();
  const marker = new QuickTranslateMarker({
    isEnabled: () => true,
    getActivePdfFile: () => ({ path: "papers/demo.pdf" }),
    openModal() {},
  });

  marker.attach(first);
  marker.attach(second);
  marker.detach(first);

  for (const type of ["selectionchange", "mousedown", "scroll", "keydown"]) {
    assert.equal(first.listenerCount(type), 0);
    assert.equal(second.listenerCount(type), 1);
  }
  marker.destroy();
});

function createPendingQuickMarkerHarness() {
  const { QuickTranslateMarker } = loadBundle();
  const doc = createSyntheticDocument();
  const timers = [];
  const marker = new QuickTranslateMarker({
    isEnabled: () => true,
    getActivePdfFile: () => ({ path: "papers/demo.pdf" }),
    openModal() {},
    setTimer(callback, delay) {
      const timer = { callback, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) {
      timer.cancelled = true;
    },
  });
  doc.setSelection(selectionFor("Alpha beta", [
    { left: 10, top: 20, right: 40, bottom: 30, width: 30, height: 10 },
  ]));
  marker.attach(doc);
  doc.dispatch("selectionchange");
  timers.at(-1).callback();
  const button = doc.appended[0];
  doc.dispatch("selectionchange");
  return { button, doc, marker, pendingTimer: timers.at(-1), timers };
}

for (const [label, dismiss] of [
  ["outside mousedown", (doc) => doc.dispatch("mousedown", { target: {} })],
  ["scroll", (doc) => doc.dispatch("scroll")],
  ["Escape", (doc) => doc.dispatch("keydown", { key: "Escape" })],
]) {
  test(`quick marker ${label} cancels pending debounce so it cannot reappear`, () => {
    const { button, doc, marker, pendingTimer } = createPendingQuickMarkerHarness();

    dismiss(doc);

    assert.equal(pendingTimer.cancelled, true);
    if (!pendingTimer.cancelled) pendingTimer.callback();
    assert.equal(button.hidden, true);
    marker.destroy();
  });
}

test("quick marker selection changes cancel and replace the pending debounce", () => {
  const { button, doc, marker, pendingTimer, timers } = createPendingQuickMarkerHarness();

  doc.dispatch("selectionchange");
  const replacement = timers.at(-1);

  assert.equal(pendingTimer.cancelled, true);
  assert.equal(replacement.cancelled, false);
  replacement.callback();
  assert.equal(button.hidden, false);
  marker.destroy();
});

test("plugin lifecycle wires the marker to the main document and window-open documents", () => {
  const mainSource = fs.readFileSync(path.join(projectRoot, "src", "main.ts"), "utf8");
  assert.match(mainSource, /new QuickTranslateMarker/);
  assert.match(mainSource, /\.attach\(document\)/);
  assert.match(mainSource, /window-open/);
  assert.match(mainSource, /window-close/);
  assert.match(mainSource, /active-leaf-change/);
  assert.match(mainSource, /quickTranslateMarker.*\.detach/s);
  assert.match(mainSource, /quickTranslateMarker.*\.destroy\(\)/s);
});

test("quick marker CSS is keyboard-visible, theme-aware, and motion-safe", () => {
  const css = fs.readFileSync(path.join(projectRoot, "styles.css"), "utf8");
  const rule = css.match(/\.pdf-chat-quick-translate-marker\s*\{([^}]*)\}/s)?.[1] || "";
  assert.match(rule, /position:\s*fixed/);
  assert.match(rule, /min-width:\s*32px/);
  assert.match(rule, /min-height:\s*32px/);
  assert.match(rule, /background:\s*var\(/);
  assert.match(rule, /color:\s*var\(/);
  assert.match(css, /\.pdf-chat-quick-translate-marker:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("fresh and continue modals select chat models independently and never restore translation history", () => {
  const { DEFAULT_SETTINGS, PDFChatModal } = loadBundle();
  const settings = plain(DEFAULT_SETTINGS);
  settings.models = [
    model("active", "Active"),
    model("last", "Last"),
    model("continue", "Continue"),
    model("translate", "Translate"),
  ];
  settings.activeModelId = "active";
  settings.lastModelId = "last";
  settings.continueModelId = "continue";
  settings.translateModelId = "translate";
  const readKeys = [];
  const services = {
    conversations: {
      getKey: (_file, _text, kind) =>
        kind === "translate" ? "translate:pdf:demo.pdf" : "pdf:demo.pdf",
      get(key) {
        readKeys.push(key);
        return key.startsWith("translate:")
          ? [{ role: "assistant", content: "must not restore", status: "complete" }]
          : [];
      },
      save: async () => {},
      clear: async () => {},
    },
    papers: {
      getOrCreateDocSummary: async () => ({}),
      getOrCreateDocChunks: async () => ({}),
      extractFullText: async () => "",
      planRagQueries: async () => [],
      retrieveContext: () => [],
    },
    llm: { chat: async () => "" },
    models: {
      get: (id) => settings.models.find((candidate) => candidate.id === id),
      resolveContinueId: () => "continue",
      resolveTranslateId: () => "translate",
    },
    actions: { execute: async () => {} },
    translations: {
      translate: async () => ({
        text: "",
        chunkCount: 0,
        stoppedEarly: false,
        failedChunkIndexes: [],
      }),
    },
  };
  const plugin = { settings, saveSettings: async () => {} };
  const file = { path: "demo.pdf", name: "demo.pdf" };

  const continued = new PDFChatModal({}, plugin, "Selection", file, false, services);
  const fresh = new PDFChatModal({}, plugin, "Selection", file, true, services);

  assert.equal(continued.currentModelId, "continue");
  assert.equal(fresh.currentModelId, "last");
  assert.equal(continued.conversationKey, "pdf:demo.pdf");
  assert.equal(continued.translateConversationKey, "translate:pdf:demo.pdf");
  assert.deepEqual(plain(continued.translateTranscript), []);
  assert.deepEqual(readKeys, ["pdf:demo.pdf", "pdf:demo.pdf"]);
});

test("0.8.3 documentation describes marker, bounded reader reliability, layered storage, and private plaintext limits", () => {
  const readme = fs.readFileSync(path.join(projectRoot, "README.md"), "utf8").toLowerCase();
  for (const phrase of [
    "0.8.3",
    "native codex thread",
    "codex exec resume",
    "quick-translate marker",
    "separate translation history",
    "translation model",
    "continue model",
    "main.js",
    "manifest.json",
    "styles.css",
    "data.json",
    "local plaintext",
    "rotate",
  ]) {
    assert.ok(readme.includes(phrase), `README must include: ${phrase}`);
  }
  assert.doesNotMatch(readme, /online paper search|ppt generation/);
});
