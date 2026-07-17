import type { App, TFile } from "obsidian";

export type LlmRole = "system" | "user" | "assistant";

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface ModelProfile {
  id: string;
  name?: string;
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

export interface PaperContext {
  app: App;
  file: TFile | null;
  selectedText: string;
  conversationKey: string;
}

export interface ResearchActionContext {
  settings: Record<string, unknown>;
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

export interface SettingsPersistence {
  loadData(): Promise<unknown>;
  saveData(data: unknown): Promise<void>;
}
