import { Notice, Plugin, type App, type TFile } from "obsidian";

import { ActionRegistry, createResearchActionRegistry } from "./actions";
import { DEFAULT_SETTINGS } from "./default-settings";
import { CodexSessionManager } from "./codex-session-manager";
import {
  cleanSelectionText,
  ConversationStore,
  getConversationKey,
  normalizeConversationMessages,
} from "./conversation";
import { OpenAICompatibleTransport } from "./llm-transport";
import { resolveContinueModelId, resolveTranslateModelId } from "./model-routing";
import { getActivePdfFile, PaperContextService } from "./paper-context";
import { createPDFChatModalServices } from "./modal-services";
import { PDFChatModal } from "./pdf-chat-modal";
import {
  QuickTranslateMarker,
  type QuickTranslateOpenRequest,
} from "./quick-translate-marker";
import { enqueueSettingsSave, migrateSettings } from "./settings";
import { PDFChatSettingTab } from "./settings-tab";
import { TranslationService } from "./translation";
import {
  reconcilePdfDeleteState,
  reconcilePdfRenameState,
  VaultLifecycleService,
} from "./vault-lifecycle";
import type {
  ConversationMessage,
  ConversationKind,
  DocChunksEntry,
  DocSummaryEntry,
  LlmCompatibilityOptions,
  LlmMessage,
  LlmRequest,
  ModelProfile,
  PDFChatModalServices,
  PDFChatPluginApi,
  PDFChatSettings,
  PdfChunk,
  TranslationOperations,
} from "./types";

export {
  ActionRegistry,
  createCompatibilityActionRegistry,
  createResearchActionRegistry,
  ResearchActionRegistry,
} from "./actions";
export {
  cleanSelectionText,
  ConversationStore,
  getConversationKey,
  normalizeConversationHistories,
  normalizeConversationSessions,
  normalizeConversationMessages,
  stableConversationHash,
} from "./conversation";
export {
  buildCodexThreadExecArgs,
  buildCodexTurnPrompt,
  isCodexThreadUnavailableError,
  resolveCodexPdfLocation,
  runCodexThreadDoctor,
  runCodexThreadTurn,
  runCodexVersionCheck,
} from "./codex-cli";
export { CodexSessionManager } from "./codex-session-manager";
export { DEFAULT_SETTINGS, LEGACY_0_4_0_TRANSLATE_PROMPT } from "./default-settings";
export { OpenAICompatibleTransport } from "./llm-transport";
export { resolveContinueModelId, resolveTranslateModelId } from "./model-routing";
export {
  bm25Retrieve,
  bm25RetrieveMulti,
  chunkPdfPages,
  expandWithNeighbors,
  extractPdfFullText,
  extractPdfPages,
  PaperContextService,
  tokenizeForBM25,
} from "./paper-context";
export {
  buildCodexDeepAnalysisPrompt,
  buildCodexDebugFullMarkdownPrompt,
  buildCodexDebugFullPrompt,
  buildCodexExecArgs,
  buildCodexMarkdownPrompt,
  buildCodexPdfOnlyPrompt,
  codexAnalysisOutputSchema,
  createCodexAnalysisTempDir,
  extractCodexMarkdownAnalysis,
  parseCodexAnalysisOutput,
  parseCodexMarkdownOutput,
  renderCodexAnalysisMarkdown,
  removeCodexAnalysisTempDir,
  resolveCodexExecArgs,
  runCodexExec,
  searchPdfFiles,
  writeCodexAnalysisPackage,
  writeCodexDebugFullPackage,
  writeCodexOutputSchema,
  writeCodexPdfOnlyPackage,
} from "./multi-paper";
export { createPDFChatModalServices } from "./modal-services";
export { PDFChatModal } from "./pdf-chat-modal";
export { QuickTranslateMarker } from "./quick-translate-marker";
export { migrateSettings, normalizeCodexInputMode, normalizeCodexOutputMode, normalizeRagChunkSettings } from "./settings";
export { buildTranslationMessages, splitTranslationChunks, TranslationService } from "./translation";
export { reconcilePdfDeleteState, reconcilePdfRenameState, VaultLifecycleService } from "./vault-lifecycle";
export type { LlmRequest, PaperContext, ResearchAction } from "./types";

function nodeInsideElement(container: HTMLElement, node: Node | null | undefined): boolean {
  if (!node) return false;
  const candidate = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !!candidate && container.contains(candidate);
}

