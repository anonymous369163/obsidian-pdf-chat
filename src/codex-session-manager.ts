import {
  buildCodexThreadExecArgs,
  isCodexThreadUnavailableError,
  runCodexThreadTurn,
  type CodexThreadExecArgs,
  type CodexThreadProgress,
  type CodexThreadTurnResult,
  type RunCodexThreadTurnOptions,
} from "./codex-cli";
import { parseResearchEvidence, type EvidenceSource } from "./evidence";
import type {
  CodexReasoningEffort,
  CodexRecoveryReason,
  CodexSessionMetadata,
  CodexVerbosity,
  ConversationSession,
  PendingCodexTurn,
  ResearchEvidence,
} from "./types";

export type CodexTurnStatus = "idle" | "running" | "stopped" | "failed" | "closed";

export interface CodexTurnSnapshot {
  sessionId: string;
  turnId?: string;
  threadId?: string;
  status: CodexTurnStatus;
  question?: string;
  progress?: string;
  startedAt?: number;
  workingDirectory?: string;
  attachedPdfPaths: string[];
  evidenceSources?: EvidenceSource[];
  selectionChars: number;
  profile?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  verbosity?: CodexVerbosity;
  finalMarkdown?: string;
  error?: string;
  recoveryReason?: CodexRecoveryReason;
}

export interface StartCodexTurnRequest {
  sessionId: string;
  question: string;
  userContent: string;
  prompt: string;
  command: string;
  workingDirectory: string;
  attachedPdfPaths: string[];
  evidenceSources?: EvidenceSource[];
  selectionChars: number;
  profile?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  verbosity?: CodexVerbosity;
  timeoutMs: number;
}

export interface CodexSessionPersistence {
  getSession(id: string): ConversationSession | null;
  listSessions?(query?: string): ConversationSession[];
  beginCodexTurn(id: string, pendingTurn: PendingCodexTurn): Promise<void>;
  updateCodexTurn(
    id: string,
    turnId: string,
    patch: Partial<Pick<PendingCodexTurn, "status" | "threadId" | "progress">>,
    codex?: CodexSessionMetadata
  ): Promise<void>;
  completeCodexTurn(
    id: string,
    turnId: string,
    userContent: string,
    assistantContent: string,
    codex: CodexSessionMetadata,
    evidence?: ResearchEvidence[]
  ): Promise<void>;
  closeSession(id: string): Promise<void>;
  updateSessionMetadata?(
    id: string,
    metadata: Partial<Pick<ConversationSession, "installationId">>
  ): Promise<void>;
}

export interface CodexSessionManagerOptions {
  installationId?: string;
}

export type CodexThreadRunner = (
  args: CodexThreadExecArgs,
  options: RunCodexThreadTurnOptions
) => Promise<CodexThreadTurnResult>;

interface ManagedTurn {
  snapshot: CodexTurnSnapshot;
  controller?: AbortController;
  listeners: Set<(snapshot: CodexTurnSnapshot) => void>;
  runToken: number;
  pendingResult?: {
    turnId: string;
    userContent: string;
    assistantContent: string;
    codex: CodexSessionMetadata;
    evidence?: ResearchEvidence[];
  };
}

export interface CodexSessionEvent {
  snapshot: CodexTurnSnapshot;
  hasSessionSubscribers: boolean;
}

function cloneSnapshot(snapshot: CodexTurnSnapshot): CodexTurnSnapshot {
  return {
    ...snapshot,
    attachedPdfPaths: [...snapshot.attachedPdfPaths],
    evidenceSources: snapshot.evidenceSources?.map((source) => ({ ...source })),
  };
}

function isAbortError(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { name?: string }).name === "AbortError";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "Unknown Codex error");
}

export class CodexSessionManager {
  private readonly turns = new Map<string, ManagedTurn>();
  private readonly globalListeners = new Set<(event: CodexSessionEvent) => void>();
  private nextRunToken = 1;

  constructor(
    private readonly persistence: CodexSessionPersistence,
    private readonly runner: CodexThreadRunner = runCodexThreadTurn,
    private readonly options: CodexSessionManagerOptions = {}
  ) {}

