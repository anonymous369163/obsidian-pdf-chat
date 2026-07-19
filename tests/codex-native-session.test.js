const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadBundle() {
  const filename = path.join(projectRoot, "main.js");
  const source = fs.readFileSync(filename, "utf8");
  class Plugin {}
  class Modal {
    constructor(app) {
      this.app = app;
    }
  }
  class PluginSettingTab {}
  class Notice {}
  class Setting {}
  class FileSystemAdapter {}
  const obsidian = {
    FileSystemAdapter,
    MarkdownRenderer: {},
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    prepareFuzzySearch: () => () => null,
    requestUrl: async () => ({}),
  };
  const sandbox = {
    AbortController,
    console,
    module: { exports: {} },
    require(request) {
      if (request === "obsidian") return obsidian;
      if (["node:fs", "fs", "node:path", "path", "node:child_process"].includes(request)) {
        return require(request);
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    clearTimeout,
    TextDecoder,
    URL,
    window: {},
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(source, sandbox, { filename });
  return sandbox.module.exports;
}

function fakeChildProcess(stdoutLines, options = {}) {
  const listeners = { stdout: {}, stderr: {}, process: {} };
  const child = {
    pid: 4321,
    stdin: { end() {} },
    stdout: { on(event, handler) { listeners.stdout[event] = handler; } },
    stderr: { on(event, handler) { listeners.stderr[event] = handler; } },
    on(event, handler) { listeners.process[event] = handler; },
    kill() { child.killed = true; },
    killed: false,
  };
  queueMicrotask(() => {
    if (options.stderr) listeners.stderr.data?.(Buffer.from(options.stderr));
    if (stdoutLines.length) listeners.stdout.data?.(Buffer.from(`${stdoutLines.join("\n")}\n`));
    listeners.process.close?.(options.code ?? 0);
  });
  return child;
}

test("buildCodexTurnPrompt sends only the question, selected context, and direct PDF paths", () => {
  const { buildCodexTurnPrompt } = loadBundle();
  assert.equal(typeof buildCodexTurnPrompt, "function");

  const prompt = buildCodexTurnPrompt({
    question: "请参考另一篇论文解释这个概念",
    papers: [
      { role: "current", name: "A.pdf", absolutePath: "D:/vault/papers/A.pdf" },
      { role: "referenced", name: "B.pdf", absolutePath: "D:/vault/refs/B.pdf" },
    ],
    selectedContext: "This is the selected paragraph.",
  });

  assert.match(prompt, /请参考另一篇论文解释这个概念/);
  assert.match(prompt, /D:\/vault\/papers\/A\.pdf/);
  assert.match(prompt, /D:\/vault\/refs\/B\.pdf/);
  assert.match(prompt, /This is the selected paragraph/);
  assert.match(prompt, /\[P1\].*A\.pdf/);
  assert.match(prompt, /\[P2\].*B\.pdf/);
  assert.match(prompt, /\[P1, p\.N\]/);
  assert.match(prompt, /普通问候.*无需读取|greeting.*without reading/i);
  assert.doesNotMatch(prompt, /manifest\.json|question\.md|full_text|chunks\.json|summary\.md|brief\.md/);
});

test("resolveCodexPdfLocation uses the desktop vault adapter without persisting absolute paths", () => {
  const { resolveCodexPdfLocation } = loadBundle();
  assert.equal(typeof resolveCodexPdfLocation, "function");
  const location = resolveCodexPdfLocation(
    { vault: { adapter: { getFullPath: (vaultPath) => `D:/vault/${vaultPath}` } } },
    "papers/sub/A.pdf"
  );

  assert.equal(location.absolutePath.replace(/\\/g, "/"), "D:/vault/papers/sub/A.pdf");
  assert.equal(location.workingDirectory.replace(/\\/g, "/"), "D:/vault/papers/sub");
});

test("buildCodexThreadExecArgs creates a persistent first turn without ephemeral mode", () => {
  const { buildCodexThreadExecArgs } = loadBundle();
  assert.equal(typeof buildCodexThreadExecArgs, "function");

  const result = buildCodexThreadExecArgs({
    command: "codex",
    workingDirectory: "D:/vault/papers",
    prompt: "hello",
    model: "gpt-5.5",
    reasoningEffort: "medium",
    verbosity: "high",
    profile: "research",
  });

  assert.equal(result.command, "codex");
  assert.deepEqual(Array.from(result.args.slice(0, 7)), [
    "exec",
    "--json",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--cd",
    "D:/vault/papers",
  ]);
  assert.equal(result.args.includes("--ephemeral"), false);
  assert.equal(result.args.includes("resume"), false);
  assert.equal(result.args.at(-1), "hello");
});

test("buildCodexThreadExecArgs resumes the exact native Codex thread", () => {
  const { buildCodexThreadExecArgs } = loadBundle();
  const result = buildCodexThreadExecArgs({
    command: "codex",
    workingDirectory: "D:/vault/papers",
    threadId: "0199a213-81c0-7800-8aa1-bbab2a035a53",
    prompt: "continue",
    model: "gpt-5.5",
    reasoningEffort: "medium",
    verbosity: "high",
  });

  assert.deepEqual(Array.from(result.args.slice(0, 3)), ["exec", "resume", "--json"]);
  assert.ok(result.args.includes("0199a213-81c0-7800-8aa1-bbab2a035a53"));
  assert.equal(result.args.includes("--ephemeral"), false);
  assert.equal(result.args.includes("--cd"), false);
  assert.equal(result.args.at(-1), "continue");
});

test("runCodexThreadTurn captures thread.started and the final Markdown agent message", async () => {
  const { buildCodexThreadExecArgs, runCodexThreadTurn } = loadBundle();
  const args = buildCodexThreadExecArgs({
    command: "codex",
    workingDirectory: "D:/vault/papers",
    prompt: "hello",
  });
  const threadIds = [];
  const spawnCalls = [];

  const result = await runCodexThreadTurn(args, {
    workingDirectory: "D:/vault/papers",
    timeoutMs: 1000,
    onThreadId: (id) => threadIds.push(id),
    spawn(command, commandArgs, spawnOptions) {
      spawnCalls.push({ command, commandArgs, spawnOptions });
      return fakeChildProcess([
        JSON.stringify({ type: "thread.started", thread_id: "thread-123" }),
        JSON.stringify({ type: "turn.started" }),
        JSON.stringify({
          type: "item.completed",
          item: { type: "agent_message", text: "# Hello\n\nThis is **Codex**." },
        }),
        JSON.stringify({ type: "turn.completed" }),
      ]);
    },
  });

  assert.equal(result.threadId, "thread-123");
  assert.equal(result.markdown, "# Hello\n\nThis is **Codex**.");
  assert.deepEqual(threadIds, ["thread-123"]);
  assert.equal(spawnCalls[0].spawnOptions.cwd, "D:/vault/papers");
});

test("runCodexThreadTurn reports missing native sessions without silently starting a new one", async () => {
  const { buildCodexThreadExecArgs, isCodexThreadUnavailableError, runCodexThreadTurn } = loadBundle();
  const args = buildCodexThreadExecArgs({
    command: "codex",
    workingDirectory: "D:/vault/papers",
    threadId: "missing-thread",
    prompt: "continue",
  });

  await assert.rejects(
    runCodexThreadTurn(args, {
      workingDirectory: "D:/vault/papers",
      timeoutMs: 1000,
      spawn: () => fakeChildProcess([], { code: 1, stderr: "Session not found: missing-thread" }),
    }),
    (error) => {
      assert.equal(isCodexThreadUnavailableError(error), true);
      return true;
    }
  );
});

test("runCodexVersionCheck verifies the configured executable without calling a model", async () => {
  const { runCodexVersionCheck } = loadBundle();
  const calls = [];

  const version = await runCodexVersionCheck("codex", {
    workingDirectory: "D:/vault/papers",
    timeoutMs: 1000,
    spawn(command, args, spawnOptions) {
      calls.push({ command, args, spawnOptions });
      return fakeChildProcess(["codex-cli 0.144.5"]);
    },
  });

  assert.equal(version, "codex-cli 0.144.5");
  assert.deepEqual(Array.from(calls[0].args), ["--version"]);
  assert.equal(calls[0].spawnOptions.cwd, "D:/vault/papers");
});

test("runCodexThreadDoctor verifies a fresh turn and an exact native resume", async () => {
  const { runCodexThreadDoctor } = loadBundle();
  const calls = [];
  const runner = async (args) => {
    calls.push(Array.from(args.args));
    return calls.length === 1
      ? { threadId: "doctor-thread", markdown: "PDF_CHAT_DOCTOR_1" }
      : { threadId: "doctor-thread", markdown: "PDF_CHAT_DOCTOR_2" };
  };

  const result = await runCodexThreadDoctor(
    {
      command: "codex",
      workingDirectory: "D:/vault/papers",
      model: "gpt-5.5",
      reasoningEffort: "medium",
      verbosity: "high",
      timeoutMs: 1000,
    },
    runner
  );

  assert.equal(result.threadId, "doctor-thread");
  assert.equal(result.firstReply, "PDF_CHAT_DOCTOR_1");
  assert.equal(result.resumeReply, "PDF_CHAT_DOCTOR_2");
  assert.equal(calls[0].includes("resume"), false);
  assert.deepEqual(calls[1].slice(0, 3), ["exec", "resume", "--json"]);
  assert.ok(calls[1].includes("doctor-thread"));
});

function createSessionPersistence() {
  const sessions = new Map([
    [
      "plugin-session-1",
      {
        id: "plugin-session-1",
        ["conversation" + "Key"]: "pdf:papers/A.pdf",
        mode: "codex",
        messages: [],
        referencedPdfPaths: [],
        includeCurrentPdfInCodex: true,
        codex: { model: "gpt-5.5", reasoningEffort: "medium", lifecycle: "active" },
      },
    ],
  ]);
  const appended = [];
  const pendingWrites = [];
  return {
    appended,
    pendingWrites,
    sessions,
    getSession(id) {
      const value = sessions.get(id);
      return value ? structuredClone(value) : null;
    },
    async updateSessionMetadata(id, metadata) {
      const session = sessions.get(id);
      sessions.set(id, { ...session, ...metadata, codex: { ...session.codex, ...metadata.codex } });
    },
    async appendSessionTurn(id, user, assistant) {
      appended.push({ id, user, assistant });
    },
    async beginCodexTurn(id, pendingTurn) {
      pendingWrites.push({ type: "begin", id, pendingTurn: structuredClone(pendingTurn) });
      const session = sessions.get(id);
      sessions.set(id, { ...session, pendingTurn: structuredClone(pendingTurn) });
    },
    async updateCodexTurn(id, turnId, patch, codex) {
      pendingWrites.push({ type: "update", id, turnId, patch: structuredClone(patch) });
      const session = sessions.get(id);
      if (session.pendingTurn?.turnId !== turnId) return;
      sessions.set(id, {
        ...session,
        pendingTurn: { ...session.pendingTurn, ...structuredClone(patch) },
        codex: codex ? { ...session.codex, ...structuredClone(codex) } : session.codex,
      });
    },
    async completeCodexTurn(id, turnId, user, assistant, codex) {
      pendingWrites.push({ type: "complete", id, turnId, codex: structuredClone(codex) });
      appended.push({ id, user, assistant });
      const session = sessions.get(id);
      sessions.set(id, { ...session, pendingTurn: undefined, codex: { ...session.codex, ...codex } });
    },
    async closeSession(id) {
      const session = sessions.get(id);
      sessions.set(id, { ...session, codex: { ...session.codex, lifecycle: "closed" } });
    },
  };
}

test("CodexSessionManager journals the pending turn before running and clears it on completion", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  const runner = async (_args, options) => {
    options.onThreadId?.("native-thread-journal");
    return { threadId: "native-thread-journal", markdown: "Journaled answer" };
  };
  const manager = new CodexSessionManager(persistence, runner);

  await manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Journal this",
    userContent: "Journal this",
    prompt: "Journal this",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: ["papers/A.pdf"],
    selectionChars: 12,
    timeoutMs: 1000,
  });

  assert.equal(persistence.pendingWrites[0].type, "begin");
  assert.equal(persistence.pendingWrites[0].pendingTurn.question, "Journal this");
  assert.equal(persistence.pendingWrites[0].pendingTurn.status, "running");
  assert.equal(persistence.pendingWrites.at(-1).type, "complete");
  assert.equal(persistence.sessions.get("plugin-session-1").pendingTurn, undefined);
});