function getActivePdfViewContainer(app: { workspace?: { activeLeaf?: unknown } }): HTMLElement | null {
  const leaf = app.workspace?.activeLeaf as
    | {
        view?: {
          getViewType?: () => string;
          containerEl?: HTMLElement;
          contentEl?: HTMLElement;
        };
        containerEl?: HTMLElement;
      }
    | null
    | undefined;
  const view = leaf?.view;
  if (!view || typeof view.getViewType !== "function" || view.getViewType() !== "pdf") return null;
  return view.containerEl || view.contentEl || leaf?.containerEl || null;
}

function isSelectionInsideActivePdfView(app: App, selection: Selection, doc: Document): boolean {
  if (!getActivePdfFile(app)) return false;
  const container = getActivePdfViewContainer(app);
  if (!container || container.ownerDocument !== doc) return false;
  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (anchorNode || focusNode) {
    return nodeInsideElement(container, anchorNode) && nodeInsideElement(container, focusNode);
  }
  if (selection.rangeCount > 0) {
    const ancestor = selection.getRangeAt(selection.rangeCount - 1).commonAncestorContainer;
    return nodeInsideElement(container, ancestor);
  }
  return false;
}

export default class PDFChatPlugin extends Plugin implements PDFChatPluginApi {
  declare settings: PDFChatSettings;
  _saveQueue: Promise<void> = Promise.resolve();
  conversationStore?: ConversationStore;
  llmTransport?: OpenAICompatibleTransport;
  paperContextService?: PaperContextService;
  translationService?: TranslationOperations;
  actionRegistry?: ActionRegistry;
  modalServices?: PDFChatModalServices;
  quickTranslateMarker?: QuickTranslateMarker;
  codexSessionManager?: CodexSessionManager;
  vaultLifecycleService?: VaultLifecycleService;
  private codexGlobalUnsubscribe?: () => void;
  private readonly codexRunningSessionIds = new Set<string>();

