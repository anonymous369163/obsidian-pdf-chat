import { prepareFuzzySearch, type App } from "obsidian";
import type {
  CodexInputMode,
  CodexOutputMode,
  CodexReasoningEffort,
  CodexVerbosity,
  LlmRequest,
  ModelProfile,
  PdfChunk,
  PdfPageText,
} from "./types";

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
  summary?: string;
  chunks?: PdfChunk[];
  pages?: PdfPageText[];
  originalPdfData?: Uint8Array;
}

export interface CodexPaperAnalysisManifest {
  version: 2;
  taskId: string;
  createdAt: string;
  mode: "pdf-only";
  questionPath: string;
  papersDir: string;
  papers: Array<{
    id: string;
    role: PaperRole;
    name: string;
    vaultPath: string;
    pdfPath: string;
  }>;
}

export interface CodexDebugFullManifest {
  version: 1;
  taskId: string;
  createdAt: string;
  question: string;
  skillPath: string;
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
    extractionReportPath: string;
    originalPdfPath?: string;
    pagesDir: string;
  }>;
}

export interface WriteCodexAnalysisPackageRequest {
  baseDir: string;
  taskId: string;
  createdAt: string;
  question: string;
  papers: PreparedCodexPaper[];
  selectedContext?: string;
}

export interface CodexAnalysisPackage {
  analysisDir: string;
  inputMode: CodexInputMode;
  skillPath?: string;
  manifestPath?: string;
  questionPath?: string;
  outputSchemaPath?: string;
  selectedContextPath?: string;
}

export interface PdfExtractionReport {
  pageCount: number;
  fullTextLength: number;
  averageCharsPerPage: number;
  longestPageChars: number;
  emptyPages: number[];
  veryShortPages: number[];
  originalPdfAvailable: boolean;
  quality: "good" | "mixed" | "poor";
  warnings: string[];
}

export interface CodexExecArgsRequest {
  analysisDir: string;
  command: string;
  profile?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  verbosity?: CodexVerbosity;
  outputMode?: CodexOutputMode;
  outputFileName?: string;
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
  onProgress?: (progress: CodexRunProgress) => void;
  spawn?: (
    command: string,
    args: string[],
    options?: { cwd?: string; windowsHide?: boolean; shell?: boolean }
  ) => CodexChildProcess;
}

export interface CodexRunProgress {
  type: string;
  message: string;
  elapsedMs: number;
}

export interface CodexMarkdownExtractionRequest {
  question: string;
  markdown: string;
  papers: Array<{ name: string; vaultPath: string; role: PaperRole }>;
  modelProfile: ModelProfile;
  llm: { chat(request: LlmRequest): Promise<string> };
  signal?: AbortSignal;
}

export interface ResolveCodexExecArgsOptions {
  platform?: string;
  env?: Record<string, string | undefined>;
  existsSync?: (file: string) => boolean;
  readdirSync?: (dir: string) => string[];
}

