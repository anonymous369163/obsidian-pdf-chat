import type {
  CodexReasoningEffort,
  ConversationHistory,
  ConversationKind,
  ConversationMessage,
  ConversationSession,
  ConversationSessionMode,
  PendingCodexTurn,
  ResearchEvidence,
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
  return normalizeMessages(messages);
}

interface MessageIdentityOptions {
  sessionId: string;
  baseTimestamp: number;
}

function normalizeMessages(
  messages: unknown,
  identity?: MessageIdentityOptions
): ConversationMessage[] {
  if (!Array.isArray(messages)) return [];
  const normalized: ConversationMessage[] = [];
  for (let index = 0; index < messages.length; index += 1) {
    const candidate = messages[index];
    if (!candidate || typeof candidate !== "object") continue;
    const message = candidate as Record<string, unknown>;
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (typeof message.content !== "string" || !message.content.trim()) continue;
    const value: ConversationMessage = {
      role: message.role,
      content: message.content,
      status: message.role === "assistant" && message.status === "stopped" ? "stopped" : "complete",
    };
    const existingId = typeof message.id === "string" ? message.id.trim() : "";
    const existingCreatedAt =
      typeof message.createdAt === "number" && Number.isFinite(message.createdAt)
        ? message.createdAt
        : undefined;
    if (identity || existingId) {
      value.id =
        existingId ||
        `message-${stableConversationHash(
          `${identity!.sessionId}:${index}:${message.role}:${stableConversationHash(message.content)}`
        )}`;
    }
    if (identity || existingCreatedAt !== undefined) {
      value.createdAt = existingCreatedAt ?? identity!.baseTimestamp + index;
    }
    if (Array.isArray(message.evidence)) {
      value.evidence = message.evidence
        .filter((item): item is ResearchEvidence => Boolean(item && typeof item === "object"))
        .map((item) => ({ ...item }));
    }
    normalized.push(value);
  }
  return normalized;
}

function normalizeSessionMessages(
  messages: unknown,
  sessionId: string,
  baseTimestamp: number
): ConversationMessage[] {
  return normalizeMessages(messages, { sessionId, baseTimestamp });
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

function normalizeStringArray(value: unknown, limit = 3): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, limit);
}

function isAbsolutePath(value: string): boolean {
  return /^(?:[A-Za-z]:[\\/]|[\\/]{1,2})/.test(value);
}

function normalizePendingCodexTurn(value: unknown): PendingCodexTurn | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const turnId = typeof candidate.turnId === "string" ? candidate.turnId.trim() : "";
  const question = typeof candidate.question === "string" ? candidate.question.trim() : "";
  const status =
    candidate.status === "running" || candidate.status === "interrupted" || candidate.status === "failed"
      ? candidate.status
      : null;
  if (!turnId || !question || !status) return undefined;
  const attachedPdfPaths = normalizeStringArray(candidate.attachedPdfPaths, 4).filter(
    (path) => !isAbsolutePath(path)
  );
  return {
    turnId,
    question,
    status,
    startedAt:
      typeof candidate.startedAt === "number" && Number.isFinite(candidate.startedAt)
        ? candidate.startedAt
        : 0,
    threadId:
      typeof candidate.threadId === "string" ? candidate.threadId.trim() || undefined : undefined,
    attachedPdfPaths,
    selectionChars:
      typeof candidate.selectionChars === "number" && Number.isFinite(candidate.selectionChars)
        ? Math.max(0, Math.floor(candidate.selectionChars))
        : 0,
    progress:
      typeof candidate.progress === "string" ? candidate.progress.trim().slice(0, 500) || undefined : undefined,
  };
}

function normalizeApiSessionMetadata(value: unknown): ConversationSession["api"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const modelId = typeof candidate.modelId === "string" ? candidate.modelId.trim() : "";
  const presetId = typeof candidate.presetId === "string" ? candidate.presetId.trim() : "";
  return modelId || presetId
    ? { modelId: modelId || undefined, presetId: presetId || undefined }
    : undefined;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().replace(/\s+/g, " ").slice(0, 50))
        .filter(Boolean)
    )
  ).slice(0, 20);
}