  private isForeignThread(session: ConversationSession): boolean {
    return Boolean(
      session.codex?.threadId &&
        session.installationId &&
        this.options.installationId &&
        session.installationId !== this.options.installationId
    );
  }

  private managed(sessionId: string): ManagedTurn {
    let managed = this.turns.get(sessionId);
    if (managed) return managed;
    const session = this.persistence.getSession(sessionId);
    managed = {
      snapshot: {
        sessionId,
        turnId: session?.pendingTurn?.turnId,
        threadId: session?.codex?.threadId,
        status:
          session?.codex?.lifecycle === "closed"
            ? "closed"
            : session?.pendingTurn?.status === "failed"
              ? "failed"
              : session?.pendingTurn
                ? "stopped"
                : "idle",
        question: session?.pendingTurn?.question,
        progress: session?.pendingTurn?.progress,
        startedAt: session?.pendingTurn?.startedAt,
        attachedPdfPaths: [
          ...(session?.pendingTurn?.attachedPdfPaths || session?.referencedPdfPaths || []),
        ],
        selectionChars: session?.pendingTurn?.selectionChars || 0,
      },
      listeners: new Set(),
      runToken: 0,
    };
    this.turns.set(sessionId, managed);
    return managed;
  }

  private notify(managed: ManagedTurn): void {
    const snapshot = cloneSnapshot(managed.snapshot);
    for (const listener of managed.listeners) listener(snapshot);
    const event = { snapshot, hasSessionSubscribers: managed.listeners.size > 0 };
    for (const listener of this.globalListeners) listener(event);
  }

  getSnapshot(sessionId: string): CodexTurnSnapshot {
    return cloneSnapshot(this.managed(sessionId).snapshot);
  }

  subscribe(sessionId: string, listener: (snapshot: CodexTurnSnapshot) => void): () => void {
    const managed = this.managed(sessionId);
    managed.listeners.add(listener);
    listener(cloneSnapshot(managed.snapshot));
    return () => managed.listeners.delete(listener);
  }

  subscribeAll(listener: (event: CodexSessionEvent) => void): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  listSnapshots(): CodexTurnSnapshot[] {
    const sessionIds = new Set<string>(this.turns.keys());
    for (const session of this.persistence.listSessions?.("") || []) {
      if (session.pendingTurn) sessionIds.add(session.id);
    }
    return Array.from(sessionIds)
      .map((sessionId) => this.getSnapshot(sessionId))
      .filter((snapshot) => snapshot.status !== "idle" && snapshot.status !== "closed")
      .sort((left, right) => (right.startedAt || 0) - (left.startedAt || 0));
  }