interface CodexChildProcess {
  stdin?: { end(): void };
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

function compactWhitespace(text: string | undefined): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export function buildCodexPaperBrief(paper: PreparedCodexPaper, maxChars = 250): string {
  const source = compactWhitespace(paper.summary) || compactWhitespace((paper.pages || []).map((page) => page.text).join(" "));
  if (!source) return `${paper.name || paper.vaultPath}: no brief available.`;
  if (source.length <= maxChars) return source;
  return source.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "…";
}

export function buildPdfExtractionReport(paper: PreparedCodexPaper): PdfExtractionReport {
  const pages = paper.pages || [];
  const pageLengths = pages.map((page) => compactWhitespace(page.text).length);
  const pageCount = pages.length;
  const fullTextLength = pageLengths.reduce((total, length) => total + length, 0);
  const emptyPages = pages
    .filter((page) => compactWhitespace(page.text).length === 0)
    .map((page) => page.page);
  const veryShortPages = pages
    .filter((page) => {
      const length = compactWhitespace(page.text).length;
      return length > 0 && length < 80;
    })
    .map((page) => page.page);
  const warnings: string[] = [];
  if (!pageCount) warnings.push("No pages were extracted from the PDF text layer.");
  if (emptyPages.length) warnings.push(`Text-layer extraction produced empty pages: ${emptyPages.join(", ")}.`);
  if (veryShortPages.length) warnings.push(`Some pages have very little extracted text: ${veryShortPages.join(", ")}.`);
  if (fullTextLength < 500) warnings.push("The extracted text is short; inspect original.pdf before making detailed claims.");
  if (!paper.originalPdfData) warnings.push("original.pdf is not available in this package; rely on extracted text cautiously.");

  const emptyRatio = pageCount ? emptyPages.length / pageCount : 1;
  const quality: PdfExtractionReport["quality"] =
    !pageCount || fullTextLength < 200 || emptyRatio > 0.5
      ? "poor"
      : warnings.length
        ? "mixed"
        : "good";

  return {
    pageCount,
    fullTextLength,
    averageCharsPerPage: pageCount ? Math.round(fullTextLength / pageCount) : 0,
    longestPageChars: pageLengths.length ? Math.max(...pageLengths) : 0,
    emptyPages,
    veryShortPages,
    originalPdfAvailable: Boolean(paper.originalPdfData),
    quality,
    warnings,
  };
}

export function buildCodexAnalysisSkillMarkdown(): string {
  return [
    "---",
    "name: pdf-paper-analysis",
    "description: Read a PDF Chat multi-paper analysis package and produce evidence-grounded JSON for comparing or synthesizing research papers.",
    "---",
    "",
    "# PDF Paper Analysis",
    "",
    "Follow this workflow exactly for the current analysis package.",
    "",
    "1. Read `manifest.json` and `question.md` first.",
    "2. For each paper, read `metadata.json` and `extraction_report.json` before drawing conclusions.",
    "3. Use `brief.md` only for orientation. It is intentionally short and incomplete.",
    "4. Use `summary.md`, `full_text.md`, `pages/`, and `chunks.json` for claims and evidence.",
    "5. If `extraction_report.json` says quality is `mixed` or `poor`, or if text evidence looks garbled, inspect `original.pdf` when it is available.",
    "6. Do not read or request private plugin settings, credential files, model URLs, or files outside this analysis package.",
    "7. Cite important claims with paper name plus page number or chunk/page source. If the package cannot support a claim, say so in `limitations`.",
    "8. Return only JSON matching `output.schema.json`; do not include Markdown fences or extra commentary.",
  ].join("\n");
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
        maxItems: 4,
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
              maxItems: 5,
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
          similarities: { type: "array", maxItems: 5, items: { type: "string" } },
          differences: { type: "array", maxItems: 5, items: { type: "string" } },
          complementaryOpportunities: { type: "array", maxItems: 5, items: { type: "string" } },
          conflictsOrRisks: { type: "array", maxItems: 5, items: { type: "string" } },
        },
      },
      synthesis: {
        type: "object",
        additionalProperties: false,
        required: ["shortAnswer", "detailedAnalysisMarkdown", "suggestedNextQuestions"],
        properties: {
          shortAnswer: { type: "string" },
          detailedAnalysisMarkdown: { type: "string" },
          suggestedNextQuestions: { type: "array", maxItems: 4, items: { type: "string" } },
        },
      },
        limitations: { type: "array", maxItems: 5, items: { type: "string" } },
    },
  };
}

function codexPdfFileName(role: PaperRole, index: number): string {
  if (role === "current") return "current.pdf";
  return `reference-${Math.max(1, index)}.pdf`;
}

