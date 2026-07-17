const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadPluginModule(options = {}) {
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
      if (options.notices) options.notices.push(message);
    }
  }
  class Setting {
    constructor() {}

    setName() {
      return this;
    }

    setDesc() {
      return this;
    }

    addControl(callback) {
      const control = {
        inputEl: { style: {} },
        tooltip: "",
        addOption() {
          return this;
        },
        onChange() {
          return this;
        },
        onClick(handler) {
          if (this.tooltip === "删除这个模型" && options.deleteModelHandlers) {
            options.deleteModelHandlers.push(handler);
          }
          return this;
        },
        setButtonText() {
          return this;
        },
        setCta() {
          return this;
        },
        setIcon() {
          return this;
        },
        setPlaceholder() {
          return this;
        },
        setTooltip(value) {
          this.tooltip = value;
          return this;
        },
        setValue() {
          return this;
        },
      };
      callback(control);
      return this;
    }

    addButton(callback) {
      return this.addControl(callback);
    }

    addDropdown(callback) {
      return this.addControl(callback);
    }

    addExtraButton(callback) {
      return this.addControl(callback);
    }

    addText(callback) {
      return this.addControl(callback);
    }

    addTextArea(callback) {
      return this.addControl(callback);
    }

    addToggle(callback) {
      return this.addControl(callback);
    }
  }

  const obsidian = {
    Plugin,
    Modal,
    Notice,
    PluginSettingTab,
    Setting,
    requestUrl: async () => ({}),
    MarkdownRenderer: {},
  };
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
      if (request === "obsidian") return obsidian;
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    window: {},
  };
  sandbox.exports = sandbox.module.exports;

  vm.runInNewContext(source, sandbox, { filename });
  const bundle = sandbox.module.exports;
  const PluginClass = bundle.default || bundle;
  PluginClass.__test = {
    createCompatibilityActionRegistry: bundle.createCompatibilityActionRegistry,
    createPDFChatModalServices: bundle.createPDFChatModalServices,
    normalizeConversationHistories: bundle.normalizeConversationHistories,
    OpenAICompatibleTransport: bundle.OpenAICompatibleTransport,
    PDFChatModal: bundle.PDFChatModal,
  };
  return PluginClass;
}

test("normalizes persisted histories to visible user and assistant messages", () => {
  const PluginClass = loadPluginModule();
  const normalize = PluginClass.__test.normalizeConversationHistories;
  assert.equal(typeof normalize, "function");

  const result = normalize({
    "pdf:papers/demo.pdf": {
      version: 99,
      updatedAt: 123,
      messages: [
        { role: "system", content: "hidden prompt" },
        { role: "user", content: "What is the claim?", status: "stopped" },
        { role: "assistant", content: "The claim is...", status: "complete" },
        { role: "assistant", content: "Partial answer", status: "stopped" },
        { role: "tool", content: "hidden tool output" },
        { role: "user", content: "   " },
      ],
    },
    broken: null,
    empty: { messages: [{ role: "assistant", content: "" }] },
  });

  assert.deepEqual(plain(result), {
    "pdf:papers/demo.pdf": {
      version: 1,
      updatedAt: 123,
      messages: [
        { role: "user", content: "What is the claim?", status: "complete" },
        { role: "assistant", content: "The claim is...", status: "complete" },
        { role: "assistant", content: "Partial answer", status: "stopped" },
      ],
    },
  });
});

test("uses PDF paths and normalized selection hashes as conversation keys", () => {
  const PluginClass = loadPluginModule();
  const plugin = Object.create(PluginClass.prototype);

  assert.equal(plugin.getConversationKey({ path: "papers/demo.pdf" }, "ignored"), "pdf:papers/demo.pdf");
  const first = plugin.getConversationKey(null, "  Same text\r\n");
  const second = plugin.getConversationKey(null, "Same text");
  const different = plugin.getConversationKey(null, "Different text");
  assert.match(first, /^selection:[0-9a-f]{8}$/);
  assert.equal(first, second);
  assert.notEqual(first, different);
});