  async onload(): Promise<void> {
    this._saveQueue = Promise.resolve();
    await this.loadSettings();
    this.conversationStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    this.codexSessionManager = new CodexSessionManager(this.conversationStore);
    this.codexGlobalUnsubscribe = this.codexSessionManager.subscribeAll(
      ({ snapshot, hasSessionSubscribers }) => {
        if (snapshot.status === "running") {
          this.codexRunningSessionIds.add(snapshot.sessionId);
          return;
        }
        if (!this.codexRunningSessionIds.delete(snapshot.sessionId)) return;
        if (hasSessionSubscribers || !["idle", "failed", "stopped"].includes(snapshot.status)) return;
        const session = this.conversationStore?.getSession(snapshot.sessionId);
        const title = session?.title || snapshot.question || "Codex 任务";
        if (snapshot.status === "idle") {
          new Notice(`Codex 已完成：${title}`);
        } else if (snapshot.status === "stopped") {
          new Notice(`Codex 已停止：${title}`);
        } else {
          new Notice(`Codex 任务失败：${title}`);
        }
      }
    );
    this.llmTransport = new OpenAICompatibleTransport(
      () => this.settings,
      (id) => this.getModelProfile(id)
    );
    this.paperContextService = new PaperContextService(
      this.app,
      () => this.settings,
      () => this.saveSettings(),
      this.llmTransport,
      (id) => this.getModelProfile(id)
    );
    this.translationService = new TranslationService(this.llmTransport);
    this.actionRegistry = createResearchActionRegistry();
    if (this.app?.vault && typeof this.app.vault.on === "function") {
      this.vaultLifecycleService = new VaultLifecycleService(
        this.app.vault,
        () => this.settings,
        (settings) => {
          this.settings = settings;
        },
        () => this.saveSettings()
      );
      this.vaultLifecycleService.attach((event) => this.registerEvent(event));
    }
    this.modalServices = createPDFChatModalServices(this, {
      conversations: {
        getKey: (file, selectedText, kind) => getConversationKey(file, selectedText, kind),
        get: (key) => this.conversationStore!.get(key),
        save: (key, messages) => this.conversationStore!.save(key, messages),
        clear: (key) => this.conversationStore!.clear(key),
        getActiveSession: (key) => this.conversationStore!.getActiveSession(key),
        ensureSession: (key, metadata) => this.conversationStore!.ensureSession(key, metadata),
        startSession: (key, metadata) => this.conversationStore!.startSession(key, metadata),
        saveActiveSession: (key, messages, metadata) =>
          this.conversationStore!.saveActiveSession(key, messages, metadata),
        getSession: (id) => this.conversationStore!.getSession(id),
        saveSessionById: (id, messages, metadata) =>
          this.conversationStore!.saveSessionById(id, messages, metadata),
        appendSessionTurn: (id, userContent, assistantContent) =>
          this.conversationStore!.appendSessionTurn(id, userContent, assistantContent),
        updateSessionMetadata: (id, metadata) =>
          this.conversationStore!.updateSessionMetadata(id, metadata),
        beginCodexTurn: (id, pendingTurn) => this.conversationStore!.beginCodexTurn(id, pendingTurn),
        updateCodexTurn: (id, turnId, patch, codex) =>
          this.conversationStore!.updateCodexTurn(id, turnId, patch, codex),
        completeCodexTurn: (id, turnId, userContent, assistantContent, codex) =>
          this.conversationStore!.completeCodexTurn(
            id,
            turnId,
            userContent,
            assistantContent,
            codex
          ),
        clearSession: (id) => this.conversationStore!.clearSession(id),
        closeSession: (id) => this.conversationStore!.closeSession(id),
        resumeSession: (id) => this.conversationStore!.resumeSession(id),
        listSessions: (query) => this.conversationStore!.listSessions(query),
      },
      papers: {
        getOrCreateDocSummary: (file, forceRefresh) =>
          this.paperContextService!.getOrCreateDocSummary(file, forceRefresh),
        getOrCreateDocChunks: (file, forceRefresh) =>
          this.paperContextService!.getOrCreateDocChunks(file, forceRefresh),
        extractPages: (file) => this.paperContextService!.extractPages(file),
        extractFullText: (file) => this.paperContextService!.extractFullText(file),
        planRagQueries: (question) => this.paperContextService!.planRagQueries(question),
        retrieveContext: (chunks, queries, topK) =>
          this.paperContextService!.retrieveContext(chunks, queries, topK),
      },
      llm: { chat: (request) => this.llmTransport!.chat(request) },
      models: {
        get: (id) => this.getModelProfile(id),
        resolveTranslateId: () => this.resolveTranslateModelId(),
        resolveContinueId: () => this.resolveContinueModelId(),
      },
      actions: this.actionRegistry,
      translations: this.translationService,
      codex: this.codexSessionManager,
    });
    this.addSettingTab(new PDFChatSettingTab(this.app, this));

    this.addCommand({
      id: "ask-about-selection",
      name: "针对选中内容提问,新开对话 (PDF Chat)",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "Q" }],
      callback: () => this.openChatModal(true),
    });

    this.addCommand({
      id: "continue-conversation",
      name: "针对选中内容提问,继续上次对话 (PDF Chat)",
      hotkeys: [{ modifiers: ["Mod"], key: "Q" }],
      callback: () => this.openChatModal(false),
    });

    this.quickTranslateMarker = new QuickTranslateMarker({
      isEnabled: () => this.settings.quickTranslateMarkerEnabled,
      getActivePdfFile: () => getActivePdfFile(this.app),
      isSelectionInsideActivePdf: (selection, doc) =>
        isSelectionInsideActivePdfView(this.app, selection, doc),
      openModal: (request) => this.openQuickTranslateModal(request),
    });
    if (typeof document !== "undefined") this.quickTranslateMarker.attach(document);
    const workspace = this.app?.workspace;
    workspace?.onLayoutReady(() => {
      const windowOpenRef = workspace.on("window-open", (workspaceWindow) => {
        if (workspaceWindow?.doc) this.quickTranslateMarker?.attach(workspaceWindow.doc);
      });
      const windowCloseRef = workspace.on("window-close", (workspaceWindow) => {
        if (workspaceWindow?.doc) this.quickTranslateMarker?.detach(workspaceWindow.doc);
      });
      const activeLeafRef = workspace.on("active-leaf-change", () => {
        this.quickTranslateMarker?.hide();
      });
      this.registerEvent(windowOpenRef);
      this.registerEvent(windowCloseRef);
      this.registerEvent(activeLeafRef);
    });
  }

  onunload(): void {
    this.codexGlobalUnsubscribe?.();
    this.codexGlobalUnsubscribe = undefined;
    this.codexRunningSessionIds.clear();
    this.codexSessionManager?.dispose();
    this.codexSessionManager = undefined;
    this.vaultLifecycleService = undefined;
    this.quickTranslateMarker?.destroy();
    this.quickTranslateMarker = undefined;
  }

  // startFresh=true: 新开一份对话,不加载这个 PDF(或选区)之前保存的记录;
  // startFresh=false: 加载并接续之前保存的记录(如果有)。两个快捷键共用同一段取选中文字的逻辑。
  openChatModal(startFresh: boolean): void {
    const win = activeWindow || window;
    const sel = win.getSelection ? win.getSelection() : null;
    const raw = sel ? sel.toString() : "";
    const text = cleanSelectionText(raw || "");
    const pdfFile = getActivePdfFile(this.app);

    if (!text && !pdfFile) {
      new Notice("没有检测到选中的文字,请先划选一段内容再按快捷键");
      return;
    }

    const paperContext = this.paperContextService!.createContext(
      pdfFile,
      text,
      getConversationKey(pdfFile, text)
    );
    new PDFChatModal(this.app, this, paperContext, null, startFresh, this.modalServices).open();
  }

  openQuickTranslateModal(request: QuickTranslateOpenRequest): void {
    const paperContext = this.paperContextService!.createContext(
      request.file,
      request.selectedText,
      getConversationKey(request.file, request.selectedText)
    );
    new PDFChatModal(
      this.app,
      this,
      paperContext,
      null,
      request.startFresh,
      this.modalServices,
      request.autoTranslateOnOpen
    ).open();
  }

  async loadSettings(): Promise<void> {
    const { settings, needsSave } = migrateSettings(await this.loadData());
    this.settings = settings;
    if (needsSave) await this.saveSettings();
  }

  async saveSettings(): Promise<void> {
    return enqueueSettingsSave(this);
  }

  getConversationKey(
    pdfFile: TFile | null,
    contextText: string,
    kind: ConversationKind = "chat"
  ): string {
    return getConversationKey(pdfFile, contextText, kind);
  }

  getConversation(key: string): ConversationMessage[] {
    if (this.conversationStore) return this.conversationStore.get(key);
    const histories = this.settings.conversationHistories || {};
    const entry = histories[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }

  async saveConversation(key: string, messages: ConversationMessage[]): Promise<void> {
    if (this.conversationStore) return this.conversationStore.save(key, messages);
    const fallbackStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    return fallbackStore.save(key, messages);
  }

  async clearConversation(key: string): Promise<void> {
    if (this.conversationStore) return this.conversationStore.clear(key);
    const fallbackStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    return fallbackStore.clear(key);
  }

  getModelProfile(id: string): ModelProfile {
    return this.settings.models.find((m) => m.id === id) || this.settings.models[0];
  }

  async generateDocSummary(
    file: TFile
  ): Promise<{ summary: string; fullLength: number; truncated: boolean }> {
    return this.paperContextService!.generateDocSummary(file);
  }

  resolveTranslateModelId(): string {
    return resolveTranslateModelId(this.settings);
  }

  resolveContinueModelId(): string {
    return resolveContinueModelId(this.settings);
  }

  async getOrCreateDocSummary(file: TFile, forceRefresh: boolean): Promise<DocSummaryEntry> {
    return this.paperContextService!.getOrCreateDocSummary(file, forceRefresh);
  }

  async generateDocChunks(file: TFile): Promise<{ chunks: PdfChunk[]; fullTextLength: number }> {
    return this.paperContextService!.generateDocChunks(file);
  }

  async planRagQueries(question: string): Promise<string[]> {
    return this.paperContextService!.planRagQueries(question);
  }

  async getOrCreateDocChunks(file: TFile, forceRefresh: boolean): Promise<DocChunksEntry> {
    return this.paperContextService!.getOrCreateDocChunks(file, forceRefresh);
  }

  async chat(
    messages: LlmMessage[],
    onChunk?: LlmRequest["onChunk"],
    signal?: AbortSignal,
    modelProfile?: ModelProfile,
    options: LlmCompatibilityOptions = {}
  ): Promise<string> {
    return this.llmTransport!.chat({
      messages,
      onChunk,
      signal,
      modelProfile,
      stream: options.stream,
      maxTokensOverride: options.maxTokensOverride,
      temperatureOverride: options.temperatureOverride,
    });
  }

  async chatOnce(
    messages: LlmMessage[],
    signal: AbortSignal | undefined,
    profile: ModelProfile,
    maxTokensOverride?: number
  ): Promise<string> {
    return this.llmTransport!.chatOnce(messages, signal, profile, maxTokensOverride);
  }

  async chatStream(
    messages: LlmMessage[],
    onChunk: LlmRequest["onChunk"],
    signal: AbortSignal | undefined,
    profile: ModelProfile
  ): Promise<string> {
    return this.llmTransport!.chatStream(messages, onChunk, signal, profile);
  }
}