export async function writeCodexPdfOnlyPackage(
  request: WriteCodexAnalysisPackageRequest
): Promise<CodexAnalysisPackage> {
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  const analysisDir = request.baseDir;
  fs.mkdirSync(path.join(analysisDir, "papers"), { recursive: true });
  let referenceIndex = 0;

  for (const [index, paper] of request.papers.entries()) {
    if (!paper.originalPdfData) {
      throw new Error(`Codex PDF-only package requires original PDF data for ${paper.name || paper.vaultPath || index + 1}`);
    }
    const id = safePaperId(paper.id || paper.vaultPath || paper.name, `paper-${index + 1}`);
    const pdfFileName = codexPdfFileName(paper.role, paper.role === "current" ? 0 : ++referenceIndex);
    const pdfPath = path.join("papers", pdfFileName).replace(/\\/g, "/");
    fs.writeFileSync(path.join(analysisDir, pdfPath), paper.originalPdfData);
    void id;
  }
  const selectedContext = (request.selectedContext || "").trim();
  const selectedContextPath = selectedContext ? "selected-context.md" : undefined;
  if (selectedContextPath) fs.writeFileSync(path.join(analysisDir, selectedContextPath), selectedContext, "utf8");

  return { analysisDir, inputMode: "pdf-only", selectedContextPath };
}

export function writeCodexOutputSchema(analysisDir: string): string {
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  const outputSchemaPath = path.join(analysisDir, "output.schema.json");
  writeJson(fs, outputSchemaPath, codexAnalysisOutputSchema());
  return outputSchemaPath;
}

export async function writeCodexDebugFullPackage(
  request: WriteCodexAnalysisPackageRequest
): Promise<CodexAnalysisPackage> {
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  const analysisDir = request.baseDir;
  fs.mkdirSync(path.join(analysisDir, "papers"), { recursive: true });
  const skillPath = "SKILL.md";
  fs.writeFileSync(path.join(analysisDir, skillPath), buildCodexAnalysisSkillMarkdown(), "utf8");
  const selectedContext = (request.selectedContext || "").trim();
  const selectedContextPath = selectedContext ? "selected-context.md" : undefined;
  if (selectedContextPath) fs.writeFileSync(path.join(analysisDir, selectedContextPath), selectedContext, "utf8");

  const manifestPapers: CodexDebugFullManifest["papers"] = [];
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
    const extractionReportPath = path.join("papers", id, "extraction_report.json");
    const originalPdfPath = paper.originalPdfData ? path.join("papers", id, "original.pdf") : undefined;
    const relativePagesDir = path.join("papers", id, "pages").replace(/\\/g, "/");
    const pages = paper.pages || [];
    const chunks = paper.chunks || [];
    const extractionReport = buildPdfExtractionReport(paper);

    writeJson(fs, path.join(analysisDir, metadataPath), {
      id,
      name: paper.name,
      role: paper.role,
      vaultPath: paper.vaultPath,
      mtime: paper.mtime,
      pageCount: pages.length,
      fullTextLength: pages.reduce((total, page) => total + (page.text || "").length, 0),
      chunkCount: chunks.length,
      originalPdfAvailable: Boolean(paper.originalPdfData),
    });
    fs.writeFileSync(path.join(analysisDir, briefPath), buildCodexPaperBrief(paper), "utf8");
    fs.writeFileSync(path.join(analysisDir, summaryPath), paper.summary || "(no summary)", "utf8");
    fs.writeFileSync(
      path.join(analysisDir, fullTextPath),
      [`# ${paper.name}`, `Vault path: ${paper.vaultPath}`, "", ...pages.map((page) => `[Page ${page.page}]\n${page.text}`)].join("\n\n"),
      "utf8"
    );
    writeJson(fs, path.join(analysisDir, chunksPath), chunks);
    writeJson(fs, path.join(analysisDir, extractionReportPath), extractionReport);
    if (paper.originalPdfData && originalPdfPath) {
      fs.writeFileSync(path.join(analysisDir, originalPdfPath), paper.originalPdfData);
    }
    for (const page of pages) {
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
      extractionReportPath: extractionReportPath.replace(/\\/g, "/"),
      originalPdfPath: originalPdfPath?.replace(/\\/g, "/"),
      pagesDir: relativePagesDir,
    });
  }

  const manifest: CodexDebugFullManifest = {
    version: 1,
    taskId: request.taskId,
    createdAt: request.createdAt,
    question: request.question,
    skillPath,
    papers: manifestPapers,
  };
  const manifestPath = path.join(analysisDir, "manifest.json");
  const questionPath = path.join(analysisDir, "question.md");
  const outputSchemaPath = path.join(analysisDir, "output.schema.json");
  writeJson(fs, manifestPath, manifest);
  fs.writeFileSync(questionPath, request.question, "utf8");
  writeJson(fs, outputSchemaPath, codexAnalysisOutputSchema());
  return {
    analysisDir,
    inputMode: "debug-full",
    skillPath: path.join(analysisDir, skillPath),
    manifestPath,
    questionPath,
    outputSchemaPath,
    selectedContextPath,
  };
}

