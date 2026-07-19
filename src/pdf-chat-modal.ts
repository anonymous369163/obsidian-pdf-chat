import {
  FuzzySuggestModal,
  MarkdownRenderer,
  Modal,
  Notice,
  type App,
  type Component,
  type TFile,
} from "obsidian";
import { DEFAULT_SETTINGS } from "./default-settings";
import { listResearchActionsForSlot } from "./actions";
import {
  buildCodexTurnPrompt,
  resolveCodexPdfLocation,
  runCodexThreadDoctor,
  runCodexVersionCheck,
} from "./codex-cli";
import type { CodexTurnSnapshot } from "./codex-session-manager";
import {
  composeBoundedContext,
  summarizeSessionMemory,
  type ContextComposition,
} from "./context-composer";
import { createPDFChatModalServices } from "./modal-services";
import {
  requestSelectionLimitDecision,
  resolveSelectionForTurn,
  type SelectionChoice,
  type SelectionDecision,
} from "./selection-limit-modal";
import {
  buildCodexMarkdownPrompt,
  buildCodexPdfOnlyPrompt,
  buildCodexDebugFullMarkdownPrompt,
  buildCodexExecArgs,
  createCodexAnalysisTempDir,
  parseCodexAnalysisOutput,
  parseCodexMarkdownOutput,
  renderCodexAnalysisMarkdown,
  removeCodexAnalysisTempDir,
  runCodexExec,
  searchPdfFiles,
  writeCodexAnalysisPackage,
  writeCodexDebugFullPackage,
  writeCodexOutputSchema,
  buildCodexDebugFullPrompt,
  type CodexRunProgress,
  type PaperSearchCandidate,
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
  CodexReasoningEffort,
  CodexVerbosity,
  CodexInputMode,
  CodexOutputMode,
  ConversationMessage,
  ConversationSession,
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
  assistantAuthor?: string;
  assistantContext?: string;
  assistantClass?: string;
}

type ModalConversationKind = "chat" | "translate";
type ModalRuntimeMode = "api" | "codex";
type CodexCloseIntent = "suspend" | "terminate";

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

function isCodexTimeoutError(error: unknown): boolean {
  return /timed out after \d+ms/i.test(errorMessage(error));
}

function formatCodexElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const two = (value: number) => String(value).padStart(2, "0");
  return hours ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}