test("CodexSessionManager does not leave a phantom running task when the initial journal save fails", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  persistence.beginCodexTurn = async () => {
    throw new Error("journal unavailable");
  };
  let runnerCalls = 0;
  const manager = new CodexSessionManager(persistence, async () => {
    runnerCalls += 1;
    return { threadId: "must-not-run", markdown: "must-not-run" };
  });

  const result = await manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Do not start",
    userContent: "Do not start",
    prompt: "Do not start",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: [],
    selectionChars: 0,
    timeoutMs: 1000,
  });

  assert.equal(runnerCalls, 0);
  assert.equal(result.status, "failed");
  assert.match(result.error, /journal unavailable/);
  assert.equal(manager.stopTurn("plugin-session-1"), false);
});

test("CodexSessionManager throttles progress persistence instead of writing data.json for every event", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  const manager = new CodexSessionManager(persistence, async (_args, options) => {
    options.onThreadId?.("native-thread-progress");
    for (let index = 0; index < 50; index += 1) {
      options.onProgress?.({ type: "reasoning", message: `Progress ${index}`, elapsedMs: index });
    }
    return { threadId: "native-thread-progress", markdown: "Done" };
  });

  await manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Many events",
    userContent: "Many events",
    prompt: "Many events",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: [],
    selectionChars: 0,
    timeoutMs: 1000,
  });

  const progressWrites = persistence.pendingWrites.filter(
    (write) => write.type === "update" && typeof write.patch.progress === "string"
  );
  assert.ok(progressWrites.length <= 3, `expected throttled progress writes, received ${progressWrites.length}`);
});