test("saves cloned visible histories and deletes empty histories", async () => {
  const PluginClass = loadPluginModule();
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = { conversationHistories: {} };
  let saveCount = 0;
  plugin.saveSettings = async () => {
    saveCount += 1;
  };

  const messages = [
    { role: "user", content: "Question", status: "complete" },
    { role: "assistant", content: "Answer", status: "stopped" },
    { role: "system", content: "must not persist" },
  ];
  await plugin.saveConversation("pdf:demo.pdf", messages);
  messages[0].content = "mutated after save";

  assert.deepEqual(plain(plugin.getConversation("pdf:demo.pdf")), [
    { role: "user", content: "Question", status: "complete" },
    { role: "assistant", content: "Answer", status: "stopped" },
  ]);
  const copy = plugin.getConversation("pdf:demo.pdf");
  copy[0].content = "mutated copy";
  assert.equal(plugin.getConversation("pdf:demo.pdf")[0].content, "Question");

  await plugin.saveConversation("pdf:demo.pdf", []);
  assert.equal(plugin.settings.conversationHistories["pdf:demo.pdf"], undefined);
  assert.equal(saveCount, 2);
});

test("clearConversation removes only the active conversation", async () => {
  const PluginClass = loadPluginModule();
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    conversationHistories: {
      "pdf:first.pdf": { version: 1, updatedAt: 1, messages: [{ role: "user", content: "one" }] },
      "pdf:second.pdf": { version: 1, updatedAt: 2, messages: [{ role: "user", content: "two" }] },
    },
  };
  plugin.saveSettings = async () => {};

  await plugin.clearConversation("pdf:first.pdf");

  assert.equal(plugin.getConversation("pdf:first.pdf").length, 0);
  assert.equal(plugin.getConversation("pdf:second.pdf")[0].content, "two");
});

test("saveSettings serializes writes and the final write contains the latest state", async () => {
  const PluginClass = loadPluginModule();
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = { marker: 1 };
  plugin._saveQueue = Promise.resolve();
  let activeWrites = 0;
  let maxActiveWrites = 0;
  const snapshots = [];
  plugin.saveData = async (settings) => {
    activeWrites += 1;
    maxActiveWrites = Math.max(maxActiveWrites, activeWrites);
    snapshots.push(plain(settings));
    await new Promise((resolve) => setTimeout(resolve, 5));
    activeWrites -= 1;
  };

  const first = plugin.saveSettings();
  plugin.settings.marker = 2;
  const second = plugin.saveSettings();
  await Promise.all([first, second]);

  assert.equal(maxActiveWrites, 1);
  assert.equal(snapshots.at(-1).marker, 2);
});

test("modal constructor restores visible history into runtime model messages", () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {
      "pdf:papers/demo.pdf": {
        version: 1,
        updatedAt: 1,
        messages: [
          { role: "user", content: "Earlier question", status: "complete" },
          { role: "assistant", content: "Earlier answer", status: "stopped" },
        ],
      },
    },
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
  };

  const modal = new PDFChatModal({}, plugin, "Latest selected text", { path: "papers/demo.pdf" });

  assert.equal(modal.conversationKey, "pdf:papers/demo.pdf");
  assert.deepEqual(plain(modal.transcript), [
    { role: "user", content: "Earlier question", status: "complete" },
    { role: "assistant", content: "Earlier answer", status: "stopped" },
  ]);
  assert.deepEqual(plain(modal.messages.slice(1)), [
    { role: "user", content: "Earlier question" },
    { role: "assistant", content: "Earlier answer" },
  ]);
  assert.match(modal.messages[0].content, /Latest selected text/);
  assert.equal(modal.fullTextAttached, false);
});

test("modal constructor skips loading history when starting fresh", () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {
      "pdf:papers/demo.pdf": {
        version: 1,
        updatedAt: 1,
        messages: [
          { role: "user", content: "Earlier question", status: "complete" },
          { role: "assistant", content: "Earlier answer", status: "stopped" },
        ],
      },
    },
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
  };

  const modal = new PDFChatModal({}, plugin, "Latest selected text", { path: "papers/demo.pdf" }, true);

  assert.equal(modal.startFresh, true);
  assert.equal(modal.hadExistingHistory, true);
  assert.deepEqual(plain(modal.transcript), []);
  assert.equal(modal.messages.length, 1);
  assert.equal(modal.messages[0].role, "system");
});

