import type { CodexReasoningEffort, CodexVerbosity } from "./types";
import { resolveCodexExecArgs } from "./multi-paper";

export interface CodexPdfReference {
  role: "current" | "referenced";
  name: string;
  absolutePath: string;
}

export interface CodexPdfLocation {
  absolutePath: string;
  workingDirectory: string;
}

export interface BuildCodexTurnPromptRequest {
  question: string;
  papers: CodexPdfReference[];
  selectedContext?: string;
}

export interface BuildCodexThreadExecArgsRequest {
  command: string;
  workingDirectory: string;
  prompt: string;
  threadId?: string;
  profile?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  verbosity?: CodexVerbosity;
}

export interface CodexThreadExecArgs {
  command: string;
  args: string[];
  threadId?: string;
}

export interface CodexThreadTurnResult {
  threadId: string;
  markdown: string;
}

export interface CodexThreadProgress {
  type: string;
  message: string;
  elapsedMs: number;
}

interface CodexChildProcess {
  pid?: number;
  stdin?: { end(): void };
  stdout?: { on(event: "data", handler: (chunk: unknown) => void): void };
  stderr?: { on(event: "data", handler: (chunk: unknown) => void): void };
  on(event: "close", handler: (code: number | null) => void): void;
  on(event: "error", handler: (error: Error) => void): void;
  kill(signal?: string): void;
}

export interface RunCodexThreadTurnOptions {
  workingDirectory: string;
  timeoutMs: number;
  signal?: AbortSignal;
  onThreadId?: (threadId: string) => void | Promise<void>;
  onProgress?: (progress: CodexThreadProgress) => void;
  spawn?: (
    command: string,
    args: string[],
    options?: { cwd?: string; windowsHide?: boolean; shell?: boolean }
  ) => CodexChildProcess;
}

function loadNodeModule<T>(name: string): T {
  const nodeRequire = typeof require === "function" ? require : null;
  if (!nodeRequire) throw new Error("Node.js APIs are not available in this Obsidian environment");
  return nodeRequire(name) as T;
}

export function resolveCodexPdfLocation(
  app: unknown,
  vaultPath: string
): CodexPdfLocation {
  const adapter = (app as {
    vault?: { adapter?: { getFullPath?: (vaultPath: string) => string } };
  })?.vault?.adapter;
  if (!adapter || typeof adapter.getFullPath !== "function") {
    throw new Error("Codex native PDF sessions require the Obsidian desktop file-system adapter");
  }
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  const absolutePath = adapter.getFullPath(vaultPath);
  if (!absolutePath) throw new Error(`Unable to resolve PDF path: ${vaultPath}`);
  return { absolutePath, workingDirectory: path.dirname(absolutePath) };
}

function quotePathForPrompt(file: CodexPdfReference): string {
  const label = file.role === "current" ? "当前论文" : "引用论文";
  return `- ${label}（${file.name}）：${file.absolutePath}`;
}

export function buildCodexTurnPrompt(request: BuildCodexTurnPromptRequest): string {
  const question = (request.question || "").trim();
  const papers = request.papers || [];
  const selection = (request.selectedContext || "").trim();
  const sections = [
    `用户问题：\n${question}`,
    papers.length
      ? `本轮可参考的 PDF：\n${papers.map(quotePathForPrompt).join("\n")}`
      : "本轮没有附加 PDF。",
  ];
  if (selection) sections.push(`本轮选区上下文：\n${selection}`);
  sections.push(
    "请直接回答用户问题。只有问题确实需要论文内容时才读取上述 PDF；普通问候或状态问题无需读取 PDF。引用论文证据时尽量给出文件名和 PDF 页码。不要读取未列出的 PDF。"
  );
  return sections.join("\n\n");
}

function appendModelOptions(
  args: string[],
  request: Pick<BuildCodexThreadExecArgsRequest, "model" | "reasoningEffort" | "verbosity">
): void {
  if (request.model) args.push("--model", request.model);
  if (request.reasoningEffort) {
    args.push("-c", `model_reasoning_effort="${request.reasoningEffort}"`);
  }
  if (request.verbosity) args.push("-c", `model_verbosity="${request.verbosity}"`);
}

export function buildCodexThreadExecArgs(
  request: BuildCodexThreadExecArgsRequest
): CodexThreadExecArgs {
  const threadId = (request.threadId || "").trim();
  const args = threadId
    ? ["exec", "resume", "--json", "--skip-git-repo-check"]
    : [
        "exec",
        "--json",
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
        "--cd",
        request.workingDirectory,
      ];
  if (!threadId && request.profile) args.push("--profile", request.profile);
  appendModelOptions(args, request);
  if (threadId) args.push(threadId);
  args.push(request.prompt);
  return { command: request.command || "codex", args, threadId: threadId || undefined };
}