  async startTurn(request: StartCodexTurnRequest): Promise<CodexTurnSnapshot> {
    const session = this.persistence.getSession(request.sessionId);
    if (!session) throw new Error(`Conversation session not found: ${request.sessionId}`);
    if (session.codex?.lifecycle === "closed") {
      throw new Error("This Codex session is closed. Use /resume before continuing it.");
    }
    const managed = this.managed(request.sessionId);
    const evidenceSources = (request.evidenceSources || []).map((source) => ({ ...source }));
    if (managed.snapshot.status === "running") {
      throw new Error("This Codex session already has a running turn");
    }
    if (this.isForeignThread(session)) {
      const recoveryMessage =
        "该 Codex thread 属于另一台设备，请查看历史或创建 local fork（本地分支）。";
      managed.snapshot = {
        sessionId: request.sessionId,
        threadId: session.codex?.threadId,
        status: "failed",
        question: request.question,
        progress: recoveryMessage,
        attachedPdfPaths: [...request.attachedPdfPaths],
        evidenceSources,
        selectionChars: request.selectionChars,
        profile: request.profile,
        model: request.model,
        reasoningEffort: request.reasoningEffort,
        verbosity: request.verbosity,
        error: recoveryMessage,
        recoveryReason: "foreign-installation",
      };
      this.notify(managed);
      return cloneSnapshot(managed.snapshot);
    }

    if (!session.installationId && this.options.installationId) {
      await this.persistence.updateSessionMetadata?.(request.sessionId, {
        installationId: this.options.installationId,
      });
    }

    const runToken = this.nextRunToken++;
    const turnId = `turn-${Date.now()}-${runToken}`;
    const controller = new AbortController();
    managed.runToken = runToken;
    managed.controller = controller;
    managed.snapshot = {
      sessionId: request.sessionId,
      turnId,
      threadId: session.codex?.threadId,
      status: "running",
      question: request.question,
      progress: "Codex 正在启动",
      startedAt: Date.now(),
      workingDirectory: request.workingDirectory,
      attachedPdfPaths: [...request.attachedPdfPaths],
      evidenceSources,
      selectionChars: request.selectionChars,
      profile: request.profile,
      model: request.model,
      reasoningEffort: request.reasoningEffort,
      verbosity: request.verbosity,
    };
    try {
      await this.persistence.beginCodexTurn(request.sessionId, {
        turnId,
        question: request.question,
        status: "running",
        startedAt: managed.snapshot.startedAt || Date.now(),
        threadId: session.codex?.threadId,
        attachedPdfPaths: [...request.attachedPdfPaths],
        selectionChars: request.selectionChars,
        progress: managed.snapshot.progress,
      });
    } catch (error) {
      managed.controller = undefined;
      managed.snapshot.status = "failed";
      managed.snapshot.error = `Codex 未启动，任务日志保存失败：${errorMessage(error)}`;
      managed.snapshot.progress = managed.snapshot.error;
      this.notify(managed);
      return cloneSnapshot(managed.snapshot);
    }
    this.notify(managed);

    const codexMetadata = (): CodexSessionMetadata => ({
      model: request.model || session.codex?.model || "",
      reasoningEffort: request.reasoningEffort || session.codex?.reasoningEffort || "medium",
      profile: request.profile ?? session.codex?.profile ?? "",
      threadId: managed.snapshot.threadId,
      lifecycle: "active",
    });
    let threadSave: Promise<void> = Promise.resolve();
    let progressSave: Promise<void> = Promise.resolve();
    let lastProgressPersistedAt = 0;
    const args = buildCodexThreadExecArgs({
      command: request.command,
      workingDirectory: request.workingDirectory,
      threadId: session.codex?.threadId,
      prompt: request.prompt,
      profile: request.profile,
      model: request.model,
      reasoningEffort: request.reasoningEffort,
      verbosity: request.verbosity,
    });

    try {
      if (controller.signal.aborted) {
        const error = new Error("Codex turn was stopped before the process started");
        error.name = "AbortError";
        throw error;
      }
      const result = await this.runner(args, {
        workingDirectory: request.workingDirectory,
        timeoutMs: request.timeoutMs,
        signal: controller.signal,
        onThreadId: (threadId) => {
          if (managed.runToken !== runToken || managed.snapshot.status === "closed") return;
          managed.snapshot.threadId = threadId;
          threadSave = this.persistence.updateCodexTurn(
            request.sessionId,
            turnId,
            { threadId },
            codexMetadata()
          );
          this.notify(managed);
        },
        onProgress: (progress: CodexThreadProgress) => {
          if (managed.runToken !== runToken || managed.snapshot.status !== "running") return;
          managed.snapshot.progress = progress.message;
          const now = Date.now();
          if (now - lastProgressPersistedAt >= 2000) {
            lastProgressPersistedAt = now;
            progressSave = progressSave
              .catch(() => undefined)
              .then(() =>
                this.persistence.updateCodexTurn(request.sessionId, turnId, {
                  progress: progress.message,
                })
              );
          }
          this.notify(managed);
        },
      });
      if (managed.runToken !== runToken || managed.snapshot.status === "closed") {
        return cloneSnapshot(managed.snapshot);
      }
      managed.snapshot.threadId = result.threadId;
      managed.snapshot.finalMarkdown = result.markdown;
      const evidence = parseResearchEvidence(result.markdown, evidenceSources);
      managed.pendingResult = {
        turnId,
        userContent: request.userContent,
        assistantContent: result.markdown,
        codex: codexMetadata(),
        ...(evidence.length ? { evidence } : {}),
      };
      await threadSave;
      await progressSave;
      await this.persistence.completeCodexTurn(
        request.sessionId,
        turnId,
        request.userContent,
        result.markdown,
        codexMetadata(),
        evidence.length ? evidence : undefined
      );
      if (managed.runToken !== runToken) return cloneSnapshot(managed.snapshot);
      managed.pendingResult = undefined;
      managed.snapshot.status = "idle";
      managed.snapshot.progress = "Codex 已完成本轮回答";
      managed.snapshot.error = undefined;
      managed.snapshot.recoveryReason = undefined;
      this.notify(managed);
    } catch (error) {
      if (managed.runToken !== runToken || managed.snapshot.status === "closed") {
        return cloneSnapshot(managed.snapshot);
      }
      if (isAbortError(error)) {
        managed.snapshot.status = "stopped";
        managed.snapshot.progress = "Codex 本轮已停止，可继续使用同一 thread 提问";
        void this.persistence
          .updateCodexTurn(request.sessionId, turnId, {
            status: "interrupted",
            progress: managed.snapshot.progress,
            threadId: managed.snapshot.threadId,
          })
          .catch(() => undefined);
      } else {
        managed.snapshot.status = "failed";
        const threadUnavailable = isCodexThreadUnavailableError(error);
        managed.snapshot.recoveryReason = threadUnavailable ? "thread-unavailable" : undefined;
        managed.snapshot.error = managed.snapshot.finalMarkdown
          ? `Codex 回答已生成，但保存失败：${errorMessage(error)}`
          : threadUnavailable
          ? "Codex thread 在本机不可用。请查看历史或创建 local fork（本地分支），不会静默新建 thread。"
          : errorMessage(error);
        managed.snapshot.progress = managed.snapshot.error;
        void this.persistence
          .updateCodexTurn(request.sessionId, turnId, {
            status: "failed",
            progress: managed.snapshot.progress,
            threadId: managed.snapshot.threadId,
          })
          .catch(() => undefined);
      }
      this.notify(managed);
    } finally {
      if (managed.runToken === runToken) managed.controller = undefined;
    }
    return cloneSnapshot(managed.snapshot);
  }

