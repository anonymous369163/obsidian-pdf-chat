import {
  buildCodexThreadExecArgs,
  isCodexThreadUnavailableError,
  runCodexThreadTurn,
  type CodexThreadExecArgs,
  type CodexThreadProgress,
  type CodexThreadTurnResult,
  type RunCodexThreadTurnOptions,
} from "./codex-cli";
import type {
  CodexReasoningEffort,
  CodexSessionMetadata,
  CodexVerbosity,
  ConversationSession,
} from "./types";

export type CodexTurnStatus = "idle" | "running" | "stopped" | "failed" | "closed";

export interface CodexTurnSnapshot {
  sessionId: string;
  threadId?: string;
  status: CodexTurnStatus;
  question?: string;
  progress?: string;
  startedAt?: number;
  workingDirectory?: string;
  attachedPdfPaths: string[];
  selectionChars: number;
  finalMarkdown?: string;
  error?: string;
}

export interface StartCodexTurnRequest {
  sessionId: string;
  question: string;
  userContent: string;
  prompt: string;
  command: string;
  workingDirectory: string;
  attachedPdfPaths: string[];
  selectionChars: number;
  profile?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  verbosity?: CodexVerbosity;
  timeoutMs: number;
}

export interface CodexSessionPersistence {
  getSession(id: string): ConversationSession | null;
  updateSessionMetadata(
    id: string,
    metadata: { codex: CodexSessionMetadata }
  ): Promise<void>;
  appendSessionTurn(id: string, userContent: string, assistantContent: string): Promise<void>;
  closeSession(id: string): Promise<void>;
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
}

function cloneSnapshot(snapshot: CodexTurnSnapshot): CodexTurnSnapshot {
  return { ...snapshot, attachedPdfPaths: [...snapshot.attachedPdfPaths] };
}

function isAbortError(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { name?: string }).name === "AbortError";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "Unknown Codex error");
}

export class CodexSessionManager {
  private readonly turns = new Map<string, ManagedTurn>();
  private nextRunToken = 1;

  constructor(
    private readonly persistence: CodexSessionPersistence,
    private readonly runner: CodexThreadRunner = runCodexThreadTurn
  ) {}

  private managed(sessionId: string): ManagedTurn {
    let managed = this.turns.get(sessionId);
    if (managed) return managed;
    const session = this.persistence.getSession(sessionId);
    managed = {
      snapshot: {
        sessionId,
        threadId: session?.codex?.threadId,
        status: session?.codex?.lifecycle === "closed" ? "closed" : "idle",
        attachedPdfPaths: [...(session?.referencedPdfPaths || [])],
        selectionChars: 0,
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

  async startTurn(request: StartCodexTurnRequest): Promise<CodexTurnSnapshot> {
    const session = this.persistence.getSession(request.sessionId);
    if (!session) throw new Error(`Conversation session not found: ${request.sessionId}`);
    if (session.codex?.lifecycle === "closed") {
      throw new Error("This Codex session is closed. Use /resume before continuing it.");
    }
    const managed = this.managed(request.sessionId);
    if (managed.snapshot.status === "running") {
      throw new Error("This Codex session already has a running turn");
    }

    const runToken = this.nextRunToken++;
    const controller = new AbortController();
    managed.runToken = runToken;
    managed.controller = controller;
    managed.snapshot = {
      sessionId: request.sessionId,
      threadId: session.codex?.threadId,
      status: "running",
      question: request.question,
      progress: "Codex 正在启动",
      startedAt: Date.now(),
      workingDirectory: request.workingDirectory,
      attachedPdfPaths: [...request.attachedPdfPaths],
      selectionChars: request.selectionChars,
    };
    this.notify(managed);

    const codexMetadata = (): CodexSessionMetadata => ({
      model: request.model || session.codex?.model || "",
      reasoningEffort: request.reasoningEffort || session.codex?.reasoningEffort || "medium",
      profile: request.profile ?? session.codex?.profile ?? "",
      threadId: managed.snapshot.threadId,
      lifecycle: "active",
    });
    let threadSave: Promise<void> = Promise.resolve();
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
      const result = await this.runner(args, {
        workingDirectory: request.workingDirectory,
        timeoutMs: request.timeoutMs,
        signal: controller.signal,
        onThreadId: (threadId) => {
          if (managed.runToken !== runToken || managed.snapshot.status === "closed") return;
          managed.snapshot.threadId = threadId;
          threadSave = this.persistence.updateSessionMetadata(request.sessionId, {
            codex: codexMetadata(),
          });
          this.notify(managed);
        },
        onProgress: (progress: CodexThreadProgress) => {
          if (managed.runToken !== runToken || managed.snapshot.status !== "running") return;
          managed.snapshot.progress = progress.message;
          this.notify(managed);
        },
      });
      await threadSave;
      if (managed.runToken !== runToken || managed.snapshot.status === "closed") {
        return cloneSnapshot(managed.snapshot);
      }
      managed.snapshot.threadId = result.threadId;
      await this.persistence.updateSessionMetadata(request.sessionId, {
        codex: codexMetadata(),
      });
      if (managed.runToken !== runToken) return cloneSnapshot(managed.snapshot);
      await this.persistence.appendSessionTurn(request.sessionId, request.userContent, result.markdown);
      managed.snapshot.status = "idle";
      managed.snapshot.progress = "Codex 已完成本轮回答";
      managed.snapshot.finalMarkdown = result.markdown;
      managed.snapshot.error = undefined;
      this.notify(managed);
    } catch (error) {
      if (managed.runToken !== runToken || managed.snapshot.status === "closed") {
        return cloneSnapshot(managed.snapshot);
      }
      if (isAbortError(error)) {
        managed.snapshot.status = "stopped";
        managed.snapshot.progress = "Codex 本轮已停止，可继续使用同一 thread 提问";
      } else {
        managed.snapshot.status = "failed";
        managed.snapshot.error = isCodexThreadUnavailableError(error)
          ? "Codex 会话可能来自另一台设备，或本机 Codex thread 记录已被删除。请用 /new 创建新会话。"
          : errorMessage(error);
        managed.snapshot.progress = managed.snapshot.error;
      }
      this.notify(managed);
    } finally {
      if (managed.runToken === runToken) managed.controller = undefined;
    }
    return cloneSnapshot(managed.snapshot);
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
      threadId: session?.codex?.threadId,
      status: "idle",
      attachedPdfPaths: [...(session?.referencedPdfPaths || [])],
      selectionChars: 0,
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
  }
}