function codexProgressBubbleText(elapsedMs: number, detail: string): string {
  return [
    `Codex 已运行 ${formatCodexElapsed(elapsedMs)}`,
    detail || "等待 Codex CLI 事件…",
    "xhigh 深度分析可能需要 10–30 分钟；如果不想继续，可以点击“停止”。",
  ].join("\n");
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

function setTextByClass(root: HTMLElement, className: string, text: string): void {
  const found = root.getElementsByClassName
    ? root.getElementsByClassName(className)[0]
    : null;
  const compatible = found as (Element & { setText?: (value: string) => void; textContent?: string }) | undefined;
  if (typeof compatible?.setText === "function") compatible.setText(text);
  else if (compatible) compatible.textContent = text;
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
  runtimeMode: ModalRuntimeMode = "api";
  currentSessionId?: string;
  isSending = false;
  isCodexRunning = false;
  codexCloseIntent: CodexCloseIntent = "suspend";
  includeCurrentPdfInCodex = true;
  includeSelectionContextInCodex = true;
  abortController: AbortController | null = null;
  private codexUnsubscribe?: () => void;
  private codexTaskBubble?: BubbleElement;
  private codexTaskQuestion?: string;
  private codexProgressTimer?: ReturnType<typeof setInterval>;
  private lastCodexSnapshot?: CodexTurnSnapshot;
  private promptHistoryCursor: number | null = null;
  private promptHistoryDraft = "";

  zoomOutBtn!: HTMLButtonElement;
  zoomLabel!: HTMLButtonElement;
  zoomInBtn!: HTMLButtonElement;
  moreButton?: HTMLButtonElement;
  moreMenu?: HTMLElement;
  modeBadgeEl?: HTMLElement;
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
  referencedPdfsEl?: HTMLElement;
  composerCardEl?: HTMLElement;
  codexContextToggleBtn?: HTMLButtonElement;
  composerMentionSuggestionsEl?: HTMLElement;
  composerMentionRange?: ComposerMentionRange;
  private composerMentionCandidates: PaperSearchCandidate[] = [];
  private composerMentionActiveIndex = 0;
  commandMenuEl?: HTMLElement;
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
    this.includeSelectionContextInCodex = this.contextText.trim()
      ? true
      : this.plugin.settings.codexDeepAnalysis.includeSelectionContext === true;
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

    // this.messages 和 transcript 只保存用户实际看到的内容。全文/RAG 等隐藏上下文按轮构造，
    // 由 context-composer 在发送前统一裁剪，不能混入可恢复、可导出的聊天记录。
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
    const activeSession = this.startFresh
      ? null
      : this.services.conversations.getActiveSession?.(this.conversationKey) || null;
    this.currentSessionId = activeSession?.id;
    if (activeSession?.mode === "codex") {
      this.runtimeMode = "codex";
      if (activeSession.codex) {
        this.plugin.settings.codexDeepAnalysis.model = activeSession.codex.model;
        this.plugin.settings.codexDeepAnalysis.reasoningEffort = activeSession.codex.reasoningEffort;
        if (activeSession.codex.profile !== undefined) {
          this.plugin.settings.codexDeepAnalysis.profile = activeSession.codex.profile || "";
        }
      }
    }
    if (activeSession?.api) {
      if (activeSession.api.modelId && this.plugin.settings.models.some((model) => model.id === activeSession.api!.modelId)) {
        this.currentModelId = activeSession.api.modelId;
      }
      if (
        activeSession.api.presetId &&
        (activeSession.api.presetId === "__default__" ||
          this.plugin.settings.promptPresets.some((preset) => preset.id === activeSession.api!.presetId))
      ) {
        this.currentPresetId = activeSession.api.presetId;
      }
    }
    if (activeSession?.referencedPdfPaths?.length) {
      this.referencedPdfFiles = activeSession.referencedPdfPaths
        .map((path) => this.findPdfFileByPath(path))
        .filter((file): file is TFile => !!file);
    }
    this.includeCurrentPdfInCodex = activeSession?.includeCurrentPdfInCodex !== false;
    const existingTranscript = activeSession?.messages || this.services.conversations.get(this.conversationKey);
    this.hadExistingHistory = existingTranscript.length > 0;
    this.transcript = this.startFresh ? [] : existingTranscript;
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content })),
    ];
  }

  buildSystemMessage(selectionContext = this.contextText): LlmMessage {
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
    content += `\n\n【我当前选中并想讨论的原文片段】:\n${selectionContext}`;
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
    this.modeBadgeEl = header.modeBadge;
    this.modelSelect = header.modelSelect;
    this.modeSelect = header.modeSelect;
    this.zoomOutBtn = header.zoomOutButton;
    this.zoomLabel = header.zoomResetButton;
    this.zoomInBtn = header.zoomInButton;
    this.moreButton = header.moreButton;
    this.moreMenu = header.moreMenu;
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
    this.updateRuntimeModeUi();
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
    this.referencedPdfsEl = composer.references;
    this.codexContextToggleBtn = composer.contextToggle;
    this.inputEl = composer.input;
    this.sendBtn = composer.sendButton;
    this.updateComposerContextStatus();
    this.codexContextToggleBtn.addEventListener("click", () => this.toggleCodexSelectionContext());
    const submit = () => this.handleSubmit();
    this.sendBtn.addEventListener("click", () => {
      if (this.isSending) {
        this.stopGenerating();
      } else {
        submit();
      }
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (this.handleComposerMentionKey(evt)) return;
      if (this.handlePromptHistoryKey(evt)) return;
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    });
    this.inputEl.addEventListener("input", () => {
      if (this.promptHistoryCursor !== null) {
        this.promptHistoryCursor = null;
        this.promptHistoryDraft = "";
      }
      this.hideFollowupSuggestions();
      this.updateComposerMentionSuggestions();
    });
    this.setupCloseIntentHandling();
    if (restoringHistory) {
      void this.restoreConversationHistory()
        .catch((err) => {
          this.setHistoryLiveMode("polite");
          new Notice("恢复上次对话显示失败: " + errorMessage(err));
        })
        .finally(() => {
          if (this.currentSessionId) this.attachCodexRuntime(this.currentSessionId);
        });
    } else if (this.startFresh && this.hadExistingHistory) {
      new Notice("已开始新对话(发出第一条消息后会替换掉上次保存的记录)");
    } else if (this.currentSessionId) {
      this.attachCodexRuntime(this.currentSessionId);
    }
    if (this.autoTranslateOnOpen) this.handleTranslate();
    else this.inputEl.focus();
  }

  private setupCloseIntentHandling(): void {
    const closeButton = (this.modalEl.querySelector?.(".modal-close-button") ||
      this.containerEl?.querySelector?.(".modal-close-button")) as HTMLElement | null;
    closeButton?.addEventListener(
      "click",
      () => {
        this.codexCloseIntent = "terminate";
      },
      { capture: true }
    );
    this.scope?.register([], "Escape", () => {
      if (this.composerMentionSuggestionsEl) {
        this.hideComposerMentionSuggestions();
        return false;
      }
      if (this.commandMenuEl) {
        this.hideCommandMenu();
        return false;
      }
      if (this.moreMenu && !this.moreMenu.hasClass("is-hidden")) {
        this.moreButton?.click();
        return false;
      }
      this.codexCloseIntent = "suspend";
      this.close();
      return false;
    });
  }

  private getDocumentName(): string {
    if (!this.pdfFile) return "选区对话";
    return this.pdfFile.name || this.pdfFile.path.split(/[\\/]/).pop() || "选区对话";
  }

  private getCodexModel(): string {
    return (
      this.plugin.settings.codexDeepAnalysis.model ||
      DEFAULT_SETTINGS.codexDeepAnalysis.model
    );
  }

  private getCodexReasoningEffort(): CodexReasoningEffort {
    return (
      this.plugin.settings.codexDeepAnalysis.reasoningEffort ||
      DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort
    );
  }

  private getCodexVerbosity(): CodexVerbosity {
    return (
      this.plugin.settings.codexDeepAnalysis.verbosity ||
      DEFAULT_SETTINGS.codexDeepAnalysis.verbosity
    );
  }

  private getCodexInputMode(): CodexInputMode {
    const value = this.plugin.settings.codexDeepAnalysis.inputMode;
    return value === "debug-full" ? "debug-full" : "pdf-only";
  }

  private codexInputModeLabel(): string {
    const mode = this.getCodexInputMode();
    if (mode === "debug-full") return "Debug full";
    return "PDF-only";
  }

  private getCodexOutputMode(): CodexOutputMode {
    const value = this.plugin.settings.codexDeepAnalysis.outputMode;
    return value === "json-schema" ? "json-schema" : "markdown";
  }

  private codexOutputModeLabel(): string {
    return this.getCodexOutputMode() === "json-schema" ? "JSON schema" : "Markdown";
  }

  private codexMetaText(fallback = false): string {
    if (fallback) return "Codex CLI 不可用或失败，已改用当前 API 模型";
    const profile = this.plugin.settings.codexDeepAnalysis.profile || "default profile";
    const context = this.shouldAttachSelectionContext() ? "selection context on" : "selection context off";
    return `requested model: ${this.getCodexModel()} · effort: ${this.getCodexReasoningEffort()} · input: ${this.codexInputModeLabel()} · ${context} · output: ${this.codexOutputModeLabel()} · profile: ${profile}`;
  }

  private hasSelectionContext(): boolean {
    return !!(this.contextText || "").trim();
  }

  private shouldAttachSelectionContext(): boolean {
    return this.includeSelectionContextInCodex && this.hasSelectionContext();
  }

  private setCodexSelectionContextEnabled(value: boolean): void {
    this.includeSelectionContextInCodex = value;
    this.plugin.settings.codexDeepAnalysis.includeSelectionContext = value;
    this.saveSettingsInBackground();
    this.updateComposerContextStatus();
  }

  private toggleCodexSelectionContext(): void {
    if (!this.hasSelectionContext()) {
      new Notice("当前没有可附带的选区上下文。");
      this.updateComposerContextStatus();
      return;
    }
    this.setCodexSelectionContextEnabled(!this.includeSelectionContextInCodex);
  }

  private applyContextCommand(args: string): void {
    const value = args.trim().toLowerCase();
    if (!this.hasSelectionContext()) {
      new Notice("当前没有可附带的选区上下文。");
      this.updateComposerContextStatus();
      return;
    }
    if (!value) {
      this.toggleCodexSelectionContext();
      return;
    }
    if (["on", "true", "yes", "1", "with"].includes(value)) {
      this.setCodexSelectionContextEnabled(true);
      return;
    }
    if (["off", "false", "no", "0", "without"].includes(value)) {
      this.setCodexSelectionContextEnabled(false);
      return;
    }
    new Notice("用法：/context、/context on 或 /context off");
  }

  private updateCodexContextToggle(): void {
    if (!this.codexContextToggleBtn) return;
    const hasContext = this.hasSelectionContext();
    const enabled = this.includeSelectionContextInCodex;
    this.codexContextToggleBtn.disabled = !hasContext;
    this.codexContextToggleBtn.toggleClass("is-enabled", hasContext && enabled);
    this.codexContextToggleBtn.toggleClass("is-disabled", !hasContext || !enabled);
    const text = !hasContext ? "无选区" : enabled ? "附选区" : "不附选区";
    this.codexContextToggleBtn.setText(text);
    labelControl(
      this.codexContextToggleBtn,
      !hasContext
        ? "当前没有可附带的选区上下文"
        : enabled
          ? "Codex 会附带当前选区上下文，点击关闭"
          : "Codex 不附带当前选区上下文，点击开启"
    );
  }

  private updateRuntimeModeUi(): void {
    const codexMode = this.runtimeMode === "codex";
    this.contentEl.toggleClass("is-codex-mode", codexMode);
    this.modalEl.toggleClass("is-codex-mode", codexMode);
    if (this.modeBadgeEl) {
      const snapshot = this.lastCodexSnapshot;
      const persistedThread = this.currentSessionId
        ? this.services.conversations.getSession?.(this.currentSessionId)?.codex?.threadId
        : undefined;
      const threadId = snapshot?.threadId || persistedThread;
      const running =
        snapshot?.status === "running" && snapshot.startedAt
          ? ` · Running ${formatCodexElapsed(Date.now() - snapshot.startedAt)}`
          : "";
      this.modeBadgeEl.setText(
        codexMode
          ? `CODEX MODE · ${this.getCodexModel()} · ${this.getCodexReasoningEffort()}${threadId ? ` · Thread ${threadId.slice(0, 8)}…` : " · New thread"}${running}`
          : "API MODE"
      );
    }
    this.updateComposerContextStatus();
  }

  private enterCodexMode(): void {
    this.runtimeMode = "codex";
    this.activeComposerKind = "chat";
    this.plugin.settings.codexDeepAnalysis.enabled = true;
    this.saveSettingsInBackground();
    this.updateRuntimeModeUi();
    this.saveSessionMetadataInBackground();
  }

  private exitCodexMode(): void {
    this.runtimeMode = "api";
    this.updateRuntimeModeUi();
    this.saveSessionMetadataInBackground();
  }

  private clearComposerInput(): void {
    if (!this.inputEl) return;
    this.inputEl.value = "";
    if (this.inputEl.style) this.inputEl.style.height = "";
  }

  private rememberPromptHistory(raw: string): void {
    const text = raw.trim();
    if (!text) return;
    const history = Array.isArray(this.plugin.settings.promptHistory)
      ? [...this.plugin.settings.promptHistory]
      : [];
    if (history[history.length - 1] !== text) history.push(text);
    this.plugin.settings.promptHistory = history.slice(-100);
    this.promptHistoryCursor = null;
    this.promptHistoryDraft = "";
    this.saveSettingsInBackground();
  }

  private saveSettingsInBackground(): void {
    Promise.resolve(this.plugin.saveSettings()).catch(() => undefined);
  }

  private saveSessionMetadataInBackground(): void {
    const session = this.ensureCurrentSessionForWrite();
    if (session && this.services.conversations.saveSessionById) {
      Promise.resolve(
        this.services.conversations.saveSessionById(
          session.id,
          this.transcript,
          this.sessionMetadata()
        )
      ).catch(() => undefined);
      return;
    }
    if (!session && this.services.conversations.ensureSession) {
      try {
        const session = this.services.conversations.ensureSession(this.conversationKey, this.sessionMetadata());
        this.currentSessionId = session?.id || this.currentSessionId;
        this.saveSettingsInBackground();
      } catch (error) {
        void error;
      }
    }
  }

  private handlePromptHistoryKey(event: KeyboardEvent): boolean {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return false;
    if (this.composerMentionSuggestionsEl) return false;
    const history = this.plugin.settings.promptHistory || [];
    if (!history.length) return false;
    const value = this.inputEl.value || "";
    const selectionStart = typeof this.inputEl.selectionStart === "number" ? this.inputEl.selectionStart : value.length;
    const selectionEnd = typeof this.inputEl.selectionEnd === "number" ? this.inputEl.selectionEnd : selectionStart;
    if (selectionStart !== selectionEnd) return false;
    if (event.key === "ArrowUp" && value.slice(0, selectionStart).includes("\n")) return false;
    if (event.key === "ArrowDown" && value.slice(selectionEnd).includes("\n")) return false;
    event.preventDefault();
    if (event.key === "ArrowUp") {
      if (this.promptHistoryCursor === null) this.promptHistoryDraft = value;
      const next = this.promptHistoryCursor === null ? history.length - 1 : Math.max(0, this.promptHistoryCursor - 1);
      this.promptHistoryCursor = next;
      this.inputEl.value = history[next] || "";
    } else {
      if (this.promptHistoryCursor === null) return true;
      const next = this.promptHistoryCursor + 1;
      if (next >= history.length) {
        this.promptHistoryCursor = null;
        this.inputEl.value = this.promptHistoryDraft;
        this.promptHistoryDraft = "";
      } else {
        this.promptHistoryCursor = next;
        this.inputEl.value = history[next] || "";
      }
    }
    const caret = this.inputEl.value.length;
    if (typeof this.inputEl.setSelectionRange === "function") {
      this.inputEl.setSelectionRange(caret, caret);
    } else {
      this.inputEl.selectionStart = caret;
      this.inputEl.selectionEnd = caret;
    }
    return true;
  }

  private hideCommandMenu(): void {
    const removable = this.commandMenuEl as (HTMLElement & { remove?: () => void }) | undefined;
    if (typeof removable?.remove === "function") {
      removable.remove();
    } else if (this.commandMenuEl?.parentElement) {
      this.commandMenuEl.parentElement.removeChild(this.commandMenuEl);
    }
    this.commandMenuEl = undefined;
  }

  private showCommandMenu(
    label: string,
    options: Array<{ label: string; detail?: string; run: () => void | Promise<void> }>
  ): void {
    this.hideCommandMenu();
    const parent = this.composerCardEl || this.contentEl;
    const menu = parent.createDiv({
      cls: "pdf-chat-command-menu",
      attr: { role: "listbox", "aria-label": label },
    });
    if (!options.length) {
      menu.createDiv({ cls: "pdf-chat-command-empty", text: "没有可用选项" });
      this.commandMenuEl = menu;
      return;
    }
    for (const option of options) {
      const button = menu.createEl("button", {
        cls: "pdf-chat-command-option",
        attr: { type: "button", role: "option" },
      });
      button.createEl("span", { text: option.label, cls: "pdf-chat-command-option-label" });
      if (option.detail) {
        button.createEl("span", { text: option.detail, cls: "pdf-chat-command-option-detail" });
      }
      labelControl(button, option.label);
      button.addEventListener("click", () => {
        this.hideCommandMenu();
        void option.run();
      });
    }
    this.commandMenuEl = menu;
  }

  private applyCodexModel(model: string, reasoningEffort: string): boolean {
    const allowed = new Set(["minimal", "low", "medium", "high", "xhigh"]);
    const normalizedModel = model.trim();
    const normalizedEffort = reasoningEffort.trim();
    if (!normalizedModel || !allowed.has(normalizedEffort)) {
      new Notice("Codex 模型格式无效，请使用 /model <model> <minimal|low|medium|high|xhigh>");
      return false;
    }
    this.plugin.settings.codexDeepAnalysis.model = normalizedModel;
    this.plugin.settings.codexDeepAnalysis.reasoningEffort = normalizedEffort as CodexReasoningEffort;
    this.saveSettingsInBackground();
    this.updateRuntimeModeUi();
    this.saveSessionMetadataInBackground();
    new Notice(`Codex 模型已切换到 ${normalizedModel} · ${normalizedEffort}`);
    return true;
  }

  private showModelMenu(): void {
    if (this.runtimeMode === "codex") {
      const presets = this.plugin.settings.codexDeepAnalysis.modelPresets?.length
        ? this.plugin.settings.codexDeepAnalysis.modelPresets
        : DEFAULT_SETTINGS.codexDeepAnalysis.modelPresets;
      this.showCommandMenu(
        "选择 Codex 模型",
        presets.map((preset) => ({
          label: preset.label || `${preset.model} · ${preset.reasoningEffort}`,
          detail: "Codex CLI",
          run: () => {
            this.applyCodexModel(preset.model, preset.reasoningEffort);
          },
        }))
      );
      return;
    }
    this.showCommandMenu(
      "选择 PDF Chat API 模型",
      this.plugin.settings.models.map((model) => ({
        label: model.name || model.id,
        detail: model.model || model.id,
        run: () => this.applyModel(model.id),
      }))
    );
  }

  private applyModelCommand(args: string): void {
    const trimmed = args.trim();
    if (!trimmed) {
      this.showModelMenu();
      return;
    }
    if (this.runtimeMode === "codex") {
      const [model, effort = this.getCodexReasoningEffort()] = trimmed.split(/\s+/);
      this.applyCodexModel(model, effort);
      return;
    }
    const lower = trimmed.toLowerCase();
    const match = this.plugin.settings.models.find((model) =>
      [model.id, model.name, model.model].some((value) => String(value || "").toLowerCase() === lower)
    );
    if (!match) {
      new Notice("没有找到这个 API 模型，输入 /model 可从列表选择。");
      return;
    }
    this.applyModel(match.id);
  }

  private sessionMetadata(title?: string): {
    title: string;
    mode: "chat" | "codex";
    referencedPdfPaths: string[];
    includeCurrentPdfInCodex: boolean;
    api: ConversationSession["api"];
    codex?: ConversationSession["codex"];
  } {
    const fallbackTitle = title || this.transcript.find((message) => message.role === "user")?.content || this.getDocumentName();
    const existingCodex = this.currentSessionId
      ? this.services.conversations.getSession?.(this.currentSessionId)?.codex
      : undefined;
    return {
      title: fallbackTitle.slice(0, 80),
      mode: this.runtimeMode === "codex" ? "codex" : "chat",
      referencedPdfPaths: this.referencedPdfFiles.map((file) => file.path).filter(Boolean),
      includeCurrentPdfInCodex: this.includeCurrentPdfInCodex,
      api: { modelId: this.currentModelId, presetId: this.currentPresetId },
      codex:
        this.runtimeMode === "codex"
          ? {
              model: this.getCodexModel(),
              reasoningEffort: this.getCodexReasoningEffort(),
              profile: this.plugin.settings.codexDeepAnalysis.profile || "",
              threadId: existingCodex?.threadId,
              lifecycle: existingCodex?.lifecycle || "active",
            }
          : undefined,
    };
  }

  private ensureCurrentSessionForWrite(): ConversationSession | null {
    if (this.currentSessionId) {
      return this.services.conversations.getSession?.(this.currentSessionId) || ({
        id: this.currentSessionId,
      } as ConversationSession);
    }
    const metadata = this.sessionMetadata();
    const session = this.startFresh
      ? this.services.conversations.startSession?.(this.conversationKey, metadata)
      : this.services.conversations.ensureSession?.(this.conversationKey, metadata);
    this.currentSessionId = session?.id;
    return session || null;
  }

  private async startNewSession(): Promise<void> {
    this.codexUnsubscribe?.();
    this.codexUnsubscribe = undefined;
    const metadata = this.sessionMetadata(this.getDocumentName());
    if (metadata.codex) {
      metadata.codex = {
        model: metadata.codex.model,
        reasoningEffort: metadata.codex.reasoningEffort,
        profile: metadata.codex.profile,
        lifecycle: "active",
      };
    }
    const session = this.services.conversations.startSession?.(
      this.conversationKey,
      metadata
    );
    this.currentSessionId = session?.id;
    this.transcript = [];
    this.messages = [this.buildSystemMessage()];
    this.activeComposerKind = "chat";
    this.fullTextAttached = false;
    this.includeCurrentPdfInCodex = true;
    this.historyEl.empty();
    this.hideFollowupSuggestions();
    this.emptyStateEl = undefined;
    this.showEmptyState();
    if (this.currentSessionId) this.attachCodexRuntime(this.currentSessionId);
    await this.plugin.saveSettings();
    new Notice("已新建讨论，旧讨论可用 /resume 找回。");
  }

  private async resumeConversationSession(sessionId: string): Promise<void> {
    const session = this.services.conversations.resumeSession?.(sessionId);
    if (!session) {
      new Notice("没有找到这段历史讨论。");
      return;
    }
    this.currentSessionId = session.id;
    this.services.codex?.reactivateSession(session.id);
    if (session.conversationKey !== this.conversationKey && session.conversationKey.startsWith("pdf:")) {
      const targetPath = session.conversationKey.slice("pdf:".length);
      const targetFile = this.findPdfFileByPath(targetPath);
      if (!targetFile) {
        new Notice("这段会话对应的 PDF 已移动或不存在；聊天记录仍保留。");
        return;
      }
      await this.plugin.saveSettings();
      await this.app.workspace.getLeaf(false).openFile(targetFile);
      this.codexCloseIntent = "suspend";
      this.close();
      const paperContext: PaperContext = {
        app: this.app,
        file: targetFile,
        selectedText: "",
        conversationKey: session.conversationKey,
      };
      new PDFChatModal(this.app, this.plugin, paperContext, null, false, this.services).open();
      return;
    }
    this.runtimeMode = session.mode === "codex" ? "codex" : "api";
    if (session.codex) {
      this.plugin.settings.codexDeepAnalysis.model = session.codex.model;
      this.plugin.settings.codexDeepAnalysis.reasoningEffort = session.codex.reasoningEffort;
      this.plugin.settings.codexDeepAnalysis.profile = session.codex.profile || "";
    }
    if (session.api?.modelId && this.plugin.settings.models.some((model) => model.id === session.api!.modelId)) {
      this.currentModelId = session.api.modelId;
    }
    if (
      session.api?.presetId &&
      (session.api.presetId === "__default__" ||
        this.plugin.settings.promptPresets.some((preset) => preset.id === session.api!.presetId))
    ) {
      this.currentPresetId = session.api.presetId;
    }
    this.referencedPdfFiles = (session.referencedPdfPaths || [])
      .map((path) => this.findPdfFileByPath(path))
      .filter((file): file is TFile => !!file);
    this.includeCurrentPdfInCodex = session.includeCurrentPdfInCodex !== false;
    this.transcript = session.messages || [];
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content })),
    ];
    this.historyEl.empty();
    this.emptyStateEl = undefined;
    this.updateRuntimeModeUi();
    this.attachCodexRuntime(session.id);
    await this.plugin.saveSettings();
    await this.restoreConversationHistory();
  }

  private showResumeMenu(): void {
    const sessions = this.services.conversations.listSessions?.("") || [];
    const currentFirst = [...sessions].sort((left, right) => {
      const leftCurrent = left.conversationKey === this.conversationKey ? 1 : 0;
      const rightCurrent = right.conversationKey === this.conversationKey ? 1 : 0;
      return rightCurrent - leftCurrent || right.updatedAt - left.updatedAt;
    });
    const owner = this;
    class ResumeSessionSuggestModal extends FuzzySuggestModal<ConversationSession> {
      getItems(): ConversationSession[] {
        return currentFirst;
      }

      getItemText(session: ConversationSession): string {
        const path = session.conversationKey.replace(/^pdf:/, "");
        const mode = session.mode === "codex" ? "Codex" : "API";
        return `${session.title || path} · ${path} · ${mode}`;
      }

      onChooseItem(session: ConversationSession): void {
        void owner.resumeConversationSession(session.id);
      }
    }
    const picker = new ResumeSessionSuggestModal(this.app);
    picker.setPlaceholder("搜索标题、PDF 路径或 Codex/API 模式…");
    picker.open();
  }

  private showTasksMenu(): void {
    const tasks = this.services.codex?.listSnapshots() || [];
    type TaskItem = { task: CodexTurnSnapshot; session: ConversationSession | null };
    const items: TaskItem[] = tasks.map((task) => ({
      task,
      session: this.services.conversations.getSession?.(task.sessionId) || null,
    }));
    const owner = this;
    class CodexTaskSuggestModal extends FuzzySuggestModal<TaskItem> {
      getItems(): TaskItem[] {
        return items;
      }

      getItemText(item: TaskItem): string {
        const { task, session } = item;
        const state = task.status === "running" ? "运行中" : task.status === "failed" ? "失败" : "已中断";
        return `${session?.title || task.question || task.sessionId} · ${state}${task.progress ? ` · ${task.progress}` : ""}`;
      }

      onChooseItem(item: TaskItem): void {
        void owner.resumeConversationSession(item.task.sessionId);
      }
    }
    const picker = new CodexTaskSuggestModal(this.app);
    picker.setPlaceholder("搜索 Codex 后台任务…");
    picker.open();
  }

  private async retryCurrentCodexSave(): Promise<void> {
    if (!this.currentSessionId || !this.services.codex) {
      new Notice("当前没有可重新保存的 Codex 回答。");
      return;
    }
    try {
      const saved = await this.services.codex.retryPersistResult(this.currentSessionId);
      new Notice(saved ? "Codex 回答已重新保存。" : "当前没有待重新保存的 Codex 回答。");
    } catch (error) {
      new Notice(`重新保存失败：${errorMessage(error)}`);
    }
  }

  private async runCodexDoctor(runRealCheck: boolean): Promise<void> {
    if (!this.pdfFile) {
      new Notice("请先从一个 PDF 视图打开 PDF Chat，再运行 /doctor。");
      return;
    }
    let workingDirectory: string;
    try {
      workingDirectory = resolveCodexPdfLocation(this.app, this.pdfFile.path).workingDirectory;
    } catch (error) {
      new Notice(`Codex 本地路径检查失败：${errorMessage(error)}`);
      return;
    }
    if (runRealCheck) {
      const candidateWindow = this.contentEl.ownerDocument?.defaultView;
      const confirmFn = candidateWindow?.confirm?.bind(candidateWindow);
      if (
        !confirmFn?.(
          "真实 Codex 诊断会执行两次模型调用：先创建 thread，再 resume 同一个 thread。是否继续？"
        )
      ) {
        new Notice("已取消真实 Codex 诊断。");
        return;
      }
    }

    this.hideFollowupSuggestions();
    this.setSendingState(true);
    const bubble = this.addBubble("assistant", "正在检查 Codex CLI…", {
      loading: true,
      assistantAuthor: "Codex Doctor",
      assistantContext: runRealCheck ? "真实 thread/resume 诊断" : "免费本地诊断",
    });
    const settings = this.plugin.settings.codexDeepAnalysis;
    try {
      const version = await runCodexVersionCheck(settings.command, {
        workingDirectory,
        timeoutMs: 10000,
      });
      if (!runRealCheck) {
        bubble.removeClass("is-loading");
        setBubbleText(
          bubble,
          `Codex CLI 本地检查通过。\n\n- 版本：${version}\n- 命令：${settings.command}\n- 工作目录：${workingDirectory}\n- 未调用模型，未产生 Codex token 消耗。`
        );
        return;
      }
      setBubbleText(bubble, "Codex CLI 可用；正在验证新 thread 与原生 resume…");
      const result = await runCodexThreadDoctor({
        command: settings.command,
        workingDirectory,
        profile: settings.profile,
        model: settings.model,
        reasoningEffort: settings.reasoningEffort,
        verbosity: settings.verbosity,
        timeoutMs: Math.min(settings.timeoutMs, 180000),
      });
      bubble.removeClass("is-loading");
      setBubbleText(
        bubble,
        [
          "Codex CLI 真实诊断通过。",
          "",
          `- 版本：${version}`,
          `- 模型：${settings.model} · ${settings.reasoningEffort}`,
          `- Thread：${result.threadId}`,
          `- 首轮：${result.firstTurnMs} ms · ${result.firstReply}`,
          `- Resume：${result.resumeTurnMs} ms · ${result.resumeReply}`,
        ].join("\n")
      );
    } catch (error) {
      bubble.removeClass("is-loading");
      bubble.addClass("is-error");
      setBubbleText(bubble, `Codex 诊断失败：${errorMessage(error)}`);
    } finally {
      this.setSendingState(false);
      this.inputEl.focus();
    }
  }

  private showStatusMessage(): void {
    const refs = this.referencedPdfFiles.length
      ? this.referencedPdfFiles.map((file) => file.name || file.path).join("、")
      : "无";
    const codexSnapshot = this.currentSessionId
      ? this.services.codex?.getSnapshot(this.currentSessionId)
      : undefined;
    const session = this.currentSessionId
      ? this.services.conversations.getSession?.(this.currentSessionId)
      : undefined;
    const lines = [
      `当前模式：${this.runtimeMode === "codex" ? "Codex CLI" : "PDF Chat API"}`,
      `API 模型：${this.plugin.settings.models.find((model) => model.id === this.currentModelId)?.name || this.currentModelId}`,
      `Codex：${this.getCodexModel()} · ${this.getCodexReasoningEffort()} · ${this.plugin.settings.codexDeepAnalysis.profile || "default profile"}`,
      `引用 PDF：${refs}`,
      `选区上下文：${this.shouldAttachSelectionContext() ? `下一轮直接附带 ${this.contextText.length} 字` : "不附带"}`,
      `Session：${this.currentSessionId || "未创建"}`,
      `Codex Thread：${codexSnapshot?.threadId || session?.codex?.threadId || "尚未创建"}`,
      `Codex 状态：${codexSnapshot?.status || "idle"}`,
      `工作目录：${codexSnapshot?.workingDirectory || (this.pdfFile ? "当前 PDF 所在文件夹" : "vault 根目录")}`,
    ];
    this.addBubble("assistant", lines.join("\n"), {
      assistantAuthor: this.runtimeMode === "codex" ? "Codex Mode" : "PDF Chat",
      assistantContext: "状态",
      assistantClass: "is-status-message",
    });
  }

  private showHelpMessage(): void {
    this.addBubble(
      "assistant",
      [
        "支持的命令：",
        "- /codex：进入 Codex 模式",
        "- /codex <问题>：进入 Codex 模式并立即让 Codex 读取当前/引用 PDF",
        "- /exit：回到普通 API 聊天",
        "- /stop：停止当前 Codex turn，但保留 thread",
        "- /model：选择当前模式下的模型",
        "- /model <model> <effort>：切换 Codex 模型和推理强度",
        "- /new：新建讨论，不删除旧讨论",
        "- /resume：恢复历史讨论",
        "- /tasks：查看运行中、失败或中断的 Codex 后台任务",
        "- /retry-save：重新保存已经生成但写入失败的 Codex 回答",
        "- /doctor：免费检查 Codex 命令与版本；/doctor real 明确执行 thread/resume 真实诊断",
        "- /refs：查看并移除当前引用的 PDF",
        "- /unref <序号或名称>：移除某篇引用 PDF",
        "- /clearrefs：清空当前讨论引用的 PDF",
        "- /context：切换是否把当前选区作为 Codex 上下文",
        "- /context on|off：开启或关闭 Codex 选区上下文",
        "- /status：查看当前模式、模型、引用 PDF 和 session",
      ].join("\n"),
      {
        assistantAuthor: this.runtimeMode === "codex" ? "Codex Mode" : "PDF Chat",
        assistantContext: "帮助",
      }
    );
  }

  private async handleSlashCommand(question: string, usingOverride: boolean): Promise<boolean> {
    if (usingOverride || !question.startsWith("/")) return false;
    const match = /^\/([A-Za-z][\w-]*)(?:\s+([\s\S]*))?$/.exec(question.trim());
    if (!match) return false;
    const command = match[1].toLowerCase();
    const args = (match[2] || "").trim();
    switch (command) {
      case "codex":
        this.enterCodexMode();
        this.clearComposerInput();
        if (args) await this.runCodexDeepAnalysis(args);
        return true;
      case "exit":
        this.exitCodexMode();
        this.clearComposerInput();
        new Notice("已退出 Codex 模式，回到 PDF Chat API。");
        return true;
      case "stop":
        this.clearComposerInput();
        if (
          this.runtimeMode === "codex" &&
          this.currentSessionId &&
          this.services.codex?.stopTurn(this.currentSessionId)
        ) {
          new Notice("正在停止当前 Codex turn；thread 会保留，可继续追问。");
        } else {
          new Notice("当前没有正在运行的 Codex turn。");
        }
        return true;
      case "status":
        this.clearComposerInput();
        this.showStatusMessage();
        return true;
      case "help":
        this.clearComposerInput();
        this.showHelpMessage();
        return true;
      case "model":
        this.clearComposerInput();
        this.applyModelCommand(args);
        return true;
      case "new":
        this.clearComposerInput();
        await this.startNewSession();
        return true;
      case "resume":
        this.clearComposerInput();
        this.showResumeMenu();
        return true;
      case "tasks":
        this.clearComposerInput();
        this.showTasksMenu();
        return true;
      case "retry-save":
        this.clearComposerInput();
        await this.retryCurrentCodexSave();
        return true;
      case "doctor":
        this.clearComposerInput();
        await this.runCodexDoctor(args.toLowerCase() === "real");
        return true;
      case "refs":
        this.clearComposerInput();
        this.showReferencesMenu();
        return true;
      case "unref":
        this.clearComposerInput();
        this.applyUnrefCommand(args);
        return true;
      case "clearrefs":
        this.clearComposerInput();
        if (this.clearReferencedPdfs()) new Notice("已清空当前讨论引用的 PDF。");
        else new Notice("当前没有引用 PDF。");
        return true;
      case "context":
        this.clearComposerInput();
        this.applyContextCommand(args);
        return true;
      default:
        if (this.runtimeMode === "codex") {
          this.clearComposerInput();
          this.addBubble(
            "assistant",
            `当前插件暂不支持 Codex TUI 命令：/${command}。输入 /help 查看可用命令。`,
            { assistantAuthor: "Codex Mode", assistantContext: "命令未支持" }
          );
          return true;
        }
        return false;
    }
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
      new Notice("当前 PDF 已经作为 Codex 附件，无需重复添加。");
      return;
    }
    if (this.referencedPdfFiles.find((existing) => existing.path === file.path)) return;
    if (this.referencedPdfFiles.length >= 3) {
      new Notice("第一版最多额外引用 3 篇 PDF。");
      return;
    }
    this.referencedPdfFiles.push(file);
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
  }

  private removeReferencedPdfByPath(path: string): boolean {
    const before = this.referencedPdfFiles.length;
    this.referencedPdfFiles = this.referencedPdfFiles.filter((file) => file.path !== path);
    if (this.referencedPdfFiles.length === before) return false;
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
    return true;
  }

  private clearReferencedPdfs(): boolean {
    if (!this.referencedPdfFiles.length) return false;
    this.referencedPdfFiles = [];
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
    return true;
  }

  private setCurrentPdfCodexAttachment(enabled: boolean): void {
    if (!this.pdfFile) return;
    this.includeCurrentPdfInCodex = enabled;
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
  }

  private findReferencedPdf(query: string): TFile | null {
    const trimmed = query.trim();
    if (!trimmed) return null;
    const index = Number.parseInt(trimmed, 10);
    if (Number.isFinite(index) && String(index) === trimmed && index >= 1) {
      return this.referencedPdfFiles[index - 1] || null;
    }
    const lower = trimmed.toLowerCase();
    return (
      this.referencedPdfFiles.find((file) =>
        [file.name, file.path].some((value) => String(value || "").toLowerCase().includes(lower))
      ) || null
    );
  }

  private renderReferencedPdfChips(): void {
    if (!this.referencedPdfsEl) return;
    this.referencedPdfsEl.empty();
    const showCurrentPdfChip = this.runtimeMode === "codex" && !!this.pdfFile;
    this.referencedPdfsEl.toggleClass("is-empty", !showCurrentPdfChip && !this.referencedPdfFiles.length);
    if (showCurrentPdfChip && this.pdfFile) {
      const currentChip = this.referencedPdfsEl.createDiv({
        cls: `pdf-chat-reference-chip pdf-chat-current-pdf-chip${this.includeCurrentPdfInCodex ? "" : " is-detached"}`,
        attr: { role: "listitem" },
      });
      currentChip.createEl("span", {
        text: `${this.includeCurrentPdfInCodex ? "当前 PDF" : "未附当前 PDF"} · ${this.pdfFile.name || this.pdfFile.path}`,
        cls: "pdf-chat-reference-chip-label pdf-chat-current-pdf-label",
      });
      const currentButton = currentChip.createEl("button", {
        text: this.includeCurrentPdfInCodex ? "×" : "附上",
        cls: this.includeCurrentPdfInCodex
          ? "pdf-chat-reference-chip-remove pdf-chat-current-pdf-remove"
          : "pdf-chat-reference-chip-restore pdf-chat-current-pdf-restore",
        attr: { type: "button" },
      });
      labelControl(
        currentButton,
        this.includeCurrentPdfInCodex ? "本轮 Codex 不再附带当前 PDF" : "重新把当前 PDF 附给 Codex"
      );
      currentButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.setCurrentPdfCodexAttachment(!this.includeCurrentPdfInCodex);
      });
    }
    for (const [index, file] of this.referencedPdfFiles.entries()) {
      const chip = this.referencedPdfsEl.createDiv({
        cls: "pdf-chat-reference-chip",
        attr: { role: "listitem" },
      });
      chip.createEl("span", {
        text: file.name || file.path || `PDF ${index + 1}`,
        cls: "pdf-chat-reference-chip-label",
      });
      const removeButton = chip.createEl("button", {
        text: "×",
        cls: "pdf-chat-reference-chip-remove",
        attr: { type: "button" },
      });
      labelControl(removeButton, `移除引用 PDF：${file.name || file.path}`);
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.removeReferencedPdfByPath(file.path);
      });
    }
  }

  private showReferencesMenu(): void {
    this.showCommandMenu(
      "管理引用 PDF",
      this.referencedPdfFiles.map((file, index) => ({
        label: `${index + 1}. ${file.name || file.path}`,
        detail: "点击移除这个引用",
        run: () => {
          this.removeReferencedPdfByPath(file.path);
        },
      }))
    );
  }

  private applyUnrefCommand(args: string): void {
    const trimmed = args.trim();
    if (!trimmed) {
      this.showReferencesMenu();
      return;
    }
    const match = this.findReferencedPdf(trimmed);
    if (!match) {
      new Notice("没有找到匹配的引用 PDF。输入 /refs 可查看当前引用。");
      return;
    }
    this.removeReferencedPdfByPath(match.path);
    new Notice(`已移除引用：${match.name || match.path}`);
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
    this.composerMentionCandidates = results;
    this.composerMentionActiveIndex = 0;
    const parent = this.composerCardEl || this.contentEl;
    if (!this.composerMentionSuggestionsEl) {
      this.composerMentionSuggestionsEl = parent.createDiv({
        cls: "pdf-chat-composer-mention-suggestions",
        attr: { role: "listbox", "aria-label": "PDF mention suggestions" },
      });
    }
    this.composerMentionSuggestionsEl.empty();
    for (const [index, candidate] of results.entries()) {
      const button = this.composerMentionSuggestionsEl.createEl("button", {
        cls: "pdf-chat-composer-mention-option",
        attr: {
          type: "button",
          role: "option",
          "aria-selected": index === this.composerMentionActiveIndex ? "true" : "false",
        },
      });
      button.toggleClass("is-active", index === this.composerMentionActiveIndex);
      button.createEl("span", { text: candidate.name, cls: "pdf-chat-pdf-search-name" });
      button.createEl("span", {
        text: `${candidate.path}${candidate.cached ? " · 已有缓存" : ""}`,
        cls: "pdf-chat-pdf-search-path",
      });
      labelControl(button, `引用 ${candidate.name}`);
      button.addEventListener("click", () => this.chooseComposerMention(candidate.path));
    }
  }

  private updateComposerMentionActiveOption(): void {
    if (!this.composerMentionSuggestionsEl) return;
    const options = Array.from(this.composerMentionSuggestionsEl.children).filter((element) =>
      (element as HTMLElement).hasClass("pdf-chat-composer-mention-option")
    ) as HTMLElement[];
    for (const [index, option] of options.entries()) {
      const active = index === this.composerMentionActiveIndex;
      option.toggleClass("is-active", active);
      option.setAttr("aria-selected", active ? "true" : "false");
      if (active && typeof option.scrollIntoView === "function") {
        option.scrollIntoView({ block: "nearest" });
      }
    }
  }

  private handleComposerMentionKey(event: KeyboardEvent): boolean {
    if (!this.composerMentionSuggestionsEl || !this.composerMentionCandidates.length) return false;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.hideComposerMentionSuggestions();
      return true;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const count = this.composerMentionCandidates.length;
      this.composerMentionActiveIndex = (this.composerMentionActiveIndex + delta + count) % count;
      this.updateComposerMentionActiveOption();
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const candidate = this.composerMentionCandidates[this.composerMentionActiveIndex];
      if (candidate) this.chooseComposerMention(candidate.path);
      return true;
    }
    return false;
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
    this.composerMentionCandidates = [];
    this.composerMentionActiveIndex = 0;
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
    this.renderReferencedPdfChips();
    this.updateCodexContextToggle();
    const modePrefix = this.runtimeMode === "codex" ? "CODEX MODE · " : "";
    const referenceSuffix = this.referencedPdfFiles.length
      ? ` · 已引用 ${this.referencedPdfFiles.length} 篇论文`
      : "";
    const selectionSuffix =
      this.runtimeMode === "codex" && this.hasSelectionContext()
        ? this.shouldAttachSelectionContext()
          ? " · 附选区"
          : " · 不附选区"
        : "";
    if (!this.pdfFile) {
      this.composerStatusEl.setText(modePrefix + "选区上下文已启用" + referenceSuffix + selectionSuffix);
      return;
    }
    if (this.useRag && this.useFullTextMode) {
      this.composerStatusEl.setText(modePrefix + "全文上下文已启用" + referenceSuffix + selectionSuffix);
    } else if (this.useRag) {
      this.composerStatusEl.setText(modePrefix + "RAG 检索已启用" + referenceSuffix + selectionSuffix);
    } else if (this.useDocSummary) {
      this.composerStatusEl.setText(modePrefix + "摘要背景已启用" + referenceSuffix + selectionSuffix);
    } else {
      this.composerStatusEl.setText(modePrefix + "当前选区上下文已启用" + referenceSuffix + selectionSuffix);
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
      const session = this.ensureCurrentSessionForWrite();
      if (session && this.services.conversations.saveSessionById) {
        await this.services.conversations.saveSessionById(
          session.id,
          this.transcript,
          this.sessionMetadata()
        );
      } else {
        await this.services.conversations.save(this.conversationKey, this.transcript);
      }
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
      if (this.currentSessionId && this.services.conversations.clearSession) {
        await this.services.conversations.clearSession(this.currentSessionId);
      } else {
        await this.services.conversations.clear(this.conversationKey);
      }
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
      const weakExtraction = cached.extractionQuality?.quality === "poor";
      this.summaryStatusEl.setText(weakExtraction ? "摘要证据较弱" : "摘要已缓存");
      this.setChipState(this.summaryStatusEl, weakExtraction ? "pending" : "success");
      this.summaryStatusEl.setAttr(
        "aria-label",
        weakExtraction
          ? `PDF 文本提取较差，摘要可能不完整 · ${date.toLocaleString()} · 建议使用 Codex 直接阅读 PDF 或先做 OCR`
          : `摘要已缓存 · ${date.toLocaleString()}${truncatedNote}`
      );
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
      const weakExtraction = cached.extractionQuality?.quality === "poor";
      this.useFullTextMode = !weakExtraction && !!(cached.fullTextLength && cached.fullTextLength <= threshold);
      const date = new Date(cached.generatedAt);
      if (weakExtraction) {
        this.ragStatusEl.setText("文本提取较差");
        this.setChipState(this.ragStatusEl, "pending");
        this.ragStatusEl.setAttr(
          "aria-label",
          `PDF 文本提取较差，已禁用自动全文直读 · ${date.toLocaleString()} · 可尝试 RAG，建议使用 Codex 直接阅读 PDF 或先做 OCR`
        );
      } else if (this.useFullTextMode) {
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
    if (this.pdfFile && this.includeCurrentPdfInCodex) papers.push({ file: this.pdfFile, role: "current" });
    for (const file of this.referencedPdfFiles) papers.push({ file, role: "referenced" });
    return papers;
  }

  private getMultiPaperQuestion(): string {
    const typed = this.inputEl?.value?.trim();
    return typed || "请基于当前论文和已引用论文回答我的问题。";
  }

  private setAssistantBubbleMeta(bubble: HTMLDivElement, author: string, context: string): void {
    setTextByClass(bubble, "pdf-chat-message-author", author);
    setTextByClass(bubble, "pdf-chat-message-context", context);
  }

  private multiPaperUserLabel(question: string): string {
    const refs = this.referencedPdfFiles.map((file) => file.name || file.path).join("、");
    return refs ? `多论文问题：${question}\n\n引用论文：${refs}` : `多论文问题：${question}`;
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
    ].join("\n");
  }

  private requestSelectionDecision(request: { textLength: number; limit: number }): Promise<SelectionChoice> {
    return requestSelectionLimitDecision(this.app, request.textLength, request.limit);
  }

  private async resolveTurnSelection(): Promise<SelectionDecision> {
    const budget = this.plugin.settings.contextBudget || DEFAULT_SETTINGS.contextBudget;
    return resolveSelectionForTurn(
      this.contextText,
      budget.maxSelectionChars,
      (request) => this.requestSelectionDecision(request)
    );
  }

  private async composeApiContext(
    question: string,
    currentContext: string,
    selection: SelectionDecision
  ): Promise<ContextComposition> {
    const budget = this.plugin.settings.contextBudget || DEFAULT_SETTINGS.contextBudget;
    const session = this.currentSessionId
      ? this.services.conversations.getSession?.(this.currentSessionId)
      : this.services.conversations.getActiveSession?.(this.conversationKey);
    const system = this.buildSystemMessage(selection.text).content;
    const maxInputChars =
      selection.kind === "all" && selection.oversized
        ? Math.max(budget.maxInputChars, system.length + question.length + 2)
        : budget.maxInputChars;
    const compose = (memory?: string) => composeBoundedContext({
      system,
      transcript: this.transcript,
      currentUser: question,
      currentContext,
      memory,
      maxInputChars,
      minRecentTurns: budget.minRecentTurns,
    });
    const initial = compose();
    if (!initial.omittedMessageCount) return initial;
    if (session?.memory && session.memory.coveredMessageCount >= initial.omittedMessageCount) {
      return compose(session.memory.content);
    }

    try {
      const memory = await summarizeSessionMemory({
        transcript: this.transcript,
        coveredMessageCount: initial.omittedMessageCount,
        llm: this.services.llm,
        modelProfile: this.services.models.get(
          this.plugin.settings.summaryModelId || this.currentModelId
        ),
        signal: this.abortController?.signal,
      });
      const writableSession = session || this.ensureCurrentSessionForWrite();
      if (writableSession?.id && this.services.conversations.updateSessionMetadata) {
        await this.services.conversations.updateSessionMetadata(writableSession.id, { memory });
      }
      return compose(memory.content);
    } catch (error) {
      if (!isAbortError(error)) {
        new Notice("较早对话摘要生成失败，本轮仅携带最近对话。" + errorMessage(error));
      }
      return initial;
    }
  }

  private async completeApiMultiPaperAnswer(
    question: string,
    userLabel: string,
    bubble: HTMLDivElement,
    selectionOverride?: SelectionDecision
  ): Promise<void> {
    const currentContext = await this.buildApiMultiPaperContext(question, (message) => {
      this.multiPaperStatusEl?.setText(message);
      setBubbleText(bubble, message);
    });
    const selection = selectionOverride || (await this.resolveTurnSelection());
    if (selection.kind === "cancel") return;
    const composition = await this.composeApiContext(question, currentContext, selection);
    let fullText = "";
    let firstChunkArrived = false;
    fullText = await this.services.llm.chat({
      messages: composition.messages,
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

  private async prepareCodexPdfFiles(progress?: (message: string) => void): Promise<PreparedCodexPaper[]> {
    const prepared: PreparedCodexPaper[] = [];
    const usedIds = new Map<string, number>();
    for (const { file, role } of this.selectedPaperFiles()) {
      progress?.(`正在复制 ${file.name || file.path} 到 Codex 临时目录…`);
      const originalPdfBuffer = await this.app.vault.readBinary(file);
      const baseId = file.path || file.name || `paper-${prepared.length + 1}`;
      const seen = usedIds.get(baseId) || 0;
      usedIds.set(baseId, seen + 1);
      prepared.push({
        id: seen ? `${baseId}-${seen + 1}` : baseId,
        role,
        name: file.name || file.path,
        vaultPath: file.path,
        mtime: file.stat && file.stat.mtime,
        originalPdfData: new Uint8Array(originalPdfBuffer),
      });
    }
    return prepared;
  }

  private async prepareCodexTextAssets(progress?: (message: string) => void): Promise<PreparedCodexPaper[]> {
    const prepared: PreparedCodexPaper[] = [];
    const usedIds = new Map<string, number>();
    for (const { file, role } of this.selectedPaperFiles()) {
      progress?.(`正在抽取 ${file.name || file.path} 的全文、分页文本和缓存资产…`);
      const [pages, summary, chunksEntry, originalPdfBuffer] = await Promise.all([
        this.services.papers.extractPages(file),
        this.services.papers.getOrCreateDocSummary(file, false),
        this.services.papers.getOrCreateDocChunks(file, false),
        this.app.vault.readBinary(file),
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
        originalPdfData: new Uint8Array(originalPdfBuffer),
      });
    }
    return prepared;
  }

  async runCodexDeepAnalysis(questionOverride?: string): Promise<void> {
    if (!this.plugin.settings.codexDeepAnalysis.enabled) {
      new Notice("需要先在 PDF Chat 设置中启用 Codex CLI。");
      return;
    }
    if (this.isSending) return;
    const question = (questionOverride && questionOverride.trim()) || this.getMultiPaperQuestion();
    const selection: SelectionDecision = this.shouldAttachSelectionContext()
      ? await this.resolveTurnSelection()
      : { kind: "all", text: "", oversized: false };
    if (selection.kind === "cancel") return;
    if (this.getCodexInputMode() === "debug-full") {
      await this.runLegacyCodexDebugAnalysis(question, selection);
      return;
    }
    const runtime = this.services.codex;
    if (!runtime) {
      new Notice("Codex 会话管理器不可用，请重新加载插件。");
      return;
    }

    this.enterCodexMode();
    const session = this.ensureCurrentSessionForWrite();
    this.currentSessionId = session?.id || this.currentSessionId;
    if (!this.currentSessionId) {
      new Notice("无法创建 Codex 会话，请重新打开 PDF Chat。");
      return;
    }

    const papers = this.selectedPaperFiles().map(({ file, role }) => {
      const location = resolveCodexPdfLocation(this.app, file.path);
      return {
        role,
        name: file.name || file.path,
        absolutePath: location.absolutePath,
      };
    });
    const currentLocation = this.pdfFile
      ? resolveCodexPdfLocation(this.app, this.pdfFile.path)
      : null;
    const adapter = this.app.vault?.adapter as {
      getBasePath?: () => string;
    };
    const workingDirectory =
      currentLocation?.workingDirectory || adapter?.getBasePath?.() || ".";
    const selectedContext = selection.text;
    const prompt = buildCodexTurnPrompt({ question, papers, selectedContext });

    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.clearComposerInput();
    this.rememberPromptHistory(question);
    this.attachCodexRuntime(this.currentSessionId);
    void runtime
      .startTurn({
        sessionId: this.currentSessionId,
        question,
        userContent: question,
        prompt,
        command:
          this.plugin.settings.codexDeepAnalysis.command ||
          DEFAULT_SETTINGS.codexDeepAnalysis.command,
        workingDirectory,
        attachedPdfPaths: this.selectedPaperFiles().map(({ file }) => file.path),
        selectionChars: selectedContext.length,
        profile: this.plugin.settings.codexDeepAnalysis.profile || "",
        model: this.getCodexModel(),
        reasoningEffort: this.getCodexReasoningEffort(),
        verbosity:
          this.plugin.settings.codexDeepAnalysis.verbosity ||
          DEFAULT_SETTINGS.codexDeepAnalysis.verbosity,
        timeoutMs:
          this.plugin.settings.codexDeepAnalysis.timeoutMs ||
          DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs,
      })
      .catch((error) => {
        new Notice("Codex 启动失败: " + errorMessage(error));
      });
  }

  private async runLegacyCodexDebugAnalysis(
    questionOverride?: string,
    selectionOverride?: SelectionDecision
  ): Promise<void> {
    if (!this.pdfFile) {
      new Notice("Codex 深度分析需要从 PDF 视图打开。");
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
    this.isCodexRunning = true;
    const inputMode = this.getCodexInputMode();
    const loadingBubble = this.addBubble("assistant", `正在准备 Codex ${this.codexInputModeLabel()} 分析包…`, {
      loading: true,
      assistantAuthor: "Codex CLI",
      assistantContext: this.codexMetaText(),
      assistantClass: "is-codex-response",
    });
    this.abortController = new AbortController();
    let analysisDir = "";
    let codexTimeoutMs = DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs;
    let codexProgressTimer: ReturnType<typeof setInterval> | null = null;
    const codexStartedAt = Date.now();
    let codexProgressDetail = `正在准备 Codex ${this.codexInputModeLabel()} 分析包…`;
    const stopCodexProgressTimer = () => {
      if (!codexProgressTimer) return;
      clearInterval(codexProgressTimer);
      codexProgressTimer = null;
    };
    const updateCodexProgress = (detail?: string) => {
      if (detail) codexProgressDetail = detail;
      const elapsedMs = Date.now() - codexStartedAt;
      const bubbleText = codexProgressBubbleText(elapsedMs, codexProgressDetail);
      setBubbleText(loadingBubble, bubbleText);
      this.multiPaperStatusEl?.setText(`Codex 已运行 ${formatCodexElapsed(elapsedMs)} · ${codexProgressDetail}`);
    };

    try {
      const taskId = String(Date.now());
      const papers =
        inputMode === "debug-full"
          ? await this.prepareCodexTextAssets((message) => {
              this.multiPaperStatusEl?.setText(message);
              setBubbleText(loadingBubble, message);
            })
          : await this.prepareCodexPdfFiles((message) => {
              this.multiPaperStatusEl?.setText(message);
              setBubbleText(loadingBubble, message);
            });
      analysisDir = createCodexAnalysisTempDir(taskId);
      const packageRequest = {
        baseDir: analysisDir,
        taskId,
        createdAt: new Date().toISOString(),
        question,
        papers,
        selectedContext: selectionOverride?.text || "",
      };
      let selectedContextPath: string | undefined;
      if (inputMode === "debug-full") {
        const codexPackage = await writeCodexDebugFullPackage(packageRequest);
        selectedContextPath = codexPackage.selectedContextPath;
      } else {
        const codexPackage = await writeCodexAnalysisPackage(packageRequest);
        selectedContextPath = codexPackage.selectedContextPath;
      }
      const settings = this.plugin.settings.codexDeepAnalysis;
      codexTimeoutMs = settings.timeoutMs || DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs;
      const outputMode = this.getCodexOutputMode();
      if (outputMode === "json-schema" && inputMode !== "debug-full") writeCodexOutputSchema(analysisDir);
      const outputFileName = outputMode === "json-schema" ? "codex-output.json" : "codex-output.md";
      const execArgs = buildCodexExecArgs({
        analysisDir,
        command: settings.command || DEFAULT_SETTINGS.codexDeepAnalysis.command,
        profile: settings.profile,
        model: settings.model || DEFAULT_SETTINGS.codexDeepAnalysis.model,
        reasoningEffort: settings.reasoningEffort || DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort,
        verbosity: settings.verbosity || DEFAULT_SETTINGS.codexDeepAnalysis.verbosity,
        outputMode,
        outputFileName,
        prompt:
          outputMode === "json-schema"
            ? inputMode === "debug-full"
              ? buildCodexDebugFullPrompt()
              : buildCodexPdfOnlyPrompt(question, papers, { selectedContextPath })
            : inputMode === "debug-full"
              ? buildCodexDebugFullMarkdownPrompt()
              : buildCodexMarkdownPrompt(question, papers, { selectedContextPath }),
      });
      const runningMessage = `Codex 正在读取 ${papers.length} 篇 PDF${selectedContextPath ? " + 选区上下文" : ""} · ${this.codexInputModeLabel()} · ${this.codexOutputModeLabel()}…`;
      updateCodexProgress(runningMessage);
      codexProgressTimer = setInterval(() => updateCodexProgress(), 1000);
      const raw = await runCodexExec(execArgs, {
        timeoutMs: codexTimeoutMs,
        outputFileName,
        signal: this.abortController.signal,
        onProgress: (progress: CodexRunProgress) => {
          updateCodexProgress(progress.message);
        },
      });
      stopCodexProgressTimer();
      const markdown =
        outputMode === "json-schema"
          ? renderCodexAnalysisMarkdown(parseCodexAnalysisOutput(raw))
          : parseCodexMarkdownOutput(raw);
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, markdown);
      this.messages.push({ role: "user", content: userLabel }, { role: "assistant", content: markdown });
      await this.recordTranscriptTurn(userLabel, markdown, "complete");
      this.showFollowupSuggestions("chat");
      this.multiPaperStatusEl?.setText("Codex 深度分析已完成。");
    } catch (error) {
      stopCodexProgressTimer();
      loadingBubble.removeClass("is-loading");
      if (isAbortError(error)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, "Codex 深度分析已停止。");
        this.multiPaperStatusEl?.setText("Codex 深度分析已停止。");
      } else if (isCodexUnavailableError(error)) {
        this.setAssistantBubbleMeta(loadingBubble, "PDF Chat API", this.codexMetaText(true));
        setBubbleText(loadingBubble, "Codex CLI 不可用，正在改用当前模型基于多论文上下文回答…");
        this.multiPaperStatusEl?.setText("Codex 不可用，改用当前模型回答。");
        try {
          await this.completeApiMultiPaperAnswer(question, userLabel, loadingBubble, selectionOverride);
        } catch (fallbackError) {
          loadingBubble.removeClass("is-loading");
          loadingBubble.addClass("is-error");
          setBubbleText(loadingBubble, "多论文上下文回答也失败: " + errorMessage(fallbackError));
          this.multiPaperStatusEl?.setText("多论文上下文回答失败。");
        }
      } else if (isCodexTimeoutError(error)) {
        loadingBubble.addClass("is-error");
        setBubbleText(
          loadingBubble,
          `Codex 深度分析超过 ${formatCodexElapsed(codexTimeoutMs)} 后已停止。\n可能是 Codex 读取 PDF 或高强度推理耗时过长。可以切换到 /model gpt-5.5 medium，减少引用 PDF，或重试。`
        );
        this.multiPaperStatusEl?.setText(`Codex 超过 ${formatCodexElapsed(codexTimeoutMs)} 后停止。`);
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "Codex 深度分析失败: " + errorMessage(error));
        this.multiPaperStatusEl?.setText("Codex 深度分析失败，可改用当前模型回答。");
      }
    } finally {
      stopCodexProgressTimer();
      const keep = this.plugin.settings.codexDeepAnalysis.keepTempFiles;
      if (analysisDir && !keep) {
        try {
          removeCodexAnalysisTempDir(analysisDir);
        } catch (error) {
          void error;
        }
      }
      this.setSendingState(false);
      this.isCodexRunning = false;
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
    if (
      this.isCodexRunning &&
      this.currentSessionId &&
      this.services.codex?.stopTurn(this.currentSessionId)
    ) {
      return;
    }
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

  private stopCodexUiTimer(): void {
    if (!this.codexProgressTimer) return;
    clearInterval(this.codexProgressTimer);
    this.codexProgressTimer = undefined;
  }

  private updateCodexProgressBubble(snapshot: CodexTurnSnapshot): void {
    if (!this.codexTaskBubble || snapshot.status !== "running") return;
    const elapsed = snapshot.startedAt ? Date.now() - snapshot.startedAt : 0;
    setBubbleText(
      this.codexTaskBubble,
      `Codex 正在运行 ${formatCodexElapsed(elapsed)}\n${snapshot.progress || "正在等待 Codex CLI 事件…"}`
    );
    this.setAssistantBubbleMeta(
      this.codexTaskBubble,
      "Codex CLI",
      `${this.getCodexModel()} · ${this.getCodexReasoningEffort()} · Thread ${snapshot.threadId || "starting"}`
    );
    this.multiPaperStatusEl?.setText(
      `Codex ${snapshot.threadId ? `Thread ${snapshot.threadId.slice(0, 8)}…` : "正在启动"} · ${formatCodexElapsed(elapsed)}`
    );
    if (this.modeBadgeEl) {
      this.modeBadgeEl.setText(
        `CODEX MODE · ${this.getCodexModel()} · ${this.getCodexReasoningEffort()} · ${snapshot.threadId ? `Thread ${snapshot.threadId.slice(0, 8)}…` : "New thread"} · Running ${formatCodexElapsed(elapsed)}`
      );
    }
  }

  private async applyCodexSnapshot(snapshot: CodexTurnSnapshot): Promise<void> {
    if (snapshot.sessionId !== this.currentSessionId) return;
    this.lastCodexSnapshot = snapshot;
    if (snapshot.status === "running") {
      this.isCodexRunning = true;
      this.setSendingState(true);
      this.hideFollowupSuggestions();
      if (!this.codexTaskBubble || this.codexTaskQuestion !== snapshot.question) {
        this.emptyStateEl?.remove();
        this.emptyStateEl = undefined;
        if (snapshot.question) this.addBubble("user", snapshot.question);
        this.codexTaskQuestion = snapshot.question;
        this.codexTaskBubble = this.addBubble("assistant", "Codex 正在启动…", {
          loading: true,
          assistantAuthor: "Codex CLI",
          assistantContext: this.codexMetaText(),
          assistantClass: "is-codex-response",
        });
      }
      this.updateCodexProgressBubble(snapshot);
      if (!this.codexProgressTimer) {
        this.codexProgressTimer = setInterval(() => {
          if (this.lastCodexSnapshot) this.updateCodexProgressBubble(this.lastCodexSnapshot);
        }, 1000);
      }
      return;
    }

    this.stopCodexUiTimer();
    this.isCodexRunning = false;
    this.setSendingState(false);
    this.updateRuntimeModeUi();
    if (snapshot.finalMarkdown) {
      const session = this.services.conversations.getSession?.(snapshot.sessionId);
      if (session) {
        this.transcript = [...session.messages];
        this.messages = [
          this.buildSystemMessage(),
          ...this.transcript.map((message) => ({ role: message.role, content: message.content })),
        ];
      }
      const alreadyVisible =
        !this.codexTaskBubble &&
        this.transcript[this.transcript.length - 1]?.role === "assistant" &&
        this.transcript[this.transcript.length - 1]?.content === snapshot.finalMarkdown;
      if (!alreadyVisible) {
        const bubble =
          this.codexTaskBubble ||
          this.addBubble("assistant", "", {
            assistantAuthor: "Codex CLI",
            assistantContext: this.codexMetaText(),
            assistantClass: "is-codex-response",
          });
        bubble.removeClass("is-loading", "is-error", "is-stopped");
        bubble.addClass("is-rendered");
        this.setAssistantBubbleMeta(
          bubble,
          "Codex CLI",
          `${this.getCodexModel()} · ${this.getCodexReasoningEffort()} · Thread ${snapshot.threadId || "unknown"}`
        );
        await renderMarkdownIntoBubble(this.app, this.plugin, bubble, snapshot.finalMarkdown);
      }
      this.multiPaperStatusEl?.setText("Codex 本轮回答已完成。");
      this.showFollowupSuggestions("chat");
    } else if (snapshot.status === "failed" || snapshot.status === "stopped") {
      const bubble =
        this.codexTaskBubble ||
        this.addBubble("assistant", "", {
          assistantAuthor: "Codex CLI",
          assistantContext: this.codexMetaText(),
          assistantClass: "is-codex-response",
        });
      bubble.removeClass("is-loading");
      bubble.addClass(snapshot.status === "failed" ? "is-error" : "is-stopped");
      setBubbleText(
        bubble,
        snapshot.status === "failed"
          ? `Codex 本轮失败：${snapshot.error || snapshot.progress || "未知错误"}`
          : snapshot.progress || "Codex 本轮已停止，可继续使用同一 thread 提问。"
      );
      this.multiPaperStatusEl?.setText(snapshot.progress || "Codex 本轮已停止。");
    }
    this.codexTaskBubble = undefined;
    this.codexTaskQuestion = undefined;
    this.inputEl?.focus();
  }

  private attachCodexRuntime(sessionId: string): void {
    const runtime = this.services.codex;
    if (!runtime) return;
    this.codexUnsubscribe?.();
    this.codexUnsubscribe = runtime.subscribe(sessionId, (snapshot) => {
      void this.applyCodexSnapshot(snapshot);
    });
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

    if (!usingOverride) this.rememberPromptHistory(question);

    if (await this.handleSlashCommand(question, usingOverride)) {
      return;
    }
    if (this.isSending) {
      new Notice("上一个问题还在生成中,请稍候或点击停止");
      return;
    }

    if (!usingOverride && this.runtimeMode === "codex") {
      await this.runCodexDeepAnalysis(question);
      return;
    }

    if (this.activeComposerKind === "translate" && this.translateTranscript.length) {
      await this.handleTranslateFollowup(question, usingOverride);
      return;
    }

    const selection = await this.resolveTurnSelection();
    if (selection.kind === "cancel") return;

    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.addBubble("user", question);
    if (!usingOverride) {
      this.inputEl.value = "";
      if (this.inputEl.style) this.inputEl.style.height = "";
    }
    this.setSendingState(true);

    const loadingBubble = this.addBubble("assistant", "思考中…", { loading: true });
    const abortController = new AbortController();
    this.abortController = abortController;

    let currentContext = opts.outgoingContentOverride || "";
    if (opts.outgoingContentOverride) {
      // 外部任务已经构造好了发送给模型的上下文；界面仍只显示用户可见问题。
    } else if (opts.skipContextAugmentation) {
      // 跳过下面的 RAG/全文拼接逻辑,原样发送。
    } else if (this.referencedPdfFiles.length) {
      setBubbleText(loadingBubble, "正在准备多论文上下文…");
      try {
        currentContext = await this.buildApiMultiPaperContext(question, (message) => {
          this.multiPaperStatusEl?.setText(message);
          setBubbleText(loadingBubble, message);
        });
      } catch (err) {
        new Notice("多论文上下文准备失败，已退回当前问题: " + errorMessage(err));
        currentContext = "";
      }
      setBubbleText(loadingBubble, "思考中…");
    } else if (this.useRag && this.useFullTextMode && this.pdfFile) {
      // 全文是本轮的隐藏证据，不进入可见历史。每轮发送前由上下文预算统一裁剪。
      setBubbleText(loadingBubble, "正在读取全文…");
      try {
        if (!this.fullTextForQA) {
          this.fullTextForQA = await this.services.papers.extractFullText(this.pdfFile);
        }
        currentContext = "【论文全文】:\n" + this.fullTextForQA;
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
        currentContext =
          "【从全文中按关键词检索到的可能相关片段(不一定完全准确,仅供参考)】:\n" +
          retrievedText;
      }
      setBubbleText(loadingBubble, "思考中…");
    }

    const composition = await this.composeApiContext(question, currentContext, selection);
    if (composition.currentInputTruncated) {
      new Notice("本轮论文上下文超过输入预算，已保留问题并截取可发送的上下文。");
    }
    this.messages.push({ role: "user", content: question });
    let fullText = "";
    let firstChunkArrived = false;

    try {
      fullText = await this.services.llm.chat({
        messages: composition.messages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          setBubbleText(loadingBubble, acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: abortController.signal,
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
      compatibleBubble.setAttr("aria-label", role === "user" ? "你的消息" : `${opts.assistantAuthor || "PDF Chat"} 的消息`);
    } else if (typeof compatibleBubble.setAttribute === "function") {
      compatibleBubble.setAttribute("aria-label", role === "user" ? "你的消息" : `${opts.assistantAuthor || "PDF Chat"} 的消息`);
    }
    if (opts && opts.loading) bubble.addClass("is-loading");
    if (opts.assistantClass) bubble.addClass(opts.assistantClass);
    if (!canCreateBubbleChildren(bubble)) {
      setBubbleText(bubble, text);
    } else if (role === "assistant") {
      const meta = createBubbleDiv(bubble, { cls: "pdf-chat-message-meta" });
      meta.createEl("span", { text: opts.assistantAuthor || "PDF Chat", cls: "pdf-chat-message-author" });
      meta.createEl("span", {
        text: opts.assistantContext || "基于当前论文上下文",
        cls: "pdf-chat-message-context",
      });
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
    this.codexUnsubscribe?.();
    this.codexUnsubscribe = undefined;
    this.stopCodexUiTimer();
    const terminateCodex =
      this.codexCloseIntent === "terminate" &&
      this.runtimeMode === "codex" &&
      !!this.currentSessionId;
    if (terminateCodex && this.currentSessionId) {
      void this.services.codex?.closeSession(this.currentSessionId);
      new Notice("Codex 会话已关闭；历史与 thread 已保留，可通过 /resume 找回。");
    } else if (this.isCodexRunning) {
      new Notice("Codex 仍在后台运行，完成后会保存到当前会话；稍后重新打开即可查看结果。");
    } else {
      this.stopGenerating();
    }
    // 只在这次会话确实产生过消息时才回写存储:避免“新开对话”模式下,用户什么都没问就
    // 直接关闭弹窗,却因为 this.transcript 一开始就是空数组而把上次保存的记录误清空。
    if (this.transcript.length && !terminateCodex && !this.isCodexRunning) {
      void this.persistConversation();
    }
    if (this.translateTranscript.length) {
      void this.persistTranslationConversation();
    }
    this.contentEl.empty();
  }
}
