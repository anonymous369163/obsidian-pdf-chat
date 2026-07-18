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

test("writeCodexAnalysisPackage creates a multi-paper package without secrets", async () => {
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
        summary: "Summary A",
        chunks: [{ page: 1, text: "Chunk A", idx: 0 }],
        pages: [{ page: 1, text: "Full A" }],
      },
      {
        id: "paper-b",
        role: "referenced",
        name: "B.pdf",
        vaultPath: "papers/B.pdf",
        mtime: 2,
        summary: "Summary B",
        chunks: [{ page: 2, text: "Chunk B", idx: 0 }],
        pages: [{ page: 2, text: "Full B" }],
      },
    ],
  });

  const manifest = readJson(path.join(result.analysisDir, "manifest.json"));
  assert.equal(manifest.version, 1);
  assert.equal(manifest.question, "Compare these papers");
  assert.deepEqual(manifest.papers.map((paper) => paper.role), ["current", "referenced"]);
  assert.ok(fs.existsSync(path.join(result.analysisDir, "question.md")));
  assert.ok(fs.existsSync(path.join(result.analysisDir, "output.schema.json")));
  assert.ok(fs.existsSync(path.join(result.analysisDir, "papers", "paper-a", "brief.md")));
  assert.ok(fs.existsSync(path.join(result.analysisDir, "papers", "paper-a", "full_text.md")));
  assert.ok(fs.existsSync(path.join(result.analysisDir, "papers", "paper-b", "pages", "page-002.md")));
  assert.match(manifest.papers[0].briefPath, /papers\/paper-a\/brief\.md/);
  assert.ok(fs.readFileSync(path.join(result.analysisDir, "papers", "paper-a", "brief.md"), "utf8").length <= 260);

  const allText = fs
    .readdirSync(result.analysisDir, { recursive: true })
    .filter((name) => fs.statSync(path.join(result.analysisDir, name)).isFile())
    .map((name) => fs.readFileSync(path.join(result.analysisDir, name), "utf8"))
    .join("\n");
  assert.doesNotMatch(allText, /apiKey|endpoint|Bearer|(^|[\\/])data\.json|YOUR_API_KEY/);
});

test("buildCodexExecArgs uses read-only ephemeral schema-constrained execution", () => {
  const { buildCodexExecArgs } = loadBundle();
  const args = buildCodexExecArgs({
    analysisDir: "C:/tmp/pdf-chat-analysis-1",
    command: "codex",
    model: "gpt-test",
    profile: "deep-review",
    reasoningEffort: "xhigh",
    verbosity: "high",
    prompt: "Read manifest",
  });

  assert.equal(args.command, "codex");
  assert.equal(args.args[0], "exec");
  assert.equal(args.args[1], "--sandbox");
  assert.ok(args.args.includes("read-only"));
  assert.ok(args.args.includes("--ephemeral"));
  assert.ok(args.args.includes("--skip-git-repo-check"));
  assert.ok(args.args.includes("--output-schema"));
  assert.ok(args.args.includes("output.schema.json"));
  assert.ok(args.args.includes("--output-last-message"));
  assert.ok(args.args.includes("codex-output.json"));
  assert.ok(args.args.includes("--profile"));
  assert.ok(args.args.includes("deep-review"));
  assert.ok(args.args.includes("--model"));
  assert.ok(args.args.includes("gpt-test"));
  assert.ok(args.args.includes("-c"));
  assert.ok(args.args.includes('model_reasoning_effort="xhigh"'));
  assert.ok(args.args.includes('model_verbosity="high"'));
  assert.equal(args.args.at(-1), "Read manifest");
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
  assert.match(markdown, /Next\?/);
  assert.throws(() => parseCodexAnalysisOutput("{}"), /Invalid Codex analysis output/);
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