function eventMessage(event: Record<string, unknown>): string | null {
  switch (event.type) {
    case "turn.started":
      return "Codex 已开始处理本轮问题";
    case "turn.completed":
      return "Codex 已完成本轮回答";
    case "turn.failed":
      return "Codex 本轮执行失败";
    case "error":
      return "Codex 报告了执行错误";
    default:
      break;
  }
  const item = event.item as Record<string, unknown> | undefined;
  if (!item || typeof item.type !== "string") return null;
  if (item.type === "reasoning") return "Codex 正在推理";
  if (item.type === "command_execution") return "Codex 正在读取论文或执行只读命令";
  if (item.type === "agent_message") return "Codex 正在整理回答";
  return null;
}

function redactProcessText(text: string): string {
  return (text || "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[REDACTED]")
    .slice(0, 1200);
}

export function isCodexThreadUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /(session|thread).*(not found|does not exist|missing)|no rollout found|could not find.*(session|thread)/i.test(
    message
  );
}

function terminateCodexChild(child: CodexChildProcess): void {
  try {
    child.kill("SIGTERM");
  } catch (error) {
    void error;
  }
  const pid = Number(child.pid);
  if (!Number.isInteger(pid) || pid <= 0) return;
  try {
    const processModule = loadNodeModule<typeof import("node:process")>("node:process");
    if (processModule.platform !== "win32") return;
    const childProcess = loadNodeModule<typeof import("node:child_process")>("node:child_process");
    childProcess.spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      shell: false,
      stdio: "ignore",
    });
  } catch (error) {
    void error;
  }
}

export function runCodexThreadTurn(
  execArgs: CodexThreadExecArgs,
  options: RunCodexThreadTurnOptions
): Promise<CodexThreadTurnResult> {
  const childProcess = options.spawn
    ? { spawn: options.spawn }
    : loadNodeModule<typeof import("node:child_process")>("node:child_process");
  const resolved = resolveCodexExecArgs(execArgs);
  const startedAt = Date.now();
  const timeoutMs = Math.max(1, options.timeoutMs || 1800000);

  return new Promise((resolve, reject) => {
    let settled = false;
    let stdoutBuffer = "";
    let stderr = "";
    let threadId = execArgs.threadId || "";
    let finalMarkdown = "";
    const child = childProcess.spawn(resolved.command, resolved.args, {
      cwd: options.workingDirectory,
      windowsHide: true,
      shell: false,
    }) as CodexChildProcess;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      callback();
    };
    const onAbort = () => {
      terminateCodexChild(child);
      const error = new Error("Codex turn aborted");
      error.name = "AbortError";
      finish(() => reject(error));
    };
    const emitEvent = (rawLine: string) => {
      const line = rawLine.trim();
      if (!line) return;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(line) as Record<string, unknown>;
      } catch (error) {
        void error;
        return;
      }
      if (event.type === "thread.started" && typeof event.thread_id === "string") {
        threadId = event.thread_id;
        void options.onThreadId?.(threadId);
      }
      const item = event.item as Record<string, unknown> | undefined;
      if (
        event.type === "item.completed" &&
        item?.type === "agent_message" &&
        typeof item.text === "string" &&
        item.text.trim()
      ) {
        finalMarkdown = item.text.trim();
      }
      const message = eventMessage(event);
      if (message) {
        options.onProgress?.({
          type: String(event.type || item?.type || "progress"),
          message,
          elapsedMs: Math.max(0, Date.now() - startedAt),
        });
      }
    };

    try {
      child.stdin?.end();
    } catch (error) {
      void error;
    }
    child.stdout?.on("data", (chunk) => {
      stdoutBuffer += String(chunk);
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) emitEvent(line);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => finish(() => reject(error)));
    child.on("close", (code) => {
      if (stdoutBuffer.trim()) emitEvent(stdoutBuffer);
      if (code !== 0) {
        const detail = redactProcessText(stderr) || `Codex exited with code ${String(code)}`;
        finish(() => reject(new Error(detail)));
        return;
      }
      if (!threadId) {
        finish(() => reject(new Error("Codex did not report a thread id")));
        return;
      }
      if (!finalMarkdown) {
        finish(() => reject(new Error("Codex returned no final agent message")));
        return;
      }
      finish(() => resolve({ threadId, markdown: finalMarkdown }));
    });
    const timer = setTimeout(() => {
      terminateCodexChild(child);
      const error = new Error(`Codex turn timed out after ${timeoutMs}ms`);
      error.name = "TimeoutError";
      finish(() => reject(error));
    }, timeoutMs);
    if (options.signal?.aborted) onAbort();
    else options.signal?.addEventListener("abort", onAbort, { once: true });
  });
}
