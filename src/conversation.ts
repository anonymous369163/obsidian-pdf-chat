import type {
  CodexReasoningEffort,
  ConversationHistory,
  ConversationKind,
  ConversationMessage,
  ConversationSession,
  ConversationSessionMode,
} from "./types";

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

function normalizeSessionMode(value: unknown): ConversationSessionMode {
  return value === "codex" ? "codex" : "chat";
}

function normalizeReasoningEffort(value: unknown): CodexReasoningEffort {
  return value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh"
    ? value
    : "xhigh";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 3);
}

function normalizeSessionId(value: unknown, fallbackSeed: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || `session-${stableConversationHash(fallbackSeed)}`;
}

function cloneSession(session: ConversationSession): ConversationSession {
  return {
    ...session,
    messages: normalizeConversationMessages(session.messages),
    referencedPdfPaths: [...session.referencedPdfPaths],
    codex: session.codex ? { ...session.codex } : undefined,
  };
}

export function normalizeConversationSessions(saved: unknown): Record<string, ConversationSession> {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const normalized: Record<string, ConversationSession> = {};
  for (const [key, candidate] of Object.entries(saved)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const entry = candidate as Record<string, unknown>;
    const conversationKey =
      typeof entry.conversationKey === "string" && entry.conversationKey.trim()
        ? entry.conversationKey.trim()
        : "";
    const messages = normalizeConversationMessages(entry.messages);
    const id = normalizeSessionId(entry.id || key, `${conversationKey}:${key}`);
    const createdAt =
      typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt) ? entry.createdAt : 0;
    const updatedAt =
      typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : createdAt;
    const codexCandidate = entry.codex && typeof entry.codex === "object" ? (entry.codex as Record<string, unknown>) : null;
    const codex =
      codexCandidate && typeof codexCandidate.model === "string" && codexCandidate.model.trim()
        ? {
            model: codexCandidate.model.trim(),
            reasoningEffort: normalizeReasoningEffort(codexCandidate.reasoningEffort),
            profile: typeof codexCandidate.profile === "string" ? codexCandidate.profile.trim() : "",
            threadId: typeof codexCandidate.threadId === "string" ? codexCandidate.threadId.trim() || undefined : undefined,
            lifecycle: codexCandidate.lifecycle === "closed" ? ("closed" as const) : ("active" as const),
          }
        : undefined;
    if (!conversationKey) continue;
    normalized[id] = {
      version: 1,
      id,
      conversationKey,
      title:
        typeof entry.title === "string" && entry.title.trim()
          ? entry.title.trim()
          : conversationKey.replace(/^pdf:/, ""),
      mode: normalizeSessionMode(entry.mode),
      messages,
      referencedPdfPaths: normalizeStringArray(entry.referencedPdfPaths),
      includeCurrentPdfInCodex: entry.includeCurrentPdfInCodex !== false,
      codex,
      createdAt,
      updatedAt,
    };
  }
  return normalized;
}

export function getConversationKey(
  pdfFile: { path?: string } | null,
  contextText: string,
  kind: ConversationKind = "chat"
): string {
  const chatKey =
    pdfFile && typeof pdfFile.path === "string" && pdfFile.path
      ? `pdf:${pdfFile.path}`
      : `selection:${stableConversationHash(cleanSelectionText(contextText || ""))}`;
  return kind === "translate" ? `translate:${chatKey}` : chatKey;
}

export interface ConversationSettings {
  conversationHistories?: Record<string, ConversationHistory>;
  conversationSessions?: Record<string, ConversationSession>;
  activeConversationSessionIds?: Record<string, string>;
}

export interface ConversationSessionMetadata {
  title?: string;
  mode?: ConversationSessionMode;
  referencedPdfPaths?: string[];
  includeCurrentPdfInCodex?: boolean;
  codex?: ConversationSession["codex"];
}

export class ConversationStore {
  constructor(
    private readonly getSettings: () => ConversationSettings,
    private readonly persistSettings: () => Promise<void>,
    private readonly now: () => number = Date.now
  ) {}

  private ensureContainers(): ConversationSettings {
    const settings = this.getSettings();
    if (!settings.conversationHistories || typeof settings.conversationHistories !== "object") {
      settings.conversationHistories = {};
    }
    if (!settings.conversationSessions || typeof settings.conversationSessions !== "object") {
      settings.conversationSessions = {};
    }
    if (!settings.activeConversationSessionIds || typeof settings.activeConversationSessionIds !== "object") {
      settings.activeConversationSessionIds = {};
    }
    return settings;
  }

  private legacySessionId(key: string): string {
    return `legacy-${stableConversationHash(key)}`;
  }

