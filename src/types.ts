import type { App, Plugin, TFile } from "obsidian";
import type { CodexTurnSnapshot, StartCodexTurnRequest } from "./codex-session-manager";

export type LlmRole = "system" | "user" | "assistant";

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface ModelProfile {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface LlmRequest {
  messages: LlmMessage[];
  onChunk?: (piece: string, accumulatedText: string) => void;
  signal?: AbortSignal;
  modelProfile?: ModelProfile;
  maxTokensOverride?: number;
  temperatureOverride?: number;
  stream?: boolean;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  status: "complete" | "stopped";
}

export interface ConversationHistory {
  version: 1;
  updatedAt: number;
  messages: ConversationMessage[];
}

export type ConversationSessionMode = "chat" | "codex";

export type PaperSourceStatus = "available" | "missing";

export interface SessionMemory {
  content: string;
  coveredMessageCount: number;
  updatedAt: number;
}

export interface ExtractionQualityReport {
  pageCount: number;
  extractedChars: number;
  emptyPageRatio: number;
  replacementCharRatio: number;
  shortPageRatio: number;
  quality: "good" | "mixed" | "poor";
}

export interface ContextBudgetSettings {
  maxInputChars: number;
  minRecentTurns: number;
  maxSelectionChars: number;
}

export type CodexReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh";

export type CodexVerbosity = "low" | "medium" | "high";

export type CodexInputMode = "pdf-only" | "debug-full";

export type CodexOutputMode = "markdown" | "json-schema";

export type CodexThreadLifecycle = "active" | "closed";

export interface CodexModelPreset {
  model: string;
  reasoningEffort: CodexReasoningEffort;
  label: string;
}

export interface CodexSessionMetadata {
  model: string;
  reasoningEffort: CodexReasoningEffort;
  profile?: string;
  threadId?: string;
  lifecycle?: CodexThreadLifecycle;
}

export interface ApiSessionMetadata {
  modelId?: string;
  presetId?: string;
}

export type PendingCodexTurnStatus = "running" | "interrupted" | "failed";

export interface PendingCodexTurn {
  turnId: string;
  question: string;
  status: PendingCodexTurnStatus;
  startedAt: number;
  threadId?: string;
  attachedPdfPaths: string[];
  selectionChars: number;
  progress?: string;
}

export interface ConversationSession {
  version: 2;
  id: string;
  conversationKey: string;
  title: string;
  mode: ConversationSessionMode;
  messages: ConversationMessage[];
  referencedPdfPaths: string[];
  includeCurrentPdfInCodex: boolean;
  api?: ApiSessionMetadata;
  codex?: CodexSessionMetadata;
  pendingTurn?: PendingCodexTurn;
  memory?: SessionMemory;
  sourceStatus?: PaperSourceStatus;
  createdAt: number;
  updatedAt: number;
}

export interface PromptPreset {
  id: string;
  name: string;
  prompt: string;
}

export interface DocSummaryEntry {
  mtime?: number;
  summary: string;
  generatedAt: number;
  fullLength: number;
  truncated: boolean;
  extractionQuality?: ExtractionQualityReport;
}

export interface DocChunksEntry {
  mtime?: number;
  chunks: PdfChunk[];
  fullTextLength: number;
  generatedAt: number;
  extractionQuality?: ExtractionQualityReport;
}

export interface TranslationSettings {
  targetLanguage: string;
  temperature: number;
  maxTokens: number;
  chunkChars: number;
  additionalInstruction: string;
}

export interface CodexDeepAnalysisSettings {
  enabled: boolean;
  command: string;
  profile: string;
  model: string;
  reasoningEffort: CodexReasoningEffort;
  verbosity: CodexVerbosity;
  inputMode: CodexInputMode;
  outputMode: CodexOutputMode;
  modelPresets: CodexModelPreset[];
  timeoutMs: number;
  keepTempFiles: boolean;
  includeSelectionContext: boolean;
}

export interface TranslationProgress {
  chunkIndex: number;
  chunkCount: number;
  chunkText: string;
  combinedText: string;
}

export interface TranslationTaskRequest {
  source: string;
  settings: TranslationSettings;
  modelProfile: ModelProfile;
  signal?: AbortSignal;
  onChunk?: (progress: TranslationProgress) => void;
}

export interface TranslationTaskResult {
  text: string;
  chunkCount: number;
  stoppedEarly: boolean;
  failedChunkIndexes: number[];
}

export type ConversationKind = "chat" | "translate";

export interface PDFChatSettings {
  models: ModelProfile[];
  activeModelId: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  fontScale: number;
  lastModelId: string;
  lastPresetId: string;
  quickTranslateMarkerEnabled: boolean;
  translateModelId: string;
  continueModelId: string;
  systemPrompt: string;
  translation: TranslationSettings;
  codexDeepAnalysis: CodexDeepAnalysisSettings;
  contextBudget: ContextBudgetSettings;
  summaryModelId: string;
  autoDocSummary: boolean;
  summaryMaxChars: number;
  summaryMaxTokens: number;
  summaryPrompt: string;
  docSummaries: Record<string, DocSummaryEntry>;
  autoRag: boolean;
  ragChunkSize: number;
  ragChunkOverlap: number;
  ragTopK: number;
  ragFullTextThreshold: number;
  ragQueryTranslate: boolean;
  ragQueryPrompt: string;
  docChunks: Record<string, DocChunksEntry>;
  conversationHistories: Record<string, ConversationHistory>;
  conversationSessions: Record<string, ConversationSession>;
  activeConversationSessionIds: Record<string, string>;
  promptHistory: string[];
  promptPresets: PromptPreset[];
}

export interface PaperContext {
  app: App;
  file: TFile | null;
  selectedText: string;
  conversationKey: string;
}

export interface ResearchActionContext {
  translate: () => Promise<void>;
}

export type ResearchActionSlot = "composer" | "context";

export interface ResearchAction {
  id: string;
  name: string;
  slot?: ResearchActionSlot;
  execute(context: ResearchActionContext): Promise<void> | void;
}

export interface PdfPageText {
  page: number;
  text: string;
}

export interface PdfChunk extends PdfPageText {
  idx?: number;
}

export interface ConversationOperations {
  getKey(file: TFile | null, selectedText: string, kind?: ConversationKind): string;
  get(key: string): ConversationMessage[];
  save(key: string, messages: ConversationMessage[]): Promise<void>;
  clear(key: string): Promise<void>;
  getActiveSession?(key: string): ConversationSession | null;
  ensureSession?(
    key: string,
    metadata?: Partial<Pick<ConversationSession, "title" | "mode" | "referencedPdfPaths" | "includeCurrentPdfInCodex" | "api" | "codex" | "memory" | "sourceStatus">>
  ): ConversationSession;
  startSession?(
    key: string,
    metadata?: Partial<Pick<ConversationSession, "title" | "mode" | "referencedPdfPaths" | "includeCurrentPdfInCodex" | "api" | "codex" | "memory" | "sourceStatus">>
  ): ConversationSession;
  saveActiveSession?(
    key: string,
    messages: ConversationMessage[],
    metadata?: Partial<Pick<ConversationSession, "title" | "mode" | "referencedPdfPaths" | "includeCurrentPdfInCodex" | "api" | "codex" | "memory" | "sourceStatus">>
  ): Promise<void>;
  getSession?(id: string): ConversationSession | null;
  saveSessionById?(
    id: string,
    messages: ConversationMessage[],
    metadata?: Partial<Pick<ConversationSession, "title" | "mode" | "referencedPdfPaths" | "includeCurrentPdfInCodex" | "api" | "codex" | "memory" | "sourceStatus">>
  ): Promise<void>;
  appendSessionTurn?(id: string, userContent: string, assistantContent: string): Promise<void>;
  updateSessionMetadata?(
    id: string,
    metadata: Partial<Pick<ConversationSession, "title" | "mode" | "referencedPdfPaths" | "includeCurrentPdfInCodex" | "api" | "codex" | "memory" | "sourceStatus">>
  ): Promise<void>;
  beginCodexTurn?(id: string, pendingTurn: PendingCodexTurn): Promise<void>;
  updateCodexTurn?(
    id: string,
    turnId: string,
    patch: Partial<Pick<PendingCodexTurn, "status" | "threadId" | "progress">>,
    codex?: CodexSessionMetadata
  ): Promise<void>;
  completeCodexTurn?(
    id: string,
    turnId: string,
    userContent: string,
    assistantContent: string,
    codex: CodexSessionMetadata
  ): Promise<void>;
  clearSession?(id: string): Promise<void>;
  closeSession?(id: string): Promise<void>;
  resumeSession?(id: string): ConversationSession | null;
  listSessions?(query?: string): ConversationSession[];
}

export interface PaperContextOperations {
  getOrCreateDocSummary(file: TFile, forceRefresh: boolean): Promise<DocSummaryEntry>;
  getOrCreateDocChunks(file: TFile, forceRefresh: boolean): Promise<DocChunksEntry>;
  extractPages(file: TFile): Promise<PdfPageText[]>;
  extractFullText(file: TFile): Promise<string>;
  planRagQueries(question: string): Promise<string[]>;
  retrieveContext(chunks: PdfChunk[], queries: string[], topK: number): PdfChunk[];
}

export interface LlmOperations {
  chat(request: LlmRequest): Promise<string>;
}

export interface TranslationOperations {
  translate(request: TranslationTaskRequest): Promise<TranslationTaskResult>;
}

export interface ModelOperations {
  get(id: string): ModelProfile;
  resolveTranslateId(): string;
  resolveContinueId(): string;
}

export interface ResearchActionOperations {
  execute(id: string, context: ResearchActionContext): Promise<void>;
  list?(): ResearchAction[];
}

export interface CodexRuntimeOperations {
  getSnapshot(sessionId: string): CodexTurnSnapshot;
  listSnapshots(): CodexTurnSnapshot[];
  subscribe(sessionId: string, listener: (snapshot: CodexTurnSnapshot) => void): () => void;
  startTurn(request: StartCodexTurnRequest): Promise<CodexTurnSnapshot>;
  stopTurn(sessionId: string): boolean;
  closeSession(sessionId: string): Promise<void>;
  reactivateSession(sessionId: string): void;
  retryPersistResult(sessionId: string): Promise<boolean>;
}

export interface PDFChatModalServices {
  conversations: ConversationOperations;
  papers: PaperContextOperations;
  llm: LlmOperations;
  models: ModelOperations;
  actions: ResearchActionOperations;
  translations: TranslationOperations;
  codex?: CodexRuntimeOperations;
}

export interface PDFChatModalServiceOverrides {
  conversations?: Partial<ConversationOperations>;
  papers?: Partial<PaperContextOperations>;
  llm?: Partial<LlmOperations>;
  models?: Partial<ModelOperations>;
  actions?: ResearchActionOperations;
  translations?: Partial<TranslationOperations>;
  codex?: CodexRuntimeOperations;
}

export interface LlmCompatibilityOptions {
  stream?: boolean;
  maxTokensOverride?: number;
  temperatureOverride?: number;
}

export interface PDFChatPluginApi extends Plugin {
  settings: PDFChatSettings;
  actionRegistry?: ResearchActionOperations;
  paperContextService?: PaperContextOperations;
  llmTransport?: LlmOperations;
  translationService?: TranslationOperations;
  codexSessionManager?: CodexRuntimeOperations;
  saveSettings(): Promise<void>;
  getConversationKey(file: TFile | null, contextText: string, kind?: ConversationKind): string;
  getConversation(key: string): ConversationMessage[];
  saveConversation(key: string, messages: ConversationMessage[]): Promise<void>;
  clearConversation(key: string): Promise<void>;
  getModelProfile(id: string): ModelProfile;
  resolveTranslateModelId(): string;
  resolveContinueModelId(): string;
  getOrCreateDocSummary(file: TFile, forceRefresh: boolean): Promise<DocSummaryEntry>;
  getOrCreateDocChunks(file: TFile, forceRefresh: boolean): Promise<DocChunksEntry>;
  planRagQueries(question: string): Promise<string[]>;
  chat(
    messages: LlmMessage[],
    onChunk?: LlmRequest["onChunk"],
    signal?: AbortSignal,
    modelProfile?: ModelProfile,
    options?: LlmCompatibilityOptions
  ): Promise<string>;
}

export interface SettingsPersistence {
  loadData(): Promise<unknown>;
  saveData(data: unknown): Promise<void>;
}
