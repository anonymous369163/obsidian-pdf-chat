import type {
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
