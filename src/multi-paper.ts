import { prepareFuzzySearch, type App } from "obsidian";
import type { CodexReasoningEffort, CodexVerbosity, PdfChunk, PdfPageText } from "./types";

export type PaperRole = "current" | "referenced";

export interface PaperSearchCandidate {
  path: string;
  name: string;
  score: number;
  cached: boolean;
}

export interface PreparedCodexPaper {
  id: string;
  role: PaperRole;
  name: string;
  vaultPath: string;
  mtime?: number;
  summary: string;
  chunks: PdfChunk[];
  pages: PdfPageText[];
}

export interface CodexPaperAnalysisManifest {
  version: 1;
  taskId: string;
  createdAt: string;
  question: string;
  papers: Array<{
    id: string;
    role: PaperRole;
    name: string;
    vaultPath: string;
    metadataPath: string;
    briefPath: string;
    summaryPath: string;
    fullTextPath: string;
    chunksPath: string;
    pagesDir: string;
  }>;
}

export interface WriteCodexAnalysisPackageRequest {
  baseDir: string;
  taskId: string;
  createdAt: string;
  question: string;
  papers: PreparedCodexPaper[];
}

export interface CodexAnalysisPackage {
  analysisDir: string;
  manifestPath: string;
  questionPath: string;
  outputSchemaPath: string;
}

export interface CodexExecArgsRequest {
  analysisDir: string;
  command: string;
  profile?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  verbosity?: CodexVerbosity;
  prompt: string;
}

export interface CodexExecArgs {
  command: string;
  args: string[];
}

export interface RunCodexExecOptions {
  timeoutMs: number;
  outputFileName?: string;
  signal?: AbortSignal;
  spawn?: (
    command: string,
    args: string[],
    options?: { cwd?: string; windowsHide?: boolean; shell?: boolean }
  ) => CodexChildProcess;
}

interface CodexChildProcess {
  stdout?: { on(event: "data", handler: (chunk: unknown) => void): void };
  stderr?: { on(event: "data", handler: (chunk: unknown) => void): void };
  on(event: "close", handler: (code: number | null) => void): void;
  on(event: "error", handler: (error: Error) => void): void;
  kill(signal?: string): void;
}

export interface CodexAnalysisOutput {
  taskType: "multi-paper-analysis";
  question: string;
  papers: Array<{
    id: string;
    name: string;
    role: PaperRole;
    oneSentenceTakeaway: string;
    coreMethod: string;
    keyEvidence: Array<{
      claim: string;
      source: string;
      page?: number;
    }>;
  }>;
  comparison: {
    similarities: string[];
    differences: string[];
    complementaryOpportunities: string[];
    conflictsOrRisks: string[];
  };
  synthesis: {
    shortAnswer: string;
    detailedAnalysisMarkdown: string;
    suggestedNextQuestions: string[];
  };
  limitations: string[];
}

function loadNodeModule<T>(name: string): T {
  const nodeRequire = typeof require === "function" ? require : null;
  if (!nodeRequire) throw new Error("Node.js APIs are not available in this Obsidian environment");
  return nodeRequire(name) as T;
}

function isPdfFile(file: { extension?: string; path?: string; name?: string }): boolean {
  const extension = String(file.extension || "").toLowerCase();
  if (extension) return extension === "pdf";
  return /\.pdf$/i.test(file.path || file.name || "");
}

