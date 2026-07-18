import type { ModelProfile, PromptPreset } from "./types";

let controlId = 0;

function nextControlId(prefix: string): string {
  controlId += 1;
  return `pdf-chat-${prefix}-${controlId}`;
}

export function setElementLabel(element: HTMLElement, label: string): void {
  const compatibleElement = element as HTMLElement & {
    setAttr?: (name: string, value: string) => void;
  };
  if (typeof compatibleElement.setAttr === "function") {
    compatibleElement.setAttr("aria-label", label);
  } else if (typeof compatibleElement.setAttribute === "function") {
    compatibleElement.setAttribute("aria-label", label);
  }
}

export const labelControl = setElementLabel;

export interface WorkbenchHeaderOptions {
  filename: string;
  models: ModelProfile[];
  currentModelId: string;
  presets: PromptPreset[];
  currentPresetId: string;
}

export interface WorkbenchHeaderElements {
  root: HTMLElement;
  modeBadge: HTMLElement;
  primaryControls: HTMLElement;
  secondaryControls: HTMLElement;
  modelSelect: HTMLSelectElement;
  modeSelect: HTMLSelectElement;
  zoomOutButton: HTMLButtonElement;
  zoomResetButton: HTMLButtonElement;
  zoomInButton: HTMLButtonElement;
  moreButton: HTMLButtonElement;
  moreMenu: HTMLElement;
  clearButton: HTMLButtonElement;
}

export function buildWorkbenchHeader(
  parent: HTMLElement,
  options: WorkbenchHeaderOptions
): WorkbenchHeaderElements {
  const root = parent.createEl("header", { cls: "pdf-chat-workbench-header" });
  const identity = root.createDiv({ cls: "pdf-chat-identity" });
  identity.createEl("h2", { text: "PDF Chat" });
  identity.createEl("span", {
    text: options.filename,
    cls: "pdf-chat-document-name",
  });
  const modeBadge = identity.createEl("span", {
    text: "API MODE",
    cls: "pdf-chat-mode-badge",
    attr: { role: "status", "aria-live": "polite" },
  });

  const primaryControls = root.createDiv({ cls: "pdf-chat-header-primary-controls pdf-chat-interactive" });
  const secondaryControls = root.createDiv({ cls: "pdf-chat-header-secondary-controls pdf-chat-interactive" });

  const modelGroup = primaryControls.createDiv({ cls: "pdf-chat-control-group" });
  const modelId = nextControlId("model");
  modelGroup.createEl("label", { text: "模型", attr: { for: modelId } });
  const modelSelect = modelGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modelId, "aria-label": "选择聊天模型" },
  });
  for (const model of options.models) {
    modelSelect.createEl("option", { text: model.name, value: model.id });
  }
  modelSelect.value = options.currentModelId;

  const modeGroup = primaryControls.createDiv({ cls: "pdf-chat-control-group" });
  const modeId = nextControlId("mode");
  modeGroup.createEl("label", { text: "阅读模式", attr: { for: modeId } });
  const modeSelect = modeGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modeId, "aria-label": "选择阅读模式" },
  });
  modeSelect.createEl("option", { text: "默认", value: "__default__" });
  for (const preset of options.presets) {
    modeSelect.createEl("option", { text: preset.name, value: preset.id });
  }
  modeSelect.value = options.currentPresetId;

  const zoomGroup = secondaryControls.createDiv({
    cls: "pdf-chat-zoom-group",
    attr: { role: "group", "aria-label": "字体大小" },
  });
  const zoomOutButton = zoomGroup.createEl("button", {
    text: "A−",
    cls: "pdf-chat-zoom-btn",
    attr: { type: "button" },
  });
  const zoomResetButton = zoomGroup.createEl("button", {
    text: "100%",
    cls: "pdf-chat-zoom-label",
    attr: { type: "button" },
  });
  const zoomInButton = zoomGroup.createEl("button", {
    text: "A+",
    cls: "pdf-chat-zoom-btn",
    attr: { type: "button" },
  });
  setElementLabel(zoomOutButton, "缩小内容字体");
  setElementLabel(zoomResetButton, "重置内容字体为 100%");
  setElementLabel(zoomInButton, "放大内容字体");

  const moreWrapper = secondaryControls.createDiv({ cls: "pdf-chat-more-wrapper" });
  const moreButton = moreWrapper.createEl("button", {
    text: "⋯",
    cls: "pdf-chat-more-button",
    attr: {
      type: "button",
      "aria-haspopup": "menu",
      "aria-expanded": "false",
    },
  });
  setElementLabel(moreButton, "更多操作");
  const moreMenu = moreWrapper.createDiv({
    cls: "pdf-chat-more-menu is-hidden",
    attr: { role: "menu" },
  });
  const clearButton = moreMenu.createEl("button", {
    text: "清空对话",
    cls: "pdf-chat-menu-item pdf-chat-reset-btn",
    attr: { type: "button" },
  });
  clearButton.setAttr("role", "menuitem");
  setElementLabel(clearButton, "清空当前对话");

  let removeTransientListeners: (() => void) | null = null;
  const closeMenu = () => {
    moreButton.setAttr("aria-expanded", "false");
    moreMenu.addClass("is-hidden");
    removeTransientListeners?.();
    removeTransientListeners = null;
  };
  const openMenu = () => {
    moreButton.setAttr("aria-expanded", "true");
    moreMenu.removeClass("is-hidden");
    const ownerDocument = root.ownerDocument;
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (target && moreWrapper.contains(target as Node)) return;
      closeMenu();
    };
    const onDocumentKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    ownerDocument.addEventListener("click", onDocumentClick);
    ownerDocument.addEventListener("keydown", onDocumentKeydown);
    removeTransientListeners = () => {
      ownerDocument.removeEventListener("click", onDocumentClick);
      ownerDocument.removeEventListener("keydown", onDocumentKeydown);
    };
  };
  moreButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (moreButton.getAttribute("aria-expanded") === "true") closeMenu();
    else openMenu();
  });
  clearButton.addEventListener("click", closeMenu);

  return {
    root,
    modeBadge,
    primaryControls,
    secondaryControls,
    modelSelect,
    modeSelect,
    zoomOutButton,
    zoomResetButton,
    zoomInButton,
    moreButton,
    moreMenu,
    clearButton,
  };
}