test("closing an empty fresh-started modal does not erase previously saved history", async () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {
      "pdf:demo.pdf": {
        version: 1,
        updatedAt: 1,
        messages: [{ role: "user", content: "Old question", status: "complete" }],
      },
    },
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
  };
  let saveCalled = false;
  plugin.saveConversation = async () => {
    saveCalled = true;
  };

  const modal = new PDFChatModal({}, plugin, "Selection", { path: "demo.pdf" }, true);
  modal.abortController = null;
  modal.contentEl = { empty() {} };

  modal.onClose();

  assert.equal(saveCalled, false);
  assert.deepEqual(plugin.settings.conversationHistories["pdf:demo.pdf"].messages, [
    { role: "user", content: "Old question", status: "complete" },
  ]);
});

test("closing defensively saves chat and translation transcripts under separate keys", async () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const saved = [];
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {},
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
  };
  plugin.saveConversation = async (key, messages) => {
    saved.push({ key, messages: plain(messages) });
  };
  const modal = new PDFChatModal({}, plugin, "Selection", { path: "demo.pdf" });
  modal.transcript = [
    { role: "user", content: "Chat question", status: "complete" },
    { role: "assistant", content: "Chat answer", status: "complete" },
  ];
  modal.translateTranscript = [
    { role: "user", content: "Translate selection", status: "complete" },
    { role: "assistant", content: "Translation", status: "stopped" },
  ];
  modal.contentEl = { empty() {} };

  modal.onClose();
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(saved.map((entry) => entry.key).sort(), [
    "pdf:demo.pdf",
    "translate:pdf:demo.pdf",
  ]);
});

test("modal records only finalized visible turns", async () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const persisted = [];
  let apiMessages = [];
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {},
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    ragQueryTranslate: false,
    ragTopK: 1,
    systemPrompt: "System instructions",
  };
  plugin.saveConversation = async (key, messages) => {
    persisted.push({ key, messages: plain(messages) });
  };

  const modal = new PDFChatModal({}, plugin, "Selection", { path: "demo.pdf" });
  await modal.recordTranscriptTurn("Visible question", "Visible answer", "complete");
  await modal.recordTranscriptTurn("Unanswered question", "", "stopped");

  assert.deepEqual(plain(modal.transcript), [
    { role: "user", content: "Visible question", status: "complete" },
    { role: "assistant", content: "Visible answer", status: "complete" },
  ]);
  assert.deepEqual(persisted, [{ key: "pdf:demo.pdf", messages: plain(modal.transcript) }]);
});

test("modal restores Markdown assistants and marks stopped responses", async () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {
      "pdf:demo.pdf": {
        version: 1,
        updatedAt: 1,
        messages: [
          { role: "user", content: "Question", status: "complete" },
          { role: "assistant", content: "**Answer**", status: "complete" },
          { role: "assistant", content: "Partial", status: "stopped" },
        ],
      },
    },
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
  };
  const modal = new PDFChatModal({}, plugin, "Selection", { path: "demo.pdf" });
  const bubbles = [];
  let scrollTarget = null;
  modal.historyEl = {
    scrollHeight: 50,
    scrollTo(options) {
      scrollTarget = options;
    },
  };
  modal.addBubble = (role, text) => {
    const bubble = {
      role,
      text,
      classes: [],
      labels: [],
      addClass(value) {
        this.classes.push(value);
      },
      createEl(tag, options) {
        this.labels.push({ tag, ...options });
      },
      empty() {
        this.text = "";
      },
      setText(value) {
        this.text = value;
      },
    };
    bubbles.push(bubble);
    return bubble;
  };

  await modal.restoreConversationHistory();

  assert.equal(bubbles[0].role, "user");
  assert.equal(bubbles[0].text, "Question");
  assert.ok(bubbles[1].classes.includes("is-rendered"));
  assert.equal(bubbles[1].text, "**Answer**");
  assert.ok(bubbles[2].classes.includes("is-stopped"));
  assert.deepEqual(bubbles[2].labels, [
    { tag: "p", cls: "pdf-chat-stopped-label", text: "[已停止生成]" },
  ]);
  assert.deepEqual(plain(scrollTarget), { top: 50, behavior: "auto" });
});