export async function writeCodexAnalysisPackage(
  request: WriteCodexAnalysisPackageRequest
): Promise<CodexAnalysisPackage> {
  return writeCodexPdfOnlyPackage(request);
}

function codexPdfPromptList(papers: PreparedCodexPaper[] = []): string[] {
  let referenceIndex = 0;
  return papers.map((paper, index) => {
    const pdfPath = `papers/${codexPdfFileName(paper.role, paper.role === "current" ? 0 : ++referenceIndex)}`;
    const role = paper.role === "current" ? "current" : `reference-${referenceIndex}`;
    const displayName = paper.name || paper.vaultPath || `paper-${index + 1}`;
    return `- ${pdfPath} (${role}) = ${displayName}${paper.vaultPath ? `; vault path: ${paper.vaultPath}` : ""}`;
  });
}

export function buildCodexPdfOnlyPrompt(
  question = "",
  papers: PreparedCodexPaper[] = [],
  options: { selectedContextPath?: string } = {}
): string {
  const paperLines = codexPdfPromptList(papers);
  return [
    "You are inside a read-only PDF Chat Codex directory that contains only the PDF files selected for this turn.",
    "Read only these PDF files:",
    paperLines.length ? paperLines.join("\n") : "- No PDF files are attached for this turn.",
    options.selectedContextPath
      ? `${options.selectedContextPath} contains the user's selected passage or local context. Use it as the primary passage to explain when it is relevant to the question.`
      : "",
    question ? `User question:\n${question}` : "Use the user's question from the command prompt.",
    "Answer the user's exact question. Use the PDF files when the question needs paper evidence or local context; for casual or operational prompts, answer directly without unnecessary reading.",
    "Do not write a full survey or generic comparison unless the user explicitly asks for it.",
    "Keep schema side fields concise: use empty arrays or short strings when a section is not needed for the user's question.",
    "Put the user-facing answer in synthesis.detailedAnalysisMarkdown.",
    "When you make an important claim, cite the paper name and page number when the PDF reader exposes page information.",
    "If a PDF cannot be read or page evidence is unavailable, say that clearly in limitations instead of guessing.",
    "Return only JSON that matches output.schema.json. Do not include markdown fences.",
  ].filter(Boolean).join("\n");
}

export function buildCodexMarkdownPrompt(
  question = "",
  papers: PreparedCodexPaper[] = [],
  options: { selectedContextPath?: string } = {}
): string {
  const paperLines = codexPdfPromptList(papers);
  return [
    "You are inside a read-only PDF Chat Codex directory that contains only the PDF files selected for this turn.",
    "Read only these PDF files:",
    paperLines.length ? paperLines.join("\n") : "- No PDF files are attached for this turn.",
    options.selectedContextPath
      ? `${options.selectedContextPath} contains the user's selected passage or selected context. Treat it as the primary passage to explain when it is relevant to the question.`
      : "",
    question ? `User question:\n${question}` : "Use the user's question from the command prompt.",
    "Answer the user's exact question. Use the PDF files when the question needs paper evidence or local context; for casual or operational prompts, answer directly without unnecessary reading.",
    "Write a natural, readable Markdown answer. Do not output JSON and do not wrap the answer in a markdown fence.",
    "Do not write a full survey, generic comparison, or table unless the user's question asks for it.",
    "When you make an important claim, cite the paper name and page number when the PDF reader exposes page information.",
    "If a PDF cannot be read or page evidence is unavailable, say that clearly instead of guessing.",
  ].filter(Boolean).join("\n");
}

