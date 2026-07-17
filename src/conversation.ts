import type { ConversationHistory, ConversationMessage } from "./types";

export function cleanSelectionText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stableConversationHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function normalizeConversationMessages(messages: unknown): ConversationMessage[] {
  if (!Array.isArray(messages)) return [];
  const normalized: ConversationMessage[] = [];
  for (const candidate of messages) {
    if (!candidate || typeof candidate !== "object") continue;
    const message = candidate as Record<string, unknown>;
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (typeof message.content !== "string" || !message.content.trim()) continue;
    normalized.push({
      role: message.role,
      content: message.content,
      status: message.role === "assistant" && message.status === "stopped" ? "stopped" : "complete",
    });
  }
  return normalized;
}

export function normalizeConversationHistories(saved: unknown): Record<string, ConversationHistory> {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const normalized: Record<string, ConversationHistory> = {};
  for (const [key, candidate] of Object.entries(saved)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const entry = candidate as Record<string, unknown>;
    const messages = normalizeConversationMessages(entry.messages);
    if (!messages.length) continue;
    normalized[key] = {
      version: 1,
      updatedAt: typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
      messages,
    };
  }
  return normalized;
}

export function getConversationKey(pdfFile: { path?: string } | null, contextText: string): string {
  if (pdfFile && typeof pdfFile.path === "string" && pdfFile.path) return `pdf:${pdfFile.path}`;
  return `selection:${stableConversationHash(cleanSelectionText(contextText || ""))}`;
}

export interface ConversationSettings {
  conversationHistories?: Record<string, ConversationHistory>;
}

export class ConversationStore {
  constructor(
    private readonly getSettings: () => ConversationSettings,
    private readonly persistSettings: () => Promise<void>,
    private readonly now: () => number = Date.now
  ) {}

  get(key: string): ConversationMessage[] {
    const entry = (this.getSettings().conversationHistories || {})[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }

  async save(key: string, messages: unknown): Promise<void> {
    const settings = this.getSettings();
    if (!settings.conversationHistories || typeof settings.conversationHistories !== "object") {
      settings.conversationHistories = {};
    }
    const normalizedMessages = normalizeConversationMessages(messages);
    if (!normalizedMessages.length) {
      delete settings.conversationHistories[key];
    } else {
      settings.conversationHistories[key] = {
        version: 1,
        updatedAt: this.now(),
        messages: normalizedMessages,
      };
    }
    await this.persistSettings();
  }

  async clear(key: string): Promise<void> {
    const histories = this.getSettings().conversationHistories;
    if (histories && histories[key]) delete histories[key];
    await this.persistSettings();
  }
}