test("CodexSessionManager keeps final Markdown visible when persistence fails and can retry", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  let failSave = true;
  const originalComplete = persistence.completeCodexTurn;
  persistence.completeCodexTurn = async (...args) => {
    if (failSave) throw new Error("disk unavailable");
    return originalComplete(...args);
  };
  const manager = new CodexSessionManager(
    persistence,
    async (_args, options) => {
      options.onThreadId?.("native-thread-retry");
      return { threadId: "native-thread-retry", markdown: "# Valuable answer" };
    }
  );

  const failed = await manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Keep this answer",
    userContent: "Keep this answer",
    prompt: "Keep this answer",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: [],
    selectionChars: 0,
    timeoutMs: 1000,
  });

  assert.equal(failed.status, "failed");
  assert.equal(failed.finalMarkdown, "# Valuable answer");
  assert.match(failed.error, /保存失败|disk unavailable/i);

  failSave = false;
  const retried = await manager.retryPersistResult("plugin-session-1");
  assert.equal(retried, true);
  assert.equal(manager.getSnapshot("plugin-session-1").status, "idle");
  assert.equal(persistence.appended.at(-1).assistant, "# Valuable answer");
});

test("CodexSessionManager retains the final answer when saving the new thread id fails", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  const originalUpdate = persistence.updateCodexTurn;
  let failThreadWrite = true;
  persistence.updateCodexTurn = async (...args) => {
    if (failThreadWrite && args[2]?.threadId) throw new Error("thread write failed");
    return originalUpdate(...args);
  };
  const manager = new CodexSessionManager(
    persistence,
    async (_args, options) => {
      options.onThreadId?.("native-thread-write-failure");
      return { threadId: "native-thread-write-failure", markdown: "# Keep this too" };
    }
  );

  const failed = await manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Preserve thread write result",
    userContent: "Preserve thread write result",
    prompt: "Preserve thread write result",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: [],
    selectionChars: 0,
    timeoutMs: 1000,
  });

  assert.equal(failed.status, "failed");
  assert.equal(failed.finalMarkdown, "# Keep this too");
  failThreadWrite = false;
  assert.equal(await manager.retryPersistResult("plugin-session-1"), true);
  assert.equal(persistence.appended.at(-1).assistant, "# Keep this too");
});