export function buildCodexDebugFullPrompt(): string {
  return [
    "Read SKILL.md first, then follow it exactly for this multi-paper analysis package.",
    "Read manifest.json and question.md after SKILL.md.",
    "If selected-context.md exists, treat it as the user's selected passage or local context for the question.",
    "For each paper: inspect extraction_report.json and brief.md first for orientation, then summary.md, full_text.md, pages/, and chunks.json for evidence.",
    "If extraction_report.json reports mixed/poor quality or the text looks garbled, inspect original.pdf when present.",
    "The prompt intentionally does not include the full paper text. Open the files listed in manifest.json inside this read-only analysis directory.",
    "Extract each paper's research problem, core method, assumptions, experiments, conclusions, and limitations.",
    "Only compare similarities, differences, complementary opportunities, and conflicts or risks when the user's question asks for comparison.",
    "Every important claim must cite the paper name and page or chunk/source location when available.",
    "Return only JSON that matches output.schema.json. Do not include markdown fences.",
  ].join("\n");
}

export function buildCodexDebugFullMarkdownPrompt(): string {
  return [
    "You are inside a read-only PDF Chat Codex debug analysis directory.",
    "Read manifest.json and question.md first.",
    "If selected-context.md exists, treat it as the user's selected passage or local context for the question.",
    "For each paper, use extraction_report.json and brief.md only for orientation.",
    "Use summary.md, full_text.md, pages/, chunks.json, and original.pdf when useful for evidence.",
    "Answer the user's exact question in natural, readable Markdown.",
    "Do not output JSON and do not wrap the answer in a markdown fence.",
    "Do not write a full survey, generic comparison, or table unless the user's question asks for it.",
    "Every important claim should cite the paper name and page, chunk, or file source when available.",
    "If text extraction is poor or evidence is unavailable, say that clearly instead of guessing.",
  ].join("\n");
}

export function buildCodexDeepAnalysisPrompt(): string {
  return buildCodexMarkdownPrompt();
}

export function buildCodexExecArgs(request: CodexExecArgsRequest): CodexExecArgs {
  const outputMode = request.outputMode === "json-schema" ? "json-schema" : "markdown";
  const outputFileName =
    request.outputFileName || (outputMode === "json-schema" ? "codex-output.json" : "codex-output.md");
  const args = [
    "exec",
    "--json",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--ephemeral",
    "--cd",
    request.analysisDir,
    "--output-last-message",
    outputFileName,
  ];
  if (outputMode === "json-schema") args.push("--output-schema", "output.schema.json");
  if (request.profile) args.push("--profile", request.profile);
  if (request.model) args.push("--model", request.model);
  if (request.reasoningEffort) args.push("-c", `model_reasoning_effort="${request.reasoningEffort}"`);
  if (request.verbosity) args.push("-c", `model_verbosity="${request.verbosity}"`);
  args.push(request.prompt);
  return { command: request.command || "codex", args };
}

function envValue(env: Record<string, string | undefined>, key: string): string {
  return env[key] || env[key.toUpperCase()] || env[key.toLowerCase()] || "";
}

function winJoin(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part.replace(/[\\/]+$/g, "") : part.replace(/^[\\/]+|[\\/]+$/g, "")))
    .join("\\");
}

function defaultResolveEnv(): Record<string, string | undefined> {
  return typeof process !== "undefined" && process?.env ? process.env : {};
}

function defaultResolvePlatform(): string {
  return typeof process !== "undefined" && process?.platform ? process.platform : "";
}