export function searchPdfFiles(
  app: App,
  query: string,
  options: { limit?: number; cachedPaths?: Set<string>; excludePaths?: Set<string> } = {}
): PaperSearchCandidate[] {
  const files = app?.vault?.getFiles ? app.vault.getFiles() : [];
  const normalizedQuery = (query || "").trim();
  const matcher =
    normalizedQuery && typeof prepareFuzzySearch === "function"
      ? prepareFuzzySearch(normalizedQuery)
      : null;
  const fallbackQuery = normalizedQuery.toLowerCase();
  const candidates = files
    .filter(isPdfFile)
    .filter((file) => !options.excludePaths?.has(file.path))
    .map((file) => {
      const target = `${file.name || ""} ${file.path || ""}`;
      const match = matcher
        ? matcher(target)
        : fallbackQuery
          ? target.toLowerCase().includes(fallbackQuery)
            ? { score: fallbackQuery.length, matches: [] }
            : null
          : { score: 1, matches: [] };
      if (!match) return null;
      return {
        path: file.path,
        name: file.name || file.path.split(/[\\/]/).pop() || file.path,
        score: typeof match.score === "number" ? match.score : normalizedQuery.length || 1,
        cached: Boolean(options.cachedPaths?.has(file.path)),
      } as PaperSearchCandidate;
    })
    .filter((candidate): candidate is PaperSearchCandidate => Boolean(candidate))
    .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  return candidates.slice(0, options.limit || 8);
}

export function safePaperId(input: string, fallback: string): string {
  const base = (input || fallback || "paper")
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback || "paper";
}

function writeJson(fs: typeof import("node:fs"), file: string, value: unknown): void {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function pageFileName(page: number): string {
  return `page-${String(page).padStart(3, "0")}.md`;
}

function compactWhitespace(text: string): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export function buildCodexPaperBrief(paper: PreparedCodexPaper, maxChars = 250): string {
  const source = compactWhitespace(paper.summary) || compactWhitespace(paper.pages.map((page) => page.text).join(" "));
  if (!source) return `${paper.name || paper.vaultPath}: no brief available.`;
  if (source.length <= maxChars) return source;
  return source.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "…";
}

export function createCodexAnalysisTempDir(taskId: string): string {
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  const os = loadNodeModule<typeof import("node:os")>("node:os");
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  return fs.mkdtempSync(path.join(os.tmpdir(), `pdf-chat-analysis-${taskId}-`));
}

export function removeCodexAnalysisTempDir(analysisDir: string): void {
  if (!analysisDir) return;
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  fs.rmSync(analysisDir, { recursive: true, force: true });
}

export function codexAnalysisOutputSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["taskType", "question", "papers", "comparison", "synthesis", "limitations"],
    properties: {
      taskType: { const: "multi-paper-analysis" },
      question: { type: "string" },
      papers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "name", "role", "oneSentenceTakeaway", "coreMethod", "keyEvidence"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            role: { enum: ["current", "referenced"] },
            oneSentenceTakeaway: { type: "string" },
            coreMethod: { type: "string" },
            keyEvidence: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["claim", "source"],
                properties: {
                  claim: { type: "string" },
                  source: { type: "string" },
                  page: { type: "number" },
                },
              },
            },
          },
        },
      },
      comparison: {
        type: "object",
        additionalProperties: false,
        required: ["similarities", "differences", "complementaryOpportunities", "conflictsOrRisks"],
        properties: {
          similarities: { type: "array", items: { type: "string" } },
          differences: { type: "array", items: { type: "string" } },
          complementaryOpportunities: { type: "array", items: { type: "string" } },
          conflictsOrRisks: { type: "array", items: { type: "string" } },
        },
      },
      synthesis: {
        type: "object",
        additionalProperties: false,
        required: ["shortAnswer", "detailedAnalysisMarkdown", "suggestedNextQuestions"],
        properties: {
          shortAnswer: { type: "string" },
          detailedAnalysisMarkdown: { type: "string" },
          suggestedNextQuestions: { type: "array", items: { type: "string" } },
        },
      },
      limitations: { type: "array", items: { type: "string" } },
    },
  };
}

