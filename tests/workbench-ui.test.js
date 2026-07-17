const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

class MiniDocument {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      handlers.filter((candidate) => candidate !== handler)
    );
  }

  dispatch(type, extra = {}) {
    const event = {
      type,
      preventDefault() {},
      stopPropagation() {},
      ...extra,
    };
    for (const handler of this.listeners.get(type) || []) handler(event);
  }
}

class MiniElement {
  constructor(tagName = "div", ownerDocument = null) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument || new MiniDocument();
    this.parentElement = null;
    this.children = [];
    this.attributes = new Map();
    this.classes = new Set();
    this.listeners = new Map();
    this.style = {
      setProperty: (name, value) => {
        this.style[name] = value;
      },
    };
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.scrollHeight = 48;
  }

  get className() {
    return Array.from(this.classes).join(" ");
  }

  get classList() {
    return {
      contains: (value) => this.classes.has(value),
    };
  }

  createDiv(options = {}) {
    return this.createEl("div", options);
  }

  createEl(tagName, options = {}) {
    const child = new MiniElement(tagName, this.ownerDocument);
    child.parentElement = this;
    this.children.push(child);
    if (options.cls) {
      String(options.cls)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((value) => child.classes.add(value));
    }
    if (options.text !== undefined) child.textContent = String(options.text);
    if (options.value !== undefined) child.value = String(options.value);
    if (options.type !== undefined) child.type = String(options.type);
    if (options.attr) {
      for (const [name, value] of Object.entries(options.attr)) child.setAttr(name, value);
    }
    return child;
  }

  addClass(...values) {
    values.forEach((value) => this.classes.add(value));
  }

  removeClass(...values) {
    values.forEach((value) => this.classes.delete(value));
  }

  toggleClass(value, force) {
    if (force === undefined ? !this.classes.has(value) : force) this.classes.add(value);
    else this.classes.delete(value);
  }

  hasClass(value) {
    return this.classes.has(value);
  }

  setAttr(name, value) {
    this.attributes.set(name, String(value));
  }

  setAttribute(name, value) {
    this.setAttr(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setText(value) {
    this.textContent = String(value);
    this.children = [];
  }

  empty() {
    this.textContent = "";
    this.children = [];
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  dispatch(type, extra = {}) {
    const event = {
      type,
      target: this,
      currentTarget: this,
      preventDefault() {},
      stopPropagation() {},
      ...extra,
    };
    for (const handler of this.listeners.get(type) || []) handler(event);
  }

  focus() {
    this.focused = true;
  }

  scrollTo(options) {
    this.lastScroll = options;
  }

  closest(selector) {
    const tags = selector.split(",").map((item) => item.trim().toUpperCase());
    let current = this;
    while (current) {
      if (tags.includes(current.tagName)) return current;
      current = current.parentElement;
    }
    return null;
  }

  contains(target) {
    let current = target;
    while (current) {
      if (current === this) return true;
      current = current.parentElement;
    }
    return false;
  }
}

function descendants(root) {
  return root.children.flatMap((child) => [child, ...descendants(child)]);
}

function byClass(root, className) {
  return descendants(root).filter((element) => element.classes.has(className));
}

function byTag(root, tagName) {
  return descendants(root).filter((element) => element.tagName === tagName.toUpperCase());
}

function loadBundle(options = {}) {
  const source = fs.readFileSync(path.join(projectRoot, "main.js"), "utf8");
  const settingTabs = [];

  class Plugin {
    constructor() {
      this.app = {};
    }

    addCommand() {}
    addSettingTab(tab) {
      settingTabs.push(tab);
    }
    async loadData() {
      return {};
    }
    async saveData() {}
  }

  class Modal {
    constructor(app) {
      this.app = app;
      this.contentEl = new MiniElement("div");
      this.modalEl = new MiniElement("div");
    }
  }

  class PluginSettingTab {
    constructor(app, plugin) {
      this.app = app;
      this.plugin = plugin;
      this.containerEl = new MiniElement("div");
    }
  }

  class Notice {
    hide() {}
  }

  class Setting {
    constructor(container) {
      this.settingEl = container.createDiv({ cls: "setting-item" });
    }

    setName(value) {
      this.settingEl.setAttr("data-name", value);
      return this;
    }

    setDesc(value) {
      this.settingEl.setAttr("data-description", value);
      return this;
    }

    addControl(tagName, callback) {
      const inputEl = this.settingEl.createEl(tagName);
      const control = {
        inputEl,
        addOption(value, label) {
          inputEl.createEl("option", { value, text: label });
          return this;
        },
        onChange(handler) {
          inputEl.registeredOnChange = handler;
          inputEl.addEventListener("change", () => handler(inputEl.value));
          return this;
        },
        onClick(handler) {
          inputEl.registeredOnClick = handler;
          inputEl.addEventListener("click", handler);
          return this;
        },
        setButtonText(value) {
          inputEl.setText(value);
          return this;
        },
        setCta() {
          inputEl.addClass("mod-cta");
          return this;
        },
        setIcon(value) {
          inputEl.setAttr("data-icon", value);
          return this;
        },
        setPlaceholder(value) {
          inputEl.setAttr("placeholder", value);
          return this;
        },
        setTooltip(value) {
          inputEl.setAttr("title", value);
          return this;
        },
        setValue(value) {
          inputEl.value = value;
          return this;
        },
      };
      callback(control);
      return this;
    }

    addButton(callback) {
      return this.addControl("button", callback);
    }
    addDropdown(callback) {
      return this.addControl("select", callback);
    }
    addExtraButton(callback) {
      return this.addControl("button", callback);
    }
    addText(callback) {
      return this.addControl("input", callback);
    }
    addTextArea(callback) {
      return this.addControl("textarea", callback);
    }
    addToggle(callback) {
      return this.addControl("input", callback);
    }
  }

  const obsidian = {
    MarkdownRenderer: options.markdownRenderer || {
      async render(_app, text, element) {
        element.setText(text);
      },
    },
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    requestUrl: async () => ({}),
  };
  const sandbox = {
    AbortController,
    Element: MiniElement,
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
  vm.runInNewContext(source, sandbox, { filename: path.join(projectRoot, "main.js") });
  return { bundle: sandbox.module.exports, settingTabs };
}

function createModalHarness({
  transcript = [],
  markdownRenderer,
  llmChat,
  translation,
  autoTranslateOnOpen = false,
  startFresh = false,
} = {}) {
  const { bundle } = loadBundle({ markdownRenderer });
  const settings = JSON.parse(JSON.stringify(bundle.DEFAULT_SETTINGS));
  settings.autoDocSummary = false;
  settings.autoRag = false;
  const plugin = {
    settings,
    saveSettings: async () => {},
  };
  const services = {
    conversations: {
      getKey: (_file, _text, kind) =>
        kind === "translate" ? "translate:pdf:papers/demo.pdf" : "pdf:papers/demo.pdf",
      get: () => transcript,
      save: async () => {},
      clear: async () => {},
    },
    papers: {
      getOrCreateDocSummary: async () => {
        throw new Error("Unexpected summary generation");
      },
      getOrCreateDocChunks: async () => {
        throw new Error("Unexpected indexing");
      },
      extractFullText: async () => "",
      planRagQueries: async () => [],
      retrieveContext: () => [],
    },
    llm: { chat: llmChat || (async () => "Answer") },
    models: {
      get: () => settings.models[0],
      resolveContinueId: () => settings.activeModelId,
      resolveTranslateId: () => settings.activeModelId,
    },
    actions: {
      list: () => [],
      execute: async (_id, context) => context.translate(),
    },
    translations: {
      translate:
        translation ||
        (async () => ({
          text: "译文",
          chunkCount: 1,
          stoppedEarly: false,
          failedChunkIndexes: [],
        })),
    },
  };
  const pdfFile = { name: "demo.pdf", path: "papers/demo.pdf", stat: { mtime: 1 } };
  const modal = new bundle.PDFChatModal(
    {},
    plugin,
    "Selected source",
    pdfFile,
    startFresh,
    services,
    autoTranslateOnOpen
  );
  modal.onOpen();
  return { modal, plugin };
}

test("quick-translate modal starts translation automatically instead of focusing the composer", async () => {
  let translationCalls = 0;
  const { modal } = createModalHarness({
    autoTranslateOnOpen: true,
    startFresh: true,
    translation: async () => {
      translationCalls += 1;
      return {
        text: "Automatic translation",
        chunkCount: 1,
        stoppedEarly: false,
        failedChunkIndexes: [],
      };
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(modal.autoTranslateOnOpen, true);
  assert.equal(translationCalls, 1);
  assert.equal(byClass(modal.historyEl, "pdf-chat-bubble").length, 2);
});

test("modal builds the accessible research-workbench regions and interactions", () => {
  const { modal } = createModalHarness();
  const regionClasses = modal.contentEl.children.map((element) => element.className);
  assert.deepEqual(regionClasses, [
    "pdf-chat-workbench-header pdf-chat-drag-handle",
    "pdf-chat-context-panel",
    "pdf-chat-history",
    "pdf-chat-composer",
  ]);

  const header = byClass(modal.contentEl, "pdf-chat-workbench-header")[0];
  assert.match(header.textContent + descendants(header).map((el) => el.textContent).join(" "), /PDF Chat/);
  assert.match(descendants(header).map((el) => el.textContent).join(" "), /demo\.pdf/);
  assert.equal(byTag(header, "select").length, 2);
  assert.equal(byClass(header, "pdf-chat-header-primary-controls").length, 1);
  assert.equal(byClass(header, "pdf-chat-header-secondary-controls").length, 1);
  assert.equal(byClass(byClass(header, "pdf-chat-header-primary-controls")[0], "pdf-chat-reset-btn").length, 0);
  const moreButton = byClass(header, "pdf-chat-more-button")[0];
  const moreMenu = byClass(header, "pdf-chat-more-menu")[0];
  const clearButton = byClass(moreMenu, "pdf-chat-reset-btn")[0];
  assert.ok(moreButton, "missing more menu trigger");
  assert.ok(moreMenu, "missing more menu");
  assert.ok(clearButton, "clear action should live inside more menu");
  assert.equal(moreButton.getAttribute("aria-expanded"), "false");
  assert.equal(moreMenu.hasClass("is-hidden"), true);
  moreButton.dispatch("click");
  assert.equal(moreButton.getAttribute("aria-expanded"), "true");
  assert.equal(moreMenu.hasClass("is-hidden"), false);
  header.ownerDocument.dispatch("keydown", { key: "Escape", target: moreButton });
  assert.equal(moreButton.getAttribute("aria-expanded"), "false");
  assert.equal(moreMenu.hasClass("is-hidden"), true);
  moreButton.dispatch("click");
  header.ownerDocument.dispatch("click", { target: modal.historyEl });
  assert.equal(moreButton.getAttribute("aria-expanded"), "false");

  const contextToggle = byClass(modal.contentEl, "pdf-chat-context-toggle")[0];
  const contextPanel = byClass(modal.contentEl, "pdf-chat-context-panel")[0];
  const contextBody = byClass(modal.contentEl, "pdf-chat-context-body")[0];
  const selectionChip = byClass(contextToggle, "pdf-chat-selection-count")[0];
  const summaryChip = byClass(contextToggle, "pdf-chat-summary-status")[0];
  const ragChip = byClass(contextToggle, "pdf-chat-rag-status")[0];
  assert.equal(contextToggle.tagName, "BUTTON");
  assert.equal(contextToggle.getAttribute("aria-expanded"), "false");
  assert.match(contextToggle.getAttribute("aria-label"), /论文上下文/);
  assert.ok(selectionChip.hasClass("is-neutral"));
  assert.ok(summaryChip.hasClass("is-neutral"));
  assert.ok(ragChip.hasClass("is-neutral"));
  assert.ok(selectionChip.hasClass("pdf-chat-status-chip-count"));
  assert.ok(summaryChip.hasClass("pdf-chat-status-chip-summary"));
  assert.ok(ragChip.hasClass("pdf-chat-status-chip-context"));
  assert.equal(contextPanel.hasClass("is-expanded"), false);
  assert.equal(contextBody.hasClass("is-collapsed"), true);
  contextToggle.dispatch("click");
  assert.equal(contextToggle.getAttribute("aria-expanded"), "true");
  assert.equal(contextPanel.hasClass("is-expanded"), true);
  assert.equal(contextBody.hasClass("is-collapsed"), false);
  contextToggle.dispatch("click");
  assert.equal(contextToggle.getAttribute("aria-expanded"), "false");
  assert.equal(contextPanel.hasClass("is-expanded"), false);
  assert.equal(contextBody.hasClass("is-collapsed"), true);

  assert.equal(modal.historyEl.getAttribute("role"), "log");
  assert.equal(modal.historyEl.getAttribute("aria-live"), "polite");
  assert.equal(byClass(modal.historyEl, "pdf-chat-empty-state").length, 1);
  assert.match(byClass(modal.historyEl, "pdf-chat-empty-state")[0].textContent, /选区已就绪/);
  assert.deepEqual(modal.transcript, []);

  const extensionSlot = byClass(modal.contentEl, "pdf-chat-research-actions")[0];
  assert.equal(extensionSlot.getAttribute("role"), "group");
  assert.equal(extensionSlot.getAttribute("data-research-action-slot"), "context");
  assert.equal(byTag(extensionSlot, "button").length, 0);
  assert.doesNotMatch(descendants(modal.contentEl).map((el) => el.textContent).join(" "), /相关论文|PPT/);

  const composer = byClass(modal.contentEl, "pdf-chat-composer")[0];
  assert.equal(byClass(composer, "pdf-chat-composer-card").length, 1);
  assert.equal(byClass(composer, "pdf-chat-composer-footer").length, 1);
  assert.match(byClass(composer, "pdf-chat-composer-status")[0].textContent, /选区上下文|当前选区/);
  assert.equal(byClass(composer, "pdf-chat-hint").length, 1);
  assert.equal(modal.translateBtn.textContent, "翻译选区");
  assert.match(modal.inputEl.getAttribute("aria-label"), /提问/);
  assert.match(modal.sendBtn.getAttribute("aria-label"), /发送/);
  assert.equal(modal.sendBtn.textContent, "↑");
  assert.deepEqual(
    descendants(modal.contentEl)
      .filter((element) => element.getAttribute("title") !== null)
      .map((element) => `${element.tagName}.${element.className}`),
    []
  );

  modal.inputEl.scrollHeight = 120;
  modal.inputEl.dispatch("input");
  assert.equal(modal.inputEl.style.height, "120px");

  modal.setSendingState(true);
  assert.equal(modal.translateBtn.disabled, true);
  assert.equal(modal.sendBtn.textContent, "停止");
  assert.match(modal.sendBtn.getAttribute("aria-label"), /停止/);
  modal.setSendingState(false);
  assert.equal(modal.translateBtn.disabled, false);
  assert.equal(modal.sendBtn.textContent, "↑");

  const bubble = modal.addBubble("user", "Question");
  assert.equal(byClass(modal.historyEl, "pdf-chat-empty-state").length, 0);
  assert.equal(bubble.getAttribute("data-speaker"), null);
  assert.match(bubble.getAttribute("aria-label"), /消息/);
  const translationBubble = modal.addBubble("user", "翻译当前选区（1028 字）");
  assert.equal(byClass(translationBubble, "pdf-chat-user-message-title")[0].textContent, "翻译当前选区");
  assert.equal(byClass(translationBubble, "pdf-chat-user-message-meta")[0].textContent, "1028 字");
  const assistantBubble = modal.addBubble("assistant", "Plain assistant answer.");
  assert.equal(byClass(assistantBubble, "pdf-chat-message-meta").length, 1);
  assert.match(descendants(byClass(assistantBubble, "pdf-chat-message-meta")[0]).map((el) => el.textContent).join(" "), /PDF Chat/);
  assert.equal(byClass(assistantBubble, "pdf-chat-message-content")[0].textContent, "Plain assistant answer.");
  assert.deepEqual(modal.transcript, []);
});

test("restored history keeps the live region off until every Markdown render settles", async () => {
  const pendingRenders = [];
  const markdownRenderer = {
    render(_app, text, element) {
      let resolve;
      const promise = new Promise((done) => {
        resolve = () => {
          element.setText(text);
          done();
        };
      });
      pendingRenders.push({ promise, resolve });
      return promise;
    },
  };
  const transcript = [
    { role: "user", content: "Question", status: "complete" },
    { role: "assistant", content: "First answer", status: "complete" },
    { role: "assistant", content: "Second answer", status: "complete" },
  ];
  const { modal } = createModalHarness({ transcript, markdownRenderer });

  assert.equal(pendingRenders.length, 2);
  assert.equal(modal.historyEl.getAttribute("aria-live"), "off");
  pendingRenders[0].resolve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(modal.historyEl.getAttribute("aria-live"), "off");

  pendingRenders[1].resolve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(byClass(modal.historyEl, "pdf-chat-empty-state").length, 0);
  assert.equal(modal.historyEl.getAttribute("aria-live"), "polite");
  assert.equal(byClass(modal.historyEl, "pdf-chat-bubble").length, 3);
});

test("normal submission clears the grown composer and resets its inline height", async () => {
  const requests = [];
  const { modal } = createModalHarness({
    llmChat: async (request) => {
      requests.push(request);
      request.onChunk?.("Answer", "Answer");
      return "Answer";
    },
  });
  modal.inputEl.value = "What is the contribution?";
  modal.inputEl.scrollHeight = 120;
  modal.inputEl.dispatch("input");
  assert.equal(modal.inputEl.style.height, "120px");

  await modal.handleSubmit();

  assert.equal(requests.length, 1);
  assert.equal(modal.inputEl.value, "");
  assert.equal(modal.inputEl.style.height, "");
  assert.deepEqual(JSON.parse(JSON.stringify(modal.transcript)), [
    { role: "user", content: "What is the contribution?", status: "complete" },
    { role: "assistant", content: "Answer", status: "complete" },
  ]);
});

test("assistant completion shows follow-up suggestions without auto-sending", async () => {
  const requests = [];
  const { modal } = createModalHarness({
    llmChat: async (request) => {
      requests.push(request);
      request.onChunk?.("Answer", "Answer");
      return "Answer";
    },
  });
  modal.inputEl.value = "What is the contribution?";

  await modal.handleSubmit();

  const suggestions = byClass(modal.historyEl, "pdf-chat-followup-suggestions");
  assert.equal(suggestions.length, 1);
  const buttons = byTag(suggestions[0], "button");
  assert.deepEqual(
    buttons.map((button) => button.textContent),
    ["解释这段内容", "总结核心贡献", "分析实验结果", "与相关工作对比"]
  );
  buttons[0].dispatch("click");
  assert.equal(modal.inputEl.value, "解释这段内容");
  assert.equal(modal.inputEl.focused, true);
  assert.equal(requests.length, 1);
  modal.inputEl.dispatch("input");
  assert.equal(byClass(modal.historyEl, "pdf-chat-followup-suggestions").length, 0);
});

test("assistant plain text is lightly split only for display", async () => {
  const longText =
    "提示生成方面主要改进了搜索空间和反馈机制。模型改进方面强调策略模型与评估模型之间的配合。实验结果说明该方法在多个任务上更稳定。";
  const { modal } = createModalHarness({
    markdownRenderer: {
      async render(_app, text, element) {
        element.setText(text);
      },
    },
    llmChat: async (request) => {
      request.onChunk?.(longText, longText);
      return longText;
    },
  });
  modal.inputEl.value = "Summarize";

  await modal.handleSubmit();

  assert.deepEqual(JSON.parse(JSON.stringify(modal.transcript)), [
    { role: "user", content: "Summarize", status: "complete" },
    { role: "assistant", content: longText, status: "complete" },
  ]);
  const assistant = byClass(modal.historyEl, "pdf-chat-bubble").find((element) =>
    element.hasClass("assistant")
  );
  assert.ok(assistant);
  const content = byClass(assistant, "pdf-chat-message-content")[0];
  assert.match(content.textContent, /提示生成方面.*\n\n模型改进方面.*\n\n实验结果/s);
});

test("settings preserve every legacy control in the correct ordered section and callbacks", async () => {
  const { bundle, settingTabs } = loadBundle();
  const PluginClass = bundle.default || bundle;
  const plugin = new PluginClass();
  await plugin.onload();
  plugin.settings.models.push({
    id: "second-model",
    name: "Second model",
    endpoint: "",
    apiKey: "",
    model: "",
  });
  const settingTab = settingTabs[0];
  settingTab.display();

  const sections = byClass(settingTab.containerEl, "pdf-chat-settings-section");
  assert.deepEqual(
    sections.map((section) => byTag(section, "h3")[0].textContent),
    ["模型", "聊天", "翻译", "论文上下文", "高级"]
  );
  assert.ok(sections.every((section) => section.tagName === "SECTION"));

  const settingNames = (section) =>
    byClass(section, "setting-item")
      .map((setting) => setting.getAttribute("data-name"))
      .filter(Boolean);
  const expectedNames = [
    [
      "模型 1 · 默认",
      "Endpoint",
      "API Key",
      "模型名(model 字段)",
      "模型 2",
      "Endpoint",
      "API Key",
      "模型名(model 字段)",
    ],
    ["流式输出", "Temperature", "Max Tokens", "继续对话使用的模型", "系统提示词"],
    [
      "翻译使用的模型",
      "划词后自动出现「译」悬浮图标",
      "翻译目标语言",
      "翻译分块大小（Unicode 字符）",
      "翻译附加要求",
    ],
    [
      "打开 PDF 划词弹窗时自动附带全文摘要",
      "摘要生成用的模型",
      "全文截断字符数上限",
      "摘要最大输出 token 数",
      "摘要生成提示词",
      "清空已缓存的全文摘要",
      "全文直读的字数阈值",
      "打开 PDF 划词弹窗时自动建立检索索引",
      "提问前先让快模型思考检索角度",
      "检索角度规划提示词",
      "每次检索返回的片段数(Top K)",
      "单块最大字符数",
      "切块重叠字符数",
      "清空已缓存的检索索引",
    ],
    plugin.settings.promptPresets.map((_preset, index) => `预设 ${index + 1}`),
  ];
  assert.deepEqual(
    JSON.parse(JSON.stringify(sections.map(settingNames))),
    JSON.parse(JSON.stringify(expectedNames))
  );
  for (const [sectionIndex, names] of expectedNames.entries()) {
    for (const name of names) {
      const setting = byClass(sections[sectionIndex], "setting-item").find(
        (element) => element.getAttribute("data-name") === name
      );
      const controls = ["input", "select", "textarea", "button"].flatMap((tagName) =>
        byTag(setting, tagName)
      );
      assert.ok(controls.length > 0, `missing legacy control for ${name}`);
    }
  }
  for (const [sectionIndex, section] of sections.entries()) {
    for (const control of ["input", "select", "textarea"].flatMap((tagName) =>
      byTag(section, tagName)
    )) {
      const setting = control.parentElement;
      assert.equal(
        typeof control.registeredOnChange,
        "function",
        `missing onChange callback in ${expectedNames[sectionIndex][0]} section for ${
          setting?.getAttribute("data-name") || control.tagName
        }`
      );
    }
    for (const button of byTag(section, "button")) {
      const setting = button.parentElement;
      assert.equal(
        typeof button.registeredOnClick,
        "function",
        `missing onClick callback in ${expectedNames[sectionIndex][0]} section for ${
          setting?.getAttribute("data-name") || button.textContent
        }`
      );
    }
  }

  const buttonTexts = (section) => byTag(section, "button").map((button) => button.textContent);
  assert.ok(buttonTexts(sections[0]).includes("+ 添加模型"));
  assert.ok(buttonTexts(sections[4]).includes("+ 添加预设"));
  assert.equal(byTag(sections[1], "textarea").length, 1);
  assert.equal(byTag(sections[2], "textarea").length, 1);
  assert.equal(byTag(sections[3], "textarea").length, 2);
  assert.equal(byTag(sections[4], "textarea").length, plugin.settings.promptPresets.length);
  assert.match(descendants(sections[4]).map((element) => element.textContent).join(" "), /Ctrl\+Alt\+Q/);

  const controlFor = (section, name, tagName) => {
    const setting = byClass(section, "setting-item").find(
      (element) => element.getAttribute("data-name") === name
    );
    assert.ok(setting, `missing setting ${name}`);
    const control = byTag(setting, tagName)[0];
    assert.ok(control, `missing ${tagName} control for ${name}`);
    return control;
  };
  const endpoint = controlFor(sections[0], "Endpoint", "input");
  endpoint.value = "  https://example.invalid/v1/chat/completions  ";
  endpoint.dispatch("change");
  const stream = controlFor(sections[1], "流式输出", "input");
  stream.value = false;
  stream.dispatch("change");
  const continueModel = controlFor(sections[1], "继续对话使用的模型", "select");
  continueModel.value = "second-model";
  continueModel.dispatch("change");
  const translateModel = controlFor(sections[2], "翻译使用的模型", "select");
  translateModel.value = "second-model";
  translateModel.dispatch("change");
  const quickMarker = controlFor(sections[2], "划词后自动出现「译」悬浮图标", "input");
  quickMarker.value = false;
  quickMarker.dispatch("change");
  const targetLanguage = controlFor(sections[2], "翻译目标语言", "input");
  targetLanguage.value = " ja ";
  targetLanguage.dispatch("change");
  const chunkChars = controlFor(sections[2], "翻译分块大小（Unicode 字符）", "input");
  assert.equal(chunkChars.value, "8000");
  const chunkSetting = chunkChars.parentElement;
  assert.match(chunkSetting.getAttribute("data-description"), /长选区.*Unicode.*大于 0 的整数/);
  chunkChars.value = "4096";
  chunkChars.dispatch("change");
  assert.equal(plugin.settings.translation.chunkChars, 4096);
  chunkChars.value = "12.5";
  chunkChars.dispatch("change");
  const topK = controlFor(sections[3], "每次检索返回的片段数(Top K)", "input");
  topK.value = "7";
  topK.dispatch("change");
  const ragOverlap = controlFor(sections[3], "切块重叠字符数", "input");
  ragOverlap.value = "699";
  ragOverlap.dispatch("change");
  assert.equal(plugin.settings.ragChunkOverlap, 699);
  const ragSize = controlFor(sections[3], "单块最大字符数", "input");
  ragSize.value = "50";
  ragSize.dispatch("change");
  assert.equal(plugin.settings.ragChunkSize, 50);
  assert.equal(plugin.settings.ragChunkOverlap, 49);
  ragOverlap.value = "0";
  ragOverlap.dispatch("change");
  assert.equal(plugin.settings.ragChunkOverlap, 0);
  ragOverlap.value = "50";
  ragOverlap.dispatch("change");
  const firstPreset = controlFor(sections[4], "预设 1", "input");
  firstPreset.value = "Updated preset";
  firstPreset.dispatch("change");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(plugin.settings.models[0].endpoint, "https://example.invalid/v1/chat/completions");
  assert.equal(plugin.settings.stream, false);
  assert.equal(plugin.settings.continueModelId, "second-model");
  assert.equal(plugin.settings.translateModelId, "second-model");
  assert.equal(plugin.settings.quickTranslateMarkerEnabled, false);
  assert.equal(plugin.settings.translation.targetLanguage, "ja");
  assert.equal(plugin.settings.translation.chunkChars, 8000);
  assert.equal(plugin.settings.ragTopK, 7);
  assert.equal(plugin.settings.ragChunkSize, 50);
  assert.equal(plugin.settings.ragChunkOverlap, 49);
  assert.equal(plugin.settings.promptPresets[0].name, "Updated preset");
});

test("CSS defines the scoped responsive, readable, selectable workbench contract", () => {
  const css = fs.readFileSync(path.join(projectRoot, "styles.css"), "utf8");

  for (const customProperty of [
    "--pdf-chat-space",
    "--pdf-chat-radius-sm",
    "--pdf-chat-radius-md",
    "--pdf-chat-radius-lg",
    "--pdf-chat-radius",
    "--pdf-chat-border",
    "--pdf-chat-panel-background",
    "--pdf-chat-readable-width",
  ]) {
    assert.match(css, new RegExp(`${customProperty}\\s*:`));
  }
  assert.match(css, /\.pdf-chat-composer[^}]*position:\s*sticky/s);
  const contextPanelRule = css.match(/\.pdf-chat-context-panel\s*\{([^}]*)\}/s)?.[1] || "";
  const expandedContextPanelRule =
    css.match(/\.pdf-chat-context-panel\.is-expanded\s*\{([^}]*)\}/s)?.[1] || "";
  const contextBodyRule = css.match(/\.pdf-chat-context-body\s*\{([^}]*)\}/s)?.[1] || "";
  const historyRule = css.match(/\.pdf-chat-history\s*\{([^}]*)\}/s)?.[1] || "";
  const headerRule = css.match(/\.pdf-chat-workbench-header\s*\{([^}]*)\}/s)?.[1] || "";
  const composerRule = css.match(/\.pdf-chat-composer\s*\{([^}]*)\}/s)?.[1] || "";
  const assistantRule = css.match(/\.pdf-chat-bubble\.assistant\s*\{([^}]*)\}/s)?.[1] || "";
  const userRule = css.match(/\.pdf-chat-bubble\.user\s*\{([^}]*)\}/s)?.[1] || "";
  const composerCardRule = css.match(/\.pdf-chat-composer-card\s*\{([^}]*)\}/s)?.[1] || "";
  assert.match(contextPanelRule, /display:\s*flex/);
  assert.match(contextPanelRule, /flex-direction:\s*column/);
  assert.match(contextPanelRule, /flex:\s*0\s+0\s+auto/);
  assert.match(contextPanelRule, /min-height:\s*42px/);
  assert.match(contextPanelRule, /overflow:\s*hidden/);
  assert.match(expandedContextPanelRule, /flex:\s*0\s+1\s+180px/);
  assert.match(expandedContextPanelRule, /min-height:\s*42px/);
  assert.match(expandedContextPanelRule, /max-height:\s*180px/);
  assert.match(contextBodyRule, /min-height:\s*0/);
  assert.match(contextBodyRule, /flex:\s*1\s+1\s+auto/);
  assert.match(contextBodyRule, /overflow-y:\s*auto/);
  assert.match(historyRule, /min-height:\s*0/);
  assert.match(historyRule, /align-items:\s*center/);
  assert.match(headerRule, /flex:\s*0\s+0\s+auto/);
  assert.match(composerRule, /flex:\s*0\s+0\s+auto/);
  assert.match(composerCardRule, /box-shadow:/);
  assert.match(assistantRule, /box-shadow:/);
  assert.match(userRule, /border-inline-end:\s*0/);
  assert.match(
    css,
    /@container\s+pdf-chat-workbench\s*\(max-width:\s*620px\)[\s\S]*?\.pdf-chat-context-panel\.is-expanded\s*\{[^}]*flex-basis:\s*160px[^}]*max-height:\s*160px/
  );
  assert.match(css, /:focus-visible/);
  assert.match(css, /@container|@media\s*\([^)]*max-width/);
  assert.match(css, /\.pdf-chat-bubble[^}]*user-select:\s*text/s);
  assert.doesNotMatch(css, /attr\(data-speaker\)/);
  assert.match(css, /\.pdf-chat-(?:bubble|message-content)[^}]*table[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.pdf-chat-bubble\.user[^}]*background:\s*var\(--pdf-chat-accent-soft\)/s);
  assert.doesNotMatch(css, /\.pdf-chat-bubble\.user[^}]*background:\s*var\(--interactive-accent\)/s);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\s*\(/i);
});