test("CodexSessionManager exposes terminal task events to plugin-level subscribers", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  const manager = new CodexSessionManager(
    persistence,
    async (_args, options) => {
      options.onThreadId?.("native-thread-global");
      return { threadId: "native-thread-global", markdown: "Done" };
    }
  );
  const events = [];
  const unsubscribe = manager.subscribeAll((event) => events.push(event));

  await manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Background task",
    userContent: "Background task",
    prompt: "Background task",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: [],
    selectionChars: 0,
    timeoutMs: 1000,
  });
  unsubscribe();

  assert.equal(events.at(-1).snapshot.status, "idle");
  assert.equal(events.at(-1).hasSessionSubscribers, false);
});

test("CodexSessionManager lists persisted interrupted work alongside live tasks", () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  persistence.sessions.get("plugin-session-1").pendingTurn = {
    turnId: "turn-persisted",
    question: "Resume this analysis",
    status: "interrupted",
    startedAt: 123,
    attachedPdfPaths: ["papers/A.pdf"],
    selectionChars: 42,
    progress: "Interrupted after restart",
  };
  persistence.listSessions = () =>
    Array.from(persistence.sessions.values()).map((session) => structuredClone(session));
  const manager = new CodexSessionManager(persistence, async () => {
    throw new Error("not used");
  });

  const tasks = manager.listSnapshots();

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].sessionId, "plugin-session-1");
  assert.equal(tasks[0].status, "stopped");
  assert.equal(tasks[0].question, "Resume this analysis");
});

