import type {
  CodexRecoveryReason,
  CodexRuntimeOperations,
  ConversationOperations,
  ConversationSession,
  ResearchArtifactOperations,
  ResearchArtifactWriteResult,
} from "./types";

export interface SessionLibraryQuery {
  text: string;
  scope: "current" | "all";
  currentConversationKey?: string;
  mode: "all" | "chat" | "codex";
  archived: "active" | "archived" | "all";
  updatedAfter?: number;
}

export interface SessionLibraryDependencies {
  conversations: ConversationOperations;
  artifacts?: Pick<ResearchArtifactOperations, "exportSessionMarkdown">;
  codex?: Pick<CodexRuntimeOperations, "getSnapshot">;
  confirmDelete?: (session: ConversationSession) => boolean | Promise<boolean>;
  installationId?: () => string;
}

export interface CodexForkRequest {
  availablePdfPaths: string[];
  handoffMaxChars: number;
}

export interface CodexForkPreview {
  attachedPdfPaths: string[];
  omittedPdfPaths: string[];
  handoffChars: number;
  messageCount: number;
}

export interface CodexRecoveryState {
  reason?: CodexRecoveryReason;
  canResumeNativeThread: boolean;
}

function normalizeTags(tags: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const candidate of Array.isArray(tags) ? tags : []) {
    if (typeof candidate !== "string") continue;
    const tag = candidate.trim().replace(/^#+/, "").toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag.slice(0, 60));
  }
  return result.slice(0, 20);
}

function searchableText(session: ConversationSession): string {
  return [
    session.title,
    session.conversationKey,
    ...(session.tags || []),
    ...(session.referencedPdfPaths || []),
    ...(session.messages || []).map((message) => message.content),
  ]
    .join(" ")
    .toLowerCase();
}

function primaryPdfPath(session: ConversationSession): string | undefined {
  return session.conversationKey.startsWith("pdf:")
    ? session.conversationKey.slice("pdf:".length)
    : undefined;
}

function selectForkHandoff(session: ConversationSession, maxChars: number): {
  memory: ConversationSession["memory"];
  messages: ConversationSession["messages"];
  chars: number;
} {
  const limit = Math.max(0, Math.floor(maxChars || 0));
  const originalMemory = session.memory?.content || "";
  const memoryContent = originalMemory.slice(0, limit);
  const memory = session.memory
    ? { ...session.memory, content: memoryContent }
    : undefined;
  let remaining = Math.max(0, limit - memoryContent.length);
  const messages: ConversationSession["messages"] = [];
  for (let index = session.messages.length - 1; index >= 0; index -= 1) {
    const message = session.messages[index];
    if (message.content.length > remaining) break;
    messages.unshift({
      ...message,
      evidence: message.evidence?.map((evidence) => ({ ...evidence })),
    });
    remaining -= message.content.length;
  }
  return { memory, messages, chars: limit - remaining };
}

export function formatCodexForkHandoff(session: ConversationSession): string {
  const parts: string[] = [];
  if (session.memory?.content.trim()) {
    parts.push(`Earlier session memory:\n${session.memory.content.trim()}`);
  }
  if (session.messages.length) {
    const visibleTurns = session.messages
      .map((message) => `${message.role === "user" ? "User" : "Assistant"}:\n${message.content}`)
      .join("\n\n");
    parts.push(`Recent visible turns from the parent session:\n${visibleTurns}`);
  }
  if (!parts.length) return "";
  return [
    "This is an explicit local fork of a Codex session whose native thread is unavailable here.",
    "Use the bounded visible handoff below only as prior discussion context; do not claim access to the old native thread.",
    ...parts,
  ].join("\n\n");
}

export class SessionLibraryService {
  constructor(private readonly dependencies: SessionLibraryDependencies) {}

  query(query: SessionLibraryQuery): ConversationSession[] {
    const needle = (query.text || "").trim().toLowerCase();
    const sessions = this.dependencies.conversations.listSessions?.("") || [];
    return sessions
      .filter((session) => {
        if (
          query.scope === "current" &&
          query.currentConversationKey &&
          session.conversationKey !== query.currentConversationKey
        ) {
          return false;
        }
        if (query.mode !== "all" && session.mode !== query.mode) return false;
        const archived = Boolean(session.archivedAt);
        if (query.archived === "active" && archived) return false;
        if (query.archived === "archived" && !archived) return false;
        if (query.updatedAfter && session.updatedAt < query.updatedAfter) return false;
        return !needle || searchableText(session).includes(needle);
      })
      .sort(
        (left, right) =>
          Number(right.pinned) - Number(left.pinned) ||
          right.updatedAt - left.updatedAt ||
          left.id.localeCompare(right.id)
      );
  }

  async rename(id: string, title: string): Promise<void> {
    const normalized = (title || "").replace(/\s+/g, " ").trim();
    if (!normalized) throw new Error("会话标题不能为空");
    if (normalized.length > 120) throw new Error("会话标题不能超过 120 个字符");
    await this.update(id, { title: normalized });
  }

  async setTags(id: string, tags: string[]): Promise<void> {
    await this.update(id, { tags: normalizeTags(tags) });
  }

  async setPinned(id: string, pinned: boolean): Promise<void> {
    await this.update(id, { pinned });
  }

  async archive(id: string): Promise<void> {
    this.assertNotRunning(id, "归档");
    if (!this.dependencies.conversations.archiveSession) {
      throw new Error("当前存储不支持归档会话");
    }
    await this.dependencies.conversations.archiveSession(id);
  }