export interface ContextPanelOptions {
  selectionText: string;
  hasPdf: boolean;
}

export interface ContextPanelElements {
  root: HTMLElement;
  toggle: HTMLButtonElement;
  body: HTMLDivElement;
  tools: HTMLDivElement;
  summaryStatus: HTMLSpanElement;
  ragStatus: HTMLSpanElement;
  researchActions: HTMLDivElement;
}

export function buildContextPanel(
  parent: HTMLElement,
  options: ContextPanelOptions
): ContextPanelElements {
  const bodyId = nextControlId("context");
  const root = parent.createEl("section", {
    cls: "pdf-chat-context-panel",
    attr: { "aria-label": "论文上下文工具" },
  });
  const toggle = root.createEl("button", {
    cls: "pdf-chat-context-toggle",
    attr: {
      type: "button",
      "aria-expanded": "false",
      "aria-controls": bodyId,
      "aria-label": "展开论文上下文工具",
    },
  });
  toggle.createEl("span", { text: "论文上下文", cls: "pdf-chat-context-title" });
  toggle.createEl("span", {
    text: `${options.selectionText.length} 字`,
    cls: "pdf-chat-status-chip pdf-chat-status-chip-count pdf-chat-selection-count is-neutral",
  });
  const summaryStatus = toggle.createEl("span", {
    text: options.hasPdf ? "摘要检查中" : "仅选区",
    cls: "pdf-chat-status-chip pdf-chat-status-chip-summary pdf-chat-summary-status is-pending",
  });
  const ragStatus = toggle.createEl("span", {
    text: options.hasPdf ? "上下文检查中" : "选区上下文",
    cls: "pdf-chat-status-chip pdf-chat-status-chip-context pdf-chat-rag-status is-pending",
  });
  toggle.createEl("span", { text: "⌄", cls: "pdf-chat-context-chevron", attr: { "aria-hidden": "true" } });

  const body = root.createDiv({
    cls: "pdf-chat-context-body is-collapsed",
    attr: { id: bodyId },
  });
  body.createEl("h3", { text: "选区原文", cls: "pdf-chat-context-heading" });
  body.createDiv({ cls: "pdf-chat-context-text", text: options.selectionText });
  const tools = body.createDiv({ cls: "pdf-chat-context-tools" });
  const researchActions = body.createDiv({
    cls: "pdf-chat-research-actions",
    attr: {
      role: "group",
      "aria-label": "论文研究扩展操作",
      "data-research-action-slot": "context",
    },
  });

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttr("aria-expanded", String(expanded));
    toggle.setAttr("aria-label", expanded ? "收起论文上下文工具" : "展开论文上下文工具");
    body.toggleClass("is-collapsed", !expanded);
    root.toggleClass("is-expanded", expanded);
  });

  return { root, toggle, body, tools, summaryStatus, ragStatus, researchActions };
}

