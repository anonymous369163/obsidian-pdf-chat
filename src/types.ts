import type { App, Plugin, TFile } from "obsidian";

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
}

export interface DocChunksEntry {
  mtime?: number;
  chunks: PdfChunk[];
  fullTextLength: number;
  generatedAt: number;
}

export interface PDFChatSettings {
  models: ModelProfile[];
  activeModelId: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  fontScale: number;
  lastModelId: string;
  lastPresetId: string;
  systemPrompt: string;
  translatePrompt: string;
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
  promptPresets: PromptPreset[];
}

export interface PaperContext {
  app: App;
  file: TFile | null;
  selectedText: string;
  conversationKey: string;
}

export interface ResearchActionContext {
  settings: PDFChatSettings;
  submit: (options: { question: string; skipContextAugmentation?: boolean }) => Promise<void>;
}

export interface ResearchAction {
  id: string;
  name: string;
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
  getKey(file: TFile | null, selectedText: string): string;
  get(key: string): ConversationMessage[];
  save(key: string, messages: ConversationMessage[]): Promise<void>;
  clear(key: string): Promise<void>;
}

export interface PaperContextOperations {
  getOrCreateDocSummary(file: TFile, forceRefresh: boolean): Promise<DocSummaryEntry>;
  getOrCreateDocChunks(file: TFile, forceRefresh: boolean): Promise<DocChunksEntry>;
  extractFullText(file: TFile): Promise<string>;
  planRagQueries(question: string): Promise<string[]>;
  retrieveContext(chunks: PdfChunk[], queries: string[], topK: number): PdfChunk[];
}

export interface LlmOperations {
  chat(request: LlmRequest): Promise<string>;
}

export interface ModelOperations {
  get(id: string): ModelProfile;
}

export interface ResearchActionOperations {
  execute(id: string, context: ResearchActionContext): Promise<void>;
}

export interface PDFChatModalServices {
  conversations: ConversationOperations;
  papers: PaperContextOperations;
  llm: LlmOperations;
  models: ModelOperations;
  actions: ResearchActionOperations;
}

export interface PDFChatModalServiceOverrides {
  conversations?: Partial<ConversationOperations>;
  papers?: Partial<PaperContextOperations>;
  llm?: Partial<LlmOperations>;
  models?: Partial<ModelOperations>;
  actions?: ResearchActionOperations;
}

export interface LlmCompatibilityOptions {
  stream?: boolean;
  maxTokensOverride?: number;
}

export interface PDFChatPluginApi extends Plugin {
  settings: PDFChatSettings;
  actionRegistry?: ResearchActionOperations;
  paperContextService?: PaperContextOperations;
  llmTransport?: LlmOperations;
  saveSettings(): Promise<void>;
  getConversationKey(file: TFile | null, contextText: string): string;
  getConversation(key: string): ConversationMessage[];
  saveConversation(key: string, messages: ConversationMessage[]): Promise<void>;
  clearConversation(key: string): Promise<void>;
  getModelProfile(id: string): ModelProfile;
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
