import type { ModelProfile, PromptPreset } from "./types";

let controlId = 0;

function nextControlId(prefix: string): string {
  controlId += 1;
  return `pdf-chat-${prefix}-${controlId}`;
}

export function labelControl(element: HTMLElement, label: string): void {
  const compatibleElement = element as HTMLElement & {
    setAttr?: (name: string, value: string) => void;
  };
  if (typeof compatibleElement.setAttr === "function") {
    compatibleElement.setAttr("aria-label", label);
    compatibleElement.setAttr("title", label);
  } else if (typeof compatibleElement.setAttribute === "function") {
    compatibleElement.setAttribute("aria-label", label);
    compatibleElement.setAttribute("title", label);
  }
}

export interface WorkbenchHeaderOptions {
  filename: string;
  models: ModelProfile[];
  currentModelId: string;
  presets: PromptPreset[];
  currentPresetId: string;
}

export interface WorkbenchHeaderElements {
  root: HTMLElement;
  modelSelect: HTMLSelectElement;
  modeSelect: HTMLSelectElement;
  zoomOutButton: HTMLButtonElement;
  zoomResetButton: HTMLButtonElement;
  zoomInButton: HTMLButtonElement;
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
    attr: { title: options.filename },
  });

  const controls = root.createDiv({ cls: "pdf-chat-header-controls pdf-chat-interactive" });
  const modelGroup = controls.createDiv({ cls: "pdf-chat-control-group" });
  const modelId = nextControlId("model");
  modelGroup.createEl("label", { text: "模型", attr: { for: modelId } });
  const modelSelect = modelGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modelId, "aria-label": "选择聊天模型", title: "选择聊天模型" },
  });
  for (const model of options.models) {
    modelSelect.createEl("option", { text: model.name, value: model.id });
  }
  modelSelect.value = options.currentModelId;

  const modeGroup = controls.createDiv({ cls: "pdf-chat-control-group" });
  const modeId = nextControlId("mode");
  modeGroup.createEl("label", { text: "阅读模式", attr: { for: modeId } });
  const modeSelect = modeGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modeId, "aria-label": "选择阅读模式", title: "选择阅读模式" },
  });
  modeSelect.createEl("option", { text: "默认", value: "__default__" });
  for (const preset of options.presets) {
    modeSelect.createEl("option", { text: preset.name, value: preset.id });
  }
  modeSelect.value = options.currentPresetId;

  const zoomGroup = controls.createDiv({
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
  labelControl(zoomOutButton, "缩小内容字体");
  labelControl(zoomResetButton, "重置内容字体为 100%");
  labelControl(zoomInButton, "放大内容字体");

  const clearButton = controls.createEl("button", {
    text: "清空",
    cls: "pdf-chat-reset-btn",
    attr: { type: "button" },
  });
  labelControl(clearButton, "清空当前对话");

  return {
    root,
    modelSelect,
    modeSelect,
    zoomOutButton,
    zoomResetButton,
    zoomInButton,
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
      title: "展开或收起论文上下文工具",
    },
  });
  toggle.createEl("span", { text: "论文上下文", cls: "pdf-chat-context-title" });
  toggle.createEl("span", {
    text: `${options.selectionText.length} 字`,
    cls: "pdf-chat-status-chip pdf-chat-selection-count",
  });
  const summaryStatus = toggle.createEl("span", {
    text: options.hasPdf ? "摘要：检查中" : "摘要：仅 PDF",
    cls: "pdf-chat-status-chip pdf-chat-summary-status",
  });
  const ragStatus = toggle.createEl("span", {
    text: options.hasPdf ? "上下文：检查中" : "上下文：选区",
    cls: "pdf-chat-status-chip pdf-chat-rag-status",
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
      "aria-label": "PDF Chat 对话记录",
      "aria-live": restoringHistory ? "off" : "polite",
      "aria-relevant": "additions",
      "aria-atomic": "false",
    },
  });
}

export function buildEmptyState(history: HTMLElement): HTMLDivElement {
  return history.createDiv({
    cls: "pdf-chat-empty-state",
    text: "选区已就绪。你可以直接提问，或点击“翻译选区”。",
    attr: { role: "status" },
  });
}

export interface ComposerElements {
  root: HTMLElement;
  input: HTMLTextAreaElement;
  translateButton: HTMLButtonElement;
  sendButton: HTMLButtonElement;
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
  const inputRow = root.createDiv({ cls: "pdf-chat-input-row" });
  const input = inputRow.createEl("textarea", {
    cls: "pdf-chat-input",
    attr: {
      rows: "1",
      placeholder: "针对当前选区提问…",
      "aria-label": "针对当前选区提问",
      title: "Enter 发送，Shift+Enter 换行",
    },
  });
  const translateButton = inputRow.createEl("button", {
    text: "翻译选区",
    cls: "pdf-chat-translate-btn",
    attr: { type: "button" },
  });
  labelControl(translateButton, "翻译当前选区");
  const sendButton = inputRow.createEl("button", {
    text: "发送",
    cls: "mod-cta pdf-chat-send-btn",
    attr: { type: "button" },
  });
  labelControl(sendButton, "发送问题");
  root.createEl("p", {
    cls: "pdf-chat-hint",
    text: "Enter 发送 · Shift+Enter 换行 · 生成时可停止",
  });
  input.addEventListener("input", () => resizeComposerTextarea(input));
  return { root, input, translateButton, sendButton };
}