test("resetConversation clears runtime and persisted state for the active key", async () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const cleared = [];
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {
      "pdf:demo.pdf": {
        version: 1,
        updatedAt: 1,
        messages: [{ role: "user", content: "Question", status: "complete" }],
      },
    },
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
  };
  plugin.clearConversation = async (key) => {
    cleared.push(key);
  };
  const modal = new PDFChatModal({}, plugin, "Selection", { path: "demo.pdf" });
  let historyEmptied = false;
  modal.historyEl = {
    empty() {
      historyEmptied = true;
    },
  };
  modal.fullTextAttached = true;
  modal.translateTranscript = [
    { role: "user", content: "Translate selection", status: "complete" },
    { role: "assistant", content: "Translation", status: "complete" },
  ];

  await modal.resetConversation();

  assert.deepEqual(cleared, ["pdf:demo.pdf"]);
  assert.deepEqual(plain(modal.transcript), []);
  assert.equal(modal.messages.length, 1);
  assert.equal(modal.messages[0].role, "system");
  assert.equal(modal.fullTextAttached, false);
  assert.equal(historyEmptied, true);
  assert.deepEqual(plain(modal.translateTranscript), [
    { role: "user", content: "Translate selection", status: "complete" },
    { role: "assistant", content: "Translation", status: "complete" },
  ]);
});

test("handleSubmit persists streamed partial text when generation is stopped", async () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  const persisted = [];
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {},
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
  };
  plugin.getModelProfile = () => ({ id: "model-a" });
  plugin.saveConversation = async (key, messages) => {
    persisted.push({ key, messages: plain(messages) });
  };
  plugin.chat = async (messages, onChunk) => {
    apiMessages = plain(messages);
    onChunk("Partial answer", "Partial answer");
    const error = new Error("Aborted");
    error.name = "AbortError";
    throw error;
  };

  const modal = new PDFChatModal({}, plugin, "Selection", { path: "demo.pdf" });
  modal.useRag = true;
  modal.useFullTextMode = false;
  modal.docChunksEntry = {
    chunks: [{ idx: 0, page: 1, text: "Question evidence from the PDF" }],
  };
  const bubbles = [];
  modal.historyEl = {
    scrollHeight: 20,
    createDiv({ cls }) {
      const bubble = {
        cls,
        text: "",
        classes: [],
        addClass(value) {
          this.classes.push(value);
        },
        removeClass(value) {
          this.classes = this.classes.filter((item) => item !== value);
        },
        setText(value) {
          this.text = value;
        },
      };
      bubbles.push(bubble);
      return bubble;
    },
    scrollTo() {},
  };
  modal.inputEl = {
    value: "Question",
    focus() {},
  };
  modal.sendBtn = {
    setText() {},
    toggleClass() {},
  };

  await modal.handleSubmit();

  assert.deepEqual(plain(modal.transcript), [
    { role: "user", content: "Question", status: "complete" },
    { role: "assistant", content: "Partial answer", status: "stopped" },
  ]);
  assert.deepEqual(persisted, [{ key: "pdf:demo.pdf", messages: plain(modal.transcript) }]);
  assert.match(apiMessages.at(-1).content, /按关键词检索到的可能相关片段/);
  assert.doesNotMatch(JSON.stringify(persisted), /按关键词检索到的可能相关片段/);
  assert.equal(bubbles.at(-1).text, "Partial answer\n\n[已停止生成]");
});

