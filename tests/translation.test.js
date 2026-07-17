const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

const LEGACY_TRANSLATE_PROMPT =
  "请把【我当前选中并想讨论的原文片段】完整翻译成中文。\n" +
  "1. 逐段对应原文分段,不要合并或省略段落。\n" +
  "2. 专业术语可保留英文原词(括号标注即可),公式、代码、变量名、图表编号等保持原样不翻译。\n" +
  "3. 只输出翻译结果,不要输出原文、不要复述要求、不要加额外解释或总结。";

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadBundle(options = {}) {
  const filename = path.join(projectRoot, "main.js");
  const source = fs.readFileSync(filename, "utf8");

  class Plugin {}
  class Modal {
    constructor(app) {
      this.app = app;
    }
  }
  class PluginSettingTab {}
  class Notice {
    constructor(message) {
      options.notices?.push(message);
    }

    hide() {}
  }
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

test("migrates legacy translation settings without changing unrelated saved data", () => {
  const { DEFAULT_SETTINGS, migrateSettings } = loadBundle();
  const models = [
    {
      id: "private-model",
      name: "Private model",
      endpoint: "https://example.invalid/v1/chat/completions",
      apiKey: "secret-value",
      model: "model-name",
    },
  ];
  const docSummaries = { "paper.pdf": { summary: "summary", generatedAt: 1, fullLength: 9, truncated: false } };
  const docChunks = {
    "paper.pdf": { chunks: [{ page: 1, text: "chunk" }], fullTextLength: 5, generatedAt: 2 },
  };
  const conversationHistories = {
    "pdf:paper.pdf": {
      version: 1,
      updatedAt: 3,
      messages: [
        { role: "user", content: "Question", status: "complete" },
        { role: "assistant", content: "Answer", status: "complete" },
      ],
    },
  };

  const migrated = migrateSettings({
    models,
    activeModelId: "private-model",
    translatePrompt: "Keep this custom instruction verbatim.  ",
    docSummaries,
    docChunks,
    conversationHistories,
  }).settings;

  assert.deepEqual(plain(DEFAULT_SETTINGS.translation), {
    targetLanguage: "zh-CN",
    temperature: 0.1,
    maxTokens: 4000,
    chunkChars: 8000,
    additionalInstruction: "",
  });
  assert.deepEqual(plain(migrated.translation), {
    ...plain(DEFAULT_SETTINGS.translation),
    additionalInstruction: "Keep this custom instruction verbatim.  ",
  });
  assert.equal(Object.hasOwn(migrated, "translatePrompt"), false);
  assert.deepEqual(plain(migrated.models), models);
  assert.deepEqual(plain(migrated.docSummaries), docSummaries);
  assert.deepEqual(plain(migrated.docChunks), docChunks);
  assert.deepEqual(plain(migrated.conversationHistories), conversationHistories);

  for (const legacyValue of [undefined, "", "   ", LEGACY_TRANSLATE_PROMPT]) {
    const saved = legacyValue === undefined ? {} : { translatePrompt: legacyValue };
    const normalized = migrateSettings(saved).settings;
    assert.equal(normalized.translation.additionalInstruction, "");
    assert.equal(Object.hasOwn(normalized, "translatePrompt"), false);
  }
});

test("constructs an isolated translation request with the selected model and translation limits", async () => {
  const { TranslationService } = loadBundle();
  const requests = [];
  const service = new TranslationService({
    async chat(request) {
      requests.push(request);
      request.onChunk?.("译文", "译文");
      return "译文";
    },
  });
  const modelProfile = {
    id: "chosen-model",
    name: "Chosen model",
    endpoint: "https://example.invalid/v1/chat/completions",
    apiKey: "secret-value",
    model: "chosen-model-name",
  };
  const source = "A formula uses x_i and cites [12], Figure 3, and Table 2.";
  const progress = [];

  const result = await service.translate({
    source,
    settings: {
      targetLanguage: "zh-CN",
      temperature: 0.1,
      maxTokens: 4000,
      chunkChars: 8000,
      additionalInstruction: "Use established terminology.",
    },
    modelProfile,
    onChunk: (update) => progress.push(plain(update)),
  });

  assert.equal(result.text, "译文");
  assert.equal(result.chunkCount, 1);
  assert.equal(requests.length, 1);
  const request = requests[0];
  assert.equal(request.modelProfile, modelProfile);
  assert.equal(request.stream, true);
  assert.equal(request.temperatureOverride, 0.1);
  assert.equal(request.maxTokensOverride, 4000);
  assert.deepEqual(plain(request.messages.map((message) => message.role)), ["system", "user"]);
  assert.match(request.messages[0].content, /faithful academic translation/i);
  assert.match(request.messages[0].content, /zh-CN/);
  assert.match(request.messages[0].content, /paragraph/i);
  assert.match(request.messages[0].content, /formulas.*code.*variables.*citations.*figure.*table/i);
  assert.match(request.messages[1].content, /Use established terminology\./);
  assert.match(request.messages[1].content, /<source_text>/);
  assert.match(request.messages[1].content, /<\/source_text>/);
  assert.equal(JSON.stringify(request.messages).split(source).length - 1, 1);
  assert.doesNotMatch(JSON.stringify(request.messages), /generic chat|restored history|document summary|RAG/);
  assert.deepEqual(progress, [
    { chunkIndex: 1, chunkCount: 1, chunkText: "译文", combinedText: "译文" },
  ]);
});

test("splits long translation sources at paragraph boundaries within the character limit", () => {
  const { splitTranslationChunks } = loadBundle();
  const exactLimit = "x".repeat(8000);
  assert.deepEqual(plain(splitTranslationChunks(exactLimit, 8000)), [exactLimit]);

  const firstParagraph = "A".repeat(4500);
  const secondParagraph = "B".repeat(4500);
  const paragraphSource = `${firstParagraph}\n\n${secondParagraph}`;
  const paragraphChunks = plain(splitTranslationChunks(paragraphSource, 8000));
  assert.equal(paragraphChunks.length, 2);
  assert.equal(paragraphChunks[0], `${firstParagraph}\n\n`);
  assert.equal(paragraphChunks.join(""), paragraphSource);
  assert.ok(paragraphChunks.every((chunk) => chunk.length > 0 && chunk.length <= 8000));

  const hardSplitSource = "z".repeat(8001);
  const hardSplitChunks = plain(splitTranslationChunks(hardSplitSource, 8000));
  assert.deepEqual(hardSplitChunks.map((chunk) => chunk.length), [8000, 1]);
  assert.equal(hardSplitChunks.join(""), hardSplitSource);
});

test("prefers an earlier line boundary over later whitespace within the limit", () => {
  const { splitTranslationChunks } = loadBundle();
  const source = "alpha\nbeta gamma";
  const chunks = plain(splitTranslationChunks(source, 12));

  assert.equal(chunks[0], "alpha\n");
  assert.equal(chunks.join(""), source);
  assert.ok(chunks.every((chunk) => chunk.length > 0 && chunk.length <= 12));
});

test("prefers an earlier sentence boundary over later whitespace within the limit", () => {
  const { splitTranslationChunks } = loadBundle();
  const source = "Alpha one. Beta two";
  const chunks = plain(splitTranslationChunks(source, 17));

  assert.equal(chunks[0], "Alpha one. ");
  assert.equal(chunks.join(""), source);
  assert.ok(chunks.every((chunk) => chunk.length > 0 && chunk.length <= 17));
});

test("uses whitespace before hard splitting when no higher-priority boundary exists", () => {
  const { splitTranslationChunks } = loadBundle();
  const source = "alpha betaGamma";
  const chunks = plain(splitTranslationChunks(source, 8));

  assert.equal(chunks[0], "alpha ");
  assert.equal(chunks.join(""), source);
  assert.ok(chunks.every((chunk) => chunk.length > 0 && chunk.length <= 8));
});

test("keeps supplementary math characters intact in chunks and translation requests", async () => {
  const { splitTranslationChunks, TranslationService } = loadBundle();
  const source = "ab𝛼cd";
  const chunks = plain(splitTranslationChunks(source, 3));

  assert.deepEqual(chunks, ["ab", "𝛼c", "d"]);
  assert.equal(chunks.join(""), source);
  assert.ok(chunks.every((chunk) => !/[\uD800-\uDBFF]$/.test(chunk)));
  assert.ok(chunks.every((chunk) => !/^[\uDC00-\uDFFF]/.test(chunk)));

  const requestedSources = [];
  const service = new TranslationService({
    async chat(request) {
      const wrapped = request.messages[1].content.match(/<source_text>\n([\s\S]*?)\n<\/source_text>/);
      assert.ok(wrapped);
      requestedSources.push(wrapped[1]);
      return "译文";
    },
  });
  await service.translate({
    source,
    settings: {
      targetLanguage: "zh-CN",
      temperature: 0.1,
      maxTokens: 4000,
      chunkChars: 3,
      additionalInstruction: "",
    },
    modelProfile: { id: "model-a", name: "A", endpoint: "", apiKey: "", model: "a" },
  });

  assert.deepEqual(requestedSources, ["ab", "𝛼c", "d"]);
  assert.equal(requestedSources.join(""), source);
});

test("translates chunks sequentially and combines streamed output in source order", async () => {
  const { TranslationService } = loadBundle();
  const calls = [];
  const updates = [];
  let activeCalls = 0;
  let maximumActiveCalls = 0;
  const service = new TranslationService({
    async chat(request) {
      activeCalls += 1;
      maximumActiveCalls = Math.max(maximumActiveCalls, activeCalls);
      const wrapped = request.messages[1].content.match(/<source_text>\n([\s\S]*?)\n<\/source_text>/);
      assert.ok(wrapped);
      const sourceChunk = wrapped[1];
      calls.push(sourceChunk);
      await new Promise((resolve) => setImmediate(resolve));
      const translated = `T:${sourceChunk.trim()}`;
      request.onChunk?.(translated, translated);
      activeCalls -= 1;
      return translated;
    },
  });

  const result = await service.translate({
    source: "AAAA\n\nBBBB\n\nCCCC",
    settings: {
      targetLanguage: "zh-CN",
      temperature: 0.1,
      maxTokens: 4000,
      chunkChars: 6,
      additionalInstruction: "",
    },
    modelProfile: { id: "model-a", name: "A", endpoint: "", apiKey: "", model: "a" },
    onChunk: (update) => updates.push(plain(update)),
  });

  assert.equal(maximumActiveCalls, 1);
  assert.deepEqual(calls, ["AAAA\n\n", "BBBB\n\n", "CCCC"]);
  assert.equal(result.chunkCount, 3);
  assert.equal(result.text, "T:AAAA\n\nT:BBBB\n\nT:CCCC");
  assert.deepEqual(
    updates.map((update) => update.combinedText),
    ["T:AAAA", "T:AAAA\n\nT:BBBB", "T:AAAA\n\nT:BBBB\n\nT:CCCC"]
  );
});

test("fails on an empty middle chunk and does not start later chunks", async () => {
  const { TranslationService } = loadBundle();
  const calls = [];
  const updates = [];
  const outputs = ["第一段", "", "不应调用"];
  const service = new TranslationService({
    async chat(request) {
      calls.push(request.messages[1].content);
      return outputs[calls.length - 1];
    },
  });

  await assert.rejects(
    service.translate({
      source: "AAAA\n\nBBBB\n\nCCCC",
      settings: {
        targetLanguage: "zh-CN",
        temperature: 0.1,
        maxTokens: 4000,
        chunkChars: 6,
        additionalInstruction: "",
      },
      modelProfile: { id: "model-a", name: "A", endpoint: "", apiKey: "", model: "a" },
      onChunk: (update) => updates.push(plain(update)),
    }),
    /empty translation output/i
  );

  assert.equal(calls.length, 2);
  assert.equal(updates.at(-1).combinedText, "第一段");
});

test("checks cancellation before calls and after an ignoring LLM returns", async () => {
  const { TranslationService } = loadBundle();
  const settings = {
    targetLanguage: "zh-CN",
    temperature: 0.1,
    maxTokens: 4000,
    chunkChars: 6,
    additionalInstruction: "",
  };
  const modelProfile = { id: "model-a", name: "A", endpoint: "", apiKey: "", model: "a" };

  const alreadyAborted = new AbortController();
  alreadyAborted.abort();
  let preAbortedCalls = 0;
  const preAbortedService = new TranslationService({
    async chat() {
      preAbortedCalls += 1;
      return "不应调用";
    },
  });
  await assert.rejects(
    preAbortedService.translate({
      source: "AAAA\n\nBBBB",
      settings,
      modelProfile,
      signal: alreadyAborted.signal,
    }),
    (error) => error?.name === "AbortError"
  );
  assert.equal(preAbortedCalls, 0);

  const abortedAfterFirst = new AbortController();
  let ignoredSignalCalls = 0;
  const ignoringService = new TranslationService({
    async chat(request) {
      ignoredSignalCalls += 1;
      request.onChunk?.("第一段", "第一段");
      abortedAfterFirst.abort();
      return "第一段";
    },
  });
  await assert.rejects(
    ignoringService.translate({
      source: "AAAA\n\nBBBB\n\nCCCC",
      settings,
      modelProfile,
      signal: abortedAfterFirst.signal,
    }),
    (error) => error?.name === "AbortError"
  );
  assert.equal(ignoredSignalCalls, 1);
});

function createModalHarness(bundle, translate, options = {}) {
  const PDFChatModal = bundle.PDFChatModal;
  const source = options.source || "Selected source";
  const persisted = [];
  const plugin = {
    settings: {
      activeModelId: "model-a",
      conversationHistories: {},
      lastModelId: "",
      lastPresetId: "",
      models: [{ id: "model-a", name: "A", endpoint: "", apiKey: "", model: "a" }],
      promptPresets: [],
      systemPrompt: "Generic chat prompt",
      translation: {
        targetLanguage: "zh-CN",
        temperature: 0.1,
        maxTokens: 4000,
        chunkChars: 8000,
        additionalInstruction: "",
        ...(options.translation || {}),
      },
    },
    saveSettings: async () => {},
  };
  const services = {
    actions: { async execute() {} },
    conversations: {
      getKey: () => "selection:key",
      get: () => [],
      async save(key, messages) {
        persisted.push({ key, messages: plain(messages) });
      },
      async clear() {},
    },
    llm: { async chat() { throw new Error("Generic chat must not run"); } },
    models: { get: () => plugin.settings.models[0] },
    papers: {
      async getOrCreateDocSummary() { return {}; },
      async getOrCreateDocChunks() { return {}; },
      async extractFullText() { throw new Error("Full text must not run"); },
      async planRagQueries() { throw new Error("RAG must not run"); },
      retrieveContext() { throw new Error("RAG must not run"); },
    },
    translations: { translate },
  };
  const modal = new PDFChatModal({}, plugin, source, null, false, services);
  const bubbles = [];
  modal.historyEl = {
    scrollHeight: 20,
    createDiv({ cls }) {
      const bubble = {
        cls,
        text: "",
        classes: [],
        addClass(value) { this.classes.push(value); },
        removeClass(value) { this.classes = this.classes.filter((item) => item !== value); },
        empty() { this.text = ""; },
        setText(value) { this.text = value; },
      };
      bubbles.push(bubble);
      return bubble;
    },
    scrollTo() {},
  };
  modal.inputEl = { value: "unrelated draft", focus() {} };
  modal.sendBtn = { setText() {}, toggleClass() {} };
  return { bubbles, modal, persisted, source };
}

test("registered translation action invokes the dedicated translation task", async () => {
  const { createResearchActionRegistry } = loadBundle();
  const registry = createResearchActionRegistry();
  let taskCalls = 0;

  await registry.execute("translate", {
    async translate() {
      taskCalls += 1;
    },
  });

  assert.equal(taskCalls, 1);
});

test("persists partial aborted translation but drops empty failed translation", async () => {
  const bundle = loadBundle();
  const stopped = createModalHarness(bundle, async (request) => {
    request.onChunk({
      chunkIndex: 1,
      chunkCount: 2,
      chunkText: "部分译文",
      combinedText: "部分译文",
    });
    const error = new Error("Aborted");
    error.name = "AbortError";
    throw error;
  });

  await stopped.modal.runTranslation();

  const friendlyLabel = `翻译当前选区（${stopped.source.length} 字）`;
  assert.deepEqual(plain(stopped.modal.transcript), [
    { role: "user", content: friendlyLabel, status: "complete" },
    { role: "assistant", content: "部分译文", status: "stopped" },
  ]);
  assert.deepEqual(stopped.persisted, [
    { key: "selection:key", messages: plain(stopped.modal.transcript) },
  ]);
  assert.equal(stopped.bubbles[0].text, friendlyLabel);
  assert.equal(stopped.bubbles[1].text, "部分译文\n\n[已停止生成]");
  assert.match(JSON.stringify(stopped.modal.messages), /部分译文/);
  assert.doesNotMatch(JSON.stringify(stopped.modal.messages.slice(1)), /<source_text>|Selected source/);
  assert.doesNotMatch(JSON.stringify(stopped.modal.transcript), /<source_text>|Selected source/);

  const failed = createModalHarness(bundle, async () => {
    throw new Error("translation endpoint failed");
  });
  const originalMessages = plain(failed.modal.messages);

  await failed.modal.runTranslation();

  assert.deepEqual(plain(failed.modal.transcript), []);
  assert.deepEqual(plain(failed.modal.messages), originalMessages);
  assert.deepEqual(failed.persisted, []);
  assert.equal(failed.bubbles[1].text, "翻译失败，请检查模型配置或稍后重试。");
});

test("modal persists prior output as stopped when a middle translation chunk is empty", async () => {
  const bundle = loadBundle();
  const serviceOutputs = ["第一段", "", "不应调用"];
  let serviceCalls = 0;
  const service = new bundle.TranslationService({
    async chat() {
      const output = serviceOutputs[serviceCalls];
      serviceCalls += 1;
      return output;
    },
  });
  const harness = createModalHarness(
    bundle,
    (request) => service.translate(request),
    { source: "AAAA\n\nBBBB\n\nCCCC", translation: { chunkChars: 6 } }
  );

  await harness.modal.runTranslation();

  const friendlyLabel = `翻译当前选区（${harness.source.length} 字）`;
  assert.equal(serviceCalls, 2);
  assert.deepEqual(plain(harness.modal.transcript), [
    { role: "user", content: friendlyLabel, status: "complete" },
    { role: "assistant", content: "第一段", status: "stopped" },
  ]);
  assert.equal(harness.bubbles[1].text, "第一段\n\n[已停止生成]");
  assert.deepEqual(plain(harness.modal.messages.slice(-2)), [
    { role: "user", content: friendlyLabel },
    { role: "assistant", content: "第一段" },
  ]);
  assert.deepEqual(harness.persisted, [
    { key: "selection:key", messages: plain(harness.modal.transcript) },
  ]);
});

test("modal sanitizes translation endpoint errors that contain internal prompts", async () => {
  const bundle = loadBundle();
  const leakedError =
    "Endpoint rejected system: faithful academic translation; user: <source_text>Selected source</source_text>";
  const failed = createModalHarness(bundle, async () => {
    throw new Error(leakedError);
  });
  const originalMessages = plain(failed.modal.messages);

  await failed.modal.runTranslation();

  assert.equal(failed.bubbles[1].text, "翻译失败，请检查模型配置或稍后重试。");
  assert.doesNotMatch(failed.bubbles[1].text, /faithful academic|source_text|Selected source|Endpoint rejected/);
  assert.deepEqual(plain(failed.modal.transcript), []);
  assert.deepEqual(plain(failed.modal.messages), originalMessages);
  assert.deepEqual(failed.persisted, []);
});

test("completed translation replaces progress in one assistant bubble and stores visible messages", async () => {
  const bundle = loadBundle();
  let taskRequest = null;
  const completed = createModalHarness(bundle, async (request) => {
    taskRequest = request;
    request.onChunk({
      chunkIndex: 1,
      chunkCount: 2,
      chunkText: "第一段",
      combinedText: "第一段",
    });
    request.onChunk({
      chunkIndex: 2,
      chunkCount: 2,
      chunkText: "第二段",
      combinedText: "第一段\n\n第二段",
    });
    return { text: "第一段\n\n第二段", chunkCount: 2 };
  });

  await completed.modal.runTranslation();

  const friendlyLabel = `翻译当前选区（${completed.source.length} 字）`;
  assert.equal(taskRequest.source, completed.source);
  assert.equal(taskRequest.settings.targetLanguage, "zh-CN");
  assert.equal(completed.bubbles.length, 2);
  assert.equal(completed.bubbles[0].text, friendlyLabel);
  assert.equal(completed.bubbles[1].text, "第一段\n\n第二段");
  assert.doesNotMatch(completed.bubbles[1].text, /正在翻译/);
  assert.deepEqual(plain(completed.modal.messages.slice(-2)), [
    { role: "user", content: friendlyLabel },
    { role: "assistant", content: "第一段\n\n第二段" },
  ]);
  assert.deepEqual(plain(completed.modal.transcript), [
    { role: "user", content: friendlyLabel, status: "complete" },
    { role: "assistant", content: "第一段\n\n第二段", status: "complete" },
  ]);
  assert.doesNotMatch(JSON.stringify(completed.persisted), /正在翻译|<source_text>/);
});

test("settings UI binds target language and additional translation instruction", () => {
  const source = fs.readFileSync(path.join(projectRoot, "src", "settings-tab.ts"), "utf8");
  assert.match(source, /settings\.translation\.targetLanguage/);
  assert.match(source, /settings\.translation\.additionalInstruction/);
  assert.doesNotMatch(source, /settings\.translatePrompt/);
});