export function buildMessageRegion(parent: HTMLElement, restoringHistory: boolean): HTMLElement {
  return parent.createEl("main", {
    cls: "pdf-chat-history",
    attr: {
      role: "log",
      "aria-live": restoringHistory ? "off" : "polite",
      "aria-relevant": "additions",
      "aria-atomic": "false",
    },
  });
}

export function buildEmptyState(history: HTMLElement): HTMLDivElement {
  return history.createDiv({
    cls: "pdf-chat-empty-state",
    text: "选区已就绪。可直接提问，输入 @ 引用其他 PDF；需要 Codex 深度阅读时输入 /codex 加问题。",
    attr: { role: "status" },
  });
}

export interface ComposerElements {
  root: HTMLElement;
  card: HTMLElement;
  status: HTMLElement;
  input: HTMLTextAreaElement;
  actions: HTMLElement;
  sendButton: HTMLButtonElement;
  hint: HTMLElement;
}

export function resizeComposerTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function buildComposer(parent: HTMLElement): ComposerElements {
  const root = parent.createEl("footer", {
    cls: "pdf-chat-composer",
    attr: { "aria-label": "提问编辑器" },
  });
  const card = root.createDiv({ cls: "pdf-chat-composer-card" });
  const inputRow = card.createDiv({ cls: "pdf-chat-input-row" });
  const input = inputRow.createEl("textarea", {
    cls: "pdf-chat-input",
    attr: {
      rows: "1",
      placeholder: "针对当前选区提问…",
      "aria-label": "针对当前选区提问",
    },
  });
  const footer = card.createDiv({ cls: "pdf-chat-composer-footer" });
  const status = footer.createDiv({
    text: "当前选区上下文已启用",
    cls: "pdf-chat-composer-status",
  });
  const actions = footer.createDiv({ cls: "pdf-chat-composer-actions" });
  const hint = actions.createDiv({
    cls: "pdf-chat-hint",
    text: "Enter 发送 · Shift+Enter 换行",
  });
  const sendButton = actions.createEl("button", {
    text: "↑",
    cls: "mod-cta pdf-chat-send-btn",
    attr: { type: "button" },
  });
  setElementLabel(sendButton, "发送问题");
  input.addEventListener("input", () => resizeComposerTextarea(input));
  return { root, card, status, input, actions, sendButton, hint };
}

export function buildFollowupSuggestions(parent: HTMLElement, suggestions: string[]): HTMLElement {
  const root = parent.createDiv({
    cls: "pdf-chat-followup-suggestions",
    attr: { role: "group", "aria-label": "快捷追问" },
  });
  const compatibleRoot = root as HTMLElement & {
    createEl?: (
      tagName: string,
      options?: { text?: string; cls?: string; attr?: Record<string, string> }
    ) => HTMLElement;
  };
  for (const suggestion of suggestions) {
    let button: HTMLElement;
    if (typeof compatibleRoot.createEl === "function") {
      button = compatibleRoot.createEl("button", {
        text: suggestion,
        cls: "pdf-chat-followup-chip",
        attr: { type: "button" },
      });
    } else if (root.ownerDocument?.createElement && typeof root.appendChild === "function") {
      button = root.ownerDocument.createElement("button");
      button.textContent = suggestion;
      button.className = "pdf-chat-followup-chip";
      button.setAttribute("type", "button");
      root.appendChild(button);
    } else {
      continue;
    }
    setElementLabel(button, suggestion);
  }
  return root;
}

export function formatTranslationUserDisplay(content: string): { title: string; meta?: string } | null {
  const match = /^翻译当前选区（(.+?)）$/.exec(content.trim());
  if (!match) return null;
  return { title: "翻译当前选区", meta: match[1] };
}

export function formatAssistantDisplayMarkdown(raw: string): string {
  if (!raw || raw.includes("\n\n")) return raw;
  if (/```|`[^`]+`|\|.+\||^\s*[-*+]\s+/m.test(raw)) return raw;
  if (/\$\$|\\\[|\\\(|<table|<pre|<code/i.test(raw)) return raw;
  if (raw.length < 40) return raw;

  const split = raw
    .replace(/(。)(?=(?:提示生成|模型改进|实验结果|方法|贡献|局限|相关工作|结论|首先|其次|最后|此外|因此))/g, "$1\n\n")
    .replace(/([.!?])\s+(?=(?:Prompt|Model|Experiment|Result|Method|Contribution|Limitation)\b)/g, "$1\n\n");
  return split === raw ? raw : split;
}
