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
      this.scope = {
        handlers: [],
        register: (modifiers, key, handler) => {
          this.scope.handlers.push({ modifiers, key, handler });
          return handler;
        },
      };
      this.close = () => {
        this.closed = true;
        this.onClose?.();
      };
    }

    open() {
      this.opened = true;
      this.onOpen?.();
      return this;
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
    clearInterval,
    clearTimeout,
    console,
    fetch: async () => {
      throw new Error("Unexpected fetch in unit test");
    },
    module: { exports: {} },
    require(request) {
      if (request === "obsidian") return obsidian;
      if (request === "node:path" || request === "path") return require("node:path");
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    setInterval,
    confirm: options.confirm || (() => false),
    window: {
      confirm: options.confirm || (() => false),
    },
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
  papers = {},
  autoTranslateOnOpen = false,
  startFresh = false,
  app = {},
  confirm,
  settingsPatch = {},
  conversations = {},
  codex,
} = {}) {
  const { bundle } = loadBundle({ markdownRenderer, confirm });
  const settings = JSON.parse(JSON.stringify(bundle.DEFAULT_SETTINGS));
  settings.autoDocSummary = false;
  settings.autoRag = false;
  Object.assign(settings, settingsPatch);
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
      ...conversations,
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
      ...papers,
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
    codex,
  };
  const pdfFile = { name: "demo.pdf", path: "papers/demo.pdf", stat: { mtime: 1 } };
  const modal = new bundle.PDFChatModal(
    app,
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
  assert.equal(modal.historyEl.getAttribute("aria-label"), null);
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
  assert.equal(byClass(composer, "pdf-chat-codex-context-toggle").length, 1);
  assert.equal(byClass(composer, "pdf-chat-translate-btn").length, 0);
  assert.equal(byClass(modal.contentEl, "pdf-chat-multi-paper").length, 0);
  assert.equal(byClass(modal.contentEl, "pdf-chat-multi-paper-bar").length, 0);
  assert.equal(byClass(modal.contentEl, "pdf-chat-ordinary-compare-btn").length, 0);
  assert.equal(byClass(modal.contentEl, "pdf-chat-codex-analysis-btn").length, 0);
  assert.equal(byClass(modal.contentEl, "pdf-chat-pdf-search-input").length, 0);
  assert.doesNotMatch(descendants(modal.contentEl).map((el) => el.textContent).join(" "), /翻译选区|添加对比论文|普通对比|Codex 深度分析/);
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
  assert.equal(modal.sendBtn.textContent, "停止");
  assert.match(modal.sendBtn.getAttribute("aria-label"), /停止/);
  modal.setSendingState(false);
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

test("multi-paper references are added only from composer @ mentions and capped at three", () => {
  const files = [
    { name: "demo.pdf", path: "papers/demo.pdf", extension: "pdf", stat: { mtime: 1 } },
    { name: "Alpha Paper.pdf", path: "papers/Alpha Paper.pdf", extension: "pdf", stat: { mtime: 2 } },
    { name: "Beta Paper.pdf", path: "papers/Beta Paper.pdf", extension: "pdf", stat: { mtime: 3 } },
    { name: "Gamma Paper.pdf", path: "papers/Gamma Paper.pdf", extension: "pdf", stat: { mtime: 4 } },
    { name: "Delta Paper.pdf", path: "papers/Delta Paper.pdf", extension: "pdf", stat: { mtime: 5 } },
    { name: "Alpha Note.md", path: "notes/Alpha Note.md", extension: "md", stat: { mtime: 6 } },
  ];
  const app = {
    vault: {
      getFiles: () => files,
      getAbstractFileByPath: (target) => files.find((file) => file.path === target) || null,
    },
  };
  const { modal } = createModalHarness({ app });

  for (const query of ["@Alpha", "@Beta", "@Gamma", "@Delta"]) {
    modal.inputEl.value = query;
    modal.inputEl.selectionStart = modal.inputEl.value.length;
    modal.inputEl.dispatch("input");
    const suggestions = byClass(modal.contentEl, "pdf-chat-composer-mention-suggestions");
    assert.equal(suggestions.length, 1);
    byClass(suggestions[0], "pdf-chat-composer-mention-option")[0].dispatch("click");
  }

  assert.equal(modal.referencedPdfFiles.length, 3);
  assert.match(byClass(modal.contentEl, "pdf-chat-composer-status")[0].textContent, /已引用 3 篇论文/);
  assert.equal(byClass(modal.contentEl, "pdf-chat-reference-chip").length, 3);
});

test("referenced PDF chips can remove restored session references", async () => {
  const files = [
    { name: "demo.pdf", path: "papers/demo.pdf", extension: "pdf", stat: { mtime: 1 } },
    { name: "Alpha Paper.pdf", path: "papers/Alpha Paper.pdf", extension: "pdf", stat: { mtime: 2 } },
    { name: "Beta Paper.pdf", path: "papers/Beta Paper.pdf", extension: "pdf", stat: { mtime: 3 } },
  ];
  let savedMetadata = null;
  const app = {
    vault: {
      getFiles: () => files,
      getAbstractFileByPath: (target) => files.find((file) => file.path === target) || null,
    },
  };
  const { modal } = createModalHarness({
    app,
    conversations: {
      getActiveSession: () => ({
        version: 1,
        id: "discussion-restored",
        ["conversation" + "Key"]: "pdf:papers/demo.pdf",
        title: "Restored",
        mode: "chat",
        messages: [{ role: "user", content: "previous question", status: "complete" }],
        referencedPdfPaths: ["papers/Alpha Paper.pdf", "papers/Beta Paper.pdf"],
        createdAt: 1,
        updatedAt: 2,
      }),
      saveActiveSession: async (_key, _messages, metadata) => {
        savedMetadata = metadata;
      },
    },
  });

  assert.equal(modal.referencedPdfFiles.length, 2);
  assert.equal(byClass(modal.contentEl, "pdf-chat-reference-chip").length, 2);

  modal.inputEl.value = "half-written prompt";
  byClass(modal.contentEl, "pdf-chat-reference-chip-remove")[0].dispatch("click");
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(modal.referencedPdfFiles.map((file) => file.path), ["papers/Beta Paper.pdf"]);
  assert.equal(modal.inputEl.value, "half-written prompt");
  assert.match(byClass(modal.contentEl, "pdf-chat-composer-status")[0].textContent, /已引用 1 篇论文/);
  assert.deepEqual(savedMetadata.referencedPdfPaths, ["papers/Beta Paper.pdf"]);
});

test("Codex mode lets the current PDF be detached and restored without clearing the prompt", async () => {
  let savedMetadata = null;
  const { modal } = createModalHarness({
    conversations: {
      ensureSession: (_key, metadata) => {
        savedMetadata = metadata;
        return { id: "session-current-toggle", messages: [], referencedPdfPaths: [], ...metadata };
      },
    },
  });

  modal.inputEl.value = "/codex";
  await modal.handleSubmit();

  assert.equal(modal.includeCurrentPdfInCodex, true);
  assert.deepEqual(JSON.parse(JSON.stringify(modal.selectedPaperFiles().map((entry) => entry.file.path))), ["papers/demo.pdf"]);
  assert.equal(byClass(modal.contentEl, "pdf-chat-current-pdf-chip").length, 1);

  modal.inputEl.value = "half-written Codex prompt";
  byClass(modal.contentEl, "pdf-chat-current-pdf-remove")[0].dispatch("click");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(modal.inputEl.value, "half-written Codex prompt");
  assert.equal(modal.includeCurrentPdfInCodex, false);
  assert.deepEqual(JSON.parse(JSON.stringify(modal.selectedPaperFiles())), []);
  assert.equal(byClass(modal.contentEl, "pdf-chat-current-pdf-restore").length, 1);
  assert.equal(savedMetadata.includeCurrentPdfInCodex, false);

  byClass(modal.contentEl, "pdf-chat-current-pdf-restore")[0].dispatch("click");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(modal.includeCurrentPdfInCodex, true);
  assert.deepEqual(JSON.parse(JSON.stringify(modal.selectedPaperFiles().map((entry) => entry.file.path))), ["papers/demo.pdf"]);
  assert.equal(savedMetadata.includeCurrentPdfInCodex, true);
});

test("multi-paper compare actions are not persistent toolbar buttons", () => {
  const { modal } = createModalHarness();
  const contextBody = byClass(modal.contentEl, "pdf-chat-context-body")[0];
  assert.equal(byClass(modal.contentEl, "pdf-chat-multi-paper-bar").length, 0);
  assert.equal(byClass(contextBody, "pdf-chat-ordinary-compare-btn").length, 0);
  assert.equal(byClass(contextBody, "pdf-chat-codex-analysis-btn").length, 0);
  assert.doesNotMatch(descendants(modal.contentEl).map((element) => element.textContent).join(" "), /普通对比|Codex 深度分析/);
});

test("typing @ in the composer opens PDF mention suggestions and selecting one references it", () => {
  const files = [
    { name: "demo.pdf", path: "papers/demo.pdf", extension: "pdf", stat: { mtime: 1 } },
    { name: "Alpha Paper.pdf", path: "papers/Alpha Paper.pdf", extension: "pdf", stat: { mtime: 2 } },
    { name: "Beta Note.md", path: "notes/Beta Note.md", extension: "md", stat: { mtime: 3 } },
  ];
  const app = {
    vault: {
      getFiles: () => files,
      getAbstractFileByPath: (target) => files.find((file) => file.path === target) || null,
    },
  };
  const { modal } = createModalHarness({ app });

  modal.inputEl.value = "请对比 @Alpha";
  modal.inputEl.selectionStart = modal.inputEl.value.length;
  modal.inputEl.dispatch("input");

  const suggestions = byClass(modal.contentEl, "pdf-chat-composer-mention-suggestions");
  assert.equal(suggestions.length, 1);
  const buttons = byClass(suggestions[0], "pdf-chat-composer-mention-option");
  assert.equal(buttons.length, 1);
  assert.match(descendants(buttons[0]).map((element) => element.textContent).join(" "), /Alpha Paper\.pdf/);

  buttons[0].dispatch("click");
  assert.equal(modal.referencedPdfFiles.length, 1);
  assert.match(modal.inputEl.value, /@Alpha Paper\.pdf\s/);
  assert.equal(byClass(modal.contentEl, "pdf-chat-composer-mention-suggestions").length, 0);
});

test("sending with referenced PDFs augments the request as shared reading context, not forced comparison", async () => {
  const referenced = { name: "Alpha Paper.pdf", path: "papers/Alpha Paper.pdf", extension: "pdf", stat: { mtime: 2 } };
  const requests = [];
  const { modal } = createModalHarness({
    llmChat: async (request) => {
      requests.push(JSON.parse(JSON.stringify(request)));
      request.onChunk?.("Answer", "Answer");
      return "Answer";
    },
    papers: {
      getOrCreateDocSummary: async (file) => ({
        mtime: file.stat?.mtime,
        summary: `Summary for ${file.name}`,
        generatedAt: 1,
        fullLength: 100,
        truncated: false,
      }),
      getOrCreateDocChunks: async (file) => ({
        mtime: file.stat?.mtime,
        fullTextLength: 100,
        generatedAt: 1,
        chunks: [{ page: 1, text: `Evidence from ${file.name}`, idx: 0 }],
      }),
      retrieveContext: (chunks) => chunks,
    },
  });
  modal.referencedPdfFiles = [referenced];
  modal.inputEl.value = "请解释第二篇论文里的核心假设如何帮助理解当前论文";

  await modal.handleSubmit();

  assert.equal(requests.length, 1);
  const outgoing = requests[0].messages.at(-1).content;
  assert.match(outgoing, /Summary for demo\.pdf/);
  assert.match(outgoing, /Summary for Alpha Paper\.pdf/);
  assert.match(outgoing, /Evidence from Alpha Paper\.pdf/);
  assert.match(outgoing, /同时阅读多篇论文|多篇论文阅读上下文/);
  assert.doesNotMatch(outgoing, /你正在做多论文对比|请对比当前论文|相似点、不同点|结合的可能性/);
  assert.deepEqual(JSON.parse(JSON.stringify(modal.transcript)), [
    { role: "user", content: "请解释第二篇论文里的核心假设如何帮助理解当前论文", status: "complete" },
    { role: "assistant", content: "Answer", status: "complete" },
  ]);
});

test("deep-analysis wording asks for Codex CLI instead of using a persistent button", async () => {
  const referenced = { name: "Alpha Paper.pdf", path: "papers/Alpha Paper.pdf", extension: "pdf", stat: { mtime: 2 } };
  const requests = [];
  let confirmMessage = "";
  let codexCalls = 0;
  const { modal, plugin } = createModalHarness({
    confirm: (message) => {
      confirmMessage = String(message);
      return true;
    },
    llmChat: async (request) => {
      requests.push(request);
      return "Unexpected normal answer";
    },
  });
  plugin.settings.codexDeepAnalysis.enabled = true;
  modal.referencedPdfFiles = [referenced];
  modal.runCodexDeepAnalysis = async () => {
    codexCalls += 1;
  };
  modal.inputEl.value = "请使用深度分析比较这两篇论文";

  await modal.handleSubmit();

  assert.equal(codexCalls, 1);
  assert.equal(requests.length, 0);
  assert.match(confirmMessage, /Codex CLI|深度分析/);
});

test("/codex command invokes Codex CLI directly with a stripped question", async () => {
  const referenced = { name: "Alpha Paper.pdf", path: "papers/Alpha Paper.pdf", extension: "pdf", stat: { mtime: 2 } };
  let confirmCalls = 0;
  let codexQuestion = "";
  const { modal } = createModalHarness({
    confirm: () => {
      confirmCalls += 1;
      return false;
    },
  });
  modal.referencedPdfFiles = [referenced];
  modal.runCodexDeepAnalysis = async (question) => {
    codexQuestion = question;
  };
  modal.inputEl.value = "/codex 请详细阅读这两篇论文，并解释第二篇如何帮助理解第一篇";

  await modal.handleSubmit();

  assert.equal(confirmCalls, 0);
  assert.equal(codexQuestion, "请详细阅读这两篇论文，并解释第二篇如何帮助理解第一篇");
  assert.match(byClass(modal.contentEl, "pdf-chat-mode-badge")[0].textContent, /CODEX MODE/);
  assert.match(byClass(modal.contentEl, "pdf-chat-composer-status")[0].textContent, /CODEX|Codex/);
});

test("/codex enters a visible Codex terminal mode and subsequent input stays in Codex", async () => {
  const calls = [];
  const { modal } = createModalHarness({
    settingsPatch: {
      codexDeepAnalysis: {
        enabled: true,
        command: "codex",
        profile: "research",
        model: "gpt-5.6-sol",
        reasoningEffort: "xhigh",
        verbosity: "high",
        modelPresets: [],
        timeoutMs: 600000,
        keepTempFiles: false,
      },
    },
  });
  modal.runCodexDeepAnalysis = async (question) => {
    calls.push(question);
  };

  modal.inputEl.value = "/codex";
  await modal.handleSubmit();
  assert.deepEqual(calls, []);
  assert.match(byClass(modal.contentEl, "pdf-chat-mode-badge")[0].textContent, /CODEX MODE/);
  assert.ok(modal.contentEl.hasClass("is-codex-mode"));

  modal.inputEl.value = "请继续分析方法假设";
  await modal.handleSubmit();
  assert.deepEqual(calls, ["请继续分析方法假设"]);

  modal.inputEl.value = "/exit";
  await modal.handleSubmit();
  assert.match(byClass(modal.contentEl, "pdf-chat-mode-badge")[0].textContent, /API MODE/);
  assert.equal(modal.contentEl.hasClass("is-codex-mode"), false);
});

test("Codex mode sends every prompt through the PDF workspace instead of lightweight routing or API fallback", async () => {
  const deepCalls = [];
  const lightweightCalls = [];
  const { modal } = createModalHarness({
    llmChat: async () => {
      throw new Error("Unexpected API fallback for Codex mode");
    },
  });
  modal.runCodexDeepAnalysis = async (question) => {
    deepCalls.push(question);
  };
  modal.runCodexLightweightChat = async (question) => {
    lightweightCalls.push(question);
    modal.inputEl.value = "";
  };

  modal.inputEl.value = "/codex";
  await modal.handleSubmit();

  modal.inputEl.value = "hello";
  await modal.handleSubmit();

  assert.deepEqual(lightweightCalls, []);
  assert.deepEqual(deepCalls, ["hello"]);
  assert.match(byClass(modal.contentEl, "pdf-chat-mode-badge")[0].textContent, /CODEX MODE/);
});

test("Codex native mode sends direct PDF paths and the current selection through the session manager", async () => {
  const started = [];
  const session = {
    version: 1,
    id: "plugin-session-1",
    ["conversation" + "Key"]: "pdf:papers/demo.pdf",
    title: "demo.pdf",
    mode: "codex",
    messages: [],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    codex: { model: "gpt-5.5", reasoningEffort: "medium", lifecycle: "active" },
    createdAt: 1,
    updatedAt: 1,
  };
  const codex = {
    subscribe: () => () => {},
    getSnapshot: () => ({
      sessionId: session.id,
      status: "idle",
      attachedPdfPaths: [],
      selectionChars: 0,
    }),
    async startTurn(request) {
      started.push(request);
      return {
        sessionId: request.sessionId,
        threadId: "native-thread-1",
        status: "idle",
        attachedPdfPaths: request.attachedPdfPaths,
        selectionChars: request.selectionChars,
        finalMarkdown: "Answer",
      };
    },
    stopTurn: () => false,
    closeSession: async () => {},
    reactivateSession: () => {},
  };
  const { modal, plugin } = createModalHarness({
    app: {
      vault: {
        adapter: { getFullPath: (vaultPath) => `D:/vault/${vaultPath}` },
      },
    },
    codex,
    conversations: {
      getActiveSession: () => session,
      getSession: () => session,
      ensureSession: () => session,
    },
  });
  plugin.settings.codexDeepAnalysis.enabled = true;

  await modal.runCodexDeepAnalysis("hello");

  assert.equal(started.length, 1);
  assert.equal(started[0].sessionId, "plugin-session-1");
  assert.equal(started[0].workingDirectory.replace(/\\/g, "/"), "D:/vault/papers");
  assert.deepEqual(Array.from(started[0].attachedPdfPaths), ["papers/demo.pdf"]);
  assert.match(started[0].prompt, /D:\/vault\/papers\/demo\.pdf/);
  assert.match(started[0].prompt, /Selected source/);
  assert.match(started[0].prompt, /普通问候.*无需读取|greeting.*without reading/i);
});

test("Esc suspends a running Codex modal while an explicit X close terminates its session", async () => {
  const closedSessions = [];
  const session = {
    version: 1,
    id: "plugin-session-close",
    ["conversation" + "Key"]: "pdf:papers/demo.pdf",
    title: "demo.pdf",
    mode: "codex",
    messages: [],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    codex: { model: "gpt-5.5", reasoningEffort: "medium", lifecycle: "active" },
    createdAt: 1,
    updatedAt: 1,
  };
  const codex = {
    subscribe: () => () => {},
    getSnapshot: () => ({ sessionId: session.id, status: "running", attachedPdfPaths: [], selectionChars: 0 }),
    startTurn: async () => {},
    stopTurn: () => true,
    closeSession: async (id) => { closedSessions.push(id); },
    reactivateSession: () => {},
  };
  const conversations = {
    getActiveSession: () => session,
    getSession: () => session,
    ensureSession: () => session,
  };
  const { modal: suspended } = createModalHarness({ codex, conversations });
  suspended.runtimeMode = "codex";
  suspended.codexCloseIntent = "suspend";
  suspended.onClose();
  assert.deepEqual(closedSessions, []);

  const { modal: terminated } = createModalHarness({ codex, conversations });
  terminated.runtimeMode = "codex";
  terminated.codexCloseIntent = "terminate";
  terminated.onClose();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(closedSessions, ["plugin-session-close"]);
});

test("reopening a running Codex session reconstructs its progress and renders the background result", async () => {
  let listener;
  const session = {
    version: 1,
    id: "plugin-session-running",
    ["conversation" + "Key"]: "pdf:papers/demo.pdf",
    title: "Running",
    mode: "codex",
    messages: [],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    codex: {
      model: "gpt-5.5",
      reasoningEffort: "medium",
      threadId: "native-thread-running",
      lifecycle: "active",
    },
    createdAt: 1,
    updatedAt: 1,
  };
  const codex = {
    subscribe: (_id, next) => {
      listener = next;
      next({
        sessionId: session.id,
        threadId: "native-thread-running",
        status: "running",
        question: "Explain the result",
        progress: "Codex 正在推理",
        startedAt: Date.now() - 2000,
        workingDirectory: "D:/vault/papers",
        attachedPdfPaths: ["papers/demo.pdf"],
        selectionChars: 0,
      });
      return () => {};
    },
    getSnapshot: () => ({}),
    startTurn: async () => {},
    stopTurn: () => true,
    closeSession: async () => {},
    reactivateSession: () => {},
  };
  const { modal } = createModalHarness({
    codex,
    conversations: {
      getActiveSession: () => session,
      getSession: () => session,
    },
  });

  assert.equal(modal.isCodexRunning, true);
  assert.match(
    descendants(byClass(modal.historyEl, "pdf-chat-bubble")[0]).map((item) => item.textContent).join(" "),
    /Explain the result/
  );
  assert.match(byClass(modal.contentEl, "pdf-chat-mode-badge")[0].textContent, /Running/);

  session.messages = [
    { role: "user", content: "Explain the result", status: "complete" },
    { role: "assistant", content: "# Background result", status: "complete" },
  ];
  listener({
    sessionId: session.id,
    threadId: "native-thread-running",
    status: "idle",
    attachedPdfPaths: ["papers/demo.pdf"],
    selectionChars: 0,
    finalMarkdown: "# Background result",
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(modal.isCodexRunning, false);
  assert.match(byClass(modal.historyEl, "pdf-chat-message-content").at(-1).textContent, /Background result/);
});

test("closing a Codex-mode modal keeps the Codex process running in the background", () => {
  const { modal } = createModalHarness();
  let aborted = false;
  modal.runtimeMode = "codex";
  modal.isSending = true;
  modal.isCodexRunning = true;
  modal.abortController = {
    abort() {
      aborted = true;
    },
  };

  modal.onClose();

  assert.equal(aborted, false);
});

test("closing a normal sending modal still aborts the active API request", () => {
  const { modal } = createModalHarness();
  let aborted = false;
  modal.runtimeMode = "codex";
  modal.isSending = true;
  modal.isCodexRunning = false;
  modal.abortController = {
    abort() {
      aborted = true;
    },
  };

  modal.onClose();

  assert.equal(aborted, true);
});

test("Codex selected-context toggle and slash command control whether the selection is attached", async () => {
  const { modal, plugin } = createModalHarness();
  const toggle = byClass(modal.contentEl, "pdf-chat-codex-context-toggle")[0];

  assert.ok(toggle);
  assert.equal(plugin.settings.codexDeepAnalysis.includeSelectionContext, true);
  assert.match(toggle.textContent, /附选区/);
  assert.equal(toggle.disabled, false);

  toggle.dispatch("click");
  assert.equal(plugin.settings.codexDeepAnalysis.includeSelectionContext, false);
  assert.match(toggle.textContent, /不附选区/);

  modal.inputEl.value = "/context";
  await modal.handleSubmit();
  assert.equal(plugin.settings.codexDeepAnalysis.includeSelectionContext, true);
  assert.match(toggle.textContent, /附选区/);

  modal.inputEl.value = "/context off";
  await modal.handleSubmit();
  assert.equal(plugin.settings.codexDeepAnalysis.includeSelectionContext, false);
  assert.match(toggle.textContent, /不附选区/);
});

test("slash commands can remove referenced PDFs without deleting the conversation", async () => {
  const alpha = { name: "Alpha Paper.pdf", path: "papers/Alpha Paper.pdf", extension: "pdf", stat: { mtime: 2 } };
  const beta = { name: "Beta Paper.pdf", path: "papers/Beta Paper.pdf", extension: "pdf", stat: { mtime: 3 } };
  const { modal } = createModalHarness();
  modal.referencedPdfFiles = [alpha, beta];
  modal.updateComposerContextStatus();

  modal.inputEl.value = "/refs";
  await modal.handleSubmit();
  assert.equal(byClass(modal.contentEl, "pdf-chat-command-menu").length, 1);
  assert.equal(byClass(modal.contentEl, "pdf-chat-command-option").length, 2);

  modal.inputEl.value = "/unref Alpha";
  await modal.handleSubmit();
  assert.deepEqual(modal.referencedPdfFiles.map((file) => file.path), ["papers/Beta Paper.pdf"]);
  assert.match(byClass(modal.contentEl, "pdf-chat-composer-status")[0].textContent, /已引用 1 篇论文/);

  modal.inputEl.value = "/clearrefs";
  await modal.handleSubmit();
  assert.equal(modal.referencedPdfFiles.length, 0);
  assert.doesNotMatch(byClass(modal.contentEl, "pdf-chat-composer-status")[0].textContent, /已引用/);
  assert.equal(modal.transcript.length, 0);
});

test("terminal prompt history restores previous prompts with arrow keys unless @ suggestions are open", async () => {
  const { modal, plugin } = createModalHarness({
    settingsPatch: { promptHistory: ["first prompt", "second prompt"] },
  });

  modal.inputEl.value = "";
  modal.inputEl.dispatch("keydown", { key: "ArrowUp", preventDefault() {} });
  assert.equal(modal.inputEl.value, "second prompt");
  modal.inputEl.dispatch("keydown", { key: "ArrowUp", preventDefault() {} });
  assert.equal(modal.inputEl.value, "first prompt");
  modal.inputEl.dispatch("keydown", { key: "ArrowDown", preventDefault() {} });
  assert.equal(modal.inputEl.value, "second prompt");

  modal.inputEl.value = "third prompt";
  await modal.handleSubmit();
  assert.deepEqual(JSON.parse(JSON.stringify(plugin.settings.promptHistory.slice(-1))), ["third prompt"]);

  modal.inputEl.value = "@";
  modal.composerMentionSuggestionsEl = modal.contentEl.createDiv({ cls: "pdf-chat-composer-mention-suggestions" });
  modal.inputEl.dispatch("keydown", { key: "ArrowUp", preventDefault() { throw new Error("should not prevent"); } });
  assert.equal(modal.inputEl.value, "@");
});

test("/model switches Codex presets in Codex mode and API models in normal mode", async () => {
  const { modal, plugin } = createModalHarness();
  plugin.settings.models.push({ id: "api-b", name: "API B", endpoint: "", apiKey: "", model: "api-b-model" });

  modal.inputEl.value = "/model api-b";
  await modal.handleSubmit();
  assert.equal(modal.currentModelId, "api-b");

  modal.inputEl.value = "/codex";
  await modal.handleSubmit();
  modal.inputEl.value = "/model gpt-5.6-sol high";
  await modal.handleSubmit();
  assert.equal(plugin.settings.codexDeepAnalysis.model, "gpt-5.6-sol");
  assert.equal(plugin.settings.codexDeepAnalysis.reasoningEffort, "high");
  assert.match(byClass(modal.contentEl, "pdf-chat-mode-badge")[0].textContent, /gpt-5\.6-sol/);

  modal.inputEl.value = "/model";
  await modal.handleSubmit();
  assert.equal(byClass(modal.contentEl, "pdf-chat-command-menu").length, 1);
});

test("/new preserves old sessions and /resume restores a selected session", async () => {
  const sessionFieldName = "conversation" + "K" + "ey";
  const session = {
    version: 1,
    id: "session-old",
    [sessionFieldName]: "pdf:papers/demo.pdf",
    title: "Old discussion",
    mode: "codex",
    messages: [
      { role: "user", content: "Old Q", status: "complete" },
      { role: "assistant", content: "Old A", status: "complete" },
    ],
    referencedPdfPaths: ["papers/alpha.pdf"],
    codex: { model: "gpt-5.6-sol", reasoningEffort: "xhigh", profile: "" },
    createdAt: 1,
    updatedAt: 2,
  };
  let activeSession = null;
  const { modal } = createModalHarness({
    conversations: {
      getActiveSession: () => null,
      listSessions: () => [session],
      startSession: (_key, metadata) => ({ ...session, ...metadata, id: "session-new", messages: [] }),
      resumeSession: (id) => {
        activeSession = id;
        return session;
      },
      saveActiveSession: async () => {},
    },
  });

  modal.inputEl.value = "/new";
  await modal.handleSubmit();
  assert.equal(byClass(modal.historyEl, "pdf-chat-empty-state").length, 1);

  modal.inputEl.value = "/resume";
  await modal.handleSubmit();
  const menu = byClass(modal.contentEl, "pdf-chat-command-menu")[0];
  assert.ok(menu);
  byClass(menu, "pdf-chat-command-option")[0].dispatch("click");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(activeSession, "session-old");
  assert.match(byClass(modal.contentEl, "pdf-chat-mode-badge")[0].textContent, /CODEX MODE/);
  assert.equal(byClass(modal.historyEl, "pdf-chat-bubble").length, 2);
});

test("/new in Codex mode starts a plugin session without inheriting the old native thread", async () => {
  let startedMetadata;
  const oldSession = {
    version: 1,
    id: "old-codex-session",
    ["conversation" + "Key"]: "pdf:papers/demo.pdf",
    title: "Old Codex",
    mode: "codex",
    messages: [],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    codex: {
      model: "gpt-5.5",
      reasoningEffort: "medium",
      threadId: "native-thread-old",
      lifecycle: "active",
    },
    createdAt: 1,
    updatedAt: 1,
  };
  const { modal } = createModalHarness({
    conversations: {
      getActiveSession: () => oldSession,
      getSession: () => oldSession,
      startSession: (_key, metadata) => {
        startedMetadata = metadata;
        return { ...oldSession, id: "new-codex-session", codex: metadata.codex };
      },
    },
  });

  modal.inputEl.value = "/new";
  await modal.handleSubmit();

  assert.equal(startedMetadata.codex.threadId, undefined);
  assert.equal(startedMetadata.codex.lifecycle, "active");
  assert.equal(modal.currentSessionId, "new-codex-session");
});

test("resuming a session from another PDF opens that PDF before creating its modal", async () => {
  const current = { name: "demo.pdf", path: "papers/demo.pdf", extension: "pdf", stat: { mtime: 1 } };
  const target = { name: "other.pdf", path: "papers/other.pdf", extension: "pdf", stat: { mtime: 2 } };
  const opened = [];
  const targetSession = {
    version: 1,
    id: "other-session",
    ["conversation" + "Key"]: "pdf:papers/other.pdf",
    title: "Other paper",
    mode: "codex",
    messages: [],
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    codex: { model: "gpt-5.5", reasoningEffort: "medium", lifecycle: "closed" },
    createdAt: 1,
    updatedAt: 2,
  };
  const app = {
    vault: {
      getFiles: () => [current, target],
      getAbstractFileByPath: (filePath) => [current, target].find((file) => file.path === filePath) || null,
    },
    workspace: {
      getLeaf: () => ({
        async openFile(file) {
          opened.push(file.path);
        },
      }),
    },
  };
  const { modal } = createModalHarness({
    app,
    conversations: {
      getActiveSession: (key) => (key === targetSession.conversationKey ? targetSession : null),
      getSession: () => targetSession,
      resumeSession: () => ({
        ...targetSession,
        codex: { ...targetSession.codex, lifecycle: "active" },
      }),
    },
  });

  await modal.resumeConversationSession("other-session");

  assert.deepEqual(opened, ["papers/other.pdf"]);
  assert.equal(modal.closed, true);
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
    ["举一个例子", "请进一步通俗易懂地讲解清楚", "请进一步给出详细的推导步骤", "进一步分析为什么是这样的"]
  );
  buttons[0].dispatch("click");
  assert.equal(modal.inputEl.value, "举一个例子");
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
    [
      "启用 Codex CLI 深度分析",
      "Codex 命令",
      "Codex profile",
      "Codex model",
      "Codex reasoning effort",
      "Codex verbosity",
      "Codex input mode",
      "Codex output mode",
      "Codex 默认附带选区上下文",
      "Codex 超时毫秒",
      "保留 Codex 临时分析包",
      ...plugin.settings.promptPresets.map((_preset, index) => `预设 ${index + 1}`),
    ],
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
  const codexCommand = controlFor(sections[4], "Codex 命令", "input");
  codexCommand.value = "  C:/Tools/codex.exe  ";
  codexCommand.dispatch("change");
  const codexInputMode = controlFor(sections[4], "Codex input mode", "select");
  codexInputMode.value = "debug-full";
  codexInputMode.dispatch("change");
  const codexTimeout = controlFor(sections[4], "Codex 超时毫秒", "input");
  codexTimeout.value = "120000";
  codexTimeout.dispatch("change");
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
  assert.equal(plugin.settings.codexDeepAnalysis.command, "C:/Tools/codex.exe");
  assert.equal(plugin.settings.codexDeepAnalysis.inputMode, "debug-full");
  assert.equal(plugin.settings.codexDeepAnalysis.timeoutMs, 120000);
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
  const mentionOptionRule =
    css.match(/\.pdf-chat-composer-mention-option\s*\{([^}]*)\}/s)?.[1] || "";
  const pdfSearchNameRule = css.match(/\.pdf-chat-pdf-search-name\s*\{([^}]*)\}/s)?.[1] || "";
  const pdfSearchPathRule = css.match(/\.pdf-chat-pdf-search-path\s*\{([^}]*)\}/s)?.[1] || "";
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
  assert.match(mentionOptionRule, /height:\s*auto/);
  assert.match(mentionOptionRule, /min-height:\s*0/);
  assert.match(mentionOptionRule, /align-items:\s*start/);
  assert.match(mentionOptionRule, /line-height:\s*1\.25/);
  assert.match(pdfSearchNameRule, /display:\s*block/);
  assert.match(pdfSearchNameRule, /line-height:\s*1\.25/);
  assert.match(pdfSearchPathRule, /display:\s*block/);
  assert.match(pdfSearchPathRule, /line-height:\s*1\.25/);
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