function defaultExistsSync(file: string): boolean {
  try {
    const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
    return fs.existsSync(file);
  } catch (error) {
    void error;
    return false;
  }
}

function defaultReaddirSync(dir: string): string[] {
  try {
    const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
    return fs.readdirSync(dir);
  } catch (error) {
    void error;
    return [];
  }
}

function commandBasename(command: string): string {
  return String(command || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .split(/[\\/]/)
    .pop() || "";
}

function commandDirname(command: string): string {
  const normalized = String(command || "").trim().replace(/^["']|["']$/g, "");
  const index = Math.max(normalized.lastIndexOf("\\"), normalized.lastIndexOf("/"));
  return index > 0 ? normalized.slice(0, index) : "";
}

function isAbsoluteCodexExe(command: string): boolean {
  return /[\\/]/.test(command) && /^codex\.exe$/i.test(commandBasename(command));
}

function isResolvableCodexCommand(command: string): boolean {
  if (isAbsoluteCodexExe(command)) return false;
  return /^codex(?:\.(?:exe|cmd|ps1))?$/i.test(commandBasename(command));
}

function pathDirs(env: Record<string, string | undefined>): string[] {
  return (envValue(env, "PATH") || envValue(env, "Path") || "")
    .split(";")
    .map((dir) => dir.trim())
    .filter(Boolean);
}

function nodeExecutableCandidates(env: Record<string, string | undefined>): string[] {
  const candidates = [
    envValue(env, "PDF_CHAT_NODE_EXE"),
    ...pathDirs(env).map((dir) => winJoin(dir, "node.exe")),
    winJoin(envValue(env, "ProgramFiles"), "nodejs", "node.exe"),
    winJoin(envValue(env, "ProgramFiles(x86)"), "nodejs", "node.exe"),
    winJoin(envValue(env, "LOCALAPPDATA"), "Programs", "nodejs", "node.exe"),
  ];
  return [...new Set(candidates.filter(Boolean))];
}

function npmCodexScriptCandidates(env: Record<string, string | undefined>, command: string): string[] {
  const commandDir = commandDirname(command);
  return [
    commandDir ? winJoin(commandDir, "node_modules", "@openai", "codex", "bin", "codex.js") : "",
    winJoin(envValue(env, "APPDATA"), "npm", "node_modules", "@openai", "codex", "bin", "codex.js"),
    winJoin(envValue(env, "LOCALAPPDATA"), "npm", "node_modules", "@openai", "codex", "bin", "codex.js"),
  ].filter(Boolean);
}

function bundledCodexExeCandidates(
  env: Record<string, string | undefined>,
  readdirSync: (dir: string) => string[]
): string[] {
  const roots = [
    winJoin(envValue(env, "USERPROFILE"), ".cursor", "extensions"),
    winJoin(envValue(env, "USERPROFILE"), ".vscode", "extensions"),
    winJoin(envValue(env, "USERPROFILE"), ".windsurf", "extensions"),
  ].filter(Boolean);
  const candidates: string[] = [];
  for (const root of roots) {
    for (const entry of readdirSync(root)) {
      if (!/^openai\.chatgpt-.*win32-x64$/i.test(entry)) continue;
      candidates.push(winJoin(root, entry, "bin", "windows-x86_64", "codex.exe"));
    }
  }
  return candidates.sort().reverse();
}

export function resolveCodexExecArgs(
  execArgs: CodexExecArgs,
  options: ResolveCodexExecArgsOptions = {}
): CodexExecArgs {
  const platform = options.platform || defaultResolvePlatform();
  if (platform !== "win32" || !isResolvableCodexCommand(execArgs.command)) return execArgs;

  const env = options.env || defaultResolveEnv();
  const existsSync = options.existsSync || defaultExistsSync;
  const readdirSync = options.readdirSync || defaultReaddirSync;

  for (const script of npmCodexScriptCandidates(env, execArgs.command)) {
    if (!existsSync(script)) continue;
    for (const nodeExe of nodeExecutableCandidates(env)) {
      if (existsSync(nodeExe)) {
        return { command: nodeExe, args: [script, ...execArgs.args] };
      }
    }
  }

  for (const exe of bundledCodexExeCandidates(env, readdirSync)) {
    if (existsSync(exe)) return { command: exe, args: execArgs.args };
  }

  return execArgs;
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

function shortPath(value: unknown): string {
  const text = String(value || "").replace(/\\/g, "/").trim();
  if (!text) return "";
  const parts = text.split("/").filter(Boolean);
  return parts.slice(-3).join("/");
}

function shortCommand(value: unknown): string {
  return redactProcessText(String(value || "").replace(/\s+/g, " ").trim()).slice(0, 160);
}

export function summarizeCodexJsonEvent(event: unknown): CodexRunProgress | null {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const value = event as Record<string, unknown>;
  const type = String(value.type || value.event || value.kind || "").trim();
  if (!type) return null;
  const lowerType = type.toLowerCase();

  if (/reasoning|thinking|thought/.test(lowerType)) {
    return { type, message: "Codex 正在推理…", elapsedMs: 0 };
  }
  if (/file.*read|read.*file/.test(lowerType)) {
    const path = shortPath(value.path || value.file || value.filename);
    return { type, message: path ? `正在读取文件：${path}` : "Codex 正在读取文件…", elapsedMs: 0 };
  }
  if (/exec|command|shell|tool/.test(lowerType)) {
    const command = shortCommand(value.command || value.cmd || value.name || value.tool || value.toolName);
    return { type, message: command ? `正在执行命令：${command}` : "Codex 正在使用工具…", elapsedMs: 0 };
  }
  if (/message|response|answer|final/.test(lowerType)) {
    return { type, message: /final/.test(lowerType) ? "Codex 正在整理最终答案…" : "Codex 正在生成回答…", elapsedMs: 0 };
  }
  if (/error|failed|failure/.test(lowerType)) {
    return { type, message: "Codex 报告了一个运行事件，正在等待最终结果…", elapsedMs: 0 };
  }
  return { type, message: `Codex 事件：${type}`, elapsedMs: 0 };
}

function emitCodexJsonProgress(
  line: string,
  startedAt: number,
  onProgress?: (progress: CodexRunProgress) => void
): void {
  if (!onProgress) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch (error) {
    void error;
    return;
  }
  const summary = summarizeCodexJsonEvent(parsed);
  if (!summary) return;
  onProgress({ ...summary, elapsedMs: Math.max(0, Date.now() - startedAt) });
}

export function runCodexExec(execArgs: CodexExecArgs, options: RunCodexExecOptions): Promise<string> {
  const path = loadNodeModule<typeof import("node:path")>("node:path");
  const fs = loadNodeModule<typeof import("node:fs")>("node:fs");
  const childProcess = options.spawn
    ? { spawn: options.spawn }
    : loadNodeModule<typeof import("node:child_process")>("node:child_process");
  const resolvedExecArgs = resolveCodexExecArgs(execArgs);
  const analysisDir = argValue(resolvedExecArgs.args, "--cd");
  if (!analysisDir) throw new Error("Codex command is missing --cd analysis directory");
  const outputFileName = options.outputFileName || "codex-output.json";
  const outputPath = path.join(analysisDir, outputFileName);

  return new Promise((resolve, reject) => {
    let settled = false;
    let stderr = "";
    let stdoutBuffer = "";
    const startedAt = Date.now();
    const timeoutMs = Math.max(1, options.timeoutMs || 1800000);
    const child = childProcess.spawn(resolvedExecArgs.command, resolvedExecArgs.args, {
      cwd: analysisDir,
      windowsHide: true,
      shell: false,
    }) as CodexChildProcess;
    try {
      child.stdin?.end();
    } catch (error) {
      void error;
    }
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
    child.stdout?.on("data", (chunk) => {
      stdoutBuffer += String(chunk || "");
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) emitCodexJsonProgress(trimmed, startedAt, options.onProgress);
      }
    });
    child.on("error", (error) => {
      finish(() => reject(new Error("Codex CLI failed to start: " + error.message)));
    });
    child.on("close", (code) => {
      finish(() => {
        if (stdoutBuffer.trim()) emitCodexJsonProgress(stdoutBuffer.trim(), startedAt, options.onProgress);
        if (code !== 0) {
          const detail = redactProcessText(stderr);
          reject(new Error(`Codex CLI exited with code ${code}${detail ? `: ${detail}` : ""}`));
          return;
        }
        if (!fs.existsSync(outputPath)) {
          reject(new Error(`Codex CLI finished but did not write ${outputFileName}`));
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

export function parseCodexMarkdownOutput(raw: string): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) throw new Error("Invalid Codex analysis output: empty Markdown output");
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

export async function extractCodexMarkdownAnalysis(
  request: CodexMarkdownExtractionRequest
): Promise<CodexAnalysisOutput> {
  const paperList = request.papers
    .map((paper) => `- ${paper.role}: ${paper.name} (${paper.vaultPath})`)
    .join("\n");
  const raw = await request.llm.chat({
    modelProfile: request.modelProfile,
    signal: request.signal,
    stream: false,
    temperatureOverride: 0.1,
    maxTokensOverride: 4000,
    messages: [
      {
        role: "system",
        content: [
          "You extract structured research-analysis data from an existing Codex Markdown answer.",
          "Use only the supplied question, paper list, and Markdown answer.",
          "Do not add claims that are absent from the Markdown.",
          "Use empty arrays for missing comparison evidence and concise limitation strings for missing information.",
          "Return only valid JSON matching the multi-paper analysis shape.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Question:",
          request.question,
          "",
          "Papers:",
          paperList || "(none)",
          "",
          "Codex Markdown answer:",
          request.markdown,
        ].join("\n"),
      },
    ],
  });
  return parseCodexAnalysisOutput(raw);
}

function listBlock(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- 暂无";
}

function tableCell(value: unknown): string {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function evidenceTable(output: CodexAnalysisOutput): string {
  const rows = output.papers.flatMap((paper) =>
    paper.keyEvidence.map((evidence) => ({
      paper: paper.name,
      claim: evidence.claim,
      source: evidence.source,
      page: typeof evidence.page === "number" ? String(evidence.page) : "",
    }))
  );
  if (!rows.length) return "";
  return [
    "### 证据表",
    "| 论文 | 证据/主张 | 来源 | 页码 |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${tableCell(row.paper)} | ${tableCell(row.claim)} | ${tableCell(row.source)} | ${tableCell(row.page)} |`),
  ].join("\n");
}

export function renderCodexAnalysisMarkdown(output: CodexAnalysisOutput): string {
  const evidence = evidenceTable(output);
  const nextQuestions = output.synthesis.suggestedNextQuestions.length
    ? `\n\n### 可以继续追问\n${listBlock(output.synthesis.suggestedNextQuestions)}`
    : "";
  const limitations = output.limitations.length
    ? `\n\n### 局限\n${listBlock(output.limitations)}`
    : "";
  const sections = [
    `### 简短结论\n${output.synthesis.shortAnswer}`,
    output.synthesis.detailedAnalysisMarkdown,
  ];
  if (evidence) sections.push(evidence);
  if (output.comparison.similarities.length) sections.push(`### 相似点\n${listBlock(output.comparison.similarities)}`);
  if (output.comparison.differences.length) sections.push(`### 不同点\n${listBlock(output.comparison.differences)}`);
  if (output.comparison.complementaryOpportunities.length) {
    sections.push(`### 结合机会\n${listBlock(output.comparison.complementaryOpportunities)}`);
  }
  if (output.comparison.conflictsOrRisks.length) sections.push(`### 风险与冲突\n${listBlock(output.comparison.conflictsOrRisks)}`);
  return sections.filter((section) => section && section.trim()).join("\n\n") + nextQuestions + limitations;
}
