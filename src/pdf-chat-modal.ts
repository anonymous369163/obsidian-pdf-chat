import {
  MarkdownRenderer,
  Modal,
  Notice,
  type App,
  type Component,
  type TFile,
} from "obsidian";
import { DEFAULT_SETTINGS } from "./default-settings";
import { listResearchActionsForSlot } from "./actions";
import { createPDFChatModalServices } from "./modal-services";
import {
  buildCodexDeepAnalysisPrompt,
  buildCodexExecArgs,
  createCodexAnalysisTempDir,
  parseCodexAnalysisOutput,
  renderCodexAnalysisMarkdown,
  removeCodexAnalysisTempDir,
  runCodexExec,
  searchPdfFiles,
  writeCodexAnalysisPackage,
  type PreparedCodexPaper,
} from "./multi-paper";
import {
  buildComposer,
  buildContextPanel,
  buildFollowupSuggestions,
  buildEmptyState,
  buildMessageRegion,
  buildWorkbenchHeader,
  formatAssistantDisplayMarkdown,
  formatTranslationUserDisplay,
  labelControl,
} from "./modal-ui";
import type {
  ConversationMessage,
  DocChunksEntry,
  DocSummaryEntry,
  LlmMessage,
  PaperContext,
  PDFChatModalServices,
  PDFChatPluginApi,
} from "./types";

interface SubmitOptions {
  question?: string;
  skipContextAugmentation?: boolean;
  outgoingContentOverride?: string;
}

interface BubbleOptions {
  loading?: boolean;
  skipScroll?: boolean;
}

type ModalConversationKind = "chat" | "translate";

interface ComposerMentionRange {
  start: number;
  end: number;
  query: string;
}

type BubbleElement = HTMLDivElement & {
  pdfChatContentEl?: HTMLElement;
};

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

function isAbortError(error: unknown): boolean {
  return !!error && typeof error === "object" && "name" in error && error.name === "AbortError";
}

function isCodexUnavailableError(error: unknown): boolean {
  const message = errorMessage(error);
  return /failed to start|not available|ENOENT|not recognized|cannot find/i.test(message);
}

async function renderMarkdownInto(
  app: App,
  component: Component,
  el: HTMLElement,
  text: string
): Promise<void> {
  el.empty();
  // 加上 Obsidian 阅读视图用的样式类,公式(MathJax)、代码块、列表等才会套用主题自带的排版样式。
  el.addClass("markdown-rendered");
  try {
    if (MarkdownRenderer.render) {
      await MarkdownRenderer.render(app, text, el, "", component);
      return;
    }
    if (MarkdownRenderer.renderMarkdown) {
      await MarkdownRenderer.renderMarkdown(text, el, "", component);
      return;
    }
  } catch (e) {
    // fall through to plain text below
  }
  el.setText(text);
}

function getBubbleContentEl(bubble: HTMLDivElement): HTMLElement {
  return (bubble as BubbleElement).pdfChatContentEl || bubble;
}

function setBubbleText(bubble: HTMLDivElement, text: string): void {
  getBubbleContentEl(bubble).setText(text);
}

function createBubbleDiv(parent: HTMLElement, options: { cls?: string; text?: string }): HTMLElement {
  const compatibleParent = parent as HTMLElement & {
    createDiv?: (options?: { cls?: string; text?: string }) => HTMLElement;
    createEl?: (tagName: string, options?: { cls?: string; text?: string }) => HTMLElement;
  };
  if (typeof compatibleParent.createDiv === "function") return compatibleParent.createDiv(options);
  if (typeof compatibleParent.createEl === "function") return compatibleParent.createEl("div", options);
  const child = parent.ownerDocument.createElement("div");
  if (options.cls) child.className = options.cls;
  if (options.text !== undefined) child.textContent = options.text;
  parent.appendChild(child);
  return child;
}

function canCreateBubbleChildren(parent: HTMLElement): boolean {
  const compatibleParent = parent as HTMLElement & {
    createDiv?: unknown;
    createEl?: unknown;
  };
  return (
    typeof compatibleParent.createDiv === "function" ||
    typeof compatibleParent.createEl === "function" ||
    typeof parent.ownerDocument?.createElement === "function"
  );
}

async function renderMarkdownIntoBubble(
  app: App,
  component: Component,
  bubble: HTMLDivElement,
  text: string
): Promise<void> {
  await renderMarkdownInto(app, component, getBubbleContentEl(bubble), formatAssistantDisplayMarkdown(text));
}

export class PDFChatModal extends Modal {
  private readonly plugin: PDFChatPluginApi;
  private readonly services: PDFChatModalServices;
  private readonly paperContext: PaperContext;
  private readonly contextText: string;
  private readonly pdfFile: TFile | null;
  readonly startFresh: boolean;
  readonly autoTranslateOnOpen: boolean;
  readonly conversationKey: string;
  readonly translateConversationKey: string;
  readonly hadExistingHistory: boolean;
  currentPresetId: string;
  currentModelId: string;
  useDocSummary = false;
  docSummaryEntry: DocSummaryEntry | null = null;
  isGeneratingSummary = false;
  useRag = false;
  docChunksEntry: DocChunksEntry | null = null;
  isIndexingRag = false;
  useFullTextMode = false;
  fullTextForQA: string | null = null;
  fullTextAttached = false;
  transcript: ConversationMessage[];
  translateTranscript: ConversationMessage[] = [];
  messages: LlmMessage[];
  activeComposerKind: ModalConversationKind = "chat";
  isSending = false;
  abortController: AbortController | null = null;

  zoomOutBtn!: HTMLButtonElement;
  zoomLabel!: HTMLButtonElement;
  zoomInBtn!: HTMLButtonElement;
  modelSelect!: HTMLSelectElement;
  modeSelect!: HTMLSelectElement;
  summaryCheckbox?: HTMLInputElement;
  summaryStatusEl?: HTMLSpanElement;
  summaryRefreshBtn?: HTMLButtonElement;
  ragCheckbox?: HTMLInputElement;
  ragStatusEl?: HTMLSpanElement;
  ragRefreshBtn?: HTMLButtonElement;
  referencedPdfFiles: TFile[] = [];
  multiPaperStatusEl?: HTMLElement;
  historyEl!: HTMLElement;
  emptyStateEl?: HTMLDivElement;
  suggestionsEl?: HTMLElement;
  composerStatusEl?: HTMLElement;
  composerCardEl?: HTMLElement;
  composerMentionSuggestionsEl?: HTMLElement;
  composerMentionRange?: ComposerMentionRange;
  inputEl!: HTMLTextAreaElement;
  sendBtn!: HTMLButtonElement;