test("handleTranslate uses the dedicated isolated translation pipeline without reading the input box", async () => {
  const PluginClass = loadPluginModule();
  const PDFChatModal = PluginClass.__test.PDFChatModal;
  let apiMessages = [];
  const plugin = Object.create(PluginClass.prototype);
  plugin.settings = {
    activeModelId: "model-a",
    conversationHistories: {},
    lastModelId: "",
    lastPresetId: "",
    models: [{ id: "model-a" }],
    promptPresets: [],
    systemPrompt: "System instructions",
    translation: {
      targetLanguage: "zh-CN",
      temperature: 0.1,
      maxTokens: 4000,
      chunkChars: 8000,
      additionalInstruction: "",
    },
  };
  plugin.getModelProfile = () => ({ id: "model-a" });
  plugin.saveConversation = async () => {};
  plugin.chat = async (messages) => {
    apiMessages = plain(messages);
    return "翻译结果";
  };

  const modal = new PDFChatModal({}, plugin, "Selection", { path: "demo.pdf" });
  // 即使全文/检索都开着,翻译也不应该触发这些逻辑,否则会调用 extractPdfFullText 等
  // 在单测环境里没有 mock 的依赖。
  modal.useRag = true;
  modal.useFullTextMode = true;
  modal.docChunksEntry = { chunks: [{ idx: 0, page: 1, text: "Some PDF text" }] };
  const bubbles = [];
  modal.historyEl = {
    scrollHeight: 20,
    createDiv({ cls }) {
      const bubble = {
        cls,
        text: "",
        classes: [],
        addClass(value) {
          this.classes.push(value);
        },
        removeClass(value) {
          this.classes = this.classes.filter((item) => item !== value);
        },
        setText(value) {
          this.text = value;
        },
      };
      bubbles.push(bubble);
      return bubble;
    },
    scrollTo() {},
  };
  modal.inputEl = { value: "leave me alone", focus() {} };
  modal.sendBtn = { setText() {}, toggleClass() {} };

  modal.handleTranslate();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(bubbles[0].text, "翻译当前选区（9 字）");
  assert.deepEqual(apiMessages.map((message) => message.role), ["system", "user"]);
  assert.match(apiMessages[1].content, /<source_text>\nSelection\n<\/source_text>/);
  assert.equal(JSON.stringify(apiMessages).split("Selection").length - 1, 1);
  assert.doesNotMatch(JSON.stringify(apiMessages), /System instructions|Some PDF text/);
  assert.equal(modal.inputEl.value, "leave me alone");
});

test("translate compatibility registry delegates to the dedicated translation task", async () => {
  const PluginClass = loadPluginModule();
  const createRegistry = PluginClass.__test.createCompatibilityActionRegistry;
  const registry = createRegistry("default translation instruction");
  let calls = 0;

  await registry.execute("translate", {
    async translate() {
      calls += 1;
    },
  });

  assert.equal(calls, 1);
});

test("non-streaming transport preserves endpoint error text when the JSON body is invalid", async () => {
  const PluginClass = loadPluginModule();
  const Transport = PluginClass.__test.OpenAICompatibleTransport;
  const profile = { id: "model-a", endpoint: "", apiKey: "", model: "model-a" };
  const transport = new Transport(
    () => ({ activeModelId: "model-a", temperature: 0.7, maxTokens: 100, stream: false }),
    () => profile,
    async () => ({
      status: 502,
      text: "gateway down",
      get json() {
        throw new Error("invalid JSON");
      },
    })
  );

  await assert.rejects(
    transport.chat({ messages: [{ role: "user", content: "Question" }] }),
    /gateway down/
  );
});