function normalizeSessionMemory(value: unknown): ConversationSession["memory"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
  if (!content) return undefined;
  return {
    content,
    coveredMessageCount:
      typeof candidate.coveredMessageCount === "number" && Number.isFinite(candidate.coveredMessageCount)
        ? Math.max(0, Math.floor(candidate.coveredMessageCount))
        : 0,
    updatedAt:
      typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt)
        ? candidate.updatedAt
        : 0,
  };
}

function normalizeSessionId(value: unknown, fallbackSeed: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || `session-${stableConversationHash(fallbackSeed)}`;
}

function cloneSession(session: ConversationSession): ConversationSession {
  return {
    ...session,
    messages: normalizeSessionMessages(session.messages, session.id, session.createdAt),
    referencedPdfPaths: [...session.referencedPdfPaths],
    tags: [...session.tags],
    api: session.api ? { ...session.api } : undefined,
    codex: session.codex ? { ...session.codex } : undefined,
    pendingTurn: session.pendingTurn
      ? { ...session.pendingTurn, attachedPdfPaths: [...session.pendingTurn.attachedPdfPaths] }
      : undefined,
    memory: session.memory ? { ...session.memory } : undefined,
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
    const id = normalizeSessionId(entry.id || key, `${conversationKey}:${key}`);
    const createdAt =
      typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt) ? entry.createdAt : 0;
    const updatedAt =
      typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : createdAt;
    const messages = normalizeSessionMessages(entry.messages, id, createdAt);
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
      version: 3,
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
      api: normalizeApiSessionMetadata(entry.api),
      codex,
      pendingTurn: normalizePendingCodexTurn(entry.pendingTurn),
      memory: normalizeSessionMemory(entry.memory),
      sourceStatus: entry.sourceStatus === "missing" ? "missing" : "available",
      pinned: entry.pinned === true,
      tags: normalizeTags(entry.tags),
      archivedAt:
        typeof entry.archivedAt === "number" && Number.isFinite(entry.archivedAt) && entry.archivedAt > 0
          ? entry.archivedAt
          : undefined,
      parentSessionId:
        typeof entry.parentSessionId === "string" && entry.parentSessionId.trim() && entry.parentSessionId.trim() !== id
          ? entry.parentSessionId.trim()
          : undefined,
      installationId:
        typeof entry.installationId === "string" ? entry.installationId.trim() || undefined : undefined,
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
  installationId?: string;
  conversationHistories?: Record<string, ConversationHistory>;
  conversationSessions?: Record<string, ConversationSession>;
  activeConversationSessionIds?: Record<string, string>;
}