export async function writeCodexAnalysisPackage(
  request: WriteCodexAnalysisPackageRequest
): Promise<CodexAnalysisPackage> {
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  const analysisDir = request.baseDir;
  fs.mkdirSync(path.join(analysisDir, "papers"), { recursive: true });

  const manifestPapers: CodexPaperAnalysisManifest["papers"] = [];
  for (const [index, paper] of request.papers.entries()) {
    const id = safePaperId(paper.id || paper.vaultPath || paper.name, `paper-${index + 1}`);
    const paperDir = path.join(analysisDir, "papers", id);
    const pagesDir = path.join(paperDir, "pages");
    fs.mkdirSync(pagesDir, { recursive: true });

    const metadataPath = path.join("papers", id, "metadata.json");
    const briefPath = path.join("papers", id, "brief.md");
    const summaryPath = path.join("papers", id, "summary.md");
    const fullTextPath = path.join("papers", id, "full_text.md");
    const chunksPath = path.join("papers", id, "chunks.json");
    const relativePagesDir = path.join("papers", id, "pages").replace(/\\/g, "/");

    writeJson(fs, path.join(analysisDir, metadataPath), {
      id,
      name: paper.name,
      role: paper.role,
      vaultPath: paper.vaultPath,
      mtime: paper.mtime,
      pageCount: paper.pages.length,
      fullTextLength: paper.pages.reduce((total, page) => total + (page.text || "").length, 0),
      chunkCount: paper.chunks.length,
    });
    fs.writeFileSync(path.join(analysisDir, briefPath), buildCodexPaperBrief(paper), "utf8");
    fs.writeFileSync(path.join(analysisDir, summaryPath), paper.summary || "(no summary)", "utf8");
    fs.writeFileSync(
      path.join(analysisDir, fullTextPath),
      paper.pages.map((page) => `[Page ${page.page}]\n${page.text}`).join("\n\n"),
      "utf8"
    );
    writeJson(fs, path.join(analysisDir, chunksPath), paper.chunks);
    for (const page of paper.pages) {
      fs.writeFileSync(path.join(pagesDir, pageFileName(page.page)), page.text || "", "utf8");
    }
    manifestPapers.push({
      id,
      role: paper.role,
      name: paper.name,
      vaultPath: paper.vaultPath,
      metadataPath: metadataPath.replace(/\\/g, "/"),
      briefPath: briefPath.replace(/\\/g, "/"),
      summaryPath: summaryPath.replace(/\\/g, "/"),
      fullTextPath: fullTextPath.replace(/\\/g, "/"),
      chunksPath: chunksPath.replace(/\\/g, "/"),
      pagesDir: relativePagesDir,
    });
  }

  const manifest: CodexPaperAnalysisManifest = {
    version: 1,
    taskId: request.taskId,
    createdAt: request.createdAt,
    question: request.question,
    papers: manifestPapers,
  };
  const manifestPath = path.join(analysisDir, "manifest.json");
  const questionPath = path.join(analysisDir, "question.md");
  const outputSchemaPath = path.join(analysisDir, "output.schema.json");
  writeJson(fs, manifestPath, manifest);
  fs.writeFileSync(questionPath, request.question, "utf8");
  writeJson(fs, outputSchemaPath, codexAnalysisOutputSchema());
  return { analysisDir, manifestPath, questionPath, outputSchemaPath };
}

export function buildCodexDeepAnalysisPrompt(): string {
  return [
    "You are a careful research assistant performing multi-paper analysis.",
    "Read manifest.json and question.md first.",
    "For each paper: read brief.md first for orientation, then summary.md, then full_text.md, and use pages/ or chunks.json for evidence.",
    "The prompt intentionally does not include the full paper text. Open the files listed in manifest.json inside this read-only analysis directory.",
    "Extract each paper's research problem, core method, assumptions, experiments, conclusions, and limitations.",
    "Then compare similarities, differences, complementary opportunities, and conflicts or risks.",
    "Every important claim must cite the paper name and page or chunk/source location when available.",
    "Return only JSON that matches output.schema.json. Do not include markdown fences.",
  ].join("\n");
}

export function buildCodexExecArgs(request: CodexExecArgsRequest): CodexExecArgs {
  const args = [
    "exec",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--ephemeral",
    "--cd",
    request.analysisDir,
    "--output-schema",
    "output.schema.json",
    "--output-last-message",
    "codex-output.json",
  ];
  if (request.profile) args.push("--profile", request.profile);
  if (request.model) args.push("--model", request.model);
  if (request.reasoningEffort) args.push("-c", `model_reasoning_effort="${request.reasoningEffort}"`);
  if (request.verbosity) args.push("-c", `model_verbosity="${request.verbosity}"`);
  args.push(request.prompt);
  return { command: request.command || "codex", args };
}

function argValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : null;
}

function redactProcessText(text: string): string {
  return (text || "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[REDACTED]")
    .slice(0, 1200);
}

export function runCodexExec(execArgs: CodexExecArgs, options: RunCodexExecOptions): Promise<string> {
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  const childProcess = options.spawn
    ? { spawn: options.spawn }
    : loadNodeModule<typeof import("node:child_process")>("node:child_process");
  const analysisDir = argValue(execArgs.args, "--cd");
  if (!analysisDir) throw new Error("Codex command is missing --cd analysis directory");
  const outputFileName = options.outputFileName || "codex-output.json";
  const outputPath = path.join(analysisDir, outputFileName);

  return new Promise((resolve, reject) => {
    let settled = false;
    let stderr = "";
    const timeoutMs = Math.max(1, options.timeoutMs || 600000);
    const child = childProcess.spawn(execArgs.command, execArgs.args, {
      cwd: analysisDir,
      windowsHide: true,
      shell: false,
    }) as CodexChildProcess;
    let timer: ReturnType<typeof setTimeout>;

    const onAbort = () => {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        void error;
      }
      const abortError = new Error("Codex analysis aborted");
      abortError.name = "AbortError";
      finish(() => reject(abortError));
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      callback();
    };
    options.signal?.addEventListener("abort", onAbort);
    timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        void error;
      }
      finish(() => reject(new Error(`Codex analysis timed out after ${timeoutMs}ms`)));
    }, timeoutMs);

    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk || "");
    });
    child.on("error", (error) => {
      finish(() => reject(new Error("Codex CLI failed to start: " + error.message)));
    });
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          const detail = redactProcessText(stderr);
          reject(new Error(`Codex CLI exited with code ${code}${detail ? `: ${detail}` : ""}`));
          return;
        }
        if (!fs.existsSync(outputPath)) {
          reject(new Error("Codex CLI finished but did not write codex-output.json"));
          return;
        }
        resolve(fs.readFileSync(outputPath, "utf8"));
      });
    });
  });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseCodexAnalysisOutput(raw: string): CodexAnalysisOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid Codex analysis output: JSON parse failed");
  }
  const value = parsed as CodexAnalysisOutput;
  if (
    !value ||
    typeof value !== "object" ||
    value.taskType !== "multi-paper-analysis" ||
    typeof value.question !== "string" ||
    !Array.isArray(value.papers) ||
    !value.comparison ||
    !value.synthesis ||
    typeof value.synthesis.shortAnswer !== "string" ||
    typeof value.synthesis.detailedAnalysisMarkdown !== "string" ||
    !isStringArray(value.synthesis.suggestedNextQuestions) ||
    !isStringArray(value.limitations)
  ) {
    throw new Error("Invalid Codex analysis output: missing required fields");
  }
  return value;
}

function listBlock(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- 暂无";
}

export function renderCodexAnalysisMarkdown(output: CodexAnalysisOutput): string {
  const nextQuestions = output.synthesis.suggestedNextQuestions.length
    ? `\n\n### 可以继续追问\n${listBlock(output.synthesis.suggestedNextQuestions)}`
    : "";
  const limitations = output.limitations.length
    ? `\n\n### 局限\n${listBlock(output.limitations)}`
    : "";
  return [
    `### 简短结论\n${output.synthesis.shortAnswer}`,
    output.synthesis.detailedAnalysisMarkdown,
    `### 相似点\n${listBlock(output.comparison.similarities)}`,
    `### 不同点\n${listBlock(output.comparison.differences)}`,
    `### 结合机会\n${listBlock(output.comparison.complementaryOpportunities)}`,
    `### 风险与冲突\n${listBlock(output.comparison.conflictsOrRisks)}`,
  ].join("\n\n") + nextQuestions + limitations;
}
