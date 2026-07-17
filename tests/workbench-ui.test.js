const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

class MiniElement {
  constructor(tagName = "div", ownerDocument = null) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument || {
      addEventListener() {},
      removeEventListener() {},
    };
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

function loadBundle() {
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
          inputEl.addEventListener("change", () => handler(inputEl.value));
          return this;
        },
        onClick(handler) {
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
    MarkdownRenderer: {
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

function createModalHarness({ transcript = [] } = {}) {
  const { bundle } = loadBundle();
  const settings = JSON.parse(JSON.stringify(bundle.DEFAULT_SETTINGS));
  settings.autoDocSummary = false;
  settings.autoRag = false;
  const plugin = {
    settings,
    saveSettings: async () => {},
  };
  const services = {
    conversations: {
      getKey: () => "pdf:papers/demo.pdf",
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
    llm: { chat: async () => "Answer" },
    models: { get: () => settings.models[0] },
    actions: { list: () => [], execute: async () => {} },
    translations: { translate: async () => ({ text: "译文", chunkCount: 1 }) },
  };
  const pdfFile = { name: "demo.pdf", path: "papers/demo.pdf", stat: { mtime: 1 } };
  const modal = new bundle.PDFChatModal({}, plugin, "Selected source", pdfFile, false, services);
  modal.onOpen();
  return { modal, plugin };
}

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

  const contextToggle = byClass(modal.contentEl, "pdf-chat-context-toggle")[0];
  const contextBody = byClass(modal.contentEl, "pdf-chat-context-body")[0];
  assert.equal(contextToggle.tagName, "BUTTON");
  assert.equal(contextToggle.getAttribute("aria-expanded"), "false");
  assert.match(contextToggle.getAttribute("aria-label"), /论文上下文/);
  assert.equal(contextBody.hasClass("is-collapsed"), true);
  contextToggle.dispatch("click");
  assert.equal(contextToggle.getAttribute("aria-expanded"), "true");
  assert.equal(contextBody.hasClass("is-collapsed"), false);

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
  assert.equal(byClass(composer, "pdf-chat-hint").length, 1);
  assert.equal(modal.translateBtn.textContent, "翻译选区");
  assert.match(modal.inputEl.getAttribute("aria-label"), /提问/);
  assert.match(modal.sendBtn.getAttribute("aria-label"), /发送/);

  modal.inputEl.scrollHeight = 120;
  modal.inputEl.dispatch("input");
  assert.equal(modal.inputEl.style.height, "120px");

  modal.setSendingState(true);
  assert.equal(modal.translateBtn.disabled, true);
  assert.equal(modal.sendBtn.textContent, "停止");
  assert.match(modal.sendBtn.getAttribute("aria-label"), /停止/);
  modal.setSendingState(false);
  assert.equal(modal.translateBtn.disabled, false);
  assert.equal(modal.sendBtn.textContent, "发送");

  const bubble = modal.addBubble("user", "Question");
  assert.equal(byClass(modal.historyEl, "pdf-chat-empty-state").length, 0);
  assert.equal(bubble.getAttribute("data-speaker"), "你");
  assert.deepEqual(modal.transcript, []);
});

test("restored history bypasses the empty state and returns the live region to polite", async () => {
  const transcript = [
    { role: "user", content: "Question", status: "complete" },
    { role: "assistant", content: "Answer", status: "complete" },
  ];
  const { modal } = createModalHarness({ transcript });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(byClass(modal.historyEl, "pdf-chat-empty-state").length, 0);
  assert.equal(modal.historyEl.getAttribute("aria-live"), "polite");
  assert.equal(byClass(modal.historyEl, "pdf-chat-bubble").length, 2);
});

test("settings display creates the five ordered visible sections", async () => {
  const { bundle, settingTabs } = loadBundle();
  const PluginClass = bundle.default || bundle;
  const plugin = new PluginClass();
  await plugin.onload();
  const settingTab = settingTabs[0];
  settingTab.display();

  const sections = byClass(settingTab.containerEl, "pdf-chat-settings-section");
  assert.deepEqual(
    sections.map((section) => byTag(section, "h3")[0].textContent),
    ["模型", "聊天", "翻译", "论文上下文", "高级"]
  );
  assert.ok(sections.every((section) => section.tagName === "SECTION"));
});

test("CSS defines the scoped responsive, readable, selectable workbench contract", () => {
  const css = fs.readFileSync(path.join(projectRoot, "styles.css"), "utf8");

  for (const customProperty of [
    "--pdf-chat-space",
    "--pdf-chat-radius",
    "--pdf-chat-border",
    "--pdf-chat-panel-background",
    "--pdf-chat-readable-width",
  ]) {
    assert.match(css, new RegExp(`${customProperty}\\s*:`));
  }
  assert.match(css, /\.pdf-chat-composer[^}]*position:\s*sticky/s);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@container|@media\s*\([^)]*max-width/);
  assert.match(css, /\.pdf-chat-bubble[^}]*user-select:\s*text/s);
  assert.match(css, /\.pdf-chat-(?:bubble|message-content)[^}]*table[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.pdf-chat-bubble\.user[^}]*background:\s*var\(--background-modifier-/s);
  assert.doesNotMatch(css, /\.pdf-chat-bubble\.user[^}]*background:\s*var\(--interactive-accent\)/s);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\s*\(/i);
});