  async retryPersistResult(sessionId: string): Promise<boolean> {
    const managed = this.turns.get(sessionId);
    const pending = managed?.pendingResult;
    if (!managed || !pending) return false;
    await this.persistence.completeCodexTurn(
      sessionId,
      pending.turnId,
      pending.userContent,
      pending.assistantContent,
      pending.codex,
      pending.evidence
    );
    managed.pendingResult = undefined;
    managed.snapshot.status = "idle";
    managed.snapshot.progress = "Codex 回答已重新保存";
    managed.snapshot.error = undefined;
    this.notify(managed);
    return true;
  }

  stopTurn(sessionId: string): boolean {
    const managed = this.turns.get(sessionId);
    if (!managed?.controller || managed.snapshot.status !== "running") return false;
    managed.snapshot.progress = "正在停止 Codex 本轮任务";
    this.notify(managed);
    managed.controller.abort();
    return true;
  }

  async closeSession(sessionId: string): Promise<void> {
    const managed = this.managed(sessionId);
    managed.snapshot.status = "closed";
    managed.snapshot.progress = "Codex 会话已关闭，可通过 /resume 找回";
    managed.runToken = this.nextRunToken++;
    managed.controller?.abort();
    managed.controller = undefined;
    await this.persistence.closeSession(sessionId);
    this.notify(managed);
  }

  reactivateSession(sessionId: string): void {
    const managed = this.managed(sessionId);
    const session = this.persistence.getSession(sessionId);
    managed.snapshot = {
      sessionId,
      turnId: session?.pendingTurn?.turnId,
      threadId: session?.codex?.threadId,
      status: session?.pendingTurn?.status === "failed" ? "failed" : session?.pendingTurn ? "stopped" : "idle",
      question: session?.pendingTurn?.question,
      progress: session?.pendingTurn?.progress,
      startedAt: session?.pendingTurn?.startedAt,
      attachedPdfPaths: [...(session?.pendingTurn?.attachedPdfPaths || session?.referencedPdfPaths || [])],
      selectionChars: session?.pendingTurn?.selectionChars || 0,
    };
    this.notify(managed);
  }

  dispose(): void {
    for (const managed of this.turns.values()) {
      managed.runToken = this.nextRunToken++;
      managed.controller?.abort();
      managed.controller = undefined;
      managed.listeners.clear();
    }
    this.globalListeners.clear();
  }
}