export interface ConversationSessionMetadata {
  title?: string;
  mode?: ConversationSessionMode;
  referencedPdfPaths?: string[];
  includeCurrentPdfInCodex?: boolean;
  api?: ConversationSession["api"];
  codex?: ConversationSession["codex"];
  memory?: ConversationSession["memory"];
  sourceStatus?: ConversationSession["sourceStatus"];
  pinned?: boolean;
  tags?: string[];
  archivedAt?: number;
  parentSessionId?: string;
  installationId?: string;
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
      version: 3,
      id,
      conversationKey: key,
      title: metadata.title || key.replace(/^pdf:/, ""),
      mode: metadata.mode || "chat",
      messages: normalizeSessionMessages(messages, id, timestamp),
      referencedPdfPaths: normalizeStringArray(metadata.referencedPdfPaths),
      includeCurrentPdfInCodex: metadata.includeCurrentPdfInCodex !== false,
      api: normalizeApiSessionMetadata(metadata.api),
      codex: metadata.codex ? { ...metadata.codex, lifecycle: metadata.codex.lifecycle || "active" } : undefined,
      memory: normalizeSessionMemory(metadata.memory),
      sourceStatus: metadata.sourceStatus === "missing" ? "missing" : "available",
      pinned: metadata.pinned === true,
      tags: normalizeTags(metadata.tags),
      archivedAt: metadata.archivedAt,
      parentSessionId: metadata.parentSessionId,
      installationId: metadata.installationId || settings.installationId,
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
    if (metadata.api) session.api = normalizeApiSessionMetadata(metadata.api);
    if (metadata.codex) {
      session.codex = {
        ...(session.codex || {}),
        ...metadata.codex,
        lifecycle: metadata.codex.lifecycle || session.codex?.lifecycle || "active",
      } as ConversationSession["codex"];
    }
    if (metadata.memory) session.memory = normalizeSessionMemory(metadata.memory);
    if (metadata.sourceStatus) session.sourceStatus = metadata.sourceStatus;
    if (typeof metadata.pinned === "boolean") session.pinned = metadata.pinned;
    if (metadata.tags) session.tags = normalizeTags(metadata.tags);
    if (metadata.archivedAt !== undefined) session.archivedAt = metadata.archivedAt;
    if (metadata.parentSessionId !== undefined) session.parentSessionId = metadata.parentSessionId;
    if (metadata.installationId !== undefined) session.installationId = metadata.installationId;
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
      if (!active.archivedAt && active.codex?.lifecycle !== "closed") return cloneSession(active);
      delete settings.activeConversationSessionIds![key];
    }
    const newest = Object.values(sessions)
      .filter(
        (session) =>
          session.conversationKey === key &&
          !session.archivedAt &&
          session.codex?.lifecycle !== "closed"
      )
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
      version: 3,
      id,
      conversationKey: key,
      title: metadata.title || key.replace(/^pdf:/, ""),
      mode: metadata.mode || "chat",
      messages: [],
      referencedPdfPaths: normalizeStringArray(metadata.referencedPdfPaths),
      includeCurrentPdfInCodex: metadata.includeCurrentPdfInCodex !== false,
      api: normalizeApiSessionMetadata(metadata.api),
      codex: metadata.codex ? { ...metadata.codex, lifecycle: metadata.codex.lifecycle || "active" } : undefined,
      memory: normalizeSessionMemory(metadata.memory),
      sourceStatus: metadata.sourceStatus === "missing" ? "missing" : "available",
      pinned: metadata.pinned === true,
      tags: normalizeTags(metadata.tags),
      archivedAt: metadata.archivedAt,
      parentSessionId: metadata.parentSessionId,
      installationId: metadata.installationId,
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
    session.messages = normalizeSessionMessages(normalizedMessages, session.id, timestamp);
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
    session.updatedAt = this.now();
    session.messages = normalizeSessionMessages(messages, session.id, session.updatedAt);
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
    const firstUserTurn = !session.messages.some((message) => message.role === "user");
    const derivedTitle = userContent.replace(/\s+/g, " ").trim().slice(0, 80);
    const messages = [
      ...session.messages,
      { role: "user" as const, content: userContent, status: "complete" as const },
      { role: "assistant" as const, content: assistantContent, status: "complete" as const },
    ];
    await this.saveSessionById(id, messages, firstUserTurn && derivedTitle ? { title: derivedTitle } : {});
  }

  async updateSessionMetadata(id: string, metadata: ConversationSessionMetadata): Promise<void> {
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    await this.saveSessionById(id, session.messages, metadata);
  }

  async beginCodexTurn(id: string, pendingTurn: PendingCodexTurn): Promise<void> {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    const normalized = normalizePendingCodexTurn(pendingTurn);
    if (!normalized) throw new Error("Invalid pending Codex turn");
    session.mode = "codex";
    session.pendingTurn = normalized;
    session.updatedAt = this.now();
    settings.conversationSessions![id] = cloneSession(session);
    await this.persistSettings();
  }

  async updateCodexTurn(
    id: string,
    turnId: string,
    patch: Partial<Pick<PendingCodexTurn, "status" | "threadId" | "progress">>,
    codex?: ConversationSession["codex"]
  ): Promise<void> {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session?.pendingTurn || session.pendingTurn.turnId !== turnId) return;
    const pendingTurn = normalizePendingCodexTurn({ ...session.pendingTurn, ...patch });
    if (!pendingTurn) throw new Error("Invalid pending Codex turn update");
    session.pendingTurn = pendingTurn;
    if (codex) session.codex = { ...(session.codex || {}), ...codex } as ConversationSession["codex"];
    session.updatedAt = this.now();
    settings.conversationSessions![id] = cloneSession(session);
    await this.persistSettings();
  }

  async completeCodexTurn(
    id: string,
    turnId: string,
    userContent: string,
    assistantContent: string,
    codex: ConversationSession["codex"]
  ): Promise<void> {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    if (!session.pendingTurn || session.pendingTurn.turnId !== turnId) {
      const tail = session.messages.slice(-2);
      const alreadyApplied =
        !session.pendingTurn &&
        tail.length === 2 &&
        tail[0].role === "user" &&
        tail[0].content === userContent &&
        tail[1].role === "assistant" &&
        tail[1].content === assistantContent;
      if (alreadyApplied) {
        session.codex = { ...(session.codex || {}), ...codex } as ConversationSession["codex"];
        settings.conversationSessions![id] = cloneSession(session);
        await this.persistSettings();
        return;
      }
      throw new Error("Codex turn no longer matches the persisted pending task");
    }
    const firstUserTurn = !session.messages.some((message) => message.role === "user");
    const derivedTitle = userContent.replace(/\s+/g, " ").trim().slice(0, 80);
    session.messages = normalizeSessionMessages([
      ...session.messages,
      { role: "user", content: userContent, status: "complete" },
      { role: "assistant", content: assistantContent, status: "complete" },
    ], session.id, this.now());
    if (firstUserTurn && derivedTitle) session.title = derivedTitle;
    session.codex = { ...(session.codex || {}), ...codex } as ConversationSession["codex"];
    session.pendingTurn = undefined;
    session.updatedAt = this.now();
    settings.conversationSessions![id] = cloneSession(session);
    if (settings.activeConversationSessionIds?.[session.conversationKey] === id) {
      settings.conversationHistories![session.conversationKey] = {
        version: 1,
        updatedAt: session.updatedAt,
        messages: normalizeConversationMessages(session.messages),
      };
    }
    await this.persistSettings();
  }

  async closeSession(id: string): Promise<void> {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) return;
    if (session.codex) session.codex = { ...session.codex, lifecycle: "closed" };
    if (session.pendingTurn?.status === "running") {
      session.pendingTurn = { ...session.pendingTurn, status: "interrupted", progress: "会话已关闭" };
    }
    session.updatedAt = this.now();
    settings.conversationSessions![id] = cloneSession(session);
    if (settings.activeConversationSessionIds?.[session.conversationKey] === id) {
      delete settings.activeConversationSessionIds[session.conversationKey];
    }
    await this.persistSettings();
  }

  async archiveSession(id: string): Promise<void> {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) return;
    const timestamp = this.now();
    session.archivedAt = timestamp;
    session.updatedAt = timestamp;
    settings.conversationSessions![id] = cloneSession(session);
    if (settings.activeConversationSessionIds?.[session.conversationKey] === id) {
      delete settings.activeConversationSessionIds[session.conversationKey];
    }
    await this.persistSettings();
  }

  async rebindSessionSource(id: string, newPath: string): Promise<void> {
    const path = (newPath || "").trim().replace(/\\/g, "/");
    if (
      !path ||
      !path.toLowerCase().endsWith(".pdf") ||
      /^(?:[A-Za-z]:|\/)/.test(path) ||
      path.split("/").includes("..")
    ) {
      throw new Error("Rebind requires a vault-relative PDF path");
    }
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    const oldKey = session.conversationKey;
    const oldPath = oldKey.startsWith("pdf:") ? oldKey.slice("pdf:".length) : "";
    session.conversationKey = ["pdf", path].join(":");
    session.sourceStatus = "available";
    session.messages = session.messages.map((message) => ({
      ...message,
      ...(message.evidence?.length
        ? {
            evidence: message.evidence.map((evidence) =>
              evidence.paperPath === oldPath
                ? { ...evidence, verification: "unverified" as const }
                : { ...evidence }
            ),
          }
        : {}),
    }));
    session.updatedAt = this.now();
    settings.conversationSessions![id] = cloneSession(session);
    if (settings.activeConversationSessionIds?.[oldKey] === id) {
      delete settings.activeConversationSessionIds[oldKey];
      settings.activeConversationSessionIds[session.conversationKey] = id;
    }
    await this.persistSettings();
  }

  async clearSession(id: string): Promise<void> {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) return;
    delete settings.conversationSessions![id];
    if (settings.activeConversationSessionIds?.[session.conversationKey] === id) {
      delete settings.activeConversationSessionIds[session.conversationKey];
      delete settings.conversationHistories![session.conversationKey];
    }
    await this.persistSettings();
  }

  resumeSession(id: string): ConversationSession | null {
    const settings = this.ensureContainers();
    const sessions = normalizeConversationSessions(settings.conversationSessions);
    const session = sessions[id];
    if (!session) return null;
    if (session.codex) session.codex = { ...session.codex, lifecycle: "active" };
    session.archivedAt = undefined;
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