  private createSessionFromHistory(
    key: string,
    metadata: ConversationSessionMetadata = {}
  ): ConversationSession | null {
    const settings = this.ensureContainers();
    const legacy = settings.conversationHistories?.[key];
    const messages = normalizeConversationMessages(legacy?.messages);
    if (!messages.length) return null;
    const id = this.legacySessionId(key);
    const existing = settings.conversationSessions![id];
    if (existing) return cloneSession(existing);
    const timestamp = legacy?.updatedAt || this.now();
    const session: ConversationSession = {
      version: 1,
      id,
      conversationKey: key,
      title: metadata.title || key.replace(/^pdf:/, ""),
      mode: metadata.mode || "chat",
      messages,
      referencedPdfPaths: normalizeStringArray(metadata.referencedPdfPaths),
      includeCurrentPdfInCodex: metadata.includeCurrentPdfInCodex !== false,
      codex: metadata.codex ? { ...metadata.codex, lifecycle: metadata.codex.lifecycle || "active" } : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    settings.conversationSessions![id] = cloneSession(session);
    settings.activeConversationSessionIds![key] = id;
    return cloneSession(session);
  }

  private applySessionMetadata(
    session: ConversationSession,
    metadata: ConversationSessionMetadata = {}
  ): ConversationSession {
    if (metadata.title && metadata.title.trim()) session.title = metadata.title.trim();
    if (metadata.mode) session.mode = metadata.mode;
    if (metadata.referencedPdfPaths) {
      session.referencedPdfPaths = normalizeStringArray(metadata.referencedPdfPaths);
    }
    if (typeof metadata.includeCurrentPdfInCodex === "boolean") {
      session.includeCurrentPdfInCodex = metadata.includeCurrentPdfInCodex;
    }
    if (metadata.codex) {
      session.codex = {
        ...(session.codex || {}),
        ...metadata.codex,
        lifecycle: metadata.codex.lifecycle || session.codex?.lifecycle || "active",
      } as ConversationSession["codex"];
    }
    return session;
  }

  private normalizedSessions(): Record<string, ConversationSession> {
    return normalizeConversationSessions(this.ensureContainers().conversationSessions);
  }

  private sessionsForKey(key: string): ConversationSession[] {
    return Object.values(this.normalizedSessions()).filter((session) => session.conversationKey === key);
  }

  get(key: string): ConversationMessage[] {
    const active = this.getActiveSession(key);
    if (active) return normalizeConversationMessages(active.messages);
    if (this.sessionsForKey(key).length) return [];
    const entry = (this.getSettings().conversationHistories || {})[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }

  getActiveSession(key: string): ConversationSession | null {
    const settings = this.ensureContainers();
    const activeId = settings.activeConversationSessionIds?.[key];
    const sessions = normalizeConversationSessions(settings.conversationSessions);
    if (activeId && sessions[activeId]) {
      const active = sessions[activeId];
      if (active.codex?.lifecycle !== "closed") return cloneSession(active);
      delete settings.activeConversationSessionIds![key];
    }
    const newest = Object.values(sessions)
      .filter((session) => session.conversationKey === key && session.codex?.lifecycle !== "closed")
      .sort((left, right) => right.updatedAt - left.updatedAt)[0];
    if (newest) {
      settings.activeConversationSessionIds![key] = newest.id;
      return cloneSession(newest);
    }
    if (Object.values(sessions).some((session) => session.conversationKey === key)) return null;
    return this.createSessionFromHistory(key);
  }

  ensureSession(key: string, metadata: ConversationSessionMetadata = {}): ConversationSession {
    const settings = this.ensureContainers();
    const active = this.getActiveSession(key);
    if (active) {
      const session = this.applySessionMetadata(active, metadata);
      settings.conversationSessions![session.id] = cloneSession(session);
      settings.activeConversationSessionIds![key] = session.id;
      return cloneSession(session);
    }
    return this.startSession(key, metadata);
  }

  startSession(key: string, metadata: ConversationSessionMetadata = {}): ConversationSession {
    const settings = this.ensureContainers();
    const timestamp = this.now();
    const id = `session-${stableConversationHash(`${key}:${timestamp}:${Object.keys(settings.conversationSessions || {}).length}`)}`;
    const session: ConversationSession = {
      version: 1,
      id,
      conversationKey: key,
      title: metadata.title || key.replace(/^pdf:/, ""),
      mode: metadata.mode || "chat",
      messages: [],
      referencedPdfPaths: normalizeStringArray(metadata.referencedPdfPaths),
      includeCurrentPdfInCodex: metadata.includeCurrentPdfInCodex !== false,
      codex: metadata.codex ? { ...metadata.codex, lifecycle: metadata.codex.lifecycle || "active" } : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    settings.conversationSessions![id] = cloneSession(session);
    settings.activeConversationSessionIds![key] = id;
    return cloneSession(session);
  }

  async saveActiveSession(
    key: string,
    messages: unknown,
    metadata: ConversationSessionMetadata = {}
  ): Promise<void> {
    const settings = this.ensureContainers();
    const normalizedMessages = normalizeConversationMessages(messages);
    const timestamp = this.now();
    if (!normalizedMessages.length) {
      const activeId = settings.activeConversationSessionIds?.[key];
      const active = activeId ? this.getSession(activeId) : null;
      const mergedCodex = metadata.codex || active?.codex;
      if (active && mergedCodex?.threadId) {
        const session = this.applySessionMetadata(active, metadata);
        session.updatedAt = timestamp;
        settings.conversationSessions![session.id] = cloneSession(session);
        await this.persistSettings();
        return;
      }
      if (activeId) delete settings.conversationSessions![activeId];
      delete settings.activeConversationSessionIds![key];
      delete settings.conversationHistories![key];
      await this.persistSettings();
      return;
    }
    const session = this.applySessionMetadata(this.ensureSession(key, metadata), metadata);
    session.messages = normalizedMessages;
    session.updatedAt = timestamp;
    settings.conversationSessions![session.id] = cloneSession(session);
    settings.activeConversationSessionIds![key] = session.id;
    settings.conversationHistories![key] = {
      version: 1,
      updatedAt: timestamp,
      messages: normalizedMessages,
    };
    await this.persistSettings();
  }

  getSession(id: string): ConversationSession | null {
    const session = this.normalizedSessions()[id];
    return session ? cloneSession(session) : null;
  }

  async saveSessionById(
    id: string,
    messages: unknown,
    metadata: ConversationSessionMetadata = {}
  ): Promise<void> {
    const settings = this.ensureContainers();
    const existing = this.getSession(id);
    if (!existing) throw new Error(`Conversation session not found: ${id}`);
    const session = this.applySessionMetadata(existing, metadata);
    session.messages = normalizeConversationMessages(messages);
    session.updatedAt = this.now();
    settings.conversationSessions![id] = cloneSession(session);
    if (settings.activeConversationSessionIds?.[session.conversationKey] === id && session.messages.length) {
      settings.conversationHistories![session.conversationKey] = {
        version: 1,
        updatedAt: session.updatedAt,
        messages: normalizeConversationMessages(session.messages),
      };
    }
    await this.persistSettings();
  }

  async appendSessionTurn(id: string, userContent: string, assistantContent: string): Promise<void> {
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    const messages = [
      ...session.messages,
      { role: "user" as const, content: userContent, status: "complete" as const },
      { role: "assistant" as const, content: assistantContent, status: "complete" as const },
    ];
    await this.saveSessionById(id, messages);
  }

  async updateSessionMetadata(id: string, metadata: ConversationSessionMetadata): Promise<void> {
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    await this.saveSessionById(id, session.messages, metadata);
  }

  async closeSession(id: string): Promise<void> {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) return;
    if (session.codex) session.codex = { ...session.codex, lifecycle: "closed" };
    session.updatedAt = this.now();
    settings.conversationSessions![id] = cloneSession(session);
    if (settings.activeConversationSessionIds?.[session.conversationKey] === id) {
      delete settings.activeConversationSessionIds[session.conversationKey];
    }
    await this.persistSettings();
  }

  resumeSession(id: string): ConversationSession | null {
    const settings = this.ensureContainers();
    const sessions = normalizeConversationSessions(settings.conversationSessions);
    const session = sessions[id];
    if (!session) return null;
    if (session.codex) session.codex = { ...session.codex, lifecycle: "active" };
    settings.activeConversationSessionIds![session.conversationKey] = session.id;
    settings.conversationSessions![session.id] = cloneSession(session);
    return cloneSession(session);
  }

  listSessions(query = ""): ConversationSession[] {
    const settings = this.ensureContainers();
    const sessions = normalizeConversationSessions(settings.conversationSessions);
    const needle = query.trim().toLowerCase();
    return Object.values(sessions)
      .filter((session) => {
        if (!needle) return true;
        return [session.title, session.conversationKey, ...session.referencedPdfPaths]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(cloneSession);
  }

  async save(key: string, messages: unknown): Promise<void> {
    await this.saveActiveSession(key, messages);
  }

  async clear(key: string): Promise<void> {
    const settings = this.ensureContainers();
    const activeId = settings.activeConversationSessionIds?.[key];
    if (activeId) delete settings.conversationSessions![activeId];
    if (settings.activeConversationSessionIds) delete settings.activeConversationSessionIds[key];
    if (settings.conversationHistories && settings.conversationHistories[key]) {
      delete settings.conversationHistories[key];
    }
    await this.persistSettings();
  }
}