test("CodexSessionManager keeps a turn running without UI subscribers and persists to the original session", async () => {
  const { CodexSessionManager } = loadBundle();
  assert.equal(typeof CodexSessionManager, "function");
  const persistence = createSessionPersistence();
  let finishTurn;
  let markRunnerStarted;
  const runnerStarted = new Promise((resolve) => {
    markRunnerStarted = resolve;
  });
  const runner = (_args, options) =>
    new Promise((resolve) => {
      options.onThreadId("native-thread-1");
      options.onProgress({ type: "reasoning", message: "Codex 正在推理", elapsedMs: 20 });
      finishTurn = () => resolve({ threadId: "native-thread-1", markdown: "Final answer" });
      markRunnerStarted();
    });
  const manager = new CodexSessionManager(persistence, runner);
  const seen = [];
  const unsubscribe = manager.subscribe("plugin-session-1", (snapshot) => seen.push(snapshot.status));

  const running = manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Question",
    userContent: "Question",
    prompt: "Question",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: ["papers/A.pdf"],
    selectionChars: 0,
    model: "gpt-5.5",
    reasoningEffort: "medium",
    verbosity: "high",
    timeoutMs: 1000,
  });
  await runnerStarted;
  unsubscribe();

  assert.equal(manager.getSnapshot("plugin-session-1").status, "running");
  assert.equal(manager.getSnapshot("plugin-session-1").threadId, "native-thread-1");
  finishTurn();
  await running;

  assert.equal(manager.getSnapshot("plugin-session-1").status, "idle");
  assert.deepEqual(persistence.appended, [
    { id: "plugin-session-1", user: "Question", assistant: "Final answer" },
  ]);
  assert.ok(seen.includes("running"));
});

test("CodexSessionManager resumes the persisted native thread on the next turn", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  const calls = [];
  const runner = async (args, options) => {
    calls.push(Array.from(args.args));
    const threadId = args.threadId || "native-thread-multi";
    options.onThreadId?.(threadId);
    return { threadId, markdown: calls.length === 1 ? "First answer" : "Second answer" };
  };
  const manager = new CodexSessionManager(persistence, runner);
  const base = {
    sessionId: "plugin-session-1",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: ["papers/A.pdf"],
    selectionChars: 0,
    timeoutMs: 1000,
  };

  await manager.startTurn({ ...base, question: "First", userContent: "First", prompt: "First" });
  await manager.startTurn({ ...base, question: "Second", userContent: "Second", prompt: "Second" });

  assert.equal(calls[0].includes("resume"), false);
  assert.deepEqual(calls[1].slice(0, 3), ["exec", "resume", "--json"]);
  assert.ok(calls[1].includes("native-thread-multi"));
  assert.deepEqual(persistence.appended.map((entry) => entry.user), ["First", "Second"]);
});

test("CodexSessionManager stop aborts only the active turn and keeps the native thread active", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  let markRunnerStarted;
  const runnerStarted = new Promise((resolve) => {
    markRunnerStarted = resolve;
  });
  const runner = (_args, options) =>
    new Promise((_resolve, reject) => {
      options.onThreadId("native-thread-stop");
      options.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
      markRunnerStarted();
    });
  const manager = new CodexSessionManager(persistence, runner);
  const running = manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Question",
    userContent: "Question",
    prompt: "Question",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: [],
    selectionChars: 0,
    timeoutMs: 1000,
  });

  await runnerStarted;
  manager.stopTurn("plugin-session-1");
  await running;

  assert.equal(manager.getSnapshot("plugin-session-1").status, "stopped");
  assert.equal(persistence.sessions.get("plugin-session-1").codex.lifecycle, "active");
  assert.equal(persistence.appended.length, 0);
});

test("CodexSessionManager close aborts the target turn and closes it without deleting history", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  let markRunnerStarted;
  const runnerStarted = new Promise((resolve) => {
    markRunnerStarted = resolve;
  });
  const runner = (_args, options) =>
    new Promise((_resolve, reject) => {
      options.onThreadId("native-thread-close");
      options.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
      markRunnerStarted();
    });
  const manager = new CodexSessionManager(persistence, runner);
  const running = manager.startTurn({
    sessionId: "plugin-session-1",
    question: "Question",
    userContent: "Question",
    prompt: "Question",
    command: "codex",
    workingDirectory: "D:/vault/papers",
    attachedPdfPaths: [],
    selectionChars: 0,
    timeoutMs: 1000,
  });

  await runnerStarted;
  await manager.closeSession("plugin-session-1");
  await running;

  assert.equal(manager.getSnapshot("plugin-session-1").status, "closed");
  assert.equal(persistence.sessions.get("plugin-session-1").codex.lifecycle, "closed");
  assert.equal(persistence.sessions.get("plugin-session-1").codex.threadId, "native-thread-close");
  assert.equal(persistence.appended.length, 0);
});
