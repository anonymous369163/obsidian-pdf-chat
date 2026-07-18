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

function createSessionPersistence() {
  const sessions = new Map([
    [
      "plugin-session-1",
      {
        id: "plugin-session-1",
        conversationKey: "pdf:papers/A.pdf",
        mode: "codex",
        messages: [],
        referencedPdfPaths: [],
        includeCurrentPdfInCodex: true,
        codex: { model: "gpt-5.5", reasoningEffort: "medium", lifecycle: "active" },
      },
    ],
  ]);
  const appended = [];
  return {
    appended,
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
    async closeSession(id) {
      const session = sessions.get(id);
      sessions.set(id, { ...session, codex: { ...session.codex, lifecycle: "closed" } });
    },
  };
}

test("CodexSessionManager keeps a turn running without UI subscribers and persists to the original session", async () => {
  const { CodexSessionManager } = loadBundle();
  assert.equal(typeof CodexSessionManager, "function");
  const persistence = createSessionPersistence();
  let finishTurn;
  const runner = (_args, options) =>
    new Promise((resolve) => {
      options.onThreadId("native-thread-1");
      options.onProgress({ type: "reasoning", message: "Codex 正在推理", elapsedMs: 20 });
      finishTurn = () => resolve({ threadId: "native-thread-1", markdown: "Final answer" });
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
  const runner = (_args, options) =>
    new Promise((_resolve, reject) => {
      options.onThreadId("native-thread-stop");
      options.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
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

  manager.stopTurn("plugin-session-1");
  await running;

  assert.equal(manager.getSnapshot("plugin-session-1").status, "stopped");
  assert.equal(persistence.sessions.get("plugin-session-1").codex.lifecycle, "active");
  assert.equal(persistence.appended.length, 0);
});

test("CodexSessionManager close aborts the target turn and closes it without deleting history", async () => {
  const { CodexSessionManager } = loadBundle();
  const persistence = createSessionPersistence();
  const runner = (_args, options) =>
    new Promise((_resolve, reject) => {
      options.onThreadId("native-thread-close");
      options.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
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

  await manager.closeSession("plugin-session-1");
  await running;

  assert.equal(manager.getSnapshot("plugin-session-1").status, "closed");
  assert.equal(persistence.sessions.get("plugin-session-1").codex.lifecycle, "closed");
  assert.equal(persistence.sessions.get("plugin-session-1").codex.threadId, "native-thread-close");
  assert.equal(persistence.appended.length, 0);
});