  constructor(
    app: App,
    plugin: PDFChatPluginApi,
    contextText: string | PaperContext,
    pdfFile: TFile | null,
    startFresh?: boolean,
    services?: PDFChatModalServices,
    autoTranslateOnOpen?: boolean
  ) {
    super(app);
    this.plugin = plugin;
    this.services = services || createPDFChatModalServices(plugin);
    const paperContext: PaperContext =
      typeof contextText === "string"
        ? {
            app,
            file: pdfFile || null,
            selectedText: contextText,
            conversationKey: this.services.conversations.getKey(pdfFile || null, contextText),
          }
        : contextText;
    this.paperContext = paperContext;
    this.contextText = paperContext.selectedText;
    this.pdfFile = paperContext.file || null;
    this.startFresh = !!startFresh;
    this.autoTranslateOnOpen = !!autoTranslateOnOpen;

    const lastPresetId = this.plugin.settings.lastPresetId;
    this.currentPresetId =
      lastPresetId &&
      (lastPresetId === "__default__" || this.plugin.settings.promptPresets.find((p) => p.id === lastPresetId))
        ? lastPresetId
        : "__default__";

    if (this.startFresh) {
      const lastModelId = this.plugin.settings.lastModelId;
      this.currentModelId =
        lastModelId && this.plugin.settings.models.find((m) => m.id === lastModelId)
          ? lastModelId
          : this.plugin.settings.activeModelId;
    } else {
      this.currentModelId = this.services.models.resolveContinueId();
    }

    // 全文只需要在对话历史里出现一次:聊天接口是无状态的,每轮都会把 this.messages 整个重新发送,
    // 已经进过历史的第一轮全文会随着后续每轮继续被带上,不需要再重复拼接一份,否则每多聊一轮,
    // 实际发给模型的内容就多一份完整全文,输入越滚越大、越聊越慢、越聊越贵。
    this.conversationKey = paperContext.conversationKey;
    this.translateConversationKey = this.services.conversations.getKey(
      this.pdfFile,
      this.contextText,
      "translate"
    );
    // “新开对话”按快捷键触发时不加载旧记录:这次会话从空白开始,只要发出第一条消息,
    // 旧的这份记录就会被 recordTranscriptTurn 整份替换掉(每个 key 只保留一份最近对话)。
    // 如果只是打开看看什么都没问就关闭,onClose 里的保存会因为 transcript 仍是空数组而跳过,
    // 不会误删旧记录。
    const existingTranscript = this.services.conversations.get(this.conversationKey);
    this.hadExistingHistory = existingTranscript.length > 0;
    this.transcript = this.startFresh ? [] : existingTranscript;
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content })),
    ];
  }

  buildSystemMessage(): LlmMessage {
    const preset =
      this.currentPresetId === "__default__"
        ? null
        : this.plugin.settings.promptPresets.find((p) => p.id === this.currentPresetId);
    const promptText = (preset && preset.prompt) || this.plugin.settings.systemPrompt;

    let content = promptText;
    if (this.useDocSummary && this.docSummaryEntry && this.docSummaryEntry.summary) {
      content +=
        "\n\n【全文背景摘要】(由快速模型浓缩整篇 PDF 得到,仅供理解背景,不是我当前问题的具体内容):\n" +
        this.docSummaryEntry.summary;
    }
    content += `\n\n【我当前选中并想讨论的原文片段】:\n${this.contextText}`;
    return { role: "system", content };
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("pdf-chat-modal");
    const header = buildWorkbenchHeader(contentEl, {
      filename: this.getDocumentName(),
      models: this.plugin.settings.models,
      currentModelId: this.currentModelId,
      presets: this.plugin.settings.promptPresets,
      currentPresetId: this.currentPresetId,
    });
    this.modelSelect = header.modelSelect;
    this.modeSelect = header.modeSelect;
    this.zoomOutBtn = header.zoomOutButton;
    this.zoomLabel = header.zoomResetButton;
    this.zoomInBtn = header.zoomInButton;
    this.setupDragging(header.root);
    header.clearButton.addEventListener("click", () => void this.resetConversation());
    this.modelSelect.addEventListener("change", () => this.applyModel(this.modelSelect.value));
    this.modeSelect.addEventListener("change", () => this.applyPreset(this.modeSelect.value));
    this.zoomOutBtn.addEventListener("click", () =>
      this.applyFontScale((this.plugin.settings.fontScale || 1) - 0.1)
    );
    this.zoomInBtn.addEventListener("click", () =>
      this.applyFontScale((this.plugin.settings.fontScale || 1) + 0.1)
    );
    this.zoomLabel.addEventListener("click", () => this.applyFontScale(1));
    this.applyFontScale(this.plugin.settings.fontScale || 1);
    const contextPanel = buildContextPanel(contentEl, {
      selectionText: this.contextText,
      hasPdf: !!this.pdfFile,
    });
    this.summaryStatusEl = contextPanel.summaryStatus;
    this.ragStatusEl = contextPanel.ragStatus;
    if (this.pdfFile) this.buildPaperContextControls(contextPanel.tools);
    this.renderResearchActions(contextPanel.researchActions);

    const restoringHistory = this.transcript.length > 0;
    this.historyEl = buildMessageRegion(contentEl, restoringHistory);
    if (!restoringHistory) this.showEmptyState();

    const composer = buildComposer(contentEl);
    this.composerCardEl = composer.card;
    this.composerStatusEl = composer.status;
    this.inputEl = composer.input;
    this.sendBtn = composer.sendButton;
    this.updateComposerContextStatus();
    const submit = () => this.handleSubmit();
    this.sendBtn.addEventListener("click", () => {
      if (this.isSending) {
        this.stopGenerating();
      } else {
        submit();
      }
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    });
    this.inputEl.addEventListener("input", () => {
      this.hideFollowupSuggestions();
      this.updateComposerMentionSuggestions();
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Escape") this.hideComposerMentionSuggestions();
    });
    if (restoringHistory) {
      this.restoreConversationHistory().catch((err) => {
        this.setHistoryLiveMode("polite");
        new Notice("恢复上次对话显示失败: " + errorMessage(err));
      });
    } else if (this.startFresh && this.hadExistingHistory) {
      new Notice("已开始新对话(发出第一条消息后会替换掉上次保存的记录)");
    }
    if (this.autoTranslateOnOpen) this.handleTranslate();
    else this.inputEl.focus();
  }

  private getDocumentName(): string {
    if (!this.pdfFile) return "选区对话";
    return this.pdfFile.name || this.pdfFile.path.split(/[\\/]/).pop() || "选区对话";
  }

  private buildPaperContextControls(container: HTMLElement): void {
    const summaryRow = container.createDiv({ cls: "pdf-chat-summary-row" });
    const summaryLabel = summaryRow.createEl("label", { cls: "pdf-chat-check-label" });
    const summaryCheckbox = (this.summaryCheckbox = summaryLabel.createEl("input", { type: "checkbox" }));
    summaryLabel.createEl("span", { text: "附带全文摘要作为背景" });
    labelControl(summaryCheckbox, "附带全文摘要作为背景");
    const summaryRefreshBtn = (this.summaryRefreshBtn = summaryRow.createEl("button", {
      text: "生成/刷新摘要",
      cls: "pdf-chat-summary-btn",
      attr: { type: "button" },
    }));
    labelControl(summaryRefreshBtn, "生成或刷新全文摘要");
    this.refreshSummaryStatus();

    summaryCheckbox.addEventListener("change", async () => {
      if (summaryCheckbox.checked) {
        await this.ensureDocSummary(false);
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        summaryCheckbox.checked = this.useDocSummary;
      } else {
        this.useDocSummary = false;
      }
      this.messages[0] = this.buildSystemMessage();
      this.updateComposerContextStatus();
    });
    summaryRefreshBtn.addEventListener("click", async () => {
      await this.ensureDocSummary(true);
      if (summaryCheckbox.checked) {
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
      }
      this.messages[0] = this.buildSystemMessage();
      this.updateComposerContextStatus();
    });

    if (this.plugin.settings.autoDocSummary) {
      summaryCheckbox.checked = true;
      this.useDocSummary = true;
      void this.ensureDocSummary(false).then(() => {
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        summaryCheckbox.checked = this.useDocSummary;
        this.messages[0] = this.buildSystemMessage();
        this.updateComposerContextStatus();
      });
    }

    const ragRow = container.createDiv({ cls: "pdf-chat-summary-row" });
    const ragLabel = ragRow.createEl("label", { cls: "pdf-chat-check-label" });
    const ragCheckbox = (this.ragCheckbox = ragLabel.createEl("input", { type: "checkbox" }));
    ragLabel.createEl("span", { text: "全文直读 / RAG 检索" });
    labelControl(ragCheckbox, "启用全文直读或 RAG 检索");
    const ragRefreshBtn = (this.ragRefreshBtn = ragRow.createEl("button", {
      text: "建立/刷新索引",
      cls: "pdf-chat-summary-btn",
      attr: { type: "button" },
    }));
    labelControl(ragRefreshBtn, "建立或刷新全文检索索引");
    this.refreshRagStatus();

    ragCheckbox.addEventListener("change", async () => {
      if (ragCheckbox.checked) {
        await this.ensureDocChunks(false);
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
        ragCheckbox.checked = this.useRag;
      } else {
        this.useRag = false;
      }
      this.updateComposerContextStatus();
    });
    ragRefreshBtn.addEventListener("click", async () => {
      await this.ensureDocChunks(true);
      if (ragCheckbox.checked) {
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
      }
      this.updateComposerContextStatus();
    });

    if (this.plugin.settings.autoRag) {
      ragCheckbox.checked = true;
      this.useRag = true;
      void this.ensureDocChunks(false).then(() => {
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
        ragCheckbox.checked = this.useRag;
        this.updateComposerContextStatus();
      });
    }
  }

  private isPdfLikeFile(file: unknown): file is TFile {
    const candidate = file as TFile & { extension?: string; path?: string; name?: string };
    if (!candidate) return false;
    if (String(candidate.extension || "").toLowerCase() === "pdf") return true;
    return /\.pdf$/i.test(candidate.path || candidate.name || "");
  }

  private findPdfFileByPath(path: string): TFile | null {
    const vault = this.app?.vault;
    const direct = vault?.getAbstractFileByPath ? vault.getAbstractFileByPath(path) : null;
    if (this.isPdfLikeFile(direct)) return direct;
    const files = vault?.getFiles ? vault.getFiles() : [];
    return (files.find((file: TFile) => file.path === path && this.isPdfLikeFile(file)) as TFile | undefined) || null;
  }

  private addReferencedPdf(file: TFile): void {
    if (!file || !this.isPdfLikeFile(file)) return;
    if (this.pdfFile && file.path === this.pdfFile.path) {
      new Notice("当前 PDF 已自动作为对比主体，无需重复引用。");
      return;
    }
    if (this.referencedPdfFiles.find((existing) => existing.path === file.path)) return;
    if (this.referencedPdfFiles.length >= 3) {
      new Notice("第一版最多额外引用 3 篇 PDF。");
      return;
    }
    this.referencedPdfFiles.push(file);
    this.updateComposerContextStatus();
  }

  private getComposerMentionRange(): ComposerMentionRange | null {
    if (!this.inputEl) return null;
    const value = this.inputEl.value || "";
    const cursor =
      typeof this.inputEl.selectionStart === "number" ? this.inputEl.selectionStart : value.length;
    const beforeCursor = value.slice(0, cursor);
    const match = /(?:^|\s)@([^\n@]*)$/.exec(beforeCursor);
    if (!match) return null;
    const atOffset = match[0].indexOf("@");
    return {
      start: match.index + atOffset,
      end: cursor,
      query: match[1].trim(),
    };
  }

  private updateComposerMentionSuggestions(): void {
    const range = this.getComposerMentionRange();
    this.composerMentionRange = range || undefined;
    if (!range) {
      this.hideComposerMentionSuggestions();
      return;
    }
    const excludePaths = new Set(this.referencedPdfFiles.map((file) => file.path));
    if (this.pdfFile) excludePaths.add(this.pdfFile.path);
    const cachedPaths = new Set([
      ...Object.keys(this.plugin.settings.docSummaries || {}),
      ...Object.keys(this.plugin.settings.docChunks || {}),
    ]);
    const results = searchPdfFiles(this.app, range.query, { limit: 6, excludePaths, cachedPaths });
    if (!results.length) {
      this.hideComposerMentionSuggestions();
      return;
    }
    const parent = this.composerCardEl || this.contentEl;
    if (!this.composerMentionSuggestionsEl) {
      this.composerMentionSuggestionsEl = parent.createDiv({
        cls: "pdf-chat-composer-mention-suggestions",
        attr: { role: "listbox", "aria-label": "PDF mention suggestions" },
      });
    }
    this.composerMentionSuggestionsEl.empty();
    for (const candidate of results) {
      const button = this.composerMentionSuggestionsEl.createEl("button", {
        cls: "pdf-chat-composer-mention-option",
        attr: { type: "button", role: "option" },
      });
      button.createEl("span", { text: candidate.name, cls: "pdf-chat-pdf-search-name" });
      button.createEl("span", {
        text: `${candidate.path}${candidate.cached ? " · 已有缓存" : ""}`,
        cls: "pdf-chat-pdf-search-path",
      });
      labelControl(button, `引用 ${candidate.name}`);
      button.addEventListener("click", () => this.chooseComposerMention(candidate.path));
    }
  }

  private hideComposerMentionSuggestions(): void {
    const removable = this.composerMentionSuggestionsEl as (HTMLElement & { remove?: () => void }) | undefined;
    if (typeof removable?.remove === "function") {
      removable.remove();
    } else if (this.composerMentionSuggestionsEl?.parentElement) {
      this.composerMentionSuggestionsEl.parentElement.removeChild(this.composerMentionSuggestionsEl);
    }
    this.composerMentionSuggestionsEl = undefined;
    this.composerMentionRange = undefined;
  }

  private chooseComposerMention(path: string): void {
    const file = this.findPdfFileByPath(path);
    if (!file) {
      this.hideComposerMentionSuggestions();
      return;
    }
    const range = this.composerMentionRange || this.getComposerMentionRange();
    this.addReferencedPdf(file);
    if (range && this.inputEl) {
      const label = `@${file.name || file.path} `;
      const value = this.inputEl.value || "";
      this.inputEl.value = value.slice(0, range.start) + label + value.slice(range.end);
      const cursor = range.start + label.length;
      if (typeof this.inputEl.setSelectionRange === "function") {
        this.inputEl.setSelectionRange(cursor, cursor);
      } else {
        this.inputEl.selectionStart = cursor;
        this.inputEl.selectionEnd = cursor;
      }
    }
    this.hideComposerMentionSuggestions();
    this.inputEl.focus();
  }

  private renderResearchActions(container: HTMLElement): void {
    for (const action of listResearchActionsForSlot(this.services.actions, "context")) {
      const button = container.createEl("button", {
        text: action.name,
        cls: "pdf-chat-research-action-btn",
        attr: { type: "button" },
      });
      labelControl(button, action.name);
      button.addEventListener("click", () => {
        void this.services.actions
          .execute(action.id, { translate: () => this.runTranslation() })
          .catch((error: unknown) => new Notice("研究操作失败: " + errorMessage(error)));
      });
    }
  }

  private showEmptyState(): void {
    if (this.emptyStateEl) return;
    const history = this.historyEl as HTMLElement & {
      createDiv?: (options?: { cls?: string; text?: string; attr?: Record<string, string> }) => HTMLDivElement;
    };
    if (typeof history.createDiv !== "function") return;
    this.emptyStateEl = buildEmptyState(history);
  }

  private removeEmptyState(): void {
    this.emptyStateEl?.remove();
    this.emptyStateEl = undefined;
  }

  private setHistoryLiveMode(value: "off" | "polite"): void {
    const history = this.historyEl as HTMLElement & {
      setAttr?: (name: string, value: string) => void;
      setAttribute?: (name: string, value: string) => void;
    };
    if (typeof history.setAttr === "function") history.setAttr("aria-live", value);
    else if (typeof history.setAttribute === "function") history.setAttribute("aria-live", value);
  }

  private setChipState(element: HTMLElement | undefined, state: "neutral" | "success" | "accent" | "pending"): void {
    if (!element) return;
    element.removeClass("is-neutral", "is-success", "is-accent", "is-pending");
    element.addClass(`is-${state}`);
  }

  updateComposerContextStatus(): void {
    if (!this.composerStatusEl) return;
    const referenceSuffix = this.referencedPdfFiles.length
      ? ` · 已引用 ${this.referencedPdfFiles.length} 篇论文`
      : "";
    if (!this.pdfFile) {
      this.composerStatusEl.setText("选区上下文已启用" + referenceSuffix);
      return;
    }
    if (this.useRag && this.useFullTextMode) {
      this.composerStatusEl.setText("全文上下文已启用" + referenceSuffix);
    } else if (this.useRag) {
      this.composerStatusEl.setText("RAG 检索已启用" + referenceSuffix);
    } else if (this.useDocSummary) {
      this.composerStatusEl.setText("摘要背景已启用" + referenceSuffix);
    } else {
      this.composerStatusEl.setText("当前选区上下文已启用" + referenceSuffix);
    }
  }

  private followupSuggestions(): string[] {
    return [
      "举一个例子",
      "请进一步通俗易懂地讲解清楚",
      "请进一步给出详细的推导步骤",
      "进一步分析为什么是这样的",
    ];
  }

  showFollowupSuggestions(kind: ModalConversationKind = "chat"): void {
    this.hideFollowupSuggestions();
    try {
      this.suggestionsEl = buildFollowupSuggestions(this.historyEl, this.followupSuggestions());
      const children = (this.suggestionsEl as HTMLElement & { children?: HTMLCollection }).children;
      if (!children) return;
      for (const button of Array.from(children)) {
        if (button.tagName !== "BUTTON") continue;
        button.addEventListener("click", () => {
          this.inputEl.value = button.textContent || "";
          this.activeComposerKind = kind;
          this.inputEl.focus();
          this.hideFollowupSuggestions();
        });
      }
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    } catch (error) {
      void error;
      this.suggestionsEl = undefined;
    }
  }

  hideFollowupSuggestions(): void {
    const removable = this.suggestionsEl as (HTMLElement & { remove?: () => void }) | undefined;
    if (typeof removable?.remove === "function") {
      removable.remove();
    } else if (this.suggestionsEl?.parentElement) {
      this.suggestionsEl.parentElement.removeChild(this.suggestionsEl);
    }
    this.suggestionsEl = undefined;
  }

  async restoreConversationHistory(): Promise<void> {
    const renderJobs = [];
    for (const message of this.transcript) {
      if (message.role === "user") {
        this.addBubble("user", message.content, { skipScroll: true });
        continue;
      }
      const bubble = this.addBubble("assistant", message.content, { skipScroll: true });
      bubble.addClass("is-rendered");
      renderJobs.push(
        renderMarkdownIntoBubble(this.app, this.plugin, bubble, message.content).then(() => {
          if (message.status === "stopped") {
            bubble.addClass("is-stopped");
            bubble.createEl("p", { cls: "pdf-chat-stopped-label", text: "[已停止生成]" });
          }
        })
      );
    }
    await Promise.all(renderJobs);
    this.setHistoryLiveMode("polite");
    this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
    const lastMessage = this.transcript[this.transcript.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.status !== "stopped") {
      this.showFollowupSuggestions();
    }
    const scope = this.pdfFile ? "本 PDF" : "当前选区";
    new Notice(`已恢复${scope}上次对话(${this.transcript.length} 条消息)`);
  }

  async persistConversation(): Promise<boolean> {
    try {
      await this.services.conversations.save(this.conversationKey, this.transcript);
      return true;
    } catch (err) {
      new Notice("保存对话失败: " + errorMessage(err));
      return false;
    }
  }

  async persistTranslationConversation(): Promise<boolean> {
    try {
      await this.services.conversations.save(
        this.translateConversationKey,
        this.translateTranscript
      );
      return true;
    } catch (err) {
      new Notice("保存翻译记录失败: " + errorMessage(err));
      return false;
    }
  }

  async recordTranscriptTurn(
    question: string,
    answer: string,
    status: ConversationMessage["status"]
  ): Promise<boolean> {
    if (typeof answer !== "string" || !answer.trim()) return false;
    this.transcript.push(
      { role: "user", content: question, status: "complete" },
      { role: "assistant", content: answer, status: status === "stopped" ? "stopped" : "complete" }
    );
    await this.persistConversation();
    return true;
  }

  async recordTranslateTurn(
    question: string,
    answer: string,
    status: ConversationMessage["status"]
  ): Promise<boolean> {
    if (typeof answer !== "string" || !answer.trim()) return false;
    this.translateTranscript.push(
      { role: "user", content: question, status: "complete" },
      { role: "assistant", content: answer, status: status === "stopped" ? "stopped" : "complete" }
    );
    await this.persistTranslationConversation();
    return true;
  }

  async resetConversation(): Promise<void> {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再清空");
      return;
    }
    this.transcript = [];
    this.messages = [this.buildSystemMessage()];
    this.activeComposerKind = "chat";
    this.fullTextAttached = false;
    this.historyEl.empty();
    this.hideFollowupSuggestions();
    this.emptyStateEl = undefined;
    this.showEmptyState();
    try {
      await this.services.conversations.clear(this.conversationKey);
      new Notice("对话已清空,原文上下文保留");
    } catch (err) {
      new Notice("界面已清空,但删除已保存对话失败: " + errorMessage(err));
    }
  }

  applyPreset(id: string): void {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再切换阅读模式");
      this.modeSelect.value = this.currentPresetId;
      return;
    }
    this.currentPresetId = id;
    this.plugin.settings.lastPresetId = id;
    this.plugin.saveSettings();
    this.messages[0] = this.buildSystemMessage();
    const preset = this.plugin.settings.promptPresets.find((p) => p.id === id);
    const name = id === "__default__" ? "默认" : (preset && preset.name) || id;
    new Notice(`已切换到「${name}」模式,后续回答会按新设定进行`);
  }

  applyModel(id: string): void {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再切换模型");
      this.modelSelect.value = this.currentModelId;
      return;
    }
    this.currentModelId = id;
    this.plugin.settings.lastModelId = id;
    this.plugin.saveSettings();
    const m = this.plugin.settings.models.find((x) => x.id === id);
    new Notice(`已切换到模型「${(m && m.name) || id}」`);
  }

  applyFontScale(scale: number): void {
    const clamped = Math.round(Math.min(1.6, Math.max(0.7, scale)) * 100) / 100;
    this.plugin.settings.fontScale = clamped;
    this.contentEl.style.setProperty("--pdf-chat-font-scale", String(clamped));
    if (this.zoomLabel) this.zoomLabel.setText(Math.round(clamped * 100) + "%");
    this.plugin.saveSettings();
  }

  refreshSummaryStatus(): void {
    if (!this.summaryStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    if (cached && cached.summary) {
      this.docSummaryEntry = cached;
      const date = new Date(cached.generatedAt);
      const truncatedNote = cached.truncated ? " · 原文过长,仅摘要了前面部分" : "";
      this.summaryStatusEl.setText("摘要已缓存");
      this.setChipState(this.summaryStatusEl, "success");
      this.summaryStatusEl.setAttr("aria-label", `摘要已缓存 · ${date.toLocaleString()}${truncatedNote}`);
    } else {
      this.docSummaryEntry = null;
      this.summaryStatusEl.setText("摘要未生成");
      this.setChipState(this.summaryStatusEl, "neutral");
      this.summaryStatusEl.setAttr("aria-label", "尚未生成全文摘要");
    }
    this.updateComposerContextStatus();
  }

  async ensureDocSummary(forceRefresh: boolean): Promise<void> {
    if (this.isGeneratingSummary || !this.pdfFile) return;

    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docSummaryEntry = cached;
      this.refreshSummaryStatus();
      return;
    }

    this.isGeneratingSummary = true;
    this.summaryStatusEl?.setText("摘要生成中");
    this.setChipState(this.summaryStatusEl, "pending");
    if (this.summaryRefreshBtn) {
      this.summaryRefreshBtn.setText("生成中…");
      this.summaryRefreshBtn.disabled = true;
    }
    if (this.summaryCheckbox) this.summaryCheckbox.disabled = true;
    const notice = new Notice("正在用快速模型提炼全文摘要,可能需要几十秒…", 0);

    try {
      this.docSummaryEntry = await this.services.papers.getOrCreateDocSummary(this.pdfFile, forceRefresh);
      this.refreshSummaryStatus();
      notice.hide();
      new Notice("全文摘要已生成/更新");
    } catch (err) {
      notice.hide();
      new Notice("生成摘要失败: " + errorMessage(err));
      if (this.summaryCheckbox) this.summaryCheckbox.checked = false;
      this.useDocSummary = false;
    } finally {
      this.isGeneratingSummary = false;
      if (this.summaryRefreshBtn) {
        this.summaryRefreshBtn.setText("生成/刷新摘要");
        this.summaryRefreshBtn.disabled = false;
      }
      if (this.summaryCheckbox) this.summaryCheckbox.disabled = false;
      this.updateComposerContextStatus();
    }
  }

  refreshRagStatus(): void {
    if (!this.ragStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    if (cached && cached.chunks && cached.chunks.length) {
      this.docChunksEntry = cached;
      const threshold = this.plugin.settings.ragFullTextThreshold || DEFAULT_SETTINGS.ragFullTextThreshold;
      this.useFullTextMode = !!(cached.fullTextLength && cached.fullTextLength <= threshold);
      const date = new Date(cached.generatedAt);
      if (this.useFullTextMode) {
        this.ragStatusEl.setText("全文直读");
        this.setChipState(this.ragStatusEl, "accent");
        this.ragStatusEl.setAttr(
          "aria-label",
          `全文约 ${cached.fullTextLength} 字，直接读全文 · ${date.toLocaleString()}`
        );
      } else {
        this.ragStatusEl.setText("RAG 就绪");
        this.setChipState(this.ragStatusEl, "success");
        this.ragStatusEl.setAttr("aria-label", `已建索引 · ${cached.chunks.length} 块 · ${date.toLocaleString()}`);
      }
    } else {
      this.docChunksEntry = null;
      this.useFullTextMode = false;
      this.ragStatusEl.setText("选区上下文");
      this.setChipState(this.ragStatusEl, "neutral");
      this.ragStatusEl.setAttr("aria-label", "尚未建立全文检索索引");
    }
    this.updateComposerContextStatus();
  }

  async ensureDocChunks(forceRefresh: boolean): Promise<void> {
    if (this.isIndexingRag || !this.pdfFile) return;

    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docChunksEntry = cached;
      this.refreshRagStatus();
      return;
    }

    this.isIndexingRag = true;
    this.ragStatusEl?.setText("索引建立中");
    this.setChipState(this.ragStatusEl, "pending");
    if (this.ragRefreshBtn) {
      this.ragRefreshBtn.setText("建立中…");
      this.ragRefreshBtn.disabled = true;
    }
    if (this.ragCheckbox) this.ragCheckbox.disabled = true;

    try {
      this.docChunksEntry = await this.services.papers.getOrCreateDocChunks(this.pdfFile, forceRefresh);
      this.refreshRagStatus();
    } catch (err) {
      new Notice("建立检索索引失败: " + errorMessage(err));
      if (this.ragCheckbox) this.ragCheckbox.checked = false;
      this.useRag = false;
    } finally {
      this.isIndexingRag = false;
      if (this.ragRefreshBtn) {
        this.ragRefreshBtn.setText("建立/刷新索引");
        this.ragRefreshBtn.disabled = false;
      }
      if (this.ragCheckbox) this.ragCheckbox.disabled = false;
      this.updateComposerContextStatus();
    }
  }

  private selectedPaperFiles(): Array<{ file: TFile; role: "current" | "referenced" }> {
    const papers: Array<{ file: TFile; role: "current" | "referenced" }> = [];
    if (this.pdfFile) papers.push({ file: this.pdfFile, role: "current" });
    for (const file of this.referencedPdfFiles) papers.push({ file, role: "referenced" });
    return papers;
  }

  private getMultiPaperQuestion(): string {
    const typed = this.inputEl?.value?.trim();
    return typed || "请基于当前论文和已引用论文回答我的问题。";
  }

  private multiPaperUserLabel(question: string): string {
    const refs = this.referencedPdfFiles.map((file) => file.name || file.path).join("、");
    return refs ? `多论文问题：${question}\n\n引用论文：${refs}` : `多论文问题：${question}`;
  }

  private codexSlashQuestion(question: string): string | null {
    const trimmed = question.trim();
    if (!/^\/codex\b/i.test(trimmed)) return null;
    const stripped = trimmed.replace(/^\/codex\b[:：]?\s*/i, "").trim();
    return (
      stripped ||
      "请基于当前论文和已引用论文进行深度阅读，提炼关键问题、核心方法、证据、局限和后续值得追问的方向。"
    );
  }

  private shouldOfferCodexDeepAnalysis(question: string): boolean {
    if (!this.pdfFile || !this.referencedPdfFiles.length) return false;
    return /(深度分析|深度阅读|深入分析|深入阅读|Codex|codex|CLI|cli)/.test(question);
  }

  private confirmCodexDeepAnalysis(): boolean {
    const message =
      "检测到你想做多论文深度分析。是否使用 Codex CLI 读取当前论文和 @ 引用论文？\n\n选择“取消”会继续使用当前模型基于多论文上下文回答。";
    const candidateWindow = this.contentEl?.ownerDocument
      ? (this.contentEl.ownerDocument as Document & { defaultView?: Window | null }).defaultView
      : null;
    const confirmFn =
      (candidateWindow && typeof candidateWindow.confirm === "function" && candidateWindow.confirm.bind(candidateWindow)) ||
      (typeof window !== "undefined" && typeof window.confirm === "function" && window.confirm.bind(window)) ||
      (typeof confirm === "function" && confirm);
    if (!confirmFn) {
      new Notice("检测到深度分析意图，但当前环境无法弹出确认框，已改用当前模型基于多论文上下文回答。");
      return false;
    }
    return confirmFn(message);
  }

  private async buildApiMultiPaperContext(question: string, progress?: (message: string) => void): Promise<string> {
    const papers = this.selectedPaperFiles();
    const parts: string[] = [];
    for (const { file, role } of papers) {
      progress?.(`正在准备 ${file.name || file.path} 的摘要和检索片段…`);
      const summary = await this.services.papers.getOrCreateDocSummary(file, false);
      const chunksEntry = await this.services.papers.getOrCreateDocChunks(file, false);
      const retrieved = this.services.papers.retrieveContext(
        chunksEntry.chunks || [],
        [question],
        this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK
      );
      const evidence = retrieved.length
        ? retrieved.map((chunk) => `[Page ${chunk.page} / chunk ${chunk.idx ?? "?"}]\n${chunk.text}`).join("\n\n")
        : "(未检索到明显相关片段)";
      parts.push(
        [
          `## ${role === "current" ? "当前论文" : "引用论文"}：${file.name || file.path}`,
          `路径：${file.path}`,
          "### 摘要",
          summary.summary || "(无摘要)",
          "### 可能相关片段",
          evidence,
        ].join("\n")
      );
    }
    return [
      "你正在同时阅读多篇论文。下面是多篇论文阅读上下文，请只基于提供的论文摘要和检索片段回答用户问题。",
      "不要默认改写用户问题；只有当用户明确要求跨论文关系分析时，才组织成关系分析式回答。",
      "需要区分依据时，请标明来自哪篇论文。",
      "如果证据不足，请明确说明不足，不要编造。",
      "",
      parts.join("\n\n---\n\n"),
      "",
      "## 用户问题",
      question,
    ].join("\n");
  }

  private async completeApiMultiPaperAnswer(
    question: string,
    userLabel: string,
    bubble: HTMLDivElement
  ): Promise<void> {
    const outgoing = await this.buildApiMultiPaperContext(question, (message) => {
      this.multiPaperStatusEl?.setText(message);
      setBubbleText(bubble, message);
    });
    let fullText = "";
    let firstChunkArrived = false;
    fullText = await this.services.llm.chat({
      messages: [...this.messages, { role: "user", content: outgoing }],
      onChunk: (_piece, acc) => {
        fullText = acc;
        if (!firstChunkArrived) {
          firstChunkArrived = true;
          bubble.removeClass("is-loading");
        }
        setBubbleText(bubble, acc);
        this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
      },
      signal: this.abortController?.signal,
      modelProfile: this.services.models.get(this.currentModelId),
    });
    bubble.removeClass("is-loading");
    bubble.addClass("is-rendered");
    await renderMarkdownIntoBubble(this.app, this.plugin, bubble, fullText);
    this.messages.push({ role: "user", content: userLabel }, { role: "assistant", content: fullText });
    await this.recordTranscriptTurn(userLabel, fullText, "complete");
    this.showFollowupSuggestions("chat");
    this.multiPaperStatusEl?.setText("已改用当前模型基于多论文上下文回答。");
  }

  private async prepareCodexPapers(progress?: (message: string) => void): Promise<PreparedCodexPaper[]> {
    const prepared: PreparedCodexPaper[] = [];
    const usedIds = new Map<string, number>();
    for (const { file, role } of this.selectedPaperFiles()) {
      progress?.(`正在抽取 ${file.name || file.path} 的全文、分页文本和缓存资产…`);
      const [pages, summary, chunksEntry] = await Promise.all([
        this.services.papers.extractPages(file),
        this.services.papers.getOrCreateDocSummary(file, false),
        this.services.papers.getOrCreateDocChunks(file, false),
      ]);
      const baseId = file.path || file.name || `paper-${prepared.length + 1}`;
      const seen = usedIds.get(baseId) || 0;
      usedIds.set(baseId, seen + 1);
      prepared.push({
        id: seen ? `${baseId}-${seen + 1}` : baseId,
        role,
        name: file.name || file.path,
        vaultPath: file.path,
        mtime: file.stat && file.stat.mtime,
        summary: summary.summary || "",
        chunks: chunksEntry.chunks || [],
        pages,
      });
    }
    return prepared;
  }

  async runOrdinaryMultiPaperCompare(): Promise<void> {
    if (!this.pdfFile) {
      new Notice("多论文阅读需要从 PDF 视图打开。");
      return;
    }
    if (!this.referencedPdfFiles.length) {
      new Notice("请先 @ 引用至少一篇其他 PDF。");
      return;
    }
    if (this.isSending) return;
    const question = this.getMultiPaperQuestion();
    const loadingNotice = new Notice("正在准备多论文上下文…", 0);
    try {
      const outgoing = await this.buildApiMultiPaperContext(question, (message) => {
        this.multiPaperStatusEl?.setText(message);
      });
      loadingNotice.hide();
      await this.handleSubmit({
        question: this.multiPaperUserLabel(question),
        outgoingContentOverride: outgoing,
        skipContextAugmentation: true,
      });
      this.multiPaperStatusEl?.setText("多论文上下文回答已完成，可继续追问。");
    } catch (error) {
      loadingNotice.hide();
      new Notice("多论文上下文准备失败: " + errorMessage(error));
      this.multiPaperStatusEl?.setText("多论文上下文准备失败。");
    }
  }

  async runCodexDeepAnalysis(questionOverride?: string): Promise<void> {
    if (!this.pdfFile) {
      new Notice("Codex 深度分析需要从 PDF 视图打开。");
      return;
    }
    if (!this.referencedPdfFiles.length) {
      new Notice("请先 @ 引用至少一篇其他 PDF。");
      return;
    }
    if (!this.plugin.settings.codexDeepAnalysis.enabled) {
      new Notice("需要先在 PDF Chat 设置中启用 Codex CLI 深度分析。");
      this.multiPaperStatusEl?.setText("Codex 深度分析尚未启用。");
      return;
    }
    if (this.isSending) return;

    const question = (questionOverride && questionOverride.trim()) || this.getMultiPaperQuestion();
    const userLabel = this.multiPaperUserLabel(question);
    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.addBubble("user", userLabel);
    this.inputEl.value = "";
    if (this.inputEl.style) this.inputEl.style.height = "";
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "正在准备 Codex 多论文分析包…", { loading: true });
    this.abortController = new AbortController();
    let analysisDir = "";

    try {
      const taskId = String(Date.now());
      const papers = await this.prepareCodexPapers((message) => {
        this.multiPaperStatusEl?.setText(message);
        setBubbleText(loadingBubble, message);
      });
      analysisDir = createCodexAnalysisTempDir(taskId);
      await writeCodexAnalysisPackage({
        baseDir: analysisDir,
        taskId,
        createdAt: new Date().toISOString(),
        question,
        papers,
      });
      const settings = this.plugin.settings.codexDeepAnalysis;
      const execArgs = buildCodexExecArgs({
        analysisDir,
        command: settings.command || DEFAULT_SETTINGS.codexDeepAnalysis.command,
        profile: settings.profile,
        model: settings.model,
        prompt: buildCodexDeepAnalysisPrompt(),
      });
      const runningMessage = `Codex 正在阅读 ${papers.length} 篇论文…`;
      this.multiPaperStatusEl?.setText(runningMessage);
      setBubbleText(loadingBubble, runningMessage);
      const raw = await runCodexExec(execArgs, {
        timeoutMs: settings.timeoutMs || DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs,
        signal: this.abortController.signal,
      });
      const output = parseCodexAnalysisOutput(raw);
      const markdown = renderCodexAnalysisMarkdown(output);
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, markdown);
      this.messages.push({ role: "user", content: userLabel }, { role: "assistant", content: markdown });
      await this.recordTranscriptTurn(userLabel, markdown, "complete");
      this.showFollowupSuggestions("chat");
      this.multiPaperStatusEl?.setText("Codex 深度分析已完成。");
    } catch (error) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(error)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, "Codex 深度分析已停止。");
        this.multiPaperStatusEl?.setText("Codex 深度分析已停止。");
      } else if (isCodexUnavailableError(error)) {
        setBubbleText(loadingBubble, "Codex CLI 不可用，正在改用当前模型基于多论文上下文回答…");
        this.multiPaperStatusEl?.setText("Codex 不可用，改用当前模型回答。");
        try {
          await this.completeApiMultiPaperAnswer(question, userLabel, loadingBubble);
        } catch (fallbackError) {
          loadingBubble.removeClass("is-loading");
          loadingBubble.addClass("is-error");
          setBubbleText(loadingBubble, "多论文上下文回答也失败: " + errorMessage(fallbackError));
          this.multiPaperStatusEl?.setText("多论文上下文回答失败。");
        }
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "Codex 深度分析失败: " + errorMessage(error));
        this.multiPaperStatusEl?.setText("Codex 深度分析失败，可改用当前模型回答。");
      }
    } finally {
      const keep = this.plugin.settings.codexDeepAnalysis.keepTempFiles;
      if (analysisDir && !keep) {
        try {
          removeCodexAnalysisTempDir(analysisDir);
        } catch (error) {
          void error;
        }
      }
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }

  setupDragging(handleEl: HTMLElement): void {
    handleEl.addClass("pdf-chat-drag-handle");
    handleEl.addEventListener("mousedown", (evt: MouseEvent) => {
      if (
        evt.target instanceof Element &&
        evt.target.closest("button, select, input, textarea, label, .pdf-chat-interactive")
      ) {
        return;
      }
      evt.preventDefault();

      const modalEl = this.modalEl;
      const doc = modalEl.ownerDocument;
      const rect = modalEl.getBoundingClientRect();
      modalEl.style.position = "fixed";
      modalEl.style.margin = "0";
      modalEl.style.left = rect.left + "px";
      modalEl.style.top = rect.top + "px";

      const startX = evt.clientX;
      const startY = evt.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;

      const onMouseMove = (moveEvt: MouseEvent) => {
        modalEl.style.left = startLeft + (moveEvt.clientX - startX) + "px";
        modalEl.style.top = startTop + (moveEvt.clientY - startY) + "px";
      };
      const onMouseUp = () => {
        doc.removeEventListener("mousemove", onMouseMove);
        doc.removeEventListener("mouseup", onMouseUp);
      };
      doc.addEventListener("mousemove", onMouseMove);
      doc.addEventListener("mouseup", onMouseUp);
    });
  }

  stopGenerating(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  setSendingState(sending: boolean): void {
    this.isSending = sending;
    if (sending) this.hideFollowupSuggestions();
    this.sendBtn.setText(sending ? "停止" : "↑");
    this.sendBtn.toggleClass("is-stop", sending);
    labelControl(this.sendBtn, sending ? "停止生成" : "发送问题");
  }

  handleTranslate(): void {
    void this.services.actions.execute("translate", {
      translate: () => this.runTranslation(),
    });
  }

  async runTranslation(): Promise<void> {
    if (!this.contextText || this.isSending) return;

    this.hideFollowupSuggestions();
    const friendlyLabel = `翻译当前选区（${this.contextText.length} 字）`;
    this.addBubble("user", friendlyLabel);
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "正在翻译…", { loading: true });
    this.abortController = new AbortController();
    let fullText = "";

    try {
      const result = await this.services.translations.translate({
        source: this.contextText,
        settings: this.plugin.settings.translation,
        modelProfile: this.services.models.get(this.services.models.resolveTranslateId()),
        signal: this.abortController.signal,
        onChunk: (progress) => {
          fullText = progress.combinedText;
          loadingBubble.removeClass("is-loading");
          const progressText =
            progress.chunkCount > 1
              ? `${progress.combinedText}\n\n正在翻译 ${progress.chunkIndex}/${progress.chunkCount}…`
              : progress.combinedText;
          setBubbleText(loadingBubble, progressText);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
      });
      fullText = result.text;
      loadingBubble.removeClass("is-loading");
      if (!fullText.trim()) {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "翻译未返回内容");
        return;
      }

      const hasFallbackChunks = result.failedChunkIndexes.length > 0;
      const isPartial = result.stoppedEarly || hasFallbackChunks;
      const status: ConversationMessage["status"] = isPartial ? "stopped" : "complete";
      if (isPartial) {
        const notices: string[] = [];
        if (result.stoppedEarly) notices.push("[已停止生成]");
        if (hasFallbackChunks) notices.push("[部分分块翻译失败，已保留原文]");
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, fullText + "\n\n" + notices.join("\n"));
      } else {
        loadingBubble.addClass("is-rendered");
        await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      }
      await this.recordTranslateTurn(friendlyLabel, fullText, status);
      this.activeComposerKind = "translate";
      if (!isPartial) this.showFollowupSuggestions("translate");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(err) && fullText.trim()) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, fullText + "\n\n[已停止生成]");
        await this.recordTranslateTurn(friendlyLabel, fullText, "stopped");
        this.activeComposerKind = "translate";
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "翻译失败，请检查模型配置或稍后重试。");
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }

  async handleTranslateFollowup(question: string, usingOverride: boolean): Promise<void> {
    this.hideFollowupSuggestions();
    this.addBubble("user", question);
    if (!usingOverride) {
      this.inputEl.value = "";
      if (this.inputEl.style) this.inputEl.style.height = "";
    }
    this.setSendingState(true);

    const loadingBubble = this.addBubble("assistant", "思考中…", { loading: true });
    this.abortController = new AbortController();
    let fullText = "";
    let firstChunkArrived = false;
    const requestMessages: LlmMessage[] = [
      this.buildSystemMessage(),
      ...this.translateTranscript.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user", content: question },
    ];

    try {
      fullText = await this.services.llm.chat({
        messages: requestMessages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          setBubbleText(loadingBubble, acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: this.abortController.signal,
        modelProfile: this.services.models.get(this.currentModelId),
      });

      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranslateTurn(question, fullText, "complete");
      this.activeComposerKind = "translate";
      this.showFollowupSuggestions("translate");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(err)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, (fullText || "") + "\n\n[已停止生成]");
        if (fullText) await this.recordTranslateTurn(question, fullText, "stopped");
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "请求失败: " + errorMessage(err));
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }

  async handleSubmit(options: SubmitOptions = {}): Promise<void> {
    const opts = options || {};
    const usingOverride = typeof opts.question === "string";
    const question = typeof opts.question === "string" ? opts.question.trim() : this.inputEl.value.trim();
    if (!question) return;
    if (this.isSending) {
      new Notice("上一个问题还在生成中,请稍候或点击停止");
      return;
    }

    const codexSlashQuestion = this.codexSlashQuestion(question);
    if (codexSlashQuestion !== null) {
      await this.runCodexDeepAnalysis(codexSlashQuestion);
      return;
    }

    if (this.activeComposerKind === "translate" && this.translateTranscript.length) {
      await this.handleTranslateFollowup(question, usingOverride);
      return;
    }

    if (
      !usingOverride &&
      !opts.outgoingContentOverride &&
      !opts.skipContextAugmentation &&
      this.shouldOfferCodexDeepAnalysis(question) &&
      this.confirmCodexDeepAnalysis()
    ) {
      await this.runCodexDeepAnalysis(question);
      return;
    }

    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.addBubble("user", question);
    if (!usingOverride) {
      this.inputEl.value = "";
      if (this.inputEl.style) this.inputEl.style.height = "";
    }
    this.setSendingState(true);

    const loadingBubble = this.addBubble("assistant", "思考中…", { loading: true });

    let outgoingContent = opts.outgoingContentOverride || question;
    if (opts.outgoingContentOverride) {
      // 外部任务已经构造好了发送给模型的上下文；界面仍只显示用户可见问题。
    } else if (opts.skipContextAugmentation) {
      // 跳过下面的 RAG/全文拼接逻辑,原样发送。
    } else if (this.referencedPdfFiles.length) {
      setBubbleText(loadingBubble, "正在准备多论文上下文…");
      try {
        outgoingContent = await this.buildApiMultiPaperContext(question, (message) => {
          this.multiPaperStatusEl?.setText(message);
          setBubbleText(loadingBubble, message);
        });
      } catch (err) {
        new Notice("多论文上下文准备失败，已退回当前问题: " + errorMessage(err));
        outgoingContent = question;
      }
      setBubbleText(loadingBubble, "思考中…");
    } else if (this.useRag && this.useFullTextMode && this.pdfFile && !this.fullTextAttached) {
      // 全文足够短,直接把全文交给模型,不做"猜哪一块相关"的检索——实测发现关键词检索对
      // "列举类"问题(比如"论文对比了哪些基线算法")经常检索不全或检索错块,直接给全文更可靠。
      // 只在对话的第一轮附带一次:之后每轮 this.messages 都会带着这一轮的历史一起重新发送,
      // 不需要也不应该重复拼接,否则输入会随聊天轮数线性膨胀。
      setBubbleText(loadingBubble, "正在读取全文…");
      try {
        if (!this.fullTextForQA) {
          this.fullTextForQA = await this.services.papers.extractFullText(this.pdfFile);
        }
        outgoingContent = "【论文全文】:\n" + this.fullTextForQA + "\n\n【我的问题】:\n" + question;
        this.fullTextAttached = true;
      } catch (err) {
        // 全文提取失败就退回原始问题,不阻塞正常提问
      }
      setBubbleText(loadingBubble, "思考中…");
    } else if (
      !this.useFullTextMode &&
      this.useRag &&
      this.docChunksEntry &&
      this.docChunksEntry.chunks &&
      this.docChunksEntry.chunks.length
    ) {
      const retrievalQueries = [question];
      if (this.plugin.settings.ragQueryTranslate) {
        setBubbleText(loadingBubble, "正在思考检索角度…");
        try {
          const variants = await this.services.papers.planRagQueries(question);
          if (variants && variants.length) retrievalQueries.push(...variants);
        } catch (err) {
          // 检索词规划失败就退回只用原始问题直接检索,不阻塞正常提问
        }
      }

      const topK = this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK;
      const expanded = this.services.papers.retrieveContext(
        this.docChunksEntry.chunks,
        retrievalQueries,
        topK
      );
      if (expanded.length) {
        const retrievedText = expanded.map((c) => `[第${c.page}页]\n${c.text}`).join("\n\n---\n\n");
        outgoingContent =
          "【从全文中按关键词检索到的可能相关片段(不一定完全准确,仅供参考)】:\n" +
          retrievedText +
          "\n\n【我的问题】:\n" +
          question;
      }
      setBubbleText(loadingBubble, "思考中…");
    }

    this.messages.push({ role: "user", content: outgoingContent });
    this.abortController = new AbortController();
    let fullText = "";
    let firstChunkArrived = false;

    try {
      fullText = await this.services.llm.chat({
        messages: this.messages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          setBubbleText(loadingBubble, acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: this.abortController.signal,
        modelProfile: this.services.models.get(this.currentModelId),
      });

      loadingBubble.removeClass("is-loading");
      // 切到最终渲染状态后去掉 pre-wrap,避免和渲染出来的 HTML(公式/段落/代码块)标签间的
      // 空白文本节点叠加,出现多余换行或挤成一团的问题。
      loadingBubble.addClass("is-rendered");
      this.messages.push({ role: "assistant", content: fullText });
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranscriptTurn(question, fullText, "complete");
      this.showFollowupSuggestions("chat");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(err)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, (fullText || "") + "\n\n[已停止生成]");
        if (fullText) {
          this.messages.push({ role: "assistant", content: fullText });
          await this.recordTranscriptTurn(question, fullText, "stopped");
        } else {
          this.messages.pop();
        }
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "请求失败: " + errorMessage(err));
        this.messages.pop();
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }

  addBubble(role: "user" | "assistant", text: string, opts: BubbleOptions = {}): HTMLDivElement {
    this.removeEmptyState();
    const bubble = this.historyEl.createDiv({ cls: `pdf-chat-bubble ${role}` }) as BubbleElement;
    const compatibleBubble = bubble as HTMLDivElement & {
      setAttr?: (name: string, value: string) => void;
    };
    if (typeof compatibleBubble.setAttr === "function") {
      compatibleBubble.setAttr("aria-label", role === "user" ? "你的消息" : "PDF Chat 的消息");
    } else if (typeof compatibleBubble.setAttribute === "function") {
      compatibleBubble.setAttribute("aria-label", role === "user" ? "你的消息" : "PDF Chat 的消息");
    }
    if (opts && opts.loading) bubble.addClass("is-loading");
    if (!canCreateBubbleChildren(bubble)) {
      setBubbleText(bubble, text);
    } else if (role === "assistant") {
      const meta = createBubbleDiv(bubble, { cls: "pdf-chat-message-meta" });
      meta.createEl("span", { text: "PDF Chat", cls: "pdf-chat-message-author" });
      meta.createEl("span", { text: "基于当前论文上下文", cls: "pdf-chat-message-context" });
      bubble.pdfChatContentEl = createBubbleDiv(bubble, { cls: "pdf-chat-message-content" });
      setBubbleText(bubble, text);
    } else {
      const translationDisplay = formatTranslationUserDisplay(text);
      bubble.pdfChatContentEl = createBubbleDiv(bubble, { cls: "pdf-chat-message-content" });
      if (translationDisplay) {
        bubble.addClass("is-translation-request");
        createBubbleDiv(bubble.pdfChatContentEl, {
          text: translationDisplay.title,
          cls: "pdf-chat-user-message-title",
        });
        if (translationDisplay.meta) {
          createBubbleDiv(bubble.pdfChatContentEl, {
            text: translationDisplay.meta,
            cls: "pdf-chat-user-message-meta",
          });
        }
      } else {
        setBubbleText(bubble, text);
      }
    }
    if (!(opts && opts.skipScroll)) {
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    }
    return bubble;
  }

  onClose(): void {
    this.stopGenerating();
    // 只在这次会话确实产生过消息时才回写存储:避免“新开对话”模式下,用户什么都没问就
    // 直接关闭弹窗,却因为 this.transcript 一开始就是空数组而把上次保存的记录误清空。
    if (this.transcript.length) {
      void this.persistConversation();
    }
    if (this.translateTranscript.length) {
      void this.persistTranslationConversation();
    }
    this.contentEl.empty();
  }
}