test("modal compatibility services forward the complete LlmRequest contract", async () => {
  const PluginClass = loadPluginModule();
  const createServices = PluginClass.__test.createPDFChatModalServices;
  const forwarded = [];
  const plugin = {
    actionRegistry: { execute() {} },
    app: {},
    clearConversation: async () => {},
    getConversation: () => [],
    getConversationKey: () => "selection:key",
    getModelProfile: () => ({}),
    getOrCreateDocChunks: async () => ({}),
    getOrCreateDocSummary: async () => ({}),
    async chat(...args) {
      forwarded.push({ legacyArgs: args });
      return "answer";
    },
    llmTransport: {
      async chat(request) {
        forwarded.push(request);
        return "answer";
      },
    },
    planRagQueries: async () => [],
    saveConversation: async () => {},
  };
  const services = createServices(plugin);
  const signal = new AbortController().signal;
  const onChunk = () => {};
  const profile = { id: "model-a", endpoint: "", apiKey: "", model: "model-a" };
  const request = {
    messages: [{ role: "user", content: "Question" }],
    onChunk,
    signal,
    modelProfile: profile,
    stream: false,
    maxTokensOverride: 321,
  };

  assert.equal(await services.llm.chat(request), "answer");
  assert.equal(forwarded.length, 1);
  assert.equal(forwarded[0], request);

  forwarded.length = 0;
  delete plugin.llmTransport;
  const legacyServices = createServices(plugin);
  assert.equal(await legacyServices.llm.chat(request), "answer");
  assert.equal(forwarded.length, 1);
  assert.equal(forwarded[0].legacyArgs[0], request.messages);
  assert.equal(forwarded[0].legacyArgs[1], request.onChunk);
  assert.equal(forwarded[0].legacyArgs[2], request.signal);
  assert.equal(forwarded[0].legacyArgs[3], request.modelProfile);
  assert.deepEqual(plain(forwarded[0].legacyArgs[4]), {
    stream: false,
    maxTokensOverride: 321,
  });
});

test("deleting the sole model shows a Notice instead of throwing", async () => {
  const notices = [];
  const deleteModelHandlers = [];
  const PluginClass = loadPluginModule({ notices, deleteModelHandlers });
  const plugin = Object.create(PluginClass.prototype);
  plugin.loadData = async () => ({});
  plugin.saveData = async () => {};
  plugin.addCommand = () => {};
  let settingTab = null;
  plugin.addSettingTab = (tab) => {
    settingTab = tab;
  };
  await plugin.onload();
  settingTab.containerEl = {
    empty() {},
    createEl() {
      return {};
    },
  };

  settingTab.display();
  assert.equal(deleteModelHandlers.length, 1);
  await deleteModelHandlers[0]();

  assert.deepEqual(notices, ["至少要保留一个模型配置"]);
  assert.equal(plugin.settings.models.length, 1);
});

test("onload registers separate new-conversation and continue-conversation hotkeys", async () => {
  const PluginClass = loadPluginModule();
  const plugin = Object.create(PluginClass.prototype);
  plugin.loadData = async () => ({});
  plugin.saveData = async () => {};
  const addedCommands = [];
  plugin.addCommand = (cmd) => addedCommands.push(cmd);
  plugin.addSettingTab = () => {};

  await plugin.onload();

  const fresh = addedCommands.find((c) => c.id === "ask-about-selection");
  const continued = addedCommands.find((c) => c.id === "continue-conversation");
  assert.ok(fresh, "expected a new-conversation command to be registered");
  assert.ok(continued, "expected a continue-conversation command to be registered");
  assert.deepEqual(plain(fresh.hotkeys), [{ modifiers: ["Mod", "Alt"], key: "Q" }]);
  assert.deepEqual(plain(continued.hotkeys), [{ modifiers: ["Mod"], key: "Q" }]);
});

test("release metadata and CSS expose the exact 0.7.0 selectable-text contract", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));
  const versions = JSON.parse(fs.readFileSync(path.join(projectRoot, "versions.json"), "utf8"));
  const css = fs.readFileSync(path.join(projectRoot, "styles.css"), "utf8");

  assert.equal(pkg.version, "0.7.0");
  assert.equal(manifest.version, "0.7.0");
  assert.equal(manifest.minAppVersion, "1.4.0");
  assert.equal(versions["0.7.0"], "1.4.0");
  assert.match(css, /\.pdf-chat-bubble[^}]*user-select:\s*text/s);
  assert.match(css, /-webkit-user-select:\s*text/);
  assert.match(css, /\.pdf-chat-bubble[^}]*cursor:\s*text/s);
});