  reactivate(id: string): ConversationSession {
    const session = this.dependencies.conversations.resumeSession?.(id);
    if (!session) throw new Error("没有找到要恢复的会话");
    return session;
  }

  async export(id: string, targetPath?: string): Promise<ResearchArtifactWriteResult> {
    const session = this.requireSession(id);
    if (!this.dependencies.artifacts) throw new Error("会话导出服务不可用");
    return this.dependencies.artifacts.exportSessionMarkdown(session, targetPath);
  }

  async rebind(id: string, newPath: string): Promise<void> {
    if (!this.dependencies.conversations.rebindSessionSource) {
      throw new Error("当前存储不支持重新绑定 PDF");
    }
    await this.dependencies.conversations.rebindSessionSource(id, newPath);
  }

  getCodexRecovery(session: ConversationSession): CodexRecoveryState {
    const liveReason = this.dependencies.codex?.getSnapshot(session.id)?.recoveryReason;
    if (liveReason) return { reason: liveReason, canResumeNativeThread: false };
    const localInstallationId = this.dependencies.installationId?.() || "";
    const foreign = Boolean(
      session.codex?.threadId &&
        session.installationId &&
        localInstallationId &&
        session.installationId !== localInstallationId
    );
    return foreign
      ? { reason: "foreign-installation", canResumeNativeThread: false }
      : { canResumeNativeThread: true };
  }

  previewCodexFork(id: string, request: CodexForkRequest): CodexForkPreview {
    const session = this.requireSession(id);
    const available = new Set(request.availablePdfPaths.filter(Boolean));
    const currentPath = primaryPdfPath(session);
    const candidates = [
      ...(session.includeCurrentPdfInCodex && currentPath ? [currentPath] : []),
      ...(session.referencedPdfPaths || []),
    ].filter((path, index, all) => all.indexOf(path) === index);
    const handoff = selectForkHandoff(session, request.handoffMaxChars);
    return {
      attachedPdfPaths: candidates.filter((path) => available.has(path)),
      omittedPdfPaths: candidates.filter((path) => !available.has(path)),
      handoffChars: handoff.chars,
      messageCount: handoff.messages.length,
    };
  }

  async createCodexFork(id: string, request: CodexForkRequest): Promise<ConversationSession> {
    const parent = this.requireSession(id);
    if (!this.dependencies.conversations.startSession || !this.dependencies.conversations.saveSessionById) {
      throw new Error("当前存储不支持创建 Codex 本地分支");
    }
    const installationId = this.dependencies.installationId?.().trim() || "";
    if (!installationId) throw new Error("缺少本机安装标识，无法安全创建 Codex 分支");
    const available = new Set(request.availablePdfPaths.filter(Boolean));
    const currentPath = primaryPdfPath(parent);
    const handoff = selectForkHandoff(parent, request.handoffMaxChars);
    const referencedPdfPaths = (parent.referencedPdfPaths || []).filter((path) => available.has(path));
    const metadata = {
      title: `Fork: ${parent.title}`.slice(0, 120),
      mode: "codex" as const,
      referencedPdfPaths,
      includeCurrentPdfInCodex: Boolean(
        parent.includeCurrentPdfInCodex && currentPath && available.has(currentPath)
      ),
      codex: {
        model: parent.codex?.model || "",
        reasoningEffort: parent.codex?.reasoningEffort || "medium" as const,
        profile: parent.codex?.profile || "",
        lifecycle: "active" as const,
      },
      memory: handoff.memory,
      sourceStatus: parent.sourceStatus,
      parentSessionId: parent.id,
      installationId,
    };
    const child = this.dependencies.conversations.startSession(parent.conversationKey, metadata);
    const messages = handoff.messages.map((message, index) => ({
      ...message,
      id: `${child.id}-fork-${index + 1}`,
      evidence: message.evidence?.map((evidence) => ({
        ...evidence,
        verification:
          evidence.paperPath && !available.has(evidence.paperPath)
            ? "unverified" as const
            : evidence.verification,
      })),
    }));
    await this.dependencies.conversations.saveSessionById(child.id, messages, metadata);
    return this.dependencies.conversations.getSession?.(child.id) || { ...child, messages };
  }

  async delete(id: string): Promise<boolean> {
    const session = this.requireSession(id);
    this.assertNotRunning(id, "删除");
    const confirmed = await (this.dependencies.confirmDelete?.(session) ?? false);
    if (!confirmed) return false;
    if (!this.dependencies.conversations.clearSession) {
      throw new Error("当前存储不支持删除会话");
    }
    await this.dependencies.conversations.clearSession(id);
    return true;
  }

  private requireSession(id: string): ConversationSession {
    const session = this.dependencies.conversations.getSession?.(id);
    if (!session) throw new Error(`没有找到会话：${id}`);
    return session;
  }

  private async update(
    id: string,
    patch: Partial<Pick<ConversationSession, "title" | "tags" | "pinned">>
  ): Promise<void> {
    this.requireSession(id);
    if (!this.dependencies.conversations.updateSessionMetadata) {
      throw new Error("当前存储不支持更新会话");
    }
    await this.dependencies.conversations.updateSessionMetadata(id, patch);
  }

  private assertNotRunning(id: string, action: string): void {
    const session = this.requireSession(id);
    const live = this.dependencies.codex?.getSnapshot(id);
    if (live?.status === "running" || session.pendingTurn?.status === "running") {
      throw new Error(`Codex 会话正在运行，不能${action}`);
    }
  }
}
