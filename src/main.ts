import { Notice, Plugin, type TFile } from "obsidian";

import { ActionRegistry, createResearchActionRegistry } from "./actions";
import { DEFAULT_SETTINGS } from "./default-settings";
import {
  cleanSelectionText,
  ConversationStore,
  getConversationKey,
  normalizeConversationMessages,
} from "./conversation";
import { OpenAICompatibleTransport } from "./llm-transport";
import { getActivePdfFile, PaperContextService } from "./paper-context";
import { createPDFChatModalServices } from "./modal-services";
import { PDFChatModal } from "./pdf-chat-modal";
import { enqueueSettingsSave, migrateSettings } from "./settings";
import { PDFChatSettingTab } from "./settings-tab";
import { TranslationService } from "./translation";
import type {
  ConversationMessage,
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
  normalizeConversationMessages,
  stableConversationHash,
} from "./conversation";
export { DEFAULT_SETTINGS, LEGACY_0_4_0_TRANSLATE_PROMPT } from "./default-settings";
export { OpenAICompatibleTransport } from "./llm-transport";
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
export { createPDFChatModalServices } from "./modal-services";
export { PDFChatModal } from "./pdf-chat-modal";
export { migrateSettings } from "./settings";
export { buildTranslationMessages, splitTranslationChunks, TranslationService } from "./translation";
export type { LlmRequest, PaperContext, ResearchAction } from "./types";

export default class PDFChatPlugin extends Plugin implements PDFChatPluginApi {
  declare settings: PDFChatSettings;
  _saveQueue: Promise<void> = Promise.resolve();
  conversationStore?: ConversationStore;
  llmTransport?: OpenAICompatibleTransport;
  paperContextService?: PaperContextService;
  translationService?: TranslationOperations;
  actionRegistry?: ActionRegistry;
  modalServices?: PDFChatModalServices;

  async onload(): Promise<void> {
    this._saveQueue = Promise.resolve();
    await this.loadSettings();
    this.conversationStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
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
    this.modalServices = createPDFChatModalServices(this, {
      conversations: {
        getKey: (file, selectedText) => getConversationKey(file, selectedText),
        get: (key) => this.conversationStore!.get(key),
        save: (key, messages) => this.conversationStore!.save(key, messages),
        clear: (key) => this.conversationStore!.clear(key),
      },
      papers: {
        getOrCreateDocSummary: (file, forceRefresh) =>
          this.paperContextService!.getOrCreateDocSummary(file, forceRefresh),
        getOrCreateDocChunks: (file, forceRefresh) =>
          this.paperContextService!.getOrCreateDocChunks(file, forceRefresh),
        extractFullText: (file) => this.paperContextService!.extractFullText(file),
        planRagQueries: (question) => this.paperContextService!.planRagQueries(question),
        retrieveContext: (chunks, queries, topK) =>
          this.paperContextService!.retrieveContext(chunks, queries, topK),
      },
      llm: { chat: (request) => this.llmTransport!.chat(request) },
      models: { get: (id) => this.getModelProfile(id) },
      actions: this.actionRegistry,
      translations: this.translationService,
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
  }

  // startFresh=true: 新开一份对话,不加载这个 PDF(或选区)之前保存的记录;
  // startFresh=false: 加载并接续之前保存的记录(如果有)。两个快捷键共用同一段取选中文字的逻辑。
  openChatModal(startFresh: boolean): void {
    const win = activeWindow || window;
    const sel = win.getSelection ? win.getSelection() : null;
    const raw = sel ? sel.toString() : "";
    const text = cleanSelectionText(raw || "");

    if (!text) {
      new Notice("没有检测到选中的文字,请先划选一段内容再按快捷键");
      return;
    }

    const pdfFile = getActivePdfFile(this.app);
    const paperContext = this.paperContextService!.createContext(
      pdfFile,
      text,
      getConversationKey(pdfFile, text)
    );
    new PDFChatModal(this.app, this, paperContext, null, startFresh, this.modalServices).open();
  }

  async loadSettings(): Promise<void> {
    const { settings, needsSave } = migrateSettings(await this.loadData());
    this.settings = settings;
    if (needsSave) await this.saveSettings();
  }

  async saveSettings(): Promise<void> {
    return enqueueSettingsSave(this);
  }

  getConversationKey(pdfFile: TFile | null, contextText: string): string {
    return getConversationKey(pdfFile, contextText);
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
