const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
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
  const obsidian = {
    MarkdownRenderer: {},
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    prepareFuzzySearch(query) {
      const normalized = String(query || "").toLowerCase();
      return (text) =>
        String(text || "").toLowerCase().includes(normalized)
          ? { score: normalized.length || 1, matches: [] }
          : null;
    },
    requestUrl: async () => ({}),
  };
  const sandbox = {
    AbortController,
    console,
    module: { exports: {} },
    require(request) {
      if (request === "obsidian") return obsidian;
      if (request === "node:fs" || request === "fs") return require("node:fs");
      if (request === "node:path" || request === "path") return require("node:path");
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

test("searchPdfFiles filters vault PDFs and ranks by fuzzy path matches", () => {
  const { searchPdfFiles } = loadBundle();
  const app = {
    vault: {
      getFiles: () => [
        { path: "papers/ReEvo.pdf", name: "ReEvo.pdf", extension: "pdf" },
        { path: "papers/Other Paper.PDF", name: "Other Paper.PDF", extension: "PDF" },
        { path: "notes/ReEvo.md", name: "ReEvo.md", extension: "md" },
      ],
    },
  };

  assert.deepEqual(
    searchPdfFiles(app, "reevo").map((candidate) => candidate.path),
    ["papers/ReEvo.pdf"]
  );
  assert.deepEqual(
    searchPdfFiles(app, "other").map((candidate) => candidate.path),
    ["papers/Other Paper.PDF"]
  );
});

test("writeCodexAnalysisPackage defaults to a PDF-only package without redundant assets or secrets", async () => {
  const { writeCodexAnalysisPackage } = loadBundle();
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-chat-analysis-test-"));
  const result = await writeCodexAnalysisPackage({
    baseDir,
    taskId: "task-1",
    createdAt: "2026-07-17T00:00:00.000Z",
    question: "Compare these papers",
    papers: [
      {
        id: "paper-a",
        role: "current",
        name: "A.pdf",
        vaultPath: "papers/A.pdf",
        mtime: 1,
        originalPdfData: Buffer.from("%PDF-1.7 fake A"),
      },
      {
        id: "paper-b",
        role: "referenced",
        name: "B.pdf",
        vaultPath: "papers/B.pdf",
        mtime: 2,
        originalPdfData: Buffer.from("%PDF-1.7 fake B"),
      },
    ],
  });

  assert.equal(result.inputMode, "pdf-only");
  assert.equal(fs.existsSync(path.join(result.analysisDir, "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(result.analysisDir, "manifest.json")), false);
  assert.equal(fs.existsSync(path.join(result.analysisDir, "question.md")), false);
  assert.equal(fs.existsSync(path.join(result.analysisDir, "output.schema.json")), false);
  assert.equal(fs.readFileSync(path.join(result.analysisDir, "papers", "current.pdf"), "utf8"), "%PDF-1.7 fake A");
  assert.equal(fs.readFileSync(path.join(result.analysisDir, "papers", "reference-1.pdf"), "utf8"), "%PDF-1.7 fake B");

  const relativeFiles = fs
    .readdirSync(result.analysisDir, { recursive: true })
    .filter((name) => fs.statSync(path.join(result.analysisDir, name)).isFile())
    .map((name) => String(name).replace(/\\/g, "/"))
    .sort();
  assert.deepEqual(relativeFiles, ["papers/current.pdf", "papers/reference-1.pdf"]);

  const allText = fs
    .readdirSync(result.analysisDir, { recursive: true })
    .filter((name) => fs.statSync(path.join(result.analysisDir, name)).isFile())
    .map((name) => fs.readFileSync(path.join(result.analysisDir, name), "utf8"))
    .join("\n");
  assert.doesNotMatch(allText, /apiKey|endpoint|Bearer|(^|[\\/])data\.json|YOUR_API_KEY|full_text|chunks|summary|brief|extraction_report|manifest|question\.md/);
});

test("writeCodexAnalysisPackage optionally attaches the selected passage as context", async () => {
  const { writeCodexAnalysisPackage, buildCodexMarkdownPrompt } = loadBundle();
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-chat-selected-context-test-"));
  const result = await writeCodexAnalysisPackage({
    baseDir,
    taskId: "task-context",
    createdAt: "2026-07-19T00:00:00.000Z",
    question: "Explain this selected paragraph using the reference paper",
    selectedContext: "The selected paragraph defines a difficult concept.",
    papers: [
      {
        id: "paper-a",
        role: "current",
        name: "A.pdf",
        vaultPath: "papers/A.pdf",
        originalPdfData: Buffer.from("%PDF-1.7 fake A"),
      },
    ],
  });

  assert.equal(result.selectedContextPath, "selected-context.md");
  assert.equal(
    fs.readFileSync(path.join(result.analysisDir, "selected-context.md"), "utf8"),
    "The selected paragraph defines a difficult concept."
  );
  const relativeFiles = fs
    .readdirSync(result.analysisDir, { recursive: true })
    .filter((name) => fs.statSync(path.join(result.analysisDir, name)).isFile())
    .map((name) => String(name).replace(/\\/g, "/"))
    .sort();
  assert.deepEqual(relativeFiles, ["papers/current.pdf", "selected-context.md"]);

  const prompt = buildCodexMarkdownPrompt("Explain this selected paragraph", [
    { role: "current", name: "A.pdf", vaultPath: "papers/A.pdf" },
  ], { selectedContextPath: "selected-context.md" });
  assert.match(prompt, /selected-context\.md/);
  assert.match(prompt, /selected passage|selected context/i);
  assert.doesNotMatch(prompt, /difficult concept/);
});

test("buildCodexMarkdownPrompt makes Codex read PDFs and answer in natural Markdown", () => {
  const { buildCodexMarkdownPrompt } = loadBundle();
  const prompt = buildCodexMarkdownPrompt("Compare these papers", [
    { role: "current", name: "A.pdf", vaultPath: "papers/A.pdf" },
    { role: "referenced", name: "B.pdf", vaultPath: "papers/B.pdf" },
  ]);

  assert.match(prompt, /papers\/current\.pdf/);
  assert.match(prompt, /papers\/reference-1\.pdf/);
  assert.match(prompt, /papers\/A\.pdf/);
  assert.match(prompt, /Compare these papers/);
  assert.match(prompt, /Markdown/);
  assert.match(prompt, /natural|自然|user's exact question/i);
  assert.match(prompt, /page/i);
  assert.match(prompt, /cannot|unable|无法|不能/);
  assert.doesNotMatch(prompt, /manifest\.json|question\.md|output\.schema\.json|Return only JSON|SKILL\.md|full_text|chunks\.json|summary\.md|brief\.md|extraction_report/);
});

test("buildCodexMarkdownPrompt is explicit when no PDF files are attached", () => {
  const { buildCodexMarkdownPrompt } = loadBundle();
  const prompt = buildCodexMarkdownPrompt("hello", []);

  assert.match(prompt, /No PDF files are attached/);
  assert.doesNotMatch(prompt, /papers\/\*\.pdf/);
});

test("buildCodexExecArgs defaults to read-only ephemeral Markdown execution", () => {
  const { buildCodexExecArgs } = loadBundle();
  const args = buildCodexExecArgs({
    analysisDir: "C:/tmp/pdf-chat-analysis-1",
    command: "codex",
    model: "gpt-test",
    profile: "deep-review",
    reasoningEffort: "xhigh",
    verbosity: "high",
    outputMode: "markdown",
    outputFileName: "codex-output.md",
    prompt: "Read manifest",
  });

  assert.equal(args.command, "codex");
  assert.equal(args.args[0], "exec");
  assert.ok(args.args.includes("--json"));
  assert.ok(args.args.includes("read-only"));
  assert.ok(args.args.includes("--ephemeral"));
  assert.ok(args.args.includes("--skip-git-repo-check"));
  assert.equal(args.args.includes("--output-schema"), false);
  assert.equal(args.args.includes("output.schema.json"), false);
  assert.ok(args.args.includes("--output-last-message"));
  assert.ok(args.args.includes("codex-output.md"));
  assert.ok(args.args.includes("--profile"));
  assert.ok(args.args.includes("deep-review"));
  assert.ok(args.args.includes("--model"));
  assert.ok(args.args.includes("gpt-test"));
  assert.ok(args.args.includes("-c"));
  assert.ok(args.args.includes('model_reasoning_effort="xhigh"'));
  assert.ok(args.args.includes('model_verbosity="high"'));
  assert.equal(args.args.at(-1), "Read manifest");
});

test("buildCodexExecArgs keeps JSON schema execution as an explicit compatibility mode", () => {
  const { buildCodexExecArgs } = loadBundle();
  const args = buildCodexExecArgs({
    analysisDir: "C:/tmp/pdf-chat-analysis-1",
    command: "codex",
    model: "gpt-test",
    reasoningEffort: "high",
    verbosity: "medium",
    outputMode: "json-schema",
    outputFileName: "codex-output.json",
    prompt: "Return JSON",
  });

  assert.ok(args.args.includes("--output-schema"));
  assert.ok(args.args.includes("output.schema.json"));
  assert.ok(args.args.includes("--output-last-message"));
  assert.ok(args.args.includes("codex-output.json"));
  assert.equal(args.args.at(-1), "Return JSON");
});

test("resolveCodexExecArgs finds npm Codex when Obsidian cannot see the shell PATH", () => {
  const { buildCodexExecArgs, resolveCodexExecArgs } = loadBundle();
  const base = buildCodexExecArgs({
    analysisDir: "C:/tmp/pdf-chat-analysis-1",
    command: "codex",
    model: "gpt-test",
    reasoningEffort: "xhigh",
    verbosity: "high",
    prompt: "Read SKILL.md",
  });
  const existing = new Set([
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Users\\tester\\AppData\\Roaming\\npm\\node_modules\\@openai\\codex\\bin\\codex.js",
  ]);

  const resolved = resolveCodexExecArgs(base, {
    platform: "win32",
    env: {
      APPDATA: "C:\\Users\\tester\\AppData\\Roaming",
      ProgramFiles: "C:\\Program Files",
      PATH: "C:\\Windows\\System32;C:\\Windows",
    },
    existsSync(file) {
      return existing.has(file);
    },
    readdirSync() {
      return [];
    },
  });

  assert.equal(resolved.command, "C:\\Program Files\\nodejs\\node.exe");
  assert.equal(resolved.args[0], "C:\\Users\\tester\\AppData\\Roaming\\npm\\node_modules\\@openai\\codex\\bin\\codex.js");
  assert.equal(resolved.args[1], "exec");
  assert.ok(resolved.args.includes("--sandbox"));
  assert.equal(resolved.args.at(-1), "Read SKILL.md");
});

test("resolveCodexExecArgs rewrites an explicit npm codex.cmd path without using shell", () => {
  const { buildCodexExecArgs, resolveCodexExecArgs } = loadBundle();
  const base = buildCodexExecArgs({
    analysisDir: "C:/tmp/pdf-chat-analysis-1",
    command: "C:\\Users\\tester\\AppData\\Roaming\\npm\\codex.cmd",
    prompt: "Read SKILL.md",
  });
  const existing = new Set([
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Users\\tester\\AppData\\Roaming\\npm\\node_modules\\@openai\\codex\\bin\\codex.js",
  ]);

  const resolved = resolveCodexExecArgs(base, {
    platform: "win32",
    env: {
      ProgramFiles: "C:\\Program Files",
    },
    existsSync(file) {
      return existing.has(file);
    },
    readdirSync() {
      return [];
    },
  });

  assert.equal(resolved.command, "C:\\Program Files\\nodejs\\node.exe");
  assert.equal(resolved.args[0], "C:\\Users\\tester\\AppData\\Roaming\\npm\\node_modules\\@openai\\codex\\bin\\codex.js");
  assert.equal(resolved.args[1], "exec");
});

test("resolveCodexExecArgs can fall back to a bundled Codex exe", () => {
  const { buildCodexExecArgs, resolveCodexExecArgs } = loadBundle();
  const base = buildCodexExecArgs({
    analysisDir: "C:/tmp/pdf-chat-analysis-1",
    command: "codex",
    prompt: "Read SKILL.md",
  });

  const resolved = resolveCodexExecArgs(base, {
    platform: "win32",
    env: {
      USERPROFILE: "C:\\Users\\tester",
      APPDATA: "C:\\Users\\tester\\AppData\\Roaming",
    },
    existsSync(file) {
      return /openai\.chatgpt-1\.0\.0-win32-x64[\\/]bin[\\/]windows-x86_64[\\/]codex\.exe$/i.test(file);
    },
    readdirSync(dir) {
      return /extensions$/i.test(dir) ? ["openai.chatgpt-1.0.0-win32-x64"] : [];
    },
  });

  assert.match(resolved.command, /codex\.exe$/i);
  assert.equal(resolved.args[0], "exec");
});

test("parseCodexAnalysisOutput validates and renders structured analysis", () => {
  const { parseCodexAnalysisOutput, renderCodexAnalysisMarkdown } = loadBundle();
  const parsed = parseCodexAnalysisOutput(
    JSON.stringify({
      taskType: "multi-paper-analysis",
      question: "Q",
      papers: [
        {
          id: "paper-a",
          name: "A.pdf",
          role: "current",
          oneSentenceTakeaway: "A takeaway",
          coreMethod: "A method",
          keyEvidence: [{ claim: "A claim", source: "A.pdf p.1", page: 1 }],
        },
      ],
      comparison: {
        similarities: ["same"],
        differences: ["different"],
        complementaryOpportunities: ["combine"],
        conflictsOrRisks: ["risk"],
      },
      synthesis: {
        shortAnswer: "Short",
        detailedAnalysisMarkdown: "Detailed **analysis**",
        suggestedNextQuestions: ["Next?"],
      },
      limitations: ["Limited"],
    })
  );

  assert.equal(parsed.taskType, "multi-paper-analysis");
  const markdown = renderCodexAnalysisMarkdown(parsed);
  assert.match(markdown, /Short/);
  assert.match(markdown, /Detailed \*\*analysis\*\*/);
  assert.match(markdown, /证据/);
  assert.match(markdown, /A claim/);
  assert.match(markdown, /A\.pdf p\.1/);
  assert.match(markdown, /Next\?/);
  assert.throws(() => parseCodexAnalysisOutput("{}"), /Invalid Codex analysis output/);
});

test("parseCodexMarkdownOutput trims optional outer fences without rewriting Markdown", () => {
  const { parseCodexMarkdownOutput } = loadBundle();

  assert.equal(parseCodexMarkdownOutput("\n# Answer\n\n| A | B |\n| - | - |\n| 1 | 2 |\n"), "# Answer\n\n| A | B |\n| - | - |\n| 1 | 2 |");
  assert.equal(parseCodexMarkdownOutput("```markdown\n## Title\n\nText\n```"), "## Title\n\nText");
  assert.equal(parseCodexMarkdownOutput("```\nplain fenced text\n```"), "plain fenced text");
  assert.throws(() => parseCodexMarkdownOutput(" \n\t"), /empty Markdown output/);
});

test("extractCodexMarkdownAnalysis uses API only for on-demand structured extraction", async () => {
  const { extractCodexMarkdownAnalysis } = loadBundle();
  const requests = [];
  const result = await extractCodexMarkdownAnalysis({
    question: "Compare the papers",
    markdown: "## Answer\nA and B differ. Evidence: A.pdf p.2.",
    papers: [
      { name: "A.pdf", vaultPath: "papers/A.pdf", role: "current" },
      { name: "B.pdf", vaultPath: "papers/B.pdf", role: "referenced" },
    ],
    modelProfile: { id: "summary", name: "Summary", endpoint: "PRIVATE_ENDPOINT", ["api" + "Key"]: "PRIVATE_KEY", model: "small-model" },
    llm: {
      async chat(request) {
        requests.push(request);
        return JSON.stringify({
          taskType: "multi-paper-analysis",
          question: "Compare the papers",
          papers: [
            {
              id: "a",
              name: "A.pdf",
              role: "current",
              oneSentenceTakeaway: "A",
              coreMethod: "Method A",
              keyEvidence: [{ claim: "A claim", source: "A.pdf p.2", page: 2 }],
            },
          ],
          comparison: { similarities: [], differences: ["Different"], complementaryOpportunities: [], conflictsOrRisks: [] },
          synthesis: { shortAnswer: "Short", detailedAnalysisMarkdown: "Details", suggestedNextQuestions: [] },
          limitations: [],
        });
      },
    },
  });

  assert.equal(result.synthesis.shortAnswer, "Short");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].modelProfile.model, "small-model");
  assert.equal(requests[0].temperatureOverride, 0.1);
  assert.equal(requests[0].stream, false);
  const serializedMessages = JSON.stringify(requests[0].messages);
  assert.match(serializedMessages, /## Answer/);
  assert.match(serializedMessages, /papers\/A\.pdf/);
  assert.doesNotMatch(serializedMessages, /PRIVATE_KEY|PRIVATE_ENDPOINT|apiKey|endpoint|data\.json|%PDF|full_text|chunks/);
});

test("runCodexExec reads the schema output file and kills timed out processes", async () => {
  const { runCodexExec } = loadBundle();
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-chat-codex-runner-test-"));
  const outputPath = path.join(baseDir, "codex-output.json");
  fs.writeFileSync(outputPath, JSON.stringify({ ok: true }), "utf8");
  const spawned = [];
  const ok = await runCodexExec(
    { command: "codex", args: ["exec", "--cd", baseDir] },
    {
      timeoutMs: 1000,
      spawn(command, args) {
        const listeners = {};
        spawned.push({ command, args });
        setTimeout(() => listeners.close?.(0), 0);
        return {
          stdout: { on() {} },
          stderr: { on() {} },
          on(event, handler) {
            listeners[event] = handler;
          },
          kill() {
            throw new Error("should not kill successful process");
          },
        };
      },
    }
  );
  assert.deepEqual(JSON.parse(ok), { ok: true });
  assert.equal(spawned[0].command, "codex");

  let killed = false;
  await assert.rejects(
    () =>
      runCodexExec(
        { command: "codex", args: ["exec", "--cd", baseDir] },
        {
          timeoutMs: 1,
          spawn() {
            return {
              stdout: { on() {} },
              stderr: { on() {} },
              on() {},
              kill() {
                killed = true;
              },
            };
          },
        }
      ),
    /timed out/
  );
  assert.equal(killed, true);
});

test("runCodexExec closes stdin so codex exec does not wait for more prompt input", async () => {
  const { runCodexExec } = loadBundle();
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-chat-codex-stdin-test-"));
  const outputPath = path.join(baseDir, "codex-output.md");
  fs.writeFileSync(outputPath, "hello", "utf8");
  let stdinEnded = false;

  await runCodexExec(
    { command: "codex", args: ["exec", "--cd", baseDir] },
    {
      timeoutMs: 1000,
      outputFileName: "codex-output.md",
      spawn() {
        const listeners = {};
        setTimeout(() => listeners.close?.(0), 0);
        return {
          stdin: {
            end() {
              stdinEnded = true;
            },
          },
          stdout: { on() {} },
          stderr: { on() {} },
          on(event, handler) {
            listeners[event] = handler;
          },
          kill() {
            throw new Error("should not kill successful process");
          },
        };
      },
    }
  );

  assert.equal(stdinEnded, true);
});

test("runCodexExec emits sanitized progress from Codex JSONL stdout", async () => {
  const { runCodexExec } = loadBundle();
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-chat-codex-progress-test-"));
  const outputPath = path.join(baseDir, "codex-output.json");
  fs.writeFileSync(outputPath, JSON.stringify({ ok: true }), "utf8");
  const progress = [];

  const ok = await runCodexExec(
    { command: "codex", args: ["exec", "--json", "--cd", baseDir] },
    {
      timeoutMs: 1000,
      onProgress(update) {
        progress.push(update);
      },
      spawn() {
        const listeners = {};
        setTimeout(() => {
          listeners.stdoutData?.(
            [
              JSON.stringify({ type: "agent_reasoning", content: "hidden reasoning should not be shown" }),
              JSON.stringify({ type: "exec_command_begin", command: "rg claim papers/paper-a/full_text.md" }),
              JSON.stringify({ type: "file_read", path: "papers/paper-a/pages/page-003.md" }),
              "not-json",
              "",
            ].join("\n")
          );
          listeners.close?.(0);
        }, 0);
        return {
          stdout: {
            on(event, handler) {
              if (event === "data") listeners.stdoutData = handler;
            },
          },
          stderr: { on() {} },
          on(event, handler) {
            listeners[event] = handler;
          },
          kill() {
            throw new Error("should not kill successful process");
          },
        };
      },
    }
  );

  assert.deepEqual(JSON.parse(ok), { ok: true });
  const messages = progress.map((item) => item.message).join("\n");
  assert.match(messages, /Codex 正在推理/);
  assert.match(messages, /正在执行命令/);
  assert.match(messages, /page-003\.md/);
  assert.doesNotMatch(messages, /hidden reasoning/);
});
