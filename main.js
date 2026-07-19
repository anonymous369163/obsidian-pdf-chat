// PDF Chat 0.8.3
var global = globalThis;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  ActionRegistry: () => ResearchActionRegistry,
  AtomicJsonStore: () => AtomicJsonStore,
  CodexSessionManager: () => CodexSessionManager,
  ConversationStore: () => ConversationStore,
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  JsonStoreError: () => JsonStoreError,
  LEGACY_0_4_0_TRANSLATE_PROMPT: () => LEGACY_0_4_0_TRANSLATE_PROMPT,
  OpenAICompatibleTransport: () => OpenAICompatibleTransport,
  PDFChatModal: () => PDFChatModal,
  PaperAssetRepository: () => PaperAssetRepository,
  PaperContextService: () => PaperContextService,
  QuickTranslateMarker: () => QuickTranslateMarker,
  ReaderDataMigrator: () => ReaderDataMigrator,
  ReaderDataStore: () => ReaderDataStore,
  ResearchActionRegistry: () => ResearchActionRegistry,
  ResearchNoteService: () => ResearchNoteService,
  SelectionLimitModal: () => SelectionLimitModal,
  SessionLibraryModal: () => SessionLibraryModal,
  SessionLibraryService: () => SessionLibraryService,
  SessionRepository: () => SessionRepository,
  TranslationService: () => TranslationService,
  VaultLifecycleService: () => VaultLifecycleService,
  assessExtractionQuality: () => assessExtractionQuality,
  bm25Retrieve: () => bm25Retrieve,
  bm25RetrieveMulti: () => bm25RetrieveMulti,
  buildCodexDebugFullMarkdownPrompt: () => buildCodexDebugFullMarkdownPrompt,
  buildCodexDebugFullPrompt: () => buildCodexDebugFullPrompt,
  buildCodexDeepAnalysisPrompt: () => buildCodexDeepAnalysisPrompt,
  buildCodexExecArgs: () => buildCodexExecArgs,
  buildCodexMarkdownPrompt: () => buildCodexMarkdownPrompt,
  buildCodexPdfOnlyPrompt: () => buildCodexPdfOnlyPrompt,
  buildCodexThreadExecArgs: () => buildCodexThreadExecArgs,
  buildCodexTurnPrompt: () => buildCodexTurnPrompt,
  buildEvidenceCitationInstructions: () => buildEvidenceCitationInstructions,
  buildTranslationMessages: () => buildTranslationMessages,
  chunkPdfPages: () => chunkPdfPages,
  cleanSelectionText: () => cleanSelectionText,
  codexAnalysisOutputSchema: () => codexAnalysisOutputSchema,
  composeBoundedContext: () => composeBoundedContext,
  createCodexAnalysisTempDir: () => createCodexAnalysisTempDir,
  createCompatibilityActionRegistry: () => createCompatibilityActionRegistry,
  createInstallationId: () => createInstallationId,
  createPDFChatModalServices: () => createPDFChatModalServices,
  createResearchActionRegistry: () => createResearchActionRegistry,
  default: () => PDFChatPlugin,
  expandWithNeighbors: () => expandWithNeighbors,
  extractCodexMarkdownAnalysis: () => extractCodexMarkdownAnalysis,
  extractPdfFullText: () => extractPdfFullText,
  extractPdfPages: () => extractPdfPages,
  formatCodexForkHandoff: () => formatCodexForkHandoff,
  getConversationKey: () => getConversationKey,
  isCodexThreadUnavailableError: () => isCodexThreadUnavailableError,
  isJsonAdapter: () => isJsonAdapter,
  migrateSettings: () => migrateSettings,
  normalizeCodexInputMode: () => normalizeCodexInputMode,
  normalizeCodexOutputMode: () => normalizeCodexOutputMode,
  normalizeConversationHistories: () => normalizeConversationHistories,
  normalizeConversationMessages: () => normalizeConversationMessages,
  normalizeConversationSessions: () => normalizeConversationSessions,
  normalizeRagChunkSettings: () => normalizeRagChunkSettings,
  openPdfEvidence: () => openPdfEvidence,
  parseCodexAnalysisOutput: () => parseCodexAnalysisOutput,
  parseCodexMarkdownOutput: () => parseCodexMarkdownOutput,
  parseResearchEvidence: () => parseResearchEvidence,
  reconcilePdfDeleteState: () => reconcilePdfDeleteState,
  reconcilePdfRenameState: () => reconcilePdfRenameState,
  removeCodexAnalysisTempDir: () => removeCodexAnalysisTempDir,
  renderCodexAnalysisMarkdown: () => renderCodexAnalysisMarkdown,
  requestSelectionLimitDecision: () => requestSelectionLimitDecision,
  resolveCodexExecArgs: () => resolveCodexExecArgs,
  resolveCodexPdfLocation: () => resolveCodexPdfLocation,
  resolveContinueModelId: () => resolveContinueModelId,
  resolveSelectionForTurn: () => resolveSelectionForTurn,
  resolveTranslateModelId: () => resolveTranslateModelId,
  runCodexExec: () => runCodexExec,
  runCodexThreadDoctor: () => runCodexThreadDoctor,
  runCodexThreadTurn: () => runCodexThreadTurn,
  runCodexVersionCheck: () => runCodexVersionCheck,
  sanitizeResearchArtifact: () => sanitizeResearchArtifact,
  searchPdfFiles: () => searchPdfFiles,
  splitTranslationChunks: () => splitTranslationChunks,
  stableConversationHash: () => stableConversationHash,
  summarizeSessionMemory: () => summarizeSessionMemory,
  tokenizeForBM25: () => tokenizeForBM25,
  writeCodexAnalysisPackage: () => writeCodexAnalysisPackage,
  writeCodexDebugFullPackage: () => writeCodexDebugFullPackage,
  writeCodexOutputSchema: () => writeCodexOutputSchema,
  writeCodexPdfOnlyPackage: () => writeCodexPdfOnlyPackage
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/actions.ts
var ResearchActionRegistry = class {
  constructor() {
    __publicField(this, "actions", /* @__PURE__ */ new Map());
  }
  register(action) {
    this.actions.set(action.id, action);
    return this;
  }
  get(id) {
    return this.actions.get(id);
  }
  list() {
    return Array.from(this.actions.values());
  }
  async execute(id, context) {
    const action = this.get(id);
    if (!action) throw new Error(`Unknown research action: ${id}`);
    await action.execute(context);
  }
};
function listResearchActionsForSlot(actions, slot) {
  return actions.list ? actions.list().filter((action) => action.slot === slot) : [];
}
function createCompatibilityActionRegistry(defaultTranslatePrompt) {
  void defaultTranslatePrompt;
  return createResearchActionRegistry();
}
function createResearchActionRegistry() {
  return new ResearchActionRegistry().register({
    id: "translate",
    name: "Translate selection",
    slot: "composer",
    async execute({ translate }) {
      await translate();
    }
  });
}

// src/multi-paper.ts
var import_obsidian = require("obsidian");
function loadNodeModule(name) {
  const nodeRequire = typeof require === "function" ? require : null;
  if (!nodeRequire) throw new Error("Node.js APIs are not available in this Obsidian environment");
  return nodeRequire(name);
}
function isPdfFile(file) {
  const extension = String(file.extension || "").toLowerCase();
  if (extension) return extension === "pdf";
  return /\.pdf$/i.test(file.path || file.name || "");
}
function searchPdfFiles(app, query, options = {}) {
  var _a;
  const files = ((_a = app == null ? void 0 : app.vault) == null ? void 0 : _a.getFiles) ? app.vault.getFiles() : [];
  const normalizedQuery = (query || "").trim();
  const matcher = normalizedQuery && typeof import_obsidian.prepareFuzzySearch === "function" ? (0, import_obsidian.prepareFuzzySearch)(normalizedQuery) : null;
  const fallbackQuery = normalizedQuery.toLowerCase();
  const candidates = files.filter(isPdfFile).filter((file) => {
    var _a2;
    return !((_a2 = options.excludePaths) == null ? void 0 : _a2.has(file.path));
  }).map((file) => {
    var _a2;
    const target = `${file.name || ""} ${file.path || ""}`;
    const match = matcher ? matcher(target) : fallbackQuery ? target.toLowerCase().includes(fallbackQuery) ? { score: fallbackQuery.length, matches: [] } : null : { score: 1, matches: [] };
    if (!match) return null;
    return {
      path: file.path,
      name: file.name || file.path.split(/[\\/]/).pop() || file.path,
      score: typeof match.score === "number" ? match.score : normalizedQuery.length || 1,
      cached: Boolean((_a2 = options.cachedPaths) == null ? void 0 : _a2.has(file.path))
    };
  }).filter((candidate) => Boolean(candidate)).sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  return candidates.slice(0, options.limit || 8);
}
function safePaperId(input, fallback) {
  const base = (input || fallback || "paper").replace(/\\/g, "/").split("/").pop().replace(/\.pdf$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || fallback || "paper";
}
function writeJson(fs, file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}
function pageFileName(page) {
  return `page-${String(page).padStart(3, "0")}.md`;
}
function compactWhitespace(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}
function buildCodexPaperBrief(paper, maxChars = 250) {
  const source = compactWhitespace(paper.summary) || compactWhitespace((paper.pages || []).map((page) => page.text).join(" "));
  if (!source) return `${paper.name || paper.vaultPath}: no brief available.`;
  if (source.length <= maxChars) return source;
  return source.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "\u2026";
}
function buildPdfExtractionReport(paper) {
  const pages = paper.pages || [];
  const pageLengths = pages.map((page) => compactWhitespace(page.text).length);
  const pageCount = pages.length;
  const fullTextLength = pageLengths.reduce((total, length) => total + length, 0);
  const emptyPages = pages.filter((page) => compactWhitespace(page.text).length === 0).map((page) => page.page);
  const veryShortPages = pages.filter((page) => {
    const length = compactWhitespace(page.text).length;
    return length > 0 && length < 80;
  }).map((page) => page.page);
  const warnings = [];
  if (!pageCount) warnings.push("No pages were extracted from the PDF text layer.");
  if (emptyPages.length) warnings.push(`Text-layer extraction produced empty pages: ${emptyPages.join(", ")}.`);
  if (veryShortPages.length) warnings.push(`Some pages have very little extracted text: ${veryShortPages.join(", ")}.`);
  if (fullTextLength < 500) warnings.push("The extracted text is short; inspect original.pdf before making detailed claims.");
  if (!paper.originalPdfData) warnings.push("original.pdf is not available in this package; rely on extracted text cautiously.");
  const emptyRatio = pageCount ? emptyPages.length / pageCount : 1;
  const quality = !pageCount || fullTextLength < 200 || emptyRatio > 0.5 ? "poor" : warnings.length ? "mixed" : "good";
  return {
    pageCount,
    fullTextLength,
    averageCharsPerPage: pageCount ? Math.round(fullTextLength / pageCount) : 0,
    longestPageChars: pageLengths.length ? Math.max(...pageLengths) : 0,
    emptyPages,
    veryShortPages,
    originalPdfAvailable: Boolean(paper.originalPdfData),
    quality,
    warnings
  };
}
function buildCodexAnalysisSkillMarkdown() {
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
    "8. Return only JSON matching `output.schema.json`; do not include Markdown fences or extra commentary."
  ].join("\n");
}
function createCodexAnalysisTempDir(taskId) {
  const fs = loadNodeModule("node:fs");
  const os = loadNodeModule("node:os");
  const path = loadNodeModule("node:path");
  return fs.mkdtempSync(path.join(os.tmpdir(), `pdf-chat-analysis-${taskId}-`));
}
function removeCodexAnalysisTempDir(analysisDir) {
  if (!analysisDir) return;
  const fs = loadNodeModule("node:fs");
  fs.rmSync(analysisDir, { recursive: true, force: true });
}
function codexAnalysisOutputSchema() {
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
                  page: { type: "number" }
                }
              }
            }
          }
        }
      },
      comparison: {
        type: "object",
        additionalProperties: false,
        required: ["similarities", "differences", "complementaryOpportunities", "conflictsOrRisks"],
        properties: {
          similarities: { type: "array", maxItems: 5, items: { type: "string" } },
          differences: { type: "array", maxItems: 5, items: { type: "string" } },
          complementaryOpportunities: { type: "array", maxItems: 5, items: { type: "string" } },
          conflictsOrRisks: { type: "array", maxItems: 5, items: { type: "string" } }
        }
      },
      synthesis: {
        type: "object",
        additionalProperties: false,
        required: ["shortAnswer", "detailedAnalysisMarkdown", "suggestedNextQuestions"],
        properties: {
          shortAnswer: { type: "string" },
          detailedAnalysisMarkdown: { type: "string" },
          suggestedNextQuestions: { type: "array", maxItems: 4, items: { type: "string" } }
        }
      },
      limitations: { type: "array", maxItems: 5, items: { type: "string" } }
    }
  };
}
function codexPdfFileName(role, index) {
  if (role === "current") return "current.pdf";
  return `reference-${Math.max(1, index)}.pdf`;
}
async function writeCodexPdfOnlyPackage(request) {
  const fs = loadNodeModule("node:fs");
  const path = loadNodeModule("node:path");
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
  const selectedContextPath = selectedContext ? "selected-context.md" : void 0;
  if (selectedContextPath) fs.writeFileSync(path.join(analysisDir, selectedContextPath), selectedContext, "utf8");
  return { analysisDir, inputMode: "pdf-only", selectedContextPath };
}
function writeCodexOutputSchema(analysisDir) {
  const fs = loadNodeModule("node:fs");
  const path = loadNodeModule("node:path");
  const outputSchemaPath = path.join(analysisDir, "output.schema.json");
  writeJson(fs, outputSchemaPath, codexAnalysisOutputSchema());
  return outputSchemaPath;
}
async function writeCodexDebugFullPackage(request) {
  const fs = loadNodeModule("node:fs");
  const path = loadNodeModule("node:path");
  const analysisDir = request.baseDir;
  fs.mkdirSync(path.join(analysisDir, "papers"), { recursive: true });
  const skillPath = "SKILL.md";
  fs.writeFileSync(path.join(analysisDir, skillPath), buildCodexAnalysisSkillMarkdown(), "utf8");
  const selectedContext = (request.selectedContext || "").trim();
  const selectedContextPath = selectedContext ? "selected-context.md" : void 0;
  if (selectedContextPath) fs.writeFileSync(path.join(analysisDir, selectedContextPath), selectedContext, "utf8");
  const manifestPapers = [];
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
    const originalPdfPath = paper.originalPdfData ? path.join("papers", id, "original.pdf") : void 0;
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
      originalPdfAvailable: Boolean(paper.originalPdfData)
    });
    fs.writeFileSync(path.join(analysisDir, briefPath), buildCodexPaperBrief(paper), "utf8");
    fs.writeFileSync(path.join(analysisDir, summaryPath), paper.summary || "(no summary)", "utf8");
    fs.writeFileSync(
      path.join(analysisDir, fullTextPath),
      [`# ${paper.name}`, `Vault path: ${paper.vaultPath}`, "", ...pages.map((page) => `[Page ${page.page}]
${page.text}`)].join("\n\n"),
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
      originalPdfPath: originalPdfPath == null ? void 0 : originalPdfPath.replace(/\\/g, "/"),
      pagesDir: relativePagesDir
    });
  }
  const manifest = {
    version: 1,
    taskId: request.taskId,
    createdAt: request.createdAt,
    question: request.question,
    skillPath,
    papers: manifestPapers
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
    selectedContextPath
  };
}
async function writeCodexAnalysisPackage(request) {
  return writeCodexPdfOnlyPackage(request);
}
function codexPdfPromptList(papers = []) {
  let referenceIndex = 0;
  return papers.map((paper, index) => {
    const pdfPath = `papers/${codexPdfFileName(paper.role, paper.role === "current" ? 0 : ++referenceIndex)}`;
    const role = paper.role === "current" ? "current" : `reference-${referenceIndex}`;
    const displayName = paper.name || paper.vaultPath || `paper-${index + 1}`;
    return `- ${pdfPath} (${role}) = ${displayName}${paper.vaultPath ? `; vault path: ${paper.vaultPath}` : ""}`;
  });
}
function buildCodexPdfOnlyPrompt(question = "", papers = [], options = {}) {
  const paperLines = codexPdfPromptList(papers);
  return [
    "You are inside a read-only PDF Chat Codex directory that contains only the PDF files selected for this turn.",
    "Read only these PDF files:",
    paperLines.length ? paperLines.join("\n") : "- No PDF files are attached for this turn.",
    options.selectedContextPath ? `${options.selectedContextPath} contains the user's selected passage or local context. Use it as the primary passage to explain when it is relevant to the question.` : "",
    question ? `User question:
${question}` : "Use the user's question from the command prompt.",
    "Answer the user's exact question. Use the PDF files when the question needs paper evidence or local context; for casual or operational prompts, answer directly without unnecessary reading.",
    "Do not write a full survey or generic comparison unless the user explicitly asks for it.",
    "Keep schema side fields concise: use empty arrays or short strings when a section is not needed for the user's question.",
    "Put the user-facing answer in synthesis.detailedAnalysisMarkdown.",
    "When you make an important claim, cite the paper name and page number when the PDF reader exposes page information.",
    "If a PDF cannot be read or page evidence is unavailable, say that clearly in limitations instead of guessing.",
    "Return only JSON that matches output.schema.json. Do not include markdown fences."
  ].filter(Boolean).join("\n");
}
function buildCodexMarkdownPrompt(question = "", papers = [], options = {}) {
  const paperLines = codexPdfPromptList(papers);
  return [
    "You are inside a read-only PDF Chat Codex directory that contains only the PDF files selected for this turn.",
    "Read only these PDF files:",
    paperLines.length ? paperLines.join("\n") : "- No PDF files are attached for this turn.",
    options.selectedContextPath ? `${options.selectedContextPath} contains the user's selected passage or selected context. Treat it as the primary passage to explain when it is relevant to the question.` : "",
    question ? `User question:
${question}` : "Use the user's question from the command prompt.",
    "Answer the user's exact question. Use the PDF files when the question needs paper evidence or local context; for casual or operational prompts, answer directly without unnecessary reading.",
    "Write a natural, readable Markdown answer. Do not output JSON and do not wrap the answer in a markdown fence.",
    "Do not write a full survey, generic comparison, or table unless the user's question asks for it.",
    "When you make an important claim, cite the paper name and page number when the PDF reader exposes page information.",
    "If a PDF cannot be read or page evidence is unavailable, say that clearly instead of guessing."
  ].filter(Boolean).join("\n");
}
function buildCodexDebugFullPrompt() {
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
    "Return only JSON that matches output.schema.json. Do not include markdown fences."
  ].join("\n");
}
function buildCodexDebugFullMarkdownPrompt() {
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
    "If text extraction is poor or evidence is unavailable, say that clearly instead of guessing."
  ].join("\n");
}
function buildCodexDeepAnalysisPrompt() {
  return buildCodexMarkdownPrompt();
}
function buildCodexExecArgs(request) {
  const outputMode = request.outputMode === "json-schema" ? "json-schema" : "markdown";
  const outputFileName = request.outputFileName || (outputMode === "json-schema" ? "codex-output.json" : "codex-output.md");
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
    outputFileName
  ];
  if (outputMode === "json-schema") args.push("--output-schema", "output.schema.json");
  if (request.profile) args.push("--profile", request.profile);
  if (request.model) args.push("--model", request.model);
  if (request.reasoningEffort) args.push("-c", `model_reasoning_effort="${request.reasoningEffort}"`);
  if (request.verbosity) args.push("-c", `model_verbosity="${request.verbosity}"`);
  args.push(request.prompt);
  return { command: request.command || "codex", args };
}
function envValue(env, key) {
  return env[key] || env[key.toUpperCase()] || env[key.toLowerCase()] || "";
}
function winJoin(...parts) {
  return parts.filter(Boolean).map((part, index) => index === 0 ? part.replace(/[\\/]+$/g, "") : part.replace(/^[\\/]+|[\\/]+$/g, "")).join("\\");
}
function defaultResolveEnv() {
  return typeof process !== "undefined" && (process == null ? void 0 : process.env) ? process.env : {};
}
function defaultResolvePlatform() {
  return typeof process !== "undefined" && (process == null ? void 0 : process.platform) ? process.platform : "";
}
function defaultExistsSync(file) {
  try {
    const fs = loadNodeModule("node:fs");
    return fs.existsSync(file);
  } catch (error) {
    void error;
    return false;
  }
}
function defaultReaddirSync(dir) {
  try {
    const fs = loadNodeModule("node:fs");
    return fs.readdirSync(dir);
  } catch (error) {
    void error;
    return [];
  }
}
function commandBasename(command) {
  return String(command || "").trim().replace(/^["']|["']$/g, "").split(/[\\/]/).pop() || "";
}
function commandDirname(command) {
  const normalized = String(command || "").trim().replace(/^["']|["']$/g, "");
  const index = Math.max(normalized.lastIndexOf("\\"), normalized.lastIndexOf("/"));
  return index > 0 ? normalized.slice(0, index) : "";
}
function isAbsoluteCodexExe(command) {
  return /[\\/]/.test(command) && /^codex\.exe$/i.test(commandBasename(command));
}
function isResolvableCodexCommand(command) {
  if (isAbsoluteCodexExe(command)) return false;
  return /^codex(?:\.(?:exe|cmd|ps1))?$/i.test(commandBasename(command));
}
function pathDirs(env) {
  return (envValue(env, "PATH") || envValue(env, "Path") || "").split(";").map((dir) => dir.trim()).filter(Boolean);
}
function nodeExecutableCandidates(env) {
  const candidates = [
    envValue(env, "PDF_CHAT_NODE_EXE"),
    ...pathDirs(env).map((dir) => winJoin(dir, "node.exe")),
    winJoin(envValue(env, "ProgramFiles"), "nodejs", "node.exe"),
    winJoin(envValue(env, "ProgramFiles(x86)"), "nodejs", "node.exe"),
    winJoin(envValue(env, "LOCALAPPDATA"), "Programs", "nodejs", "node.exe")
  ];
  return [...new Set(candidates.filter(Boolean))];
}
function npmCodexScriptCandidates(env, command) {
  const commandDir = commandDirname(command);
  return [
    commandDir ? winJoin(commandDir, "node_modules", "@openai", "codex", "bin", "codex.js") : "",
    winJoin(envValue(env, "APPDATA"), "npm", "node_modules", "@openai", "codex", "bin", "codex.js"),
    winJoin(envValue(env, "LOCALAPPDATA"), "npm", "node_modules", "@openai", "codex", "bin", "codex.js")
  ].filter(Boolean);
}
function bundledCodexExeCandidates(env, readdirSync) {
  const roots = [
    winJoin(envValue(env, "USERPROFILE"), ".cursor", "extensions"),
    winJoin(envValue(env, "USERPROFILE"), ".vscode", "extensions"),
    winJoin(envValue(env, "USERPROFILE"), ".windsurf", "extensions")
  ].filter(Boolean);
  const candidates = [];
  for (const root of roots) {
    for (const entry of readdirSync(root)) {
      if (!/^openai\.chatgpt-.*win32-x64$/i.test(entry)) continue;
      candidates.push(winJoin(root, entry, "bin", "windows-x86_64", "codex.exe"));
    }
  }
  return candidates.sort().reverse();
}
function resolveCodexExecArgs(execArgs, options = {}) {
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
function argValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : null;
}
function redactProcessText(text) {
  return (text || "").replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]").replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[REDACTED]").slice(0, 1200);
}
function shortPath(value) {
  const text = String(value || "").replace(/\\/g, "/").trim();
  if (!text) return "";
  const parts = text.split("/").filter(Boolean);
  return parts.slice(-3).join("/");
}
function shortCommand(value) {
  return redactProcessText(String(value || "").replace(/\s+/g, " ").trim()).slice(0, 160);
}
function summarizeCodexJsonEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const value = event;
  const type = String(value.type || value.event || value.kind || "").trim();
  if (!type) return null;
  const lowerType = type.toLowerCase();
  if (/reasoning|thinking|thought/.test(lowerType)) {
    return { type, message: "Codex \u6B63\u5728\u63A8\u7406\u2026", elapsedMs: 0 };
  }
  if (/file.*read|read.*file/.test(lowerType)) {
    const path = shortPath(value.path || value.file || value.filename);
    return { type, message: path ? `\u6B63\u5728\u8BFB\u53D6\u6587\u4EF6\uFF1A${path}` : "Codex \u6B63\u5728\u8BFB\u53D6\u6587\u4EF6\u2026", elapsedMs: 0 };
  }
  if (/exec|command|shell|tool/.test(lowerType)) {
    const command = shortCommand(value.command || value.cmd || value.name || value.tool || value.toolName);
    return { type, message: command ? `\u6B63\u5728\u6267\u884C\u547D\u4EE4\uFF1A${command}` : "Codex \u6B63\u5728\u4F7F\u7528\u5DE5\u5177\u2026", elapsedMs: 0 };
  }
  if (/message|response|answer|final/.test(lowerType)) {
    return { type, message: /final/.test(lowerType) ? "Codex \u6B63\u5728\u6574\u7406\u6700\u7EC8\u7B54\u6848\u2026" : "Codex \u6B63\u5728\u751F\u6210\u56DE\u7B54\u2026", elapsedMs: 0 };
  }
  if (/error|failed|failure/.test(lowerType)) {
    return { type, message: "Codex \u62A5\u544A\u4E86\u4E00\u4E2A\u8FD0\u884C\u4E8B\u4EF6\uFF0C\u6B63\u5728\u7B49\u5F85\u6700\u7EC8\u7ED3\u679C\u2026", elapsedMs: 0 };
  }
  return { type, message: `Codex \u4E8B\u4EF6\uFF1A${type}`, elapsedMs: 0 };
}
function emitCodexJsonProgress(line, startedAt, onProgress) {
  if (!onProgress) return;
  let parsed;
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
function runCodexExec(execArgs, options) {
  const path = loadNodeModule("node:path");
  const fs = loadNodeModule("node:fs");
  const childProcess = options.spawn ? { spawn: options.spawn } : loadNodeModule("node:child_process");
  const resolvedExecArgs = resolveCodexExecArgs(execArgs);
  const analysisDir = argValue(resolvedExecArgs.args, "--cd");
  if (!analysisDir) throw new Error("Codex command is missing --cd analysis directory");
  const outputFileName = options.outputFileName || "codex-output.json";
  const outputPath = path.join(analysisDir, outputFileName);
  return new Promise((resolve, reject) => {
    var _a, _b, _c, _d;
    let settled = false;
    let stderr = "";
    let stdoutBuffer = "";
    const startedAt = Date.now();
    const timeoutMs = Math.max(1, options.timeoutMs || 18e5);
    const child = childProcess.spawn(resolvedExecArgs.command, resolvedExecArgs.args, {
      cwd: analysisDir,
      windowsHide: true,
      shell: false
    });
    try {
      (_a = child.stdin) == null ? void 0 : _a.end();
    } catch (error) {
      void error;
    }
    let timer;
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
    const finish = (callback) => {
      var _a2;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      (_a2 = options.signal) == null ? void 0 : _a2.removeEventListener("abort", onAbort);
      callback();
    };
    (_b = options.signal) == null ? void 0 : _b.addEventListener("abort", onAbort);
    timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        void error;
      }
      finish(() => reject(new Error(`Codex analysis timed out after ${timeoutMs}ms`)));
    }, timeoutMs);
    (_c = child.stderr) == null ? void 0 : _c.on("data", (chunk) => {
      stderr += String(chunk || "");
    });
    (_d = child.stdout) == null ? void 0 : _d.on("data", (chunk) => {
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
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function parseCodexAnalysisOutput(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid Codex analysis output: JSON parse failed");
  }
  const value = parsed;
  if (!value || typeof value !== "object" || value.taskType !== "multi-paper-analysis" || typeof value.question !== "string" || !Array.isArray(value.papers) || !value.comparison || !value.synthesis || typeof value.synthesis.shortAnswer !== "string" || typeof value.synthesis.detailedAnalysisMarkdown !== "string" || !isStringArray(value.synthesis.suggestedNextQuestions) || !isStringArray(value.limitations)) {
    throw new Error("Invalid Codex analysis output: missing required fields");
  }
  return value;
}
function parseCodexMarkdownOutput(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) throw new Error("Invalid Codex analysis output: empty Markdown output");
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}
async function extractCodexMarkdownAnalysis(request) {
  const paperList = request.papers.map((paper) => `- ${paper.role}: ${paper.name} (${paper.vaultPath})`).join("\n");
  const raw = await request.llm.chat({
    modelProfile: request.modelProfile,
    signal: request.signal,
    stream: false,
    temperatureOverride: 0.1,
    maxTokensOverride: 4e3,
    messages: [
      {
        role: "system",
        content: [
          "You extract structured research-analysis data from an existing Codex Markdown answer.",
          "Use only the supplied question, paper list, and Markdown answer.",
          "Do not add claims that are absent from the Markdown.",
          "Use empty arrays for missing comparison evidence and concise limitation strings for missing information.",
          "Return only valid JSON matching the multi-paper analysis shape."
        ].join("\n")
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
          request.markdown
        ].join("\n")
      }
    ]
  });
  return parseCodexAnalysisOutput(raw);
}
function listBlock(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- \u6682\u65E0";
}
function tableCell(value) {
  return String(value != null ? value : "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}
function evidenceTable(output) {
  const rows = output.papers.flatMap(
    (paper) => paper.keyEvidence.map((evidence) => ({
      paper: paper.name,
      claim: evidence.claim,
      source: evidence.source,
      page: typeof evidence.page === "number" ? String(evidence.page) : ""
    }))
  );
  if (!rows.length) return "";
  return [
    "### \u8BC1\u636E\u8868",
    "| \u8BBA\u6587 | \u8BC1\u636E/\u4E3B\u5F20 | \u6765\u6E90 | \u9875\u7801 |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${tableCell(row.paper)} | ${tableCell(row.claim)} | ${tableCell(row.source)} | ${tableCell(row.page)} |`)
  ].join("\n");
}
function renderCodexAnalysisMarkdown(output) {
  const evidence = evidenceTable(output);
  const nextQuestions = output.synthesis.suggestedNextQuestions.length ? `

### \u53EF\u4EE5\u7EE7\u7EED\u8FFD\u95EE
${listBlock(output.synthesis.suggestedNextQuestions)}` : "";
  const limitations = output.limitations.length ? `

### \u5C40\u9650
${listBlock(output.limitations)}` : "";
  const sections = [
    `### \u7B80\u77ED\u7ED3\u8BBA
${output.synthesis.shortAnswer}`,
    output.synthesis.detailedAnalysisMarkdown
  ];
  if (evidence) sections.push(evidence);
  if (output.comparison.similarities.length) sections.push(`### \u76F8\u4F3C\u70B9
${listBlock(output.comparison.similarities)}`);
  if (output.comparison.differences.length) sections.push(`### \u4E0D\u540C\u70B9
${listBlock(output.comparison.differences)}`);
  if (output.comparison.complementaryOpportunities.length) {
    sections.push(`### \u7ED3\u5408\u673A\u4F1A
${listBlock(output.comparison.complementaryOpportunities)}`);
  }
  if (output.comparison.conflictsOrRisks.length) sections.push(`### \u98CE\u9669\u4E0E\u51B2\u7A81
${listBlock(output.comparison.conflictsOrRisks)}`);
  return sections.filter((section) => section && section.trim()).join("\n\n") + nextQuestions + limitations;
}

// src/codex-cli.ts
function loadNodeModule2(name) {
  const nodeRequire = typeof require === "function" ? require : null;
  if (!nodeRequire) throw new Error("Node.js APIs are not available in this Obsidian environment");
  return nodeRequire(name);
}
function resolveCodexPdfLocation(app, vaultPath) {
  var _a;
  const adapter = (_a = app == null ? void 0 : app.vault) == null ? void 0 : _a.adapter;
  if (!adapter || typeof adapter.getFullPath !== "function") {
    throw new Error("Codex native PDF sessions require the Obsidian desktop file-system adapter");
  }
  const path = loadNodeModule2("node:path");
  const absolutePath = adapter.getFullPath(vaultPath);
  if (!absolutePath) throw new Error(`Unable to resolve PDF path: ${vaultPath}`);
  return { absolutePath, workingDirectory: path.dirname(absolutePath) };
}
function quotePathForPrompt(file, index) {
  const label = file.role === "current" ? "\u5F53\u524D\u8BBA\u6587" : "\u5F15\u7528\u8BBA\u6587";
  return `- [P${index + 1}] ${label}\uFF08${file.name}\uFF09\uFF1A${file.absolutePath}`;
}
function buildCodexTurnPrompt(request) {
  const question = (request.question || "").trim();
  const papers = request.papers || [];
  const selection = (request.selectedContext || "").trim();
  const sections = [
    `\u7528\u6237\u95EE\u9898\uFF1A
${question}`,
    papers.length ? `\u672C\u8F6E\u53EF\u53C2\u8003\u7684 PDF\uFF1A
${papers.map(quotePathForPrompt).join("\n")}` : "\u672C\u8F6E\u6CA1\u6709\u9644\u52A0 PDF\u3002"
  ];
  if (selection) sections.push(`\u672C\u8F6E\u9009\u533A\u4E0A\u4E0B\u6587\uFF1A
${selection}`);
  sections.push(
    "\u8BF7\u76F4\u63A5\u56DE\u7B54\u7528\u6237\u95EE\u9898\u3002\u53EA\u6709\u95EE\u9898\u786E\u5B9E\u9700\u8981\u8BBA\u6587\u5185\u5BB9\u65F6\u624D\u8BFB\u53D6\u4E0A\u8FF0 PDF\uFF1B\u666E\u901A\u95EE\u5019\u6216\u72B6\u6001\u95EE\u9898\u65E0\u9700\u8BFB\u53D6 PDF\u3002\u5F15\u7528\u53EF\u786E\u8BA4\u7684\u8BBA\u6587\u8BC1\u636E\u65F6\uFF0C\u8BF7\u4F7F\u7528 [P1, p.N] \u683C\u5F0F\uFF08P1 \u66FF\u6362\u4E3A\u4E0A\u65B9\u8BBA\u6587\u522B\u540D\uFF0CN \u66FF\u6362\u4E3A PDF \u9875\u7801\uFF09\uFF1B\u65E0\u6CD5\u786E\u8BA4\u9875\u7801\u65F6\u660E\u786E\u8BF4\u660E\uFF0C\u4E0D\u8981\u7F16\u9020\u3002\u4E0D\u8981\u8BFB\u53D6\u672A\u5217\u51FA\u7684 PDF\u3002"
  );
  return sections.join("\n\n");
}
function appendModelOptions(args, request) {
  if (request.model) args.push("--model", request.model);
  if (request.reasoningEffort) {
    args.push("-c", `model_reasoning_effort="${request.reasoningEffort}"`);
  }
  if (request.verbosity) args.push("-c", `model_verbosity="${request.verbosity}"`);
}
function buildCodexThreadExecArgs(request) {
  const threadId = (request.threadId || "").trim();
  const args = threadId ? ["exec", "resume", "--json", "--skip-git-repo-check"] : [
    "exec",
    "--json",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--cd",
    request.workingDirectory
  ];
  if (!threadId && request.profile) args.push("--profile", request.profile);
  appendModelOptions(args, request);
  if (threadId) args.push(threadId);
  args.push(request.prompt);
  return { command: request.command || "codex", args, threadId: threadId || void 0 };
}
function eventMessage(event) {
  switch (event.type) {
    case "turn.started":
      return "Codex \u5DF2\u5F00\u59CB\u5904\u7406\u672C\u8F6E\u95EE\u9898";
    case "turn.completed":
      return "Codex \u5DF2\u5B8C\u6210\u672C\u8F6E\u56DE\u7B54";
    case "turn.failed":
      return "Codex \u672C\u8F6E\u6267\u884C\u5931\u8D25";
    case "error":
      return "Codex \u62A5\u544A\u4E86\u6267\u884C\u9519\u8BEF";
    default:
      break;
  }
  const item = event.item;
  if (!item || typeof item.type !== "string") return null;
  if (item.type === "reasoning") return "Codex \u6B63\u5728\u63A8\u7406";
  if (item.type === "command_execution") return "Codex \u6B63\u5728\u8BFB\u53D6\u8BBA\u6587\u6216\u6267\u884C\u53EA\u8BFB\u547D\u4EE4";
  if (item.type === "agent_message") return "Codex \u6B63\u5728\u6574\u7406\u56DE\u7B54";
  return null;
}
function redactProcessText2(text) {
  return (text || "").replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]").replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[REDACTED]").slice(0, 1200);
}
function isCodexThreadUnavailableError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /(session|thread).*(not found|does not exist|missing)|no rollout found|could not find.*(session|thread)/i.test(
    message
  );
}
function terminateCodexChild(child) {
  try {
    child.kill("SIGTERM");
  } catch (error) {
    void error;
  }
  const pid = Number(child.pid);
  if (!Number.isInteger(pid) || pid <= 0) return;
  try {
    const processModule = loadNodeModule2("node:process");
    if (processModule.platform !== "win32") return;
    const childProcess = loadNodeModule2("node:child_process");
    childProcess.spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      shell: false,
      stdio: "ignore"
    });
  } catch (error) {
    void error;
  }
}
function runCodexVersionCheck(command, options) {
  const childProcess = options.spawn ? { spawn: options.spawn } : loadNodeModule2("node:child_process");
  const resolved = resolveCodexExecArgs({ command: command || "codex", args: ["--version"] });
  const timeoutMs = Math.max(1, options.timeoutMs || 1e4);
  return new Promise((resolve, reject) => {
    var _a, _b, _c;
    let settled = false;
    let stdout = "";
    let stderr = "";
    let timer;
    const child = childProcess.spawn(resolved.command, resolved.args, {
      cwd: options.workingDirectory,
      windowsHide: true,
      shell: false
    });
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    (_a = child.stdout) == null ? void 0 : _a.on("data", (chunk) => {
      stdout += String(chunk);
    });
    (_b = child.stderr) == null ? void 0 : _b.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => finish(() => reject(error)));
    child.on("close", (code) => {
      const version = redactProcessText2(stdout).trim();
      if (code === 0 && version) finish(() => resolve(version));
      else finish(() => reject(new Error(redactProcessText2(stderr) || `Codex exited with code ${String(code)}`)));
    });
    try {
      (_c = child.stdin) == null ? void 0 : _c.end();
    } catch (error) {
      void error;
    }
    timer = setTimeout(() => {
      terminateCodexChild(child);
      finish(() => reject(new Error(`Codex version check timed out after ${timeoutMs}ms`)));
    }, timeoutMs);
  });
}
async function runCodexThreadDoctor(request, runner = runCodexThreadTurn) {
  const base = {
    command: request.command,
    workingDirectory: request.workingDirectory,
    profile: request.profile,
    model: request.model,
    reasoningEffort: request.reasoningEffort,
    verbosity: request.verbosity
  };
  const firstStartedAt = Date.now();
  const first = await runner(
    buildCodexThreadExecArgs({ ...base, prompt: "Reply exactly PDF_CHAT_DOCTOR_1" }),
    { workingDirectory: request.workingDirectory, timeoutMs: request.timeoutMs }
  );
  const firstTurnMs = Date.now() - firstStartedAt;
  if (!first.markdown.includes("PDF_CHAT_DOCTOR_1")) {
    throw new Error("Codex fresh-thread diagnostic returned an unexpected reply");
  }
  const resumeStartedAt = Date.now();
  const resumed = await runner(
    buildCodexThreadExecArgs({
      ...base,
      threadId: first.threadId,
      prompt: "Reply exactly PDF_CHAT_DOCTOR_2"
    }),
    { workingDirectory: request.workingDirectory, timeoutMs: request.timeoutMs }
  );
  if (resumed.threadId !== first.threadId) {
    throw new Error("Codex resume returned a different thread id");
  }
  if (!resumed.markdown.includes("PDF_CHAT_DOCTOR_2")) {
    throw new Error("Codex resume diagnostic returned an unexpected reply");
  }
  return {
    threadId: first.threadId,
    firstReply: first.markdown,
    resumeReply: resumed.markdown,
    firstTurnMs,
    resumeTurnMs: Date.now() - resumeStartedAt
  };
}
function runCodexThreadTurn(execArgs, options) {
  const childProcess = options.spawn ? { spawn: options.spawn } : loadNodeModule2("node:child_process");
  const resolved = resolveCodexExecArgs(execArgs);
  const startedAt = Date.now();
  const timeoutMs = Math.max(1, options.timeoutMs || 18e5);
  return new Promise((resolve, reject) => {
    var _a, _b, _c, _d, _e;
    let settled = false;
    let stdoutBuffer = "";
    let stderr = "";
    let threadId = execArgs.threadId || "";
    let finalMarkdown = "";
    const child = childProcess.spawn(resolved.command, resolved.args, {
      cwd: options.workingDirectory,
      windowsHide: true,
      shell: false
    });
    const finish = (callback) => {
      var _a2;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      (_a2 = options.signal) == null ? void 0 : _a2.removeEventListener("abort", onAbort);
      callback();
    };
    const onAbort = () => {
      terminateCodexChild(child);
      const error = new Error("Codex turn aborted");
      error.name = "AbortError";
      finish(() => reject(error));
    };
    const emitEvent = (rawLine) => {
      var _a2, _b2;
      const line = rawLine.trim();
      if (!line) return;
      let event;
      try {
        event = JSON.parse(line);
      } catch (error) {
        void error;
        return;
      }
      if (event.type === "thread.started" && typeof event.thread_id === "string") {
        threadId = event.thread_id;
        void ((_a2 = options.onThreadId) == null ? void 0 : _a2.call(options, threadId));
      }
      const item = event.item;
      if (event.type === "item.completed" && (item == null ? void 0 : item.type) === "agent_message" && typeof item.text === "string" && item.text.trim()) {
        finalMarkdown = item.text.trim();
      }
      const message = eventMessage(event);
      if (message) {
        (_b2 = options.onProgress) == null ? void 0 : _b2.call(options, {
          type: String(event.type || (item == null ? void 0 : item.type) || "progress"),
          message,
          elapsedMs: Math.max(0, Date.now() - startedAt)
        });
      }
    };
    try {
      (_a = child.stdin) == null ? void 0 : _a.end();
    } catch (error) {
      void error;
    }
    (_b = child.stdout) == null ? void 0 : _b.on("data", (chunk) => {
      stdoutBuffer += String(chunk);
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) emitEvent(line);
    });
    (_c = child.stderr) == null ? void 0 : _c.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => finish(() => reject(error)));
    child.on("close", (code) => {
      if (stdoutBuffer.trim()) emitEvent(stdoutBuffer);
      if (code !== 0) {
        const detail = redactProcessText2(stderr) || `Codex exited with code ${String(code)}`;
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
    if ((_d = options.signal) == null ? void 0 : _d.aborted) onAbort();
    else (_e = options.signal) == null ? void 0 : _e.addEventListener("abort", onAbort, { once: true });
  });
}

// src/codex-session-manager.ts
function cloneSnapshot(snapshot) {
  return { ...snapshot, attachedPdfPaths: [...snapshot.attachedPdfPaths] };
}
function isAbortError(error) {
  return !!error && typeof error === "object" && error.name === "AbortError";
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error || "Unknown Codex error");
}
var CodexSessionManager = class {
  constructor(persistence, runner = runCodexThreadTurn, options = {}) {
    this.persistence = persistence;
    this.runner = runner;
    this.options = options;
    __publicField(this, "turns", /* @__PURE__ */ new Map());
    __publicField(this, "globalListeners", /* @__PURE__ */ new Set());
    __publicField(this, "nextRunToken", 1);
  }
  isForeignThread(session) {
    var _a;
    return Boolean(
      ((_a = session.codex) == null ? void 0 : _a.threadId) && session.installationId && this.options.installationId && session.installationId !== this.options.installationId
    );
  }
  managed(sessionId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    let managed = this.turns.get(sessionId);
    if (managed) return managed;
    const session = this.persistence.getSession(sessionId);
    managed = {
      snapshot: {
        sessionId,
        turnId: (_a = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _a.turnId,
        threadId: (_b = session == null ? void 0 : session.codex) == null ? void 0 : _b.threadId,
        status: ((_c = session == null ? void 0 : session.codex) == null ? void 0 : _c.lifecycle) === "closed" ? "closed" : ((_d = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _d.status) === "failed" ? "failed" : (session == null ? void 0 : session.pendingTurn) ? "stopped" : "idle",
        question: (_e = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _e.question,
        progress: (_f = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _f.progress,
        startedAt: (_g = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _g.startedAt,
        attachedPdfPaths: [
          ...((_h = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _h.attachedPdfPaths) || (session == null ? void 0 : session.referencedPdfPaths) || []
        ],
        selectionChars: ((_i = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _i.selectionChars) || 0
      },
      listeners: /* @__PURE__ */ new Set(),
      runToken: 0
    };
    this.turns.set(sessionId, managed);
    return managed;
  }
  notify(managed) {
    const snapshot = cloneSnapshot(managed.snapshot);
    for (const listener of managed.listeners) listener(snapshot);
    const event = { snapshot, hasSessionSubscribers: managed.listeners.size > 0 };
    for (const listener of this.globalListeners) listener(event);
  }
  getSnapshot(sessionId) {
    return cloneSnapshot(this.managed(sessionId).snapshot);
  }
  subscribe(sessionId, listener) {
    const managed = this.managed(sessionId);
    managed.listeners.add(listener);
    listener(cloneSnapshot(managed.snapshot));
    return () => managed.listeners.delete(listener);
  }
  subscribeAll(listener) {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }
  listSnapshots() {
    var _a, _b;
    const sessionIds = new Set(this.turns.keys());
    for (const session of ((_b = (_a = this.persistence).listSessions) == null ? void 0 : _b.call(_a, "")) || []) {
      if (session.pendingTurn) sessionIds.add(session.id);
    }
    return Array.from(sessionIds).map((sessionId) => this.getSnapshot(sessionId)).filter((snapshot) => snapshot.status !== "idle" && snapshot.status !== "closed").sort((left, right) => (right.startedAt || 0) - (left.startedAt || 0));
  }
  async startTurn(request) {
    var _a, _b, _c, _d, _e, _f, _g;
    const session = this.persistence.getSession(request.sessionId);
    if (!session) throw new Error(`Conversation session not found: ${request.sessionId}`);
    if (((_a = session.codex) == null ? void 0 : _a.lifecycle) === "closed") {
      throw new Error("This Codex session is closed. Use /resume before continuing it.");
    }
    const managed = this.managed(request.sessionId);
    if (managed.snapshot.status === "running") {
      throw new Error("This Codex session already has a running turn");
    }
    if (this.isForeignThread(session)) {
      const recoveryMessage = "\u8BE5 Codex thread \u5C5E\u4E8E\u53E6\u4E00\u53F0\u8BBE\u5907\uFF0C\u8BF7\u67E5\u770B\u5386\u53F2\u6216\u521B\u5EFA local fork\uFF08\u672C\u5730\u5206\u652F\uFF09\u3002";
      managed.snapshot = {
        sessionId: request.sessionId,
        threadId: (_b = session.codex) == null ? void 0 : _b.threadId,
        status: "failed",
        question: request.question,
        progress: recoveryMessage,
        attachedPdfPaths: [...request.attachedPdfPaths],
        selectionChars: request.selectionChars,
        error: recoveryMessage,
        recoveryReason: "foreign-installation"
      };
      this.notify(managed);
      return cloneSnapshot(managed.snapshot);
    }
    if (!session.installationId && this.options.installationId) {
      await ((_d = (_c = this.persistence).updateSessionMetadata) == null ? void 0 : _d.call(_c, request.sessionId, {
        installationId: this.options.installationId
      }));
    }
    const runToken = this.nextRunToken++;
    const turnId = `turn-${Date.now()}-${runToken}`;
    const controller = new AbortController();
    managed.runToken = runToken;
    managed.controller = controller;
    managed.snapshot = {
      sessionId: request.sessionId,
      turnId,
      threadId: (_e = session.codex) == null ? void 0 : _e.threadId,
      status: "running",
      question: request.question,
      progress: "Codex \u6B63\u5728\u542F\u52A8",
      startedAt: Date.now(),
      workingDirectory: request.workingDirectory,
      attachedPdfPaths: [...request.attachedPdfPaths],
      selectionChars: request.selectionChars
    };
    try {
      await this.persistence.beginCodexTurn(request.sessionId, {
        turnId,
        question: request.question,
        status: "running",
        startedAt: managed.snapshot.startedAt || Date.now(),
        threadId: (_f = session.codex) == null ? void 0 : _f.threadId,
        attachedPdfPaths: [...request.attachedPdfPaths],
        selectionChars: request.selectionChars,
        progress: managed.snapshot.progress
      });
    } catch (error) {
      managed.controller = void 0;
      managed.snapshot.status = "failed";
      managed.snapshot.error = `Codex \u672A\u542F\u52A8\uFF0C\u4EFB\u52A1\u65E5\u5FD7\u4FDD\u5B58\u5931\u8D25\uFF1A${errorMessage(error)}`;
      managed.snapshot.progress = managed.snapshot.error;
      this.notify(managed);
      return cloneSnapshot(managed.snapshot);
    }
    this.notify(managed);
    const codexMetadata = () => {
      var _a2, _b2, _c2, _d2, _e2;
      return {
        model: request.model || ((_a2 = session.codex) == null ? void 0 : _a2.model) || "",
        reasoningEffort: request.reasoningEffort || ((_b2 = session.codex) == null ? void 0 : _b2.reasoningEffort) || "medium",
        profile: (_e2 = (_d2 = request.profile) != null ? _d2 : (_c2 = session.codex) == null ? void 0 : _c2.profile) != null ? _e2 : "",
        threadId: managed.snapshot.threadId,
        lifecycle: "active"
      };
    };
    let threadSave = Promise.resolve();
    let progressSave = Promise.resolve();
    let lastProgressPersistedAt = 0;
    const args = buildCodexThreadExecArgs({
      command: request.command,
      workingDirectory: request.workingDirectory,
      threadId: (_g = session.codex) == null ? void 0 : _g.threadId,
      prompt: request.prompt,
      profile: request.profile,
      model: request.model,
      reasoningEffort: request.reasoningEffort,
      verbosity: request.verbosity
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
        onProgress: (progress) => {
          if (managed.runToken !== runToken || managed.snapshot.status !== "running") return;
          managed.snapshot.progress = progress.message;
          const now = Date.now();
          if (now - lastProgressPersistedAt >= 2e3) {
            lastProgressPersistedAt = now;
            progressSave = progressSave.catch(() => void 0).then(
              () => this.persistence.updateCodexTurn(request.sessionId, turnId, {
                progress: progress.message
              })
            );
          }
          this.notify(managed);
        }
      });
      if (managed.runToken !== runToken || managed.snapshot.status === "closed") {
        return cloneSnapshot(managed.snapshot);
      }
      managed.snapshot.threadId = result.threadId;
      managed.snapshot.finalMarkdown = result.markdown;
      managed.pendingResult = {
        turnId,
        userContent: request.userContent,
        assistantContent: result.markdown,
        codex: codexMetadata()
      };
      await threadSave;
      await progressSave;
      await this.persistence.completeCodexTurn(
        request.sessionId,
        turnId,
        request.userContent,
        result.markdown,
        codexMetadata()
      );
      if (managed.runToken !== runToken) return cloneSnapshot(managed.snapshot);
      managed.pendingResult = void 0;
      managed.snapshot.status = "idle";
      managed.snapshot.progress = "Codex \u5DF2\u5B8C\u6210\u672C\u8F6E\u56DE\u7B54";
      managed.snapshot.error = void 0;
      managed.snapshot.recoveryReason = void 0;
      this.notify(managed);
    } catch (error) {
      if (managed.runToken !== runToken || managed.snapshot.status === "closed") {
        return cloneSnapshot(managed.snapshot);
      }
      if (isAbortError(error)) {
        managed.snapshot.status = "stopped";
        managed.snapshot.progress = "Codex \u672C\u8F6E\u5DF2\u505C\u6B62\uFF0C\u53EF\u7EE7\u7EED\u4F7F\u7528\u540C\u4E00 thread \u63D0\u95EE";
        void this.persistence.updateCodexTurn(request.sessionId, turnId, {
          status: "interrupted",
          progress: managed.snapshot.progress,
          threadId: managed.snapshot.threadId
        }).catch(() => void 0);
      } else {
        managed.snapshot.status = "failed";
        const threadUnavailable = isCodexThreadUnavailableError(error);
        managed.snapshot.recoveryReason = threadUnavailable ? "thread-unavailable" : void 0;
        managed.snapshot.error = managed.snapshot.finalMarkdown ? `Codex \u56DE\u7B54\u5DF2\u751F\u6210\uFF0C\u4F46\u4FDD\u5B58\u5931\u8D25\uFF1A${errorMessage(error)}` : threadUnavailable ? "Codex thread \u5728\u672C\u673A\u4E0D\u53EF\u7528\u3002\u8BF7\u67E5\u770B\u5386\u53F2\u6216\u521B\u5EFA local fork\uFF08\u672C\u5730\u5206\u652F\uFF09\uFF0C\u4E0D\u4F1A\u9759\u9ED8\u65B0\u5EFA thread\u3002" : errorMessage(error);
        managed.snapshot.progress = managed.snapshot.error;
        void this.persistence.updateCodexTurn(request.sessionId, turnId, {
          status: "failed",
          progress: managed.snapshot.progress,
          threadId: managed.snapshot.threadId
        }).catch(() => void 0);
      }
      this.notify(managed);
    } finally {
      if (managed.runToken === runToken) managed.controller = void 0;
    }
    return cloneSnapshot(managed.snapshot);
  }
  async retryPersistResult(sessionId) {
    const managed = this.turns.get(sessionId);
    const pending = managed == null ? void 0 : managed.pendingResult;
    if (!managed || !pending) return false;
    await this.persistence.completeCodexTurn(
      sessionId,
      pending.turnId,
      pending.userContent,
      pending.assistantContent,
      pending.codex
    );
    managed.pendingResult = void 0;
    managed.snapshot.status = "idle";
    managed.snapshot.progress = "Codex \u56DE\u7B54\u5DF2\u91CD\u65B0\u4FDD\u5B58";
    managed.snapshot.error = void 0;
    this.notify(managed);
    return true;
  }
  stopTurn(sessionId) {
    const managed = this.turns.get(sessionId);
    if (!(managed == null ? void 0 : managed.controller) || managed.snapshot.status !== "running") return false;
    managed.snapshot.progress = "\u6B63\u5728\u505C\u6B62 Codex \u672C\u8F6E\u4EFB\u52A1";
    this.notify(managed);
    managed.controller.abort();
    return true;
  }
  async closeSession(sessionId) {
    var _a;
    const managed = this.managed(sessionId);
    managed.snapshot.status = "closed";
    managed.snapshot.progress = "Codex \u4F1A\u8BDD\u5DF2\u5173\u95ED\uFF0C\u53EF\u901A\u8FC7 /resume \u627E\u56DE";
    managed.runToken = this.nextRunToken++;
    (_a = managed.controller) == null ? void 0 : _a.abort();
    managed.controller = void 0;
    await this.persistence.closeSession(sessionId);
    this.notify(managed);
  }
  reactivateSession(sessionId) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const managed = this.managed(sessionId);
    const session = this.persistence.getSession(sessionId);
    managed.snapshot = {
      sessionId,
      turnId: (_a = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _a.turnId,
      threadId: (_b = session == null ? void 0 : session.codex) == null ? void 0 : _b.threadId,
      status: ((_c = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _c.status) === "failed" ? "failed" : (session == null ? void 0 : session.pendingTurn) ? "stopped" : "idle",
      question: (_d = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _d.question,
      progress: (_e = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _e.progress,
      startedAt: (_f = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _f.startedAt,
      attachedPdfPaths: [...((_g = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _g.attachedPdfPaths) || (session == null ? void 0 : session.referencedPdfPaths) || []],
      selectionChars: ((_h = session == null ? void 0 : session.pendingTurn) == null ? void 0 : _h.selectionChars) || 0
    };
    this.notify(managed);
  }
  dispose() {
    var _a;
    for (const managed of this.turns.values()) {
      managed.runToken = this.nextRunToken++;
      (_a = managed.controller) == null ? void 0 : _a.abort();
      managed.controller = void 0;
      managed.listeners.clear();
    }
    this.globalListeners.clear();
  }
};

// src/conversation.ts
function cleanSelectionText(raw) {
  return raw.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function stableConversationHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function normalizeConversationMessages(messages) {
  return normalizeMessages(messages);
}
function normalizeMessages(messages, identity) {
  if (!Array.isArray(messages)) return [];
  const normalized = [];
  for (let index = 0; index < messages.length; index += 1) {
    const candidate = messages[index];
    if (!candidate || typeof candidate !== "object") continue;
    const message = candidate;
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (typeof message.content !== "string" || !message.content.trim()) continue;
    const value = {
      role: message.role,
      content: message.content,
      status: message.role === "assistant" && message.status === "stopped" ? "stopped" : "complete"
    };
    const existingId = typeof message.id === "string" ? message.id.trim() : "";
    const existingCreatedAt = typeof message.createdAt === "number" && Number.isFinite(message.createdAt) ? message.createdAt : void 0;
    if (identity || existingId) {
      value.id = existingId || `message-${stableConversationHash(
        `${identity.sessionId}:${index}:${message.role}:${stableConversationHash(message.content)}`
      )}`;
    }
    if (identity || existingCreatedAt !== void 0) {
      value.createdAt = existingCreatedAt != null ? existingCreatedAt : identity.baseTimestamp + index;
    }
    if (Array.isArray(message.evidence)) {
      value.evidence = message.evidence.filter((item) => Boolean(item && typeof item === "object")).map((item) => ({ ...item }));
    }
    normalized.push(value);
  }
  return normalized;
}
function normalizeSessionMessages(messages, sessionId, baseTimestamp) {
  return normalizeMessages(messages, { sessionId, baseTimestamp });
}
function normalizeConversationHistories(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const normalized = {};
  for (const [key, candidate] of Object.entries(saved)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const entry = candidate;
    const messages = normalizeConversationMessages(entry.messages);
    if (!messages.length) continue;
    normalized[key] = {
      version: 1,
      updatedAt: typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
      messages
    };
  }
  return normalized;
}
function normalizeSessionMode(value) {
  return value === "codex" ? "codex" : "chat";
}
function normalizeReasoningEffort(value) {
  return value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh" ? value : "xhigh";
}
function normalizeStringArray(value, limit = 3) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    )
  ).slice(0, limit);
}
function isAbsolutePath(value) {
  return /^(?:[A-Za-z]:[\\/]|[\\/]{1,2})/.test(value);
}
function normalizePendingCodexTurn(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const candidate = value;
  const turnId = typeof candidate.turnId === "string" ? candidate.turnId.trim() : "";
  const question = typeof candidate.question === "string" ? candidate.question.trim() : "";
  const status = candidate.status === "running" || candidate.status === "interrupted" || candidate.status === "failed" ? candidate.status : null;
  if (!turnId || !question || !status) return void 0;
  const attachedPdfPaths = normalizeStringArray(candidate.attachedPdfPaths, 4).filter(
    (path) => !isAbsolutePath(path)
  );
  return {
    turnId,
    question,
    status,
    startedAt: typeof candidate.startedAt === "number" && Number.isFinite(candidate.startedAt) ? candidate.startedAt : 0,
    threadId: typeof candidate.threadId === "string" ? candidate.threadId.trim() || void 0 : void 0,
    attachedPdfPaths,
    selectionChars: typeof candidate.selectionChars === "number" && Number.isFinite(candidate.selectionChars) ? Math.max(0, Math.floor(candidate.selectionChars)) : 0,
    progress: typeof candidate.progress === "string" ? candidate.progress.trim().slice(0, 500) || void 0 : void 0
  };
}
function normalizeApiSessionMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const candidate = value;
  const modelId = typeof candidate.modelId === "string" ? candidate.modelId.trim() : "";
  const presetId = typeof candidate.presetId === "string" ? candidate.presetId.trim() : "";
  return modelId || presetId ? { modelId: modelId || void 0, presetId: presetId || void 0 } : void 0;
}
function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter((item) => typeof item === "string").map((item) => item.trim().replace(/\s+/g, " ").slice(0, 50)).filter(Boolean)
    )
  ).slice(0, 20);
}
function normalizeSessionMemory(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
  const candidate = value;
  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
  if (!content) return void 0;
  return {
    content,
    coveredMessageCount: typeof candidate.coveredMessageCount === "number" && Number.isFinite(candidate.coveredMessageCount) ? Math.max(0, Math.floor(candidate.coveredMessageCount)) : 0,
    updatedAt: typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : 0
  };
}
function normalizeSessionId(value, fallbackSeed) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || `session-${stableConversationHash(fallbackSeed)}`;
}
function cloneSession(session) {
  return {
    ...session,
    messages: normalizeSessionMessages(session.messages, session.id, session.createdAt),
    referencedPdfPaths: [...session.referencedPdfPaths],
    tags: [...session.tags],
    api: session.api ? { ...session.api } : void 0,
    codex: session.codex ? { ...session.codex } : void 0,
    pendingTurn: session.pendingTurn ? { ...session.pendingTurn, attachedPdfPaths: [...session.pendingTurn.attachedPdfPaths] } : void 0,
    memory: session.memory ? { ...session.memory } : void 0
  };
}
function normalizeConversationSessions(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const normalized = {};
  for (const [key, candidate] of Object.entries(saved)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const entry = candidate;
    const conversationKey = typeof entry.conversationKey === "string" && entry.conversationKey.trim() ? entry.conversationKey.trim() : "";
    const id = normalizeSessionId(entry.id || key, `${conversationKey}:${key}`);
    const createdAt = typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt) ? entry.createdAt : 0;
    const updatedAt = typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : createdAt;
    const messages = normalizeSessionMessages(entry.messages, id, createdAt);
    const codexCandidate = entry.codex && typeof entry.codex === "object" ? entry.codex : null;
    const codex = codexCandidate && typeof codexCandidate.model === "string" && codexCandidate.model.trim() ? {
      model: codexCandidate.model.trim(),
      reasoningEffort: normalizeReasoningEffort(codexCandidate.reasoningEffort),
      profile: typeof codexCandidate.profile === "string" ? codexCandidate.profile.trim() : "",
      threadId: typeof codexCandidate.threadId === "string" ? codexCandidate.threadId.trim() || void 0 : void 0,
      lifecycle: codexCandidate.lifecycle === "closed" ? "closed" : "active"
    } : void 0;
    if (!conversationKey) continue;
    normalized[id] = {
      version: 3,
      id,
      conversationKey,
      title: typeof entry.title === "string" && entry.title.trim() ? entry.title.trim() : conversationKey.replace(/^pdf:/, ""),
      mode: normalizeSessionMode(entry.mode),
      messages,
      referencedPdfPaths: normalizeStringArray(entry.referencedPdfPaths),
      includeCurrentPdfInCodex: entry.includeCurrentPdfInCodex !== false,
      api: normalizeApiSessionMetadata(entry.api),
      codex,
      pendingTurn: normalizePendingCodexTurn(entry.pendingTurn),
      memory: normalizeSessionMemory(entry.memory),
      sourceStatus: entry.sourceStatus === "missing" ? "missing" : "available",
      pinned: entry.pinned === true,
      tags: normalizeTags(entry.tags),
      archivedAt: typeof entry.archivedAt === "number" && Number.isFinite(entry.archivedAt) && entry.archivedAt > 0 ? entry.archivedAt : void 0,
      parentSessionId: typeof entry.parentSessionId === "string" && entry.parentSessionId.trim() && entry.parentSessionId.trim() !== id ? entry.parentSessionId.trim() : void 0,
      installationId: typeof entry.installationId === "string" ? entry.installationId.trim() || void 0 : void 0,
      createdAt,
      updatedAt
    };
  }
  return normalized;
}
function getConversationKey(pdfFile, contextText, kind = "chat") {
  const chatKey = pdfFile && typeof pdfFile.path === "string" && pdfFile.path ? `pdf:${pdfFile.path}` : `selection:${stableConversationHash(cleanSelectionText(contextText || ""))}`;
  return kind === "translate" ? `translate:${chatKey}` : chatKey;
}
var ConversationStore = class {
  constructor(getSettings, persistSettings, now = Date.now) {
    this.getSettings = getSettings;
    this.persistSettings = persistSettings;
    this.now = now;
  }
  ensureContainers() {
    const settings = this.getSettings();
    if (!settings.conversationHistories || typeof settings.conversationHistories !== "object") {
      settings.conversationHistories = {};
    }
    if (!settings.conversationSessions || typeof settings.conversationSessions !== "object") {
      settings.conversationSessions = {};
    }
    if (!settings.activeConversationSessionIds || typeof settings.activeConversationSessionIds !== "object") {
      settings.activeConversationSessionIds = {};
    }
    return settings;
  }
  legacySessionId(key) {
    return `legacy-${stableConversationHash(key)}`;
  }
  createSessionFromHistory(key, metadata = {}) {
    var _a;
    const settings = this.ensureContainers();
    const legacy = (_a = settings.conversationHistories) == null ? void 0 : _a[key];
    const messages = normalizeConversationMessages(legacy == null ? void 0 : legacy.messages);
    if (!messages.length) return null;
    const id = this.legacySessionId(key);
    const existing = settings.conversationSessions[id];
    if (existing) return cloneSession(existing);
    const timestamp = (legacy == null ? void 0 : legacy.updatedAt) || this.now();
    const session = {
      version: 3,
      id,
      conversationKey: key,
      title: metadata.title || key.replace(/^pdf:/, ""),
      mode: metadata.mode || "chat",
      messages: normalizeSessionMessages(messages, id, timestamp),
      referencedPdfPaths: normalizeStringArray(metadata.referencedPdfPaths),
      includeCurrentPdfInCodex: metadata.includeCurrentPdfInCodex !== false,
      api: normalizeApiSessionMetadata(metadata.api),
      codex: metadata.codex ? { ...metadata.codex, lifecycle: metadata.codex.lifecycle || "active" } : void 0,
      memory: normalizeSessionMemory(metadata.memory),
      sourceStatus: metadata.sourceStatus === "missing" ? "missing" : "available",
      pinned: metadata.pinned === true,
      tags: normalizeTags(metadata.tags),
      archivedAt: metadata.archivedAt,
      parentSessionId: metadata.parentSessionId,
      installationId: metadata.installationId || settings.installationId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    settings.conversationSessions[id] = cloneSession(session);
    settings.activeConversationSessionIds[key] = id;
    return cloneSession(session);
  }
  applySessionMetadata(session, metadata = {}) {
    var _a;
    if (metadata.title && metadata.title.trim()) session.title = metadata.title.trim();
    if (metadata.mode) session.mode = metadata.mode;
    if (metadata.referencedPdfPaths) {
      session.referencedPdfPaths = normalizeStringArray(metadata.referencedPdfPaths);
    }
    if (typeof metadata.includeCurrentPdfInCodex === "boolean") {
      session.includeCurrentPdfInCodex = metadata.includeCurrentPdfInCodex;
    }
    if (metadata.api) session.api = normalizeApiSessionMetadata(metadata.api);
    if (metadata.codex) {
      session.codex = {
        ...session.codex || {},
        ...metadata.codex,
        lifecycle: metadata.codex.lifecycle || ((_a = session.codex) == null ? void 0 : _a.lifecycle) || "active"
      };
    }
    if (metadata.memory) session.memory = normalizeSessionMemory(metadata.memory);
    if (metadata.sourceStatus) session.sourceStatus = metadata.sourceStatus;
    if (typeof metadata.pinned === "boolean") session.pinned = metadata.pinned;
    if (metadata.tags) session.tags = normalizeTags(metadata.tags);
    if (metadata.archivedAt !== void 0) session.archivedAt = metadata.archivedAt;
    if (metadata.parentSessionId !== void 0) session.parentSessionId = metadata.parentSessionId;
    if (metadata.installationId !== void 0) session.installationId = metadata.installationId;
    return session;
  }
  normalizedSessions() {
    return normalizeConversationSessions(this.ensureContainers().conversationSessions);
  }
  sessionsForKey(key) {
    return Object.values(this.normalizedSessions()).filter((session) => session.conversationKey === key);
  }
  get(key) {
    const active = this.getActiveSession(key);
    if (active) return normalizeConversationMessages(active.messages);
    if (this.sessionsForKey(key).length) return [];
    const entry = (this.getSettings().conversationHistories || {})[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }
  getActiveSession(key) {
    var _a, _b;
    const settings = this.ensureContainers();
    const activeId = (_a = settings.activeConversationSessionIds) == null ? void 0 : _a[key];
    const sessions = normalizeConversationSessions(settings.conversationSessions);
    if (activeId && sessions[activeId]) {
      const active = sessions[activeId];
      if (!active.archivedAt && ((_b = active.codex) == null ? void 0 : _b.lifecycle) !== "closed") return cloneSession(active);
      delete settings.activeConversationSessionIds[key];
    }
    const newest = Object.values(sessions).filter(
      (session) => {
        var _a2;
        return session.conversationKey === key && !session.archivedAt && ((_a2 = session.codex) == null ? void 0 : _a2.lifecycle) !== "closed";
      }
    ).sort((left, right) => right.updatedAt - left.updatedAt)[0];
    if (newest) {
      settings.activeConversationSessionIds[key] = newest.id;
      return cloneSession(newest);
    }
    if (Object.values(sessions).some((session) => session.conversationKey === key)) return null;
    return this.createSessionFromHistory(key);
  }
  ensureSession(key, metadata = {}) {
    const settings = this.ensureContainers();
    const active = this.getActiveSession(key);
    if (active) {
      const session = this.applySessionMetadata(active, metadata);
      settings.conversationSessions[session.id] = cloneSession(session);
      settings.activeConversationSessionIds[key] = session.id;
      return cloneSession(session);
    }
    return this.startSession(key, metadata);
  }
  startSession(key, metadata = {}) {
    const settings = this.ensureContainers();
    const timestamp = this.now();
    const id = `session-${stableConversationHash(`${key}:${timestamp}:${Object.keys(settings.conversationSessions || {}).length}`)}`;
    const session = {
      version: 3,
      id,
      conversationKey: key,
      title: metadata.title || key.replace(/^pdf:/, ""),
      mode: metadata.mode || "chat",
      messages: [],
      referencedPdfPaths: normalizeStringArray(metadata.referencedPdfPaths),
      includeCurrentPdfInCodex: metadata.includeCurrentPdfInCodex !== false,
      api: normalizeApiSessionMetadata(metadata.api),
      codex: metadata.codex ? { ...metadata.codex, lifecycle: metadata.codex.lifecycle || "active" } : void 0,
      memory: normalizeSessionMemory(metadata.memory),
      sourceStatus: metadata.sourceStatus === "missing" ? "missing" : "available",
      pinned: metadata.pinned === true,
      tags: normalizeTags(metadata.tags),
      archivedAt: metadata.archivedAt,
      parentSessionId: metadata.parentSessionId,
      installationId: metadata.installationId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    settings.conversationSessions[id] = cloneSession(session);
    settings.activeConversationSessionIds[key] = id;
    return cloneSession(session);
  }
  async saveActiveSession(key, messages, metadata = {}) {
    var _a;
    const settings = this.ensureContainers();
    const normalizedMessages = normalizeConversationMessages(messages);
    const timestamp = this.now();
    if (!normalizedMessages.length) {
      const activeId = (_a = settings.activeConversationSessionIds) == null ? void 0 : _a[key];
      const active = activeId ? this.getSession(activeId) : null;
      const mergedCodex = metadata.codex || (active == null ? void 0 : active.codex);
      if (active && (mergedCodex == null ? void 0 : mergedCodex.threadId)) {
        const session2 = this.applySessionMetadata(active, metadata);
        session2.updatedAt = timestamp;
        settings.conversationSessions[session2.id] = cloneSession(session2);
        await this.persistSettings();
        return;
      }
      if (activeId) delete settings.conversationSessions[activeId];
      delete settings.activeConversationSessionIds[key];
      delete settings.conversationHistories[key];
      await this.persistSettings();
      return;
    }
    const session = this.applySessionMetadata(this.ensureSession(key, metadata), metadata);
    session.messages = normalizeSessionMessages(normalizedMessages, session.id, timestamp);
    session.updatedAt = timestamp;
    settings.conversationSessions[session.id] = cloneSession(session);
    settings.activeConversationSessionIds[key] = session.id;
    settings.conversationHistories[key] = {
      version: 1,
      updatedAt: timestamp,
      messages: normalizedMessages
    };
    await this.persistSettings();
  }
  getSession(id) {
    const session = this.normalizedSessions()[id];
    return session ? cloneSession(session) : null;
  }
  async saveSessionById(id, messages, metadata = {}) {
    var _a;
    const settings = this.ensureContainers();
    const existing = this.getSession(id);
    if (!existing) throw new Error(`Conversation session not found: ${id}`);
    const session = this.applySessionMetadata(existing, metadata);
    session.updatedAt = this.now();
    session.messages = normalizeSessionMessages(messages, session.id, session.updatedAt);
    settings.conversationSessions[id] = cloneSession(session);
    if (((_a = settings.activeConversationSessionIds) == null ? void 0 : _a[session.conversationKey]) === id && session.messages.length) {
      settings.conversationHistories[session.conversationKey] = {
        version: 1,
        updatedAt: session.updatedAt,
        messages: normalizeConversationMessages(session.messages)
      };
    }
    await this.persistSettings();
  }
  async appendSessionTurn(id, userContent, assistantContent) {
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    const firstUserTurn = !session.messages.some((message) => message.role === "user");
    const derivedTitle = userContent.replace(/\s+/g, " ").trim().slice(0, 80);
    const messages = [
      ...session.messages,
      { role: "user", content: userContent, status: "complete" },
      { role: "assistant", content: assistantContent, status: "complete" }
    ];
    await this.saveSessionById(id, messages, firstUserTurn && derivedTitle ? { title: derivedTitle } : {});
  }
  async updateSessionMetadata(id, metadata) {
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    await this.saveSessionById(id, session.messages, metadata);
  }
  async beginCodexTurn(id, pendingTurn) {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    const normalized = normalizePendingCodexTurn(pendingTurn);
    if (!normalized) throw new Error("Invalid pending Codex turn");
    session.mode = "codex";
    session.pendingTurn = normalized;
    session.updatedAt = this.now();
    settings.conversationSessions[id] = cloneSession(session);
    await this.persistSettings();
  }
  async updateCodexTurn(id, turnId, patch, codex) {
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!(session == null ? void 0 : session.pendingTurn) || session.pendingTurn.turnId !== turnId) return;
    const pendingTurn = normalizePendingCodexTurn({ ...session.pendingTurn, ...patch });
    if (!pendingTurn) throw new Error("Invalid pending Codex turn update");
    session.pendingTurn = pendingTurn;
    if (codex) session.codex = { ...session.codex || {}, ...codex };
    session.updatedAt = this.now();
    settings.conversationSessions[id] = cloneSession(session);
    await this.persistSettings();
  }
  async completeCodexTurn(id, turnId, userContent, assistantContent, codex) {
    var _a;
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    if (!session.pendingTurn || session.pendingTurn.turnId !== turnId) {
      const tail = session.messages.slice(-2);
      const alreadyApplied = !session.pendingTurn && tail.length === 2 && tail[0].role === "user" && tail[0].content === userContent && tail[1].role === "assistant" && tail[1].content === assistantContent;
      if (alreadyApplied) {
        session.codex = { ...session.codex || {}, ...codex };
        settings.conversationSessions[id] = cloneSession(session);
        await this.persistSettings();
        return;
      }
      throw new Error("Codex turn no longer matches the persisted pending task");
    }
    const firstUserTurn = !session.messages.some((message) => message.role === "user");
    const derivedTitle = userContent.replace(/\s+/g, " ").trim().slice(0, 80);
    session.messages = normalizeSessionMessages([
      ...session.messages,
      { role: "user", content: userContent, status: "complete" },
      { role: "assistant", content: assistantContent, status: "complete" }
    ], session.id, this.now());
    if (firstUserTurn && derivedTitle) session.title = derivedTitle;
    session.codex = { ...session.codex || {}, ...codex };
    session.pendingTurn = void 0;
    session.updatedAt = this.now();
    settings.conversationSessions[id] = cloneSession(session);
    if (((_a = settings.activeConversationSessionIds) == null ? void 0 : _a[session.conversationKey]) === id) {
      settings.conversationHistories[session.conversationKey] = {
        version: 1,
        updatedAt: session.updatedAt,
        messages: normalizeConversationMessages(session.messages)
      };
    }
    await this.persistSettings();
  }
  async closeSession(id) {
    var _a, _b;
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) return;
    if (session.codex) session.codex = { ...session.codex, lifecycle: "closed" };
    if (((_a = session.pendingTurn) == null ? void 0 : _a.status) === "running") {
      session.pendingTurn = { ...session.pendingTurn, status: "interrupted", progress: "\u4F1A\u8BDD\u5DF2\u5173\u95ED" };
    }
    session.updatedAt = this.now();
    settings.conversationSessions[id] = cloneSession(session);
    if (((_b = settings.activeConversationSessionIds) == null ? void 0 : _b[session.conversationKey]) === id) {
      delete settings.activeConversationSessionIds[session.conversationKey];
    }
    await this.persistSettings();
  }
  async archiveSession(id) {
    var _a;
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) return;
    const timestamp = this.now();
    session.archivedAt = timestamp;
    session.updatedAt = timestamp;
    settings.conversationSessions[id] = cloneSession(session);
    if (((_a = settings.activeConversationSessionIds) == null ? void 0 : _a[session.conversationKey]) === id) {
      delete settings.activeConversationSessionIds[session.conversationKey];
    }
    await this.persistSettings();
  }
  async rebindSessionSource(id, newPath) {
    var _a;
    const path = (newPath || "").trim().replace(/\\/g, "/");
    if (!path || !path.toLowerCase().endsWith(".pdf") || /^(?:[A-Za-z]:|\/)/.test(path) || path.split("/").includes("..")) {
      throw new Error("Rebind requires a vault-relative PDF path");
    }
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    const oldKey = session.conversationKey;
    const oldPath = oldKey.startsWith("pdf:") ? oldKey.slice("pdf:".length) : "";
    session.conversationKey = ["pdf", path].join(":");
    session.sourceStatus = "available";
    session.messages = session.messages.map((message) => {
      var _a2;
      return {
        ...message,
        ...((_a2 = message.evidence) == null ? void 0 : _a2.length) ? {
          evidence: message.evidence.map(
            (evidence) => evidence.paperPath === oldPath ? { ...evidence, verification: "unverified" } : { ...evidence }
          )
        } : {}
      };
    });
    session.updatedAt = this.now();
    settings.conversationSessions[id] = cloneSession(session);
    if (((_a = settings.activeConversationSessionIds) == null ? void 0 : _a[oldKey]) === id) {
      delete settings.activeConversationSessionIds[oldKey];
      settings.activeConversationSessionIds[session.conversationKey] = id;
    }
    await this.persistSettings();
  }
  async clearSession(id) {
    var _a;
    const settings = this.ensureContainers();
    const session = this.getSession(id);
    if (!session) return;
    delete settings.conversationSessions[id];
    if (((_a = settings.activeConversationSessionIds) == null ? void 0 : _a[session.conversationKey]) === id) {
      delete settings.activeConversationSessionIds[session.conversationKey];
      delete settings.conversationHistories[session.conversationKey];
    }
    await this.persistSettings();
  }
  resumeSession(id) {
    const settings = this.ensureContainers();
    const sessions = normalizeConversationSessions(settings.conversationSessions);
    const session = sessions[id];
    if (!session) return null;
    if (session.codex) session.codex = { ...session.codex, lifecycle: "active" };
    session.archivedAt = void 0;
    settings.activeConversationSessionIds[session.conversationKey] = session.id;
    settings.conversationSessions[session.id] = cloneSession(session);
    return cloneSession(session);
  }
  listSessions(query = "") {
    const settings = this.ensureContainers();
    const sessions = normalizeConversationSessions(settings.conversationSessions);
    const needle = query.trim().toLowerCase();
    return Object.values(sessions).filter((session) => {
      if (!needle) return true;
      return [session.title, session.conversationKey, ...session.referencedPdfPaths].join(" ").toLowerCase().includes(needle);
    }).sort((left, right) => right.updatedAt - left.updatedAt).map(cloneSession);
  }
  async save(key, messages) {
    await this.saveActiveSession(key, messages);
  }
  async clear(key) {
    var _a;
    const settings = this.ensureContainers();
    const activeId = (_a = settings.activeConversationSessionIds) == null ? void 0 : _a[key];
    if (activeId) delete settings.conversationSessions[activeId];
    if (settings.activeConversationSessionIds) delete settings.activeConversationSessionIds[key];
    if (settings.conversationHistories && settings.conversationHistories[key]) {
      delete settings.conversationHistories[key];
    }
    await this.persistSettings();
  }
};

// src/llm-transport.ts
var import_obsidian2 = require("obsidian");
function getDefaultFetchRequest() {
  const fetchRequest = typeof globalThis !== "undefined" ? globalThis.fetch : void 0;
  if (typeof fetchRequest !== "function") {
    return (() => Promise.reject(new Error("fetch is not available in this environment")));
  }
  return fetchRequest.bind(globalThis);
}
function asCompletionPayload(value) {
  return value && typeof value === "object" ? value : null;
}
var OpenAICompatibleTransport = class {
  constructor(getSettings, getModelProfile, request = import_obsidian2.requestUrl, fetchRequest = getDefaultFetchRequest()) {
    this.getSettings = getSettings;
    this.getModelProfile = getModelProfile;
    this.request = request;
    this.fetchRequest = fetchRequest;
  }
  async chat(request) {
    var _a, _b;
    const settings = this.getSettings();
    const profile = request.modelProfile || this.getModelProfile(settings.activeModelId);
    const shouldStream = (_a = request.stream) != null ? _a : settings.stream;
    if (shouldStream) {
      return this.chatStream(
        request.messages,
        request.onChunk,
        request.signal,
        profile,
        request.maxTokensOverride,
        request.temperatureOverride
      );
    }
    const text = await this.chatOnce(
      request.messages,
      request.signal,
      profile,
      request.maxTokensOverride,
      request.temperatureOverride
    );
    (_b = request.onChunk) == null ? void 0 : _b.call(request, text, text);
    return text;
  }
  async chatOnce(messages, signal, profile, maxTokensOverride, temperatureOverride) {
    const settings = this.getSettings();
    const body = {
      model: profile.model,
      temperature: temperatureOverride != null ? temperatureOverride : settings.temperature,
      max_tokens: maxTokensOverride != null ? maxTokensOverride : settings.maxTokens,
      stream: false,
      messages
    };
    const response = await this.request({
      url: profile.endpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`
      },
      body: JSON.stringify(body),
      throw: false
    });
    if (signal == null ? void 0 : signal.aborted) {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      throw abortError;
    }
    let data = null;
    try {
      data = asCompletionPayload(response.json);
    } catch (e) {
      data = null;
    }
    if (response.status >= 300) {
      const message = data && data.error && data.error.message || response.text || `HTTP ${response.status}`;
      throw new Error(message);
    }
    const choice = data && data.choices && data.choices[0];
    const content = choice && (choice.message ? choice.message.content : choice.text);
    if (!content) throw new Error("\u6A21\u578B\u6CA1\u6709\u8FD4\u56DE\u5185\u5BB9,\u539F\u59CB\u54CD\u5E94: " + JSON.stringify(data));
    return String(content).trim();
  }
  async chatStream(messages, onChunk, signal, profile, maxTokensOverride, temperatureOverride) {
    var _a, _b, _c, _d;
    const settings = this.getSettings();
    const response = await this.fetchRequest(profile.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`
      },
      body: JSON.stringify({
        model: profile.model,
        temperature: temperatureOverride != null ? temperatureOverride : settings.temperature,
        max_tokens: maxTokensOverride != null ? maxTokensOverride : settings.maxTokens,
        stream: true,
        messages
      }),
      signal
    });
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
      }
      let message = errorText || `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.error && parsed.error.message || message;
      } catch (e) {
      }
      throw new Error(message);
    }
    if (!((_a = response.body) == null ? void 0 : _a.getReader)) {
      const data = asCompletionPayload(await response.json());
      const content = ((_d = (_c = (_b = data == null ? void 0 : data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) || "";
      onChunk == null ? void 0 : onChunk(content, content);
      return content;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(":")) continue;
        const payload = line.replace(/^data:\s*/i, "").trim();
        if (!payload || payload === "[DONE]") continue;
        let parsed;
        try {
          parsed = asCompletionPayload(JSON.parse(payload));
        } catch (e) {
          continue;
        }
        if (parsed == null ? void 0 : parsed.error) throw new Error(parsed.error.message || JSON.stringify(parsed.error));
        const choices = parsed == null ? void 0 : parsed.choices;
        if (!(choices == null ? void 0 : choices.length)) continue;
        const delta = choices[0].delta || choices[0].message || {};
        const piece = delta.content || delta.reasoning_content || (typeof delta.text === "string" ? delta.text : "");
        if (piece) {
          full += piece;
          onChunk == null ? void 0 : onChunk(piece, full);
        }
      }
    }
    return full;
  }
};

// src/evidence.ts
var import_obsidian3 = require("obsidian");
var ALIAS_CITATION = /\[([A-Za-z][A-Za-z0-9_-]*)\s*,\s*p(?:age)?\.?\s*(-?\d+)\]/gi;
var PDF_LINK_CITATION = /\[\[([^\]#|]+\.pdf)#page=(-?\d+)(?:\|[^\]]*)?\]\]/gi;
function normalizedPath(value) {
  return value.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}
function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
function normalizeClaim(markdown, index, rawLength) {
  const lineStart = markdown.lastIndexOf("\n", index) + 1;
  const nextLineBreak = markdown.indexOf("\n", index + rawLength);
  const lineEnd = nextLineBreak >= 0 ? nextLineBreak : markdown.length;
  const cleaned = markdown.slice(lineStart, lineEnd).replace(ALIAS_CITATION, "").replace(PDF_LINK_CITATION, "").replace(/\s+/g, " ").replace(/\s+([.,!?;:。！？；：])/g, "$1").trim();
  return cleaned || "\u8BBA\u6587\u8BC1\u636E";
}
function collectCandidates(markdown) {
  const candidates = [];
  for (const match of markdown.matchAll(ALIAS_CITATION)) {
    candidates.push({
      index: match.index || 0,
      raw: match[0],
      alias: match[1],
      page: Number(match[2])
    });
  }
  for (const match of markdown.matchAll(PDF_LINK_CITATION)) {
    candidates.push({
      index: match.index || 0,
      raw: match[0],
      path: normalizedPath(match[1]),
      page: Number(match[2])
    });
  }
  return candidates.sort((left, right) => left.index - right.index);
}
function validPage(page, source) {
  if (!Number.isInteger(page) || page < 1 || !source) return false;
  if (Number.isInteger(source.pageCount) && Number(source.pageCount) > 0) {
    return page <= Number(source.pageCount);
  }
  return true;
}
function parseResearchEvidence(markdown, sources) {
  if (typeof markdown !== "string" || !markdown.trim()) return [];
  const normalizedSources = (Array.isArray(sources) ? sources : []).filter((source) => source && source.alias && source.paperPath).map((source) => ({
    ...source,
    alias: source.alias.trim(),
    paperPath: normalizedPath(source.paperPath)
  }));
  const byAlias = new Map(normalizedSources.map((source) => [source.alias.toLowerCase(), source]));
  const byPath = new Map(normalizedSources.map((source) => [source.paperPath.toLowerCase(), source]));
  const seen = /* @__PURE__ */ new Set();
  const evidence = [];
  for (const candidate of collectCandidates(markdown)) {
    const source = candidate.alias ? byAlias.get(candidate.alias.toLowerCase()) : byPath.get((candidate.path || "").toLowerCase());
    const paperPath = (source == null ? void 0 : source.paperPath) || candidate.path;
    const sourceAlias = (source == null ? void 0 : source.alias) || candidate.alias;
    const claim = normalizeClaim(markdown, candidate.index, candidate.raw.length);
    const verification = validPage(candidate.page, source) ? "located" : "unverified";
    const dedupeKey = `${(paperPath || sourceAlias || "unknown").toLowerCase()}|${candidate.page}|${claim.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    evidence.push({
      id: `evidence-${stableHash(`${dedupeKey}|${candidate.raw}`)}`,
      claim,
      ...paperPath ? { paperPath } : {},
      ...Number.isInteger(candidate.page) ? { page: candidate.page } : {},
      ...sourceAlias ? { sourceAlias } : {},
      verification,
      raw: candidate.raw
    });
  }
  return evidence;
}
async function openPdfEvidence(app, evidence) {
  if (!evidence || evidence.verification !== "located" || !evidence.paperPath || !Number.isInteger(evidence.page) || Number(evidence.page) < 1) {
    new import_obsidian3.Notice("\u8FD9\u6761\u8BC1\u636E\u5C1A\u672A\u9A8C\u8BC1\uFF0C\u65E0\u6CD5\u5B9A\u4F4D\u5230 PDF \u9875\u9762\u3002");
    return false;
  }
  const paperPath = normalizedPath(evidence.paperPath);
  const file = app.vault.getAbstractFileByPath(paperPath);
  if (!file || !paperPath.toLowerCase().endsWith(".pdf")) {
    new import_obsidian3.Notice("\u8BC1\u636E\u5BF9\u5E94\u7684 PDF \u5DF2\u79FB\u52A8\u6216\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u6253\u5F00\u9875\u9762\u3002");
    return false;
  }
  await app.workspace.openLinkText(`${paperPath}#page=${evidence.page}`, "", false);
  return true;
}

// src/model-routing.ts
function validConfiguredId(models, configuredId) {
  if (!configuredId) return null;
  return models.some((model) => model.id === configuredId) ? configuredId : null;
}
function keywordModelId(models, keyword) {
  var _a;
  const normalizedKeyword = keyword.toLocaleLowerCase();
  const match = models.find(
    (model) => [model.id, model.model, model.name].some(
      (value) => String(value != null ? value : "").toLocaleLowerCase().includes(normalizedKeyword)
    )
  );
  return (_a = match == null ? void 0 : match.id) != null ? _a : null;
}
function activeOrFirstId(settings) {
  var _a, _b, _c;
  return (_c = (_b = validConfiguredId(settings.models, settings.activeModelId)) != null ? _b : (_a = settings.models[0]) == null ? void 0 : _a.id) != null ? _c : "";
}
function resolveTranslateModelId(settings) {
  var _a, _b;
  return (_b = (_a = validConfiguredId(settings.models, settings.translateModelId)) != null ? _a : keywordModelId(settings.models, "deepseek")) != null ? _b : activeOrFirstId(settings);
}
function resolveContinueModelId(settings) {
  var _a, _b;
  return (_b = (_a = validConfiguredId(settings.models, settings.continueModelId)) != null ? _a : keywordModelId(settings.models, "glm")) != null ? _b : activeOrFirstId(settings);
}

// src/default-settings.ts
var LEGACY_0_4_0_TRANSLATE_PROMPT = "\u8BF7\u628A\u3010\u6211\u5F53\u524D\u9009\u4E2D\u5E76\u60F3\u8BA8\u8BBA\u7684\u539F\u6587\u7247\u6BB5\u3011\u5B8C\u6574\u7FFB\u8BD1\u6210\u4E2D\u6587\u3002\n1. \u9010\u6BB5\u5BF9\u5E94\u539F\u6587\u5206\u6BB5,\u4E0D\u8981\u5408\u5E76\u6216\u7701\u7565\u6BB5\u843D\u3002\n2. \u4E13\u4E1A\u672F\u8BED\u53EF\u4FDD\u7559\u82F1\u6587\u539F\u8BCD(\u62EC\u53F7\u6807\u6CE8\u5373\u53EF),\u516C\u5F0F\u3001\u4EE3\u7801\u3001\u53D8\u91CF\u540D\u3001\u56FE\u8868\u7F16\u53F7\u7B49\u4FDD\u6301\u539F\u6837\u4E0D\u7FFB\u8BD1\u3002\n3. \u53EA\u8F93\u51FA\u7FFB\u8BD1\u7ED3\u679C,\u4E0D\u8981\u8F93\u51FA\u539F\u6587\u3001\u4E0D\u8981\u590D\u8FF0\u8981\u6C42\u3001\u4E0D\u8981\u52A0\u989D\u5916\u89E3\u91CA\u6216\u603B\u7ED3\u3002";
var DEFAULT_SETTINGS = {
  installationId: "",
  readerDataVersion: 0,
  paperCacheQuota: {
    maxEntries: 100,
    maxBytes: 100 * 1024 * 1024
  },
  models: [
    {
      id: "openai-compatible",
      name: "OpenAI-compatible API",
      endpoint: "",
      apiKey: "",
      model: ""
    }
  ],
  activeModelId: "openai-compatible",
  temperature: 0.7,
  maxTokens: 1200,
  stream: true,
  // 弹窗里聊天内容(上下文预览/对话气泡/输入框)的字体缩放比例,可在弹窗标题栏用 A-/A+ 调整,会记住上次的值。
  fontScale: 1,
  // 记住上一次对话用的模型/阅读模式,下次打开弹窗直接沿用,不用每次重新选。
  lastModelId: "",
  lastPresetId: "",
  quickTranslateMarkerEnabled: true,
  translateModelId: "",
  continueModelId: "",
  systemPrompt: "\u4F60\u662F\u6211\u7684\u9605\u8BFB\u52A9\u624B\u3002\u8BF7\u7ED3\u5408\u4E0B\u9762\u63D0\u4F9B\u7684\u539F\u6587\u7247\u6BB5\u56DE\u7B54\u6211\u7684\u95EE\u9898\u3002\n1. \u4F18\u5148\u57FA\u4E8E\u539F\u6587\u7247\u6BB5\u56DE\u7B54,\u4E0D\u8981\u8131\u79BB\u5B83\u53E6\u8D77\u7089\u7076\u3002\n2. \u5982\u679C\u95EE\u9898\u5728\u539F\u6587\u7247\u6BB5\u4E2D\u627E\u4E0D\u5230\u4F9D\u636E,\u8BF7\u660E\u786E\u8BF4\u660E,\u4E0D\u8981\u7F16\u9020\u3002\n3. \u76F4\u63A5\u8F93\u51FA\u56DE\u7B54\u5185\u5BB9,\u4E0D\u8981\u590D\u8FF0\u89C4\u5219,\u4E0D\u8981\u52A0\u201C\u6839\u636E\u539F\u6587...\u201D\u8FD9\u7C7B\u5957\u8BDD\u5F00\u5934\u3002\n4. \u540E\u7EED\u8FFD\u95EE\u8981\u7ED3\u5408\u4E4B\u524D\u7684\u5BF9\u8BDD\u4E0A\u4E0B\u6587,\u4FDD\u6301\u8FDE\u8D2F\u3002",
  translation: {
    targetLanguage: "zh-CN",
    temperature: 0.1,
    maxTokens: 4e3,
    chunkChars: 8e3,
    additionalInstruction: ""
  },
  researchNotes: {
    folder: "PDF Chat/Reading Notes",
    exportFolder: "PDF Chat/Exports",
    includeSelectionText: false
  },
  codexDeepAnalysis: {
    enabled: false,
    command: "codex",
    profile: "",
    model: "gpt-5.5",
    reasoningEffort: "medium",
    verbosity: "medium",
    inputMode: "pdf-only",
    outputMode: "markdown",
    modelPresets: [
      { model: "gpt-5.5", reasoningEffort: "medium", label: "gpt-5.5 \xB7 medium" },
      { model: "gpt-5.5", reasoningEffort: "high", label: "gpt-5.5 \xB7 high" },
      { model: "gpt-5.6-sol", reasoningEffort: "medium", label: "gpt-5.6-sol \xB7 medium" },
      { model: "gpt-5.6-sol", reasoningEffort: "xhigh", label: "gpt-5.6-sol \xB7 xhigh" }
    ],
    timeoutMs: 18e5,
    keepTempFiles: false,
    includeSelectionContext: true
  },
  contextBudget: {
    maxInputChars: 6e4,
    minRecentTurns: 6,
    maxSelectionChars: 2e4
  },
  // 全文摘要(浓缩上下文)相关设置:先用一个快速/便宜的模型把整篇 PDF 浓缩成摘要,
  // 缓存下来,回答局部选段问题时可以选择性地附带这份摘要作为背景,
  // 而不是把全文原样塞进上下文导致跑题或超长。
  summaryModelId: "openai-compatible",
  // 打开 PDF 划词弹窗时,如果已经缓存过摘要就自动附带、没缓存就自动生成一次,
  // 不需要每次手动勾选/点击,配合下面的按文件+mtime 缓存,同一篇论文只会真正调用一次摘要模型。
  autoDocSummary: true,
  summaryMaxChars: 1e5,
  // 摘要输出单独限制 token 数,避免和主聊天的 maxTokens 共用同一个上限导致摘要写得又长又碎。
  summaryMaxTokens: 700,
  summaryPrompt: "\u4F60\u662F\u4E00\u4E2A\u5B66\u672F\u8BBA\u6587\u63D0\u70BC\u52A9\u624B\u3002\u4E0B\u9762\u4F1A\u7ED9\u4F60\u4E00\u7BC7\u8BBA\u6587\u7684\u5168\u6587(\u53EF\u80FD\u56E0\u7BC7\u5E45\u8FC7\u957F\u88AB\u622A\u65AD)\u3002\n\u8BF7\u63D0\u70BC\u4E00\u4EFD*\u6781\u7B80*\u7684\u80CC\u666F\u6458\u8981\u5361\u7247,\u53EA\u7528\u6765\u7ED9\u6211\u4E4B\u540E\u9488\u5BF9\u8BBA\u6587\u91CC\u67D0\u4E00\u5C0F\u6BB5\u63D0\u95EE\u65F6\u63D0\u4F9B\u80CC\u666F\u53C2\u8003,\u4E0D\u662F\u5B8C\u6574\u6458\u8981,\u6211\u4E0D\u4F1A\u901A\u7BC7\u8BFB\u5B83\u3002\n\u786C\u6027\u8981\u6C42(\u52A1\u5FC5\u9075\u5B88):\n1. \u603B\u5B57\u6570\u4E0D\u8D85\u8FC7400\u5B57,\u5B81\u53EF\u5C11\u5199\u4E5F\u4E0D\u8981\u591A\u5199,\u8FD9\u662F\u786C\u4E0A\u9650,\u4E0D\u8981\u56E0\u4E3A\u539F\u6587\u957F\u5C31\u5199\u66F4\u591A\u3002\n2. \u53EA\u4FDD\u7559:\u7814\u7A76\u4E3B\u9898\u4E0E\u6838\u5FC3\u8D21\u732E(1-2\u53E5)\u3001\u603B\u4F53\u7ED3\u6784(\u6BCF\u8282\u4E00\u53E5\u8BDD\u5E26\u8FC7,\u4E0D\u5C55\u5F00\u7EC6\u8282)\u30013-5\u4E2A\u5173\u952E\u672F\u8BED\u7684\u6781\u7B80\u91CA\u4E49\u3001\u6838\u5FC3\u65B9\u6CD5/\u8BBA\u8BC1\u903B\u8F91(2-3\u53E5)\u3002\n3. \u4E0D\u9010\u6BB5\u590D\u8FF0\u3001\u4E0D\u4E3E\u4F8B\u3001\u4E0D\u5F15\u7528\u539F\u6587\u957F\u53E5\u3001\u4E0D\u5199\u80CC\u666F\u77E5\u8BC6\u79D1\u666E\u6BB5\u843D\u3002\n4. \u76F4\u63A5\u8F93\u51FA\u5185\u5BB9,\u4E0D\u8981\u201C\u597D\u7684,\u4EE5\u4E0B\u662F\u6458\u8981\u201D\u4E4B\u7C7B\u7684\u5F00\u573A\u767D\u6216\u7ED3\u5C3E\u603B\u7ED3\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002",
  // key 是文件的 vault 相对路径,value 形如 { mtime, summary, generatedAt, fullLength, truncated }
  docSummaries: {},
  // RAG 检索(关键词/BM25,不依赖任何 embedding 模型):把全文按页切块,提问时按关键词相关性
  // 检索出最相关的几块塞进上下文,跟"全文摘要"是互补关系——摘要给全局背景,这个给具体细节定位。
  autoRag: true,
  ragChunkSize: 700,
  ragChunkOverlap: 100,
  ragTopK: 4,
  // 实测发现:BM25 关键词检索对"列举类"问题(比如"论文对比了哪些基线算法")天然不擅长——
  // 真正答案段落里全是专有名词而不是"对比/baseline"这类通用词,反而会被论文里其他大量提到
  // "对比/baseline"的段落(相关工作、附录补充实验等)挤到检索排名前面,漏掉真正该看的那一块。
  // 而大部分单篇论文全文并不长,直接把全文原样交给模型远比"猜哪一块"更准。所以全文长度在这个
  // 阈值以内时,直接读全文回答,只有超过阈值(全文塞不下)时才退回关键词检索。
  ragFullTextThreshold: 18e4,
  // BM25 是纯字符匹配,中文问题和英文论文原文之间没有共同字符/词,直接检索基本会全部落空。
  // 开启后,提问时会先让一个快模型"思考"这个问题该从哪几个角度/说法去检索,输出多组中英双语检索词
  // (不只是逐字翻译),再拿每一组分别去检索、把结果融合排序,比单一检索词能覆盖更多角度、找得更全。
  ragQueryTranslate: true,
  ragQueryPrompt: "\u4F60\u662F\u8BBA\u6587\u68C0\u7D22\u7B56\u7565\u52A9\u624B,\u4EFB\u52A1\u662F\u628A\u6211\u7684\u95EE\u9898\u62C6\u89E3\u6210\u591A\u7EC4\u201C\u68C0\u7D22\u5173\u952E\u8BCD\u201D,\u7528\u4E8E\u5728\u8BBA\u6587\u5168\u6587\u91CC\u505A\u5173\u952E\u8BCD\u68C0\u7D22\u3002\u4F60\u4E0D\u8D1F\u8D23\u56DE\u7B54\u95EE\u9898\u672C\u8EAB\u3002\n\u8BBA\u6587\u539F\u6587\u53EF\u80FD\u662F\u82F1\u6587,\u4E5F\u53EF\u80FD\u662F\u4E2D\u6587,\u4F60\u5E76\u4E0D\u786E\u5B9A,\u6240\u4EE5\u6BCF\u4E00\u7EC4\u5173\u952E\u8BCD\u90FD\u8981\u4E2D\u82F1\u6587\u517C\u987E\u3002\n\u5728\u5FC3\u91CC(\u4E0D\u8981\u8F93\u51FA\u8FC7\u7A0B)\u6309\u8FD9\u4E2A\u601D\u8DEF\u601D\u8003:\n1. \u8FD9\u4E2A\u95EE\u9898\u771F\u6B63\u60F3\u77E5\u9053\u7684\u662F\u4EC0\u4E48?\u6309\u8BBA\u6587\u7684\u5E38\u89C1\u7ED3\u6784,\u7B54\u6848\u5927\u6982\u7387\u4F1A\u51FA\u73B0\u5728\u65B9\u6CD5/\u6570\u636E/\u5B9E\u9A8C\u8BBE\u7F6E/\u7ED3\u679C/\u5C40\u9650/\u76F8\u5173\u5DE5\u4F5C\u91CC\u7684\u54EA\u4E00\u90E8\u5206?\n2. \u8BBA\u6587\u4F5C\u8005\u63CF\u8FF0\u8FD9\u4E2A\u6982\u5FF5\u65F6,\u53EF\u80FD\u4F1A\u7528\u54EA\u4E9B\u4E0D\u540C\u7684\u8BF4\u6CD5(\u540C\u4E49\u8BCD\u3001\u66F4\u5B66\u672F\u5316\u7684\u8868\u8FBE\u3001\u5E38\u89C1\u7F29\u5199\u3001\u5BF9\u5E94\u7684\u516C\u5F0F\u7B26\u53F7\u6216\u53D8\u91CF\u540D)?\n3. \u5982\u679C\u8FD9\u4E2A\u95EE\u9898\u5305\u542B\u591A\u4E2A\u5B50\u95EE\u9898\u6216\u591A\u4E2A\u6982\u5FF5,\u80FD\u4E0D\u80FD\u62C6\u6210\u51E0\u4E2A\u66F4\u5177\u4F53\u3001\u66F4\u5BB9\u6613\u5206\u522B\u547D\u4E2D\u539F\u6587\u7684\u68C0\u7D22\u89D2\u5EA6?\n\u8F93\u51FA\u6070\u597D3\u884C,\u6BCF\u884C\u662F\u4E00\u7EC4\u72EC\u7ACB\u7684\u68C0\u7D22\u5173\u952E\u8BCD/\u77ED\u8BED(\u540C\u4E00\u884C\u5185\u591A\u4E2A\u5173\u952E\u8BCD\u7528\u9017\u53F7\u5206\u9694),3\u884C\u8981\u4EE3\u88683\u4E2A\u4E0D\u540C\u89D2\u5EA6\u6216\u4E0D\u540C\u8BF4\u6CD5\u7684\u68C0\u7D22\u5C1D\u8BD5,\u4E0D\u89813\u884C\u90FD\u662F\u540C\u4E00\u4E2A\u610F\u601D\u7684\u91CD\u590D\u8868\u8FBE\u3002\n\u76F4\u63A5\u8F93\u51FA\u8FD93\u884C,\u4E0D\u8981\u7F16\u53F7\u3001\u4E0D\u8981\u89E3\u91CA\u3001\u4E0D\u8981\u8F93\u51FA\u95EE\u9898\u672C\u8EAB\u3001\u4E0D\u8981\u8F93\u51FA\u8FD93\u884C\u4EE5\u5916\u7684\u4EFB\u4F55\u6587\u5B57\u3002",
  // key 是文件的 vault 相对路径,value 形如 { mtime, chunks: [{page, text}], generatedAt }
  docChunks: {},
  // 每篇 PDF(或精确匹配的非 PDF 选区)只保存一份最近对话。这里只存用户实际看到的问答,
  // 不保存 system prompt、全文或 RAG 检索片段,避免 data.json 被隐藏上下文快速撑大。
  conversationHistories: {},
  conversationSessions: {},
  activeConversationSessionIds: {},
  promptHistory: [],
  promptPresets: [
    {
      id: "paper-map",
      name: "\u8BBA\u6587\u901F\u8BFB\u5730\u56FE",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u5B66\u672F\u8BBA\u6587\u901F\u8BFB\u52A9\u624B\u3002\u8BBA\u6587\u4E0D\u662F\u6545\u4E8B,\u4E0D\u8981\u4ECE\u5934\u8BFB\u5230\u5C3E\u2014\u2014\u5148\u7ED9\u51FA\u5168\u5C40\u5730\u56FE,\u518D\u51B3\u5B9A\u54EA\u4E9B\u90E8\u5206\u503C\u5F97\u6DF1\u8BFB\u3002\n\u56DE\u7B54\u65F6\u4F18\u5148\u7ED9\u51FA:\u5206\u8282\u901F\u89C8(2-3\u53E5\u8BDD/\u8282)\u3001\u6838\u5FC3\u56E0\u679C\u94FE(A\u2192B\u2192C)\u3001\u503C\u4E0D\u503C\u5F97\u6DF1\u8BFB\u7684\u4F18\u5148\u7EA7\u5224\u65AD(\u9AD8/\u4E2D/\u4F4E)\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "methods-decoder",
      name: "\u65B9\u6CD5\u8BBA\u89E3\u7801",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u628A\u590D\u6742\u7814\u7A76\u65B9\u6CD5\u7FFB\u8BD1\u6210\u5927\u767D\u8BDD\u7684\u52A9\u624B,\u540C\u65F6\u662F\u6311\u5254\u7684\u65B9\u6CD5\u8BBA\u5BA1\u67E5\u8005\u3002\n\u56DE\u7B54\u65F6\u8BF4\u660E:\u7814\u7A76\u8BBE\u8BA1\u662F\u4EC0\u4E48(\u7C7B\u6BD4\u8BB2\u89E3)\u3001\u5173\u952E\u8981\u7D20(\u6837\u672C/\u53D8\u91CF/\u5206\u6790\u65B9\u6CD5)\u3001\u8FD9\u4E2A\u8BBE\u8BA1\u5F3A\u5728\u54EA\u3001\u5F31\u5728\u54EA(\u6BCF\u6761\u8BF4\u660E\u4F1A\u5BFC\u81F4\u7ED3\u8BBA\u5728\u4EC0\u4E48\u60C5\u51B5\u4E0B\u4E0D\u6210\u7ACB)\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "limitations",
      name: "\u5C40\u9650\u4E0E\u5047\u8BBE",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u4E25\u8C28\u7684\u8BBA\u6587\u8BC4\u5BA1\u8005\u3002\u6BCF\u7BC7\u8BBA\u6587\u90FD\u6709\u5C40\u9650\u2014\u2014\u6709\u4E9B\u4F5C\u8005\u81EA\u5DF1\u627F\u8BA4,\u6709\u4E9B\u85CF\u5728\u8BBE\u8BA1\u91CC\u6CA1\u8BF4\u3002\n\u56DE\u7B54\u65F6\u533A\u5206:\u4F5C\u8005\u660E\u8BF4\u7684\u5C40\u9650 vs \u6CA1\u8BF4\u4F46\u6697\u542B\u7684\u5047\u8BBE(\u6BCF\u6761\u8BF4\u660E\u5047\u8BBE\u4E0D\u6210\u7ACB\u4F1A\u600E\u6837\u5F71\u54CD\u7ED3\u8BBA),\u5E76\u7ED9\u51FA\u7ED3\u8BBA\u53EF\u4FE1\u5EA6\u7684\u6574\u4F53\u5224\u65AD\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "reproducibility",
      name: "\u590D\u73B0\u6027\u68C0\u67E5",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u4E13\u6CE8\u4E8E\u53EF\u590D\u73B0\u6027\u7684\u5BA1\u67E5\u8005,\u53C2\u8003 FAIR \u539F\u5219\u7684\u601D\u8DEF,\u4F46\u4F1A\u6309\u8BBA\u6587\u6240\u5C5E\u9886\u57DF\u81EA\u884C\u5224\u65AD\u5408\u7406\u6807\u51C6\u3002\n\u56DE\u7B54\u65F6\u6309:\u6570\u636E\u53EF\u83B7\u5F97\u6027\u3001\u4EE3\u7801\u4E0E\u73AF\u5883\u3001\u6D41\u7A0B\u6B65\u9AA4\u3001\u53C2\u6570\u900F\u660E\u5EA6\u56DB\u4E2A\u7EF4\u5EA6\u8BC4\u4F30,\u6700\u540E\u7ED9\u51FA\u4F4E/\u4E2D/\u9AD8\u590D\u73B0\u6027\u8BC4\u7EA7\u548C\u6700\u7F3A\u7684\u4E09\u6837\u4E1C\u897F\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "math",
      name: "\u6570\u5B66\u7B26\u53F7\u8BB2\u89E3",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u628A\u516C\u5F0F\u548C\u7B26\u53F7\u7FFB\u8BD1\u6210\u5927\u767D\u8BDD\u7684\u52A9\u624B,\u5047\u8BBE\u6211\u5177\u5907\u57FA\u7840\u7684\u8BE5\u9886\u57DF\u77E5\u8BC6,\u4F46\u8BB0\u4E0D\u6E05\u5177\u4F53\u7B26\u53F7\u7EA6\u5B9A\u3002\n\u56DE\u7B54\u65F6\u9010\u4E2A\u7B26\u53F7\u8BB2\u89E3\u542B\u4E49\u3001\u8BF4\u660E\u516C\u5F0F\u5728\u7B97\u4EC0\u4E48\u3001\u4E3A\u4EC0\u4E48\u8FD9\u4E2A\u516C\u5F0F\u5BF9\u8BBA\u70B9\u5173\u952E,\u5982\u679C\u53EF\u80FD\u7ED9\u4E00\u4E2A\u6781\u7B80\u6570\u503C\u4F8B\u5B50\u5E2E\u52A9\u5EFA\u7ACB\u76F4\u89C9\u3002\u7528\u4E2D\u6587,\u7B26\u53F7\u672C\u8EAB\u4FDD\u7559\u539F\u6837\u3002"
    },
    {
      id: "critic",
      name: "\u6279\u5224\u6027\u5BA1\u8BFB",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u903B\u8F91\u5BA1\u67E5\u8005\u548C\u8FA9\u8BC1\u5206\u6790\u8005\u3002\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u540C\u610F\u8BBA\u6587,\u800C\u662F\u63D0\u4F9B\u6709\u4EF7\u503C\u7684\u963B\u529B\u2014\u2014\u5E2E\u6211\u628A\u7406\u89E3\u63A8\u8FDB\u5230\u80FD\u6311\u51FA\u6BDB\u75C5\u3002\n\u56DE\u7B54\u65F6\u53EF\u4EE5\u5305\u542B:\u88AB\u5FFD\u7565\u7684\u66FF\u4EE3\u8DEF\u5F84\u3001\u903B\u8F91\u6F0F\u6D1E(\u8C2C\u8BEF/\u8BED\u4E49\u8DF3\u8DC3)\u3001\u6700\u6709\u529B\u7684\u53CD\u65B9\u8BBA\u8BC1(Steel Man)\u3001\u4F5C\u8005\u7565\u8FC7\u7684\u5173\u952E\u95EE\u9898(\u623F\u95F4\u91CC\u7684\u5927\u8C61)\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD,\u4E0D\u8981\u91CD\u590D\u539F\u6587\u5185\u5BB9\u3002"
    },
    {
      id: "scaffold",
      name: "\u6982\u5FF5\u811A\u624B\u67B6",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u8BA4\u77E5\u9605\u8BFB\u6559\u7EC3\u3002\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u66FF\u6211\u603B\u7ED3\u6587\u5B57,\u800C\u662F\u5E2E\u6211\u642D\u5EFA\u7406\u89E3\u5B83\u6240\u9700\u8981\u7684\u811A\u624B\u67B6\u2014\u2014\u8865\u4E0A\u4F5C\u8005\u9ED8\u8BA4\u6211\u5DF2\u7ECF\u77E5\u9053\u3001\u4F46\u6211\u5B9E\u9645\u4E0A\u4E0D\u77E5\u9053\u7684\u90E8\u5206\u3002\u5047\u8BBE\u6211\u5728\u8FD9\u4E2A\u9886\u57DF\u80CC\u666F\u77E5\u8BC6\u4E3A\u96F6,\u9664\u975E\u660E\u663E\u4E0D\u662F\u8FD9\u6837\u3002\n\u56DE\u7B54\u65F6\u53EF\u4EE5\u5305\u542B:\u80CC\u666F\u77E5\u8BC6\u901F\u89C8\u3001\u672F\u8BED\u8868\u3001\u6697\u542B\u63A8\u7406(\u7EBF\u7D22/\u7A7A\u767D/\u7F6E\u4FE1\u5EA6)\u3001\u5BB9\u6613\u8BFB\u9519\u7684\u5730\u65B9\u3001\u7528\u96F6\u672F\u8BED\u7684\u60C5\u5883\u6A21\u578B\u8BB2\u89E3\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "quiz",
      name: "\u81EA\u6D4B\u4E94\u95EE",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u8BFE\u7A0B\u8BBE\u8BA1\u5E08\u548C\u82CF\u683C\u62C9\u5E95\u5F0F\u5F15\u5BFC\u8005\u3002\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u66FF\u6211\u89E3\u91CA\u8BBA\u6587,\u800C\u662F\u63D0\u70BC\u51FA\u80FD\u68C0\u9A8C\u6211\u662F\u5426\u771F\u6B63\u7406\u89E3\u6838\u5FC3\u539F\u7406\u7684\u9AD8\u5C42\u6B21\u95EE\u9898\u2014\u2014\u7528\u6765\u8003\u6211,\u4E0D\u662F\u7528\u6765\u8BB2\u7ED9\u6211\u542C\u3002\n\u88AB\u8981\u6C42\u51FA\u9898\u65F6,\u63D0\u70BC\u6070\u597D5\u4E2A\u9AD8\u5C42\u6B21\u95EE\u9898(\u907F\u514D\u662F\u975E\u9898,\u4F18\u5148\u7528\u5982\u4F55/\u4E3A\u4EC0\u4E48/\u5982\u679C...\u4F1A\u600E\u6837),\u6700\u540E\u52A0\u4E00\u4E2A\u5FC5\u987B\u4E32\u8054\u6240\u6709\u4E3B\u9898\u624D\u80FD\u56DE\u7B54\u7684\u7EFC\u5408\u95EE\u9898\u3002\u5176\u4F59\u65F6\u5019\u6B63\u5E38\u56DE\u7B54\u6211\u7684\u95EE\u9898\u3002\u7528\u4E2D\u6587\u3002"
    }
  ]
};

// src/extraction-quality.ts
var SHORT_PAGE_CHARS = 80;
function ratio(count, total) {
  return total > 0 ? count / total : 0;
}
function assessExtractionQuality(pages) {
  const normalizedPages = Array.isArray(pages) ? pages : [];
  const pageCount = normalizedPages.length;
  const pageTexts = normalizedPages.map((page) => String((page == null ? void 0 : page.text) || "").trim());
  const extractedChars = pageTexts.reduce((sum, text) => sum + text.length, 0);
  const emptyPages = pageTexts.filter((text) => !text).length;
  const shortPages = pageTexts.filter((text) => text.length < SHORT_PAGE_CHARS).length;
  const replacementChars = pageTexts.reduce((sum, text) => {
    var _a, _b;
    const replacementCount = ((_a = text.match(/\uFFFD/g)) == null ? void 0 : _a.length) || 0;
    const controlCount = ((_b = text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g)) == null ? void 0 : _b.length) || 0;
    return sum + replacementCount + controlCount;
  }, 0);
  const emptyPageRatio = ratio(emptyPages, pageCount);
  const shortPageRatio = ratio(shortPages, pageCount);
  const replacementCharRatio = ratio(replacementChars, extractedChars);
  const averageChars = ratio(extractedChars, pageCount);
  let quality = "good";
  if (pageCount === 0 || extractedChars < Math.max(200, pageCount * 40) || emptyPageRatio >= 0.5 || shortPageRatio >= 0.75 || replacementCharRatio >= 0.02) {
    quality = "poor";
  } else if (emptyPageRatio >= 0.2 || shortPageRatio >= 0.4 || replacementCharRatio >= 5e-3 || averageChars < 300) {
    quality = "mixed";
  }
  return {
    pageCount,
    extractedChars,
    emptyPageRatio,
    replacementCharRatio,
    shortPageRatio,
    quality
  };
}

// src/paper-context.ts
function getActivePdfFile(app) {
  const leaf = app.workspace.activeLeaf;
  const view = leaf && leaf.view;
  if (view && typeof view.getViewType === "function" && view.getViewType() === "pdf" && "file" in view) {
    return view.file || null;
  }
  return null;
}
async function extractPdfPages(app, file) {
  const pdfjsLib = window.pdfjsLib;
  if (!(pdfjsLib == null ? void 0 : pdfjsLib.getDocument)) {
    throw new Error("\u5F53\u524D Obsidian \u7248\u672C\u6CA1\u6709\u66B4\u9732 pdfjsLib,\u65E0\u6CD5\u63D0\u53D6\u5168\u6587");
  }
  const buffer = await app.vault.readBinary(file);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str || "").join(" ");
    pages.push({ page: pageNumber, text: pageText });
  }
  return pages;
}
async function extractPdfFullText(app, file) {
  const pages = await extractPdfPages(app, file);
  return pages.map((page) => `[\u7B2C${page.page}\u9875]
${page.text}`).join("\n\n").trim();
}
function chunkPdfPages(pages, chunkSize, overlap) {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError("chunkSize must be a positive integer");
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError("overlap must be an integer between 0 and chunkSize - 1");
  }
  const chunks = [];
  for (const page of pages) {
    const text = (page.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (text.length <= chunkSize) {
      chunks.push({ page: page.page, text });
      continue;
    }
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push({ page: page.page, text: text.slice(start, end) });
      if (end >= text.length) break;
      const nextStart = end - overlap;
      if (nextStart <= start) throw new RangeError("chunk settings must advance the cursor");
      start = nextStart;
    }
  }
  chunks.forEach((chunk, index) => chunk.idx = index);
  return chunks;
}
function expandWithNeighbors(allChunks, retrieved) {
  if (!(retrieved == null ? void 0 : retrieved.length)) return retrieved;
  const wanted = /* @__PURE__ */ new Set();
  retrieved.forEach((chunk) => {
    if (typeof chunk.idx !== "number") return;
    wanted.add(chunk.idx - 1);
    wanted.add(chunk.idx);
    wanted.add(chunk.idx + 1);
  });
  return allChunks.filter((chunk) => typeof chunk.idx === "number" && wanted.has(chunk.idx)).sort((left, right) => (left.idx || 0) - (right.idx || 0));
}
function tokenizeForBM25(text) {
  const lower = (text || "").toLowerCase();
  const tokens = [];
  const wordPattern = /[a-z0-9]+/g;
  let match;
  while (match = wordPattern.exec(lower)) tokens.push(match[0]);
  const cjk = lower.match(/[\u4e00-\u9fff]/g) || [];
  for (let index = 0; index < cjk.length; index++) {
    tokens.push(cjk[index]);
    if (index + 1 < cjk.length) tokens.push(cjk[index] + cjk[index + 1]);
  }
  return tokens;
}
function bm25Retrieve(chunks, query, topK) {
  if (!(chunks == null ? void 0 : chunks.length)) return [];
  const documentTokens = chunks.map((chunk) => tokenizeForBM25(chunk.text));
  const documentFrequency = /* @__PURE__ */ new Map();
  documentTokens.forEach((tokens) => {
    new Set(tokens).forEach(
      (token) => documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1)
    );
  });
  const documentCount = documentTokens.length;
  const averageLength = documentTokens.reduce((total, tokens) => total + tokens.length, 0) / (documentCount || 1) || 1;
  const k1 = 1.5;
  const b = 0.75;
  const queryTokens = Array.from(new Set(tokenizeForBM25(query)));
  const scored = chunks.map((chunk, index) => {
    const tokens = documentTokens[index];
    const documentLength = tokens.length || 1;
    const termFrequency = /* @__PURE__ */ new Map();
    tokens.forEach((token) => termFrequency.set(token, (termFrequency.get(token) || 0) + 1));
    let score = 0;
    for (const queryToken of queryTokens) {
      const frequency = termFrequency.get(queryToken) || 0;
      if (!frequency) continue;
      const containingDocuments = documentFrequency.get(queryToken) || 0;
      const inverseFrequency = Math.log(
        1 + (documentCount - containingDocuments + 0.5) / (containingDocuments + 0.5)
      );
      const denominator = frequency + k1 * (1 - b + b * documentLength / averageLength);
      score += inverseFrequency * (frequency * (k1 + 1) / denominator);
    }
    return { chunk, score };
  });
  return scored.sort((left, right) => right.score - left.score).filter((entry) => entry.score > 0).slice(0, topK).map((entry) => entry.chunk);
}
function bm25RetrieveMulti(chunks, queries, topK) {
  const uniqueQueries = Array.from(new Set((queries || []).filter(Boolean)));
  if (!uniqueQueries.length) return [];
  const keyOf = (chunk) => chunk.page + "::" + chunk.text.slice(0, 60);
  const fused = /* @__PURE__ */ new Map();
  for (const query of uniqueQueries) {
    const ranked = bm25Retrieve(chunks, query, Math.max(topK * 2, 8));
    ranked.forEach((chunk, rank) => {
      const key = keyOf(chunk);
      const entry = fused.get(key) || { chunk, score: 0 };
      entry.score += 1 / (rank + 1);
      fused.set(key, entry);
    });
  }
  return Array.from(fused.values()).sort((left, right) => right.score - left.score).slice(0, topK).map((entry) => entry.chunk);
}
var PaperContextService = class {
  constructor(app, getSettings, persistSettings, transport, getModelProfile) {
    this.app = app;
    this.getSettings = getSettings;
    this.persistSettings = persistSettings;
    this.transport = transport;
    this.getModelProfile = getModelProfile;
  }
  createContext(file, selectedText, conversationKey) {
    return { app: this.app, file, selectedText, conversationKey };
  }
  extractPages(file) {
    return extractPdfPages(this.app, file);
  }
  extractFullText(file) {
    return extractPdfFullText(this.app, file);
  }
  async generateDocSummary(file) {
    const settings = this.getSettings();
    const pages = await this.extractPages(file);
    const extractionQuality = assessExtractionQuality(pages);
    const fullText = pages.map((page) => `[\u7B2C${page.page}\u9875]
${page.text}`).join("\n\n").trim();
    let textForSummary = fullText;
    let truncated = false;
    const maxChars = settings.summaryMaxChars || DEFAULT_SETTINGS.summaryMaxChars;
    if (textForSummary.length > maxChars) {
      textForSummary = textForSummary.slice(0, maxChars);
      truncated = true;
    }
    const profile = this.getModelProfile(settings.summaryModelId) || this.getModelProfile(settings.activeModelId);
    const systemPrompt = settings.summaryPrompt + (truncated ? "\n\n(\u6CE8\u610F:\u539F\u6587\u8FC7\u957F,\u4EE5\u4E0B\u53EA\u662F\u622A\u65AD\u540E\u7684\u524D\u9762\u90E8\u5206)" : "");
    const summary = await this.transport.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textForSummary || "(\u672A\u80FD\u63D0\u53D6\u5230\u6587\u672C\u5185\u5BB9)" }
      ],
      modelProfile: profile,
      maxTokensOverride: settings.summaryMaxTokens || DEFAULT_SETTINGS.summaryMaxTokens,
      stream: false
    });
    return { summary, fullLength: fullText.length, truncated, extractionQuality };
  }
  async getOrCreateDocSummary(file, forceRefresh) {
    const settings = this.getSettings();
    const mtime = file.stat && file.stat.mtime;
    const cached = settings.docSummaries[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) return cached;
    const { summary, fullLength, truncated, extractionQuality } = await this.generateDocSummary(file);
    const entry = { mtime, summary, generatedAt: Date.now(), fullLength, truncated, extractionQuality };
    settings.docSummaries[file.path] = entry;
    await this.persistSettings();
    return entry;
  }
  async generateDocChunks(file) {
    const settings = this.getSettings();
    const pages = await extractPdfPages(this.app, file);
    const chunks = chunkPdfPages(
      pages,
      settings.ragChunkSize,
      settings.ragChunkOverlap
    );
    const fullTextLength = pages.reduce((total, page) => total + (page.text ? page.text.length : 0), 0);
    return { chunks, fullTextLength, extractionQuality: assessExtractionQuality(pages) };
  }
  async planRagQueries(question) {
    const settings = this.getSettings();
    const profile = this.getModelProfile(settings.summaryModelId) || this.getModelProfile(settings.activeModelId);
    const raw = await this.transport.chat({
      messages: [
        { role: "system", content: settings.ragQueryPrompt },
        { role: "user", content: question }
      ],
      modelProfile: profile,
      maxTokensOverride: 300,
      stream: false
    });
    return (raw || "").split(/\r?\n/).map((line) => line.replace(/^[\s\-*•\d.、)]+/, "").trim()).filter(Boolean);
  }
  async getOrCreateDocChunks(file, forceRefresh) {
    var _a;
    const settings = this.getSettings();
    const mtime = file.stat && file.stat.mtime;
    const cached = settings.docChunks[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) {
      if (((_a = cached.chunks) == null ? void 0 : _a.length) && typeof cached.chunks[0].idx !== "number") {
        cached.chunks.forEach((chunk, index) => chunk.idx = index);
      }
      return cached;
    }
    const { chunks, fullTextLength, extractionQuality } = await this.generateDocChunks(file);
    const entry = { mtime, chunks, fullTextLength, generatedAt: Date.now(), extractionQuality };
    settings.docChunks[file.path] = entry;
    await this.persistSettings();
    return entry;
  }
  retrieveContext(chunks, queries, topK) {
    return expandWithNeighbors(chunks, bm25RetrieveMulti(chunks, queries, topK));
  }
};

// src/translation.ts
var FAILED_CHUNK_PREFIX = "[\u7FFB\u8BD1\u5931\u8D25\uFF0C\u4FDD\u7559\u539F\u6587]";
var GENERIC_TRANSLATION_FAILURE = "Translation failed for every chunk.";
function isWhitespace(value) {
  return /^\s$/u.test(value);
}
function sentenceBoundary(points, start, hardEnd) {
  const punctuation = /* @__PURE__ */ new Set([".", "!", "?", "\u3002", "\uFF01", "\uFF1F"]);
  const closers = /* @__PURE__ */ new Set(['"', "'", "\u201D", "\u2019", "\uFF09", "]"]);
  let boundary = -1;
  for (let index = start; index < hardEnd; index += 1) {
    if (!punctuation.has(points[index])) continue;
    let after = index + 1;
    while (after < hardEnd && closers.has(points[after])) after += 1;
    if (after >= hardEnd || !isWhitespace(points[after])) continue;
    while (after < hardEnd && isWhitespace(points[after])) after += 1;
    boundary = after;
  }
  return boundary;
}
function preferredBoundary(points, start, hardEnd) {
  for (let index = hardEnd - 2; index >= start; index -= 1) {
    if (points[index] === "\n" && points[index + 1] === "\n") return index + 2;
  }
  for (let index = hardEnd - 1; index >= start; index -= 1) {
    if (points[index] === "\n") return index + 1;
  }
  const sentence = sentenceBoundary(points, start, hardEnd);
  if (sentence > start) return sentence;
  for (let index = hardEnd - 1; index >= start; index -= 1) {
    if (isWhitespace(points[index])) return index + 1;
  }
  return hardEnd;
}
function splitTranslationChunks(source, limit) {
  if (!source) return [];
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError("Translation chunk limit must be a positive integer");
  }
  const points = Array.from(source);
  if (points.length <= limit) return [source];
  const chunks = [];
  let start = 0;
  while (start < points.length) {
    const hardEnd = Math.min(start + limit, points.length);
    const end = hardEnd === points.length ? hardEnd : preferredBoundary(points, start, hardEnd);
    chunks.push(points.slice(start, end).join(""));
    start = end;
  }
  return chunks;
}
function buildTranslationMessages(source, settings) {
  const system = `You are an expert academic translator. Produce a faithful academic translation into ${settings.targetLanguage}. Preserve paragraph boundaries and paragraph order. Preserve formulas, code, variables, citations, and figure and table numbers exactly. Output only the translated text.`;
  const additional = settings.additionalInstruction ? `Additional instruction:
${settings.additionalInstruction}

` : "";
  return [
    { role: "system", content: system },
    {
      role: "user",
      content: `${additional}<source_text>
${source}
</source_text>`
    }
  ];
}
function combineTranslations(translations) {
  return translations.filter((translation) => translation.trim().length > 0).join("\n\n");
}
function stoppedResult(chunks, completed, failedChunkIndexes) {
  return {
    text: combineTranslations(completed),
    chunkCount: chunks.length,
    stoppedEarly: true,
    failedChunkIndexes: [...failedChunkIndexes]
  };
}
function emitProgress(request, chunkIndex, chunkCount, chunkText, completed) {
  var _a;
  const progress = {
    chunkIndex: chunkIndex + 1,
    chunkCount,
    chunkText,
    combinedText: combineTranslations(completed)
  };
  (_a = request.onChunk) == null ? void 0 : _a.call(request, progress);
}
var TranslationService = class {
  constructor(llm) {
    this.llm = llm;
  }
  async translate(request) {
    var _a, _b, _c, _d, _e;
    const chunks = splitTranslationChunks(request.source, request.settings.chunkChars);
    if (!chunks.length) {
      return {
        text: "",
        chunkCount: 0,
        stoppedEarly: false,
        failedChunkIndexes: []
      };
    }
    const completed = [];
    const failedChunkIndexes = [];
    const requestOnce = async (chunk) => {
      return this.llm.chat({
        messages: buildTranslationMessages(chunk, request.settings),
        modelProfile: request.modelProfile,
        signal: request.signal,
        stream: true,
        temperatureOverride: request.settings.temperature,
        maxTokensOverride: request.settings.maxTokens
      });
    };
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      if ((_a = request.signal) == null ? void 0 : _a.aborted) {
        return stoppedResult(chunks, completed, failedChunkIndexes);
      }
      const chunk = chunks[chunkIndex];
      let translated = "";
      let failed = false;
      try {
        translated = (await requestOnce(chunk)).trim();
        if ((_b = request.signal) == null ? void 0 : _b.aborted) {
          return stoppedResult(chunks, completed, failedChunkIndexes);
        }
        if (!translated) {
          if ((_c = request.signal) == null ? void 0 : _c.aborted) {
            return stoppedResult(chunks, completed, failedChunkIndexes);
          }
          translated = (await requestOnce(chunk)).trim();
          if ((_d = request.signal) == null ? void 0 : _d.aborted) {
            return stoppedResult(chunks, completed, failedChunkIndexes);
          }
          failed = !translated;
        }
      } catch (e) {
        if ((_e = request.signal) == null ? void 0 : _e.aborted) {
          return stoppedResult(chunks, completed, failedChunkIndexes);
        }
        failed = true;
      }
      const output = failed ? `${FAILED_CHUNK_PREFIX}
${chunk}` : translated;
      if (failed) failedChunkIndexes.push(chunkIndex);
      completed.push(output);
      emitProgress(request, chunkIndex, chunks.length, output, completed);
    }
    if (failedChunkIndexes.length === chunks.length) {
      throw new Error(GENERIC_TRANSLATION_FAILURE);
    }
    return {
      text: combineTranslations(completed),
      chunkCount: chunks.length,
      stoppedEarly: false,
      failedChunkIndexes
    };
  }
};

// src/modal-services.ts
function createPDFChatModalServices(plugin, overrides = {}) {
  const llm = {
    chat: (request) => {
      if (plugin.llmTransport) return plugin.llmTransport.chat(request);
      return plugin.chat(
        request.messages,
        request.onChunk,
        request.signal,
        request.modelProfile,
        {
          stream: request.stream,
          maxTokensOverride: request.maxTokensOverride,
          temperatureOverride: request.temperatureOverride
        }
      );
    }
  };
  const compatibility = {
    conversations: {
      getKey: (file, selectedText, kind) => plugin.getConversationKey(file, selectedText, kind),
      get: (key) => plugin.getConversation(key),
      save: (key, messages) => plugin.saveConversation(key, messages),
      clear: (key) => plugin.clearConversation(key)
    },
    papers: {
      getOrCreateDocSummary: (file, forceRefresh) => plugin.getOrCreateDocSummary(file, forceRefresh),
      getOrCreateDocChunks: (file, forceRefresh) => plugin.getOrCreateDocChunks(file, forceRefresh),
      extractPages: (file) => plugin.paperContextService ? plugin.paperContextService.extractPages(file) : extractPdfPages(plugin.app || {}, file),
      extractFullText: (file) => plugin.paperContextService ? plugin.paperContextService.extractFullText(file) : extractPdfFullText(plugin.app || {}, file),
      planRagQueries: (question) => plugin.planRagQueries(question),
      retrieveContext: (chunks, queries, topK) => expandWithNeighbors(chunks, bm25RetrieveMulti(chunks, queries, topK))
    },
    llm,
    models: {
      get: (id) => plugin.getModelProfile(id),
      resolveTranslateId: () => plugin.resolveTranslateModelId(),
      resolveContinueId: () => plugin.resolveContinueModelId()
    },
    actions: plugin.actionRegistry || createResearchActionRegistry(),
    translations: plugin.translationService || new TranslationService(llm),
    codex: plugin.codexSessionManager,
    artifacts: plugin.researchArtifacts
  };
  return {
    ...compatibility,
    ...overrides,
    conversations: { ...compatibility.conversations, ...overrides.conversations || {} },
    papers: { ...compatibility.papers, ...overrides.papers || {} },
    llm: { ...compatibility.llm, ...overrides.llm || {} },
    models: { ...compatibility.models, ...overrides.models || {} },
    actions: overrides.actions || compatibility.actions,
    translations: {
      translate: (request) => {
        var _a;
        return ((_a = overrides.translations) == null ? void 0 : _a.translate) ? overrides.translations.translate(request) : compatibility.translations.translate(request);
      }
    },
    codex: overrides.codex || compatibility.codex,
    artifacts: overrides.artifacts || compatibility.artifacts
  };
}

// src/pdf-chat-modal.ts
var import_obsidian6 = require("obsidian");

// src/context-composer.ts
var MEMORY_PREFIX = "\u3010\u8F83\u65E9\u5BF9\u8BDD\u6458\u8981\u3011\n";
var TRUNCATION_MARKER = "\n\n[\u5185\u5BB9\u56E0\u4E0A\u4E0B\u6587\u9884\u7B97\u5DF2\u622A\u65AD]";
function buildEvidenceCitationInstructions(sources) {
  const normalized = (Array.isArray(sources) ? sources : []).filter(
    (source) => {
      var _a, _b;
      return ((_a = source == null ? void 0 : source.alias) == null ? void 0 : _a.trim()) && ((_b = source == null ? void 0 : source.paperPath) == null ? void 0 : _b.trim());
    }
  );
  if (!normalized.length) return "";
  return [
    "\u8BBA\u6587\u8BC1\u636E\u6765\u6E90\u522B\u540D\uFF1A",
    ...normalized.map(
      (source) => `- [${source.alias.trim()}] ${source.name || source.paperPath}\uFF1A${source.paperPath}`
    ),
    "\u56DE\u7B54\u4E2D\u5F15\u7528\u53EF\u786E\u8BA4\u7684\u8BBA\u6587\u8BC1\u636E\u65F6\uFF0C\u8BF7\u4F7F\u7528 [P1, p.N] \u8FD9\u79CD\u683C\u5F0F\uFF08P1 \u66FF\u6362\u4E3A\u5BF9\u5E94\u522B\u540D\uFF0CN \u66FF\u6362\u4E3A PDF \u9875\u7801\uFF09\u3002\u65E0\u6CD5\u786E\u8BA4\u9875\u7801\u65F6\u8BF7\u660E\u786E\u8BF4\u660E\uFF0C\u4E0D\u8981\u7F16\u9020\u9875\u7801\u3002"
  ].join("\n");
}
function normalizeLimit(value, fallback) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
function truncatePrefix(value, limit) {
  if (limit <= 0) return "";
  if (value.length <= limit) return value;
  if (limit <= TRUNCATION_MARKER.length) return value.slice(0, limit);
  return value.slice(0, limit - TRUNCATION_MARKER.length).trimEnd() + TRUNCATION_MARKER;
}
function buildMandatoryMessages(system, currentContext, currentUser, maxInputChars) {
  const delimiter = currentContext ? "\n\n" : "";
  const fullCurrent = `${currentContext}${delimiter}${currentUser}`;
  if (system.length + fullCurrent.length <= maxInputChars) {
    return {
      system: { role: "system", content: system },
      current: { role: "user", content: fullCurrent },
      truncated: false
    };
  }
  const systemBudget = Math.min(system.length, Math.max(0, Math.floor(maxInputChars * 0.4)));
  const fittedSystem = truncatePrefix(system, systemBudget);
  const currentBudget = Math.max(0, maxInputChars - fittedSystem.length);
  let fittedCurrent = "";
  if (currentUser.length >= currentBudget) {
    fittedCurrent = truncatePrefix(currentUser, currentBudget);
  } else if (currentContext) {
    const contextBudget = Math.max(0, currentBudget - currentUser.length - delimiter.length);
    const fittedContext = truncatePrefix(currentContext, contextBudget);
    fittedCurrent = fittedContext ? `${fittedContext}${delimiter}${currentUser}` : currentUser;
  } else {
    fittedCurrent = currentUser;
  }
  return {
    system: { role: "system", content: fittedSystem },
    current: { role: "user", content: fittedCurrent },
    truncated: true
  };
}
function groupTranscriptTurns(transcript) {
  const turns = [];
  let current = null;
  transcript.forEach((candidate, index) => {
    if (!candidate || candidate.role !== "user" && candidate.role !== "assistant") return;
    if (typeof candidate.content !== "string" || !candidate.content) return;
    const message = { role: candidate.role, content: candidate.content };
    if (candidate.role === "user") {
      if (current) turns.push(current);
      current = { start: index, messages: [message], chars: message.content.length };
      return;
    }
    if (!current) {
      turns.push({ start: index, messages: [message], chars: message.content.length });
      return;
    }
    current.messages.push(message);
    current.chars += message.content.length;
  });
  if (current) turns.push(current);
  return turns;
}
function composeBoundedContext(request) {
  const maxInputChars = normalizeLimit(request.maxInputChars, 6e4);
  const minRecentTurns = normalizeLimit(request.minRecentTurns, 6);
  const system = typeof request.system === "string" ? request.system : "";
  const currentUser = typeof request.currentUser === "string" ? request.currentUser : "";
  const currentContext = typeof request.currentContext === "string" ? request.currentContext : "";
  const mandatory = buildMandatoryMessages(system, currentContext, currentUser, maxInputChars);
  let remaining = Math.max(
    0,
    maxInputChars - mandatory.system.content.length - mandatory.current.content.length
  );
  const transcript = Array.isArray(request.transcript) ? request.transcript : [];
  const turns = groupTranscriptTurns(transcript);
  const included = [];
  let nextTurnIndex = turns.length - 1;
  while (nextTurnIndex >= 0 && included.length < minRecentTurns) {
    const turn = turns[nextTurnIndex];
    if (turn.chars > remaining) break;
    included.unshift(turn);
    remaining -= turn.chars;
    nextTurnIndex -= 1;
  }
  const memory = typeof request.memory === "string" ? request.memory.trim() : "";
  const memoryContent = memory ? `${MEMORY_PREFIX}${memory}` : "";
  const includeMemory = !!memoryContent && memoryContent.length <= remaining;
  if (!includeMemory) {
    while (nextTurnIndex >= 0) {
      const turn = turns[nextTurnIndex];
      if (turn.chars > remaining) break;
      included.unshift(turn);
      remaining -= turn.chars;
      nextTurnIndex -= 1;
    }
  }
  const includedTranscriptStart = included.length ? included[0].start : transcript.length;
  const messages = [mandatory.system];
  if (includeMemory) messages.push({ role: "system", content: memoryContent });
  for (const turn of included) messages.push(...turn.messages);
  messages.push(mandatory.current);
  return {
    messages,
    omittedMessageCount: includedTranscriptStart,
    includedTranscriptStart,
    currentInputTruncated: mandatory.truncated
  };
}
async function summarizeSessionMemory(request) {
  const visibleMessages = request.transcript.slice(0, Math.max(0, request.coveredMessageCount)).filter((message) => message.role === "user" || message.role === "assistant").map((message) => `${message.role === "user" ? "\u7528\u6237" : "\u52A9\u624B"}: ${message.content}`).join("\n\n");
  if (!visibleMessages.trim()) throw new Error("No visible conversation turns to summarize");
  const content = await request.llm.chat({
    messages: [
      {
        role: "system",
        content: "\u8BF7\u628A\u8F83\u65E9\u7684\u8BBA\u6587\u9605\u8BFB\u5BF9\u8BDD\u538B\u7F29\u6210\u7B80\u6D01\u3001\u5FE0\u5B9E\u7684\u4F1A\u8BDD\u8BB0\u5FC6\u3002\u4FDD\u7559\u7528\u6237\u76EE\u6807\u3001\u5DF2\u786E\u8BA4\u7ED3\u8BBA\u3001\u5173\u952E\u672F\u8BED\u3001\u672A\u89E3\u51B3\u95EE\u9898\u548C\u5FC5\u8981\u8BC1\u636E\uFF1B\u4E0D\u8981\u8865\u9020\u4FE1\u606F\uFF0C\u4E0D\u8981\u8F93\u51FA\u6807\u9898\u6216\u8BF4\u660E\u3002"
      },
      { role: "user", content: visibleMessages }
    ],
    modelProfile: request.modelProfile,
    signal: request.signal,
    stream: false,
    temperatureOverride: 0.1,
    maxTokensOverride: 1200
  });
  const normalized = content.trim();
  if (!normalized) throw new Error("Conversation memory summarization returned empty output");
  return {
    content: normalized,
    coveredMessageCount: Math.max(0, Math.min(request.coveredMessageCount, request.transcript.length)),
    updatedAt: (request.now || Date.now)()
  };
}

// src/session-library.ts
function normalizeTags2(tags) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const candidate of Array.isArray(tags) ? tags : []) {
    if (typeof candidate !== "string") continue;
    const tag = candidate.trim().replace(/^#+/, "").toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag.slice(0, 60));
  }
  return result.slice(0, 20);
}
function searchableText(session) {
  return [
    session.title,
    session.conversationKey,
    ...session.tags || [],
    ...session.referencedPdfPaths || [],
    ...(session.messages || []).map((message) => message.content)
  ].join(" ").toLowerCase();
}
function primaryPdfPath(session) {
  return session.conversationKey.startsWith("pdf:") ? session.conversationKey.slice("pdf:".length) : void 0;
}
function selectForkHandoff(session, maxChars) {
  var _a, _b;
  const limit = Math.max(0, Math.floor(maxChars || 0));
  const originalMemory = ((_a = session.memory) == null ? void 0 : _a.content) || "";
  const memoryContent = originalMemory.slice(0, limit);
  const memory = session.memory ? { ...session.memory, content: memoryContent } : void 0;
  let remaining = Math.max(0, limit - memoryContent.length);
  const messages = [];
  for (let index = session.messages.length - 1; index >= 0; index -= 1) {
    const message = session.messages[index];
    if (message.content.length > remaining) break;
    messages.unshift({
      ...message,
      evidence: (_b = message.evidence) == null ? void 0 : _b.map((evidence) => ({ ...evidence }))
    });
    remaining -= message.content.length;
  }
  return { memory, messages, chars: limit - remaining };
}
function formatCodexForkHandoff(session) {
  var _a;
  const parts = [];
  if ((_a = session.memory) == null ? void 0 : _a.content.trim()) {
    parts.push(`Earlier session memory:
${session.memory.content.trim()}`);
  }
  if (session.messages.length) {
    const visibleTurns = session.messages.map((message) => `${message.role === "user" ? "User" : "Assistant"}:
${message.content}`).join("\n\n");
    parts.push(`Recent visible turns from the parent session:
${visibleTurns}`);
  }
  if (!parts.length) return "";
  return [
    "This is an explicit local fork of a Codex session whose native thread is unavailable here.",
    "Use the bounded visible handoff below only as prior discussion context; do not claim access to the old native thread.",
    ...parts
  ].join("\n\n");
}
var SessionLibraryService = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  query(query) {
    var _a, _b;
    const needle = (query.text || "").trim().toLowerCase();
    const sessions = ((_b = (_a = this.dependencies.conversations).listSessions) == null ? void 0 : _b.call(_a, "")) || [];
    return sessions.filter((session) => {
      if (query.scope === "current" && query.currentConversationKey && session.conversationKey !== query.currentConversationKey) {
        return false;
      }
      if (query.mode !== "all" && session.mode !== query.mode) return false;
      const archived = Boolean(session.archivedAt);
      if (query.archived === "active" && archived) return false;
      if (query.archived === "archived" && !archived) return false;
      if (query.updatedAfter && session.updatedAt < query.updatedAfter) return false;
      return !needle || searchableText(session).includes(needle);
    }).sort(
      (left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt - left.updatedAt || left.id.localeCompare(right.id)
    );
  }
  async rename(id, title) {
    const normalized = (title || "").replace(/\s+/g, " ").trim();
    if (!normalized) throw new Error("\u4F1A\u8BDD\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");
    if (normalized.length > 120) throw new Error("\u4F1A\u8BDD\u6807\u9898\u4E0D\u80FD\u8D85\u8FC7 120 \u4E2A\u5B57\u7B26");
    await this.update(id, { title: normalized });
  }
  async setTags(id, tags) {
    await this.update(id, { tags: normalizeTags2(tags) });
  }
  async setPinned(id, pinned) {
    await this.update(id, { pinned });
  }
  async archive(id) {
    this.assertNotRunning(id, "\u5F52\u6863");
    if (!this.dependencies.conversations.archiveSession) {
      throw new Error("\u5F53\u524D\u5B58\u50A8\u4E0D\u652F\u6301\u5F52\u6863\u4F1A\u8BDD");
    }
    await this.dependencies.conversations.archiveSession(id);
  }
  reactivate(id) {
    var _a, _b;
    const session = (_b = (_a = this.dependencies.conversations).resumeSession) == null ? void 0 : _b.call(_a, id);
    if (!session) throw new Error("\u6CA1\u6709\u627E\u5230\u8981\u6062\u590D\u7684\u4F1A\u8BDD");
    return session;
  }
  async export(id, targetPath) {
    const session = this.requireSession(id);
    if (!this.dependencies.artifacts) throw new Error("\u4F1A\u8BDD\u5BFC\u51FA\u670D\u52A1\u4E0D\u53EF\u7528");
    return this.dependencies.artifacts.exportSessionMarkdown(session, targetPath);
  }
  async rebind(id, newPath) {
    if (!this.dependencies.conversations.rebindSessionSource) {
      throw new Error("\u5F53\u524D\u5B58\u50A8\u4E0D\u652F\u6301\u91CD\u65B0\u7ED1\u5B9A PDF");
    }
    await this.dependencies.conversations.rebindSessionSource(id, newPath);
  }
  getCodexRecovery(session) {
    var _a, _b, _c, _d, _e;
    const liveReason = (_b = (_a = this.dependencies.codex) == null ? void 0 : _a.getSnapshot(session.id)) == null ? void 0 : _b.recoveryReason;
    if (liveReason) return { reason: liveReason, canResumeNativeThread: false };
    const localInstallationId = ((_d = (_c = this.dependencies).installationId) == null ? void 0 : _d.call(_c)) || "";
    const foreign = Boolean(
      ((_e = session.codex) == null ? void 0 : _e.threadId) && session.installationId && localInstallationId && session.installationId !== localInstallationId
    );
    return foreign ? { reason: "foreign-installation", canResumeNativeThread: false } : { canResumeNativeThread: true };
  }
  previewCodexFork(id, request) {
    const session = this.requireSession(id);
    const available = new Set(request.availablePdfPaths.filter(Boolean));
    const currentPath = primaryPdfPath(session);
    const candidates = [
      ...session.includeCurrentPdfInCodex && currentPath ? [currentPath] : [],
      ...session.referencedPdfPaths || []
    ].filter((path, index, all) => all.indexOf(path) === index);
    const handoff = selectForkHandoff(session, request.handoffMaxChars);
    return {
      attachedPdfPaths: candidates.filter((path) => available.has(path)),
      omittedPdfPaths: candidates.filter((path) => !available.has(path)),
      handoffChars: handoff.chars,
      messageCount: handoff.messages.length
    };
  }
  async createCodexFork(id, request) {
    var _a, _b, _c, _d, _e, _f, _g;
    const parent = this.requireSession(id);
    if (!this.dependencies.conversations.startSession || !this.dependencies.conversations.saveSessionById) {
      throw new Error("\u5F53\u524D\u5B58\u50A8\u4E0D\u652F\u6301\u521B\u5EFA Codex \u672C\u5730\u5206\u652F");
    }
    const installationId = ((_b = (_a = this.dependencies).installationId) == null ? void 0 : _b.call(_a).trim()) || "";
    if (!installationId) throw new Error("\u7F3A\u5C11\u672C\u673A\u5B89\u88C5\u6807\u8BC6\uFF0C\u65E0\u6CD5\u5B89\u5168\u521B\u5EFA Codex \u5206\u652F");
    const available = new Set(request.availablePdfPaths.filter(Boolean));
    const currentPath = primaryPdfPath(parent);
    const handoff = selectForkHandoff(parent, request.handoffMaxChars);
    const referencedPdfPaths = (parent.referencedPdfPaths || []).filter((path) => available.has(path));
    const metadata = {
      title: `Fork: ${parent.title}`.slice(0, 120),
      mode: "codex",
      referencedPdfPaths,
      includeCurrentPdfInCodex: Boolean(
        parent.includeCurrentPdfInCodex && currentPath && available.has(currentPath)
      ),
      codex: {
        model: ((_c = parent.codex) == null ? void 0 : _c.model) || "",
        reasoningEffort: ((_d = parent.codex) == null ? void 0 : _d.reasoningEffort) || "medium",
        profile: ((_e = parent.codex) == null ? void 0 : _e.profile) || "",
        lifecycle: "active"
      },
      memory: handoff.memory,
      sourceStatus: parent.sourceStatus,
      parentSessionId: parent.id,
      installationId
    };
    const child = this.dependencies.conversations.startSession(parent.conversationKey, metadata);
    const messages = handoff.messages.map((message, index) => {
      var _a2;
      return {
        ...message,
        id: `${child.id}-fork-${index + 1}`,
        evidence: (_a2 = message.evidence) == null ? void 0 : _a2.map((evidence) => ({ ...evidence }))
      };
    });
    await this.dependencies.conversations.saveSessionById(child.id, messages, metadata);
    return ((_g = (_f = this.dependencies.conversations).getSession) == null ? void 0 : _g.call(_f, child.id)) || { ...child, messages };
  }
  async delete(id) {
    var _a, _b, _c;
    const session = this.requireSession(id);
    this.assertNotRunning(id, "\u5220\u9664");
    const confirmed = await ((_c = (_b = (_a = this.dependencies).confirmDelete) == null ? void 0 : _b.call(_a, session)) != null ? _c : false);
    if (!confirmed) return false;
    if (!this.dependencies.conversations.clearSession) {
      throw new Error("\u5F53\u524D\u5B58\u50A8\u4E0D\u652F\u6301\u5220\u9664\u4F1A\u8BDD");
    }
    await this.dependencies.conversations.clearSession(id);
    return true;
  }
  requireSession(id) {
    var _a, _b;
    const session = (_b = (_a = this.dependencies.conversations).getSession) == null ? void 0 : _b.call(_a, id);
    if (!session) throw new Error(`\u6CA1\u6709\u627E\u5230\u4F1A\u8BDD\uFF1A${id}`);
    return session;
  }
  async update(id, patch) {
    this.requireSession(id);
    if (!this.dependencies.conversations.updateSessionMetadata) {
      throw new Error("\u5F53\u524D\u5B58\u50A8\u4E0D\u652F\u6301\u66F4\u65B0\u4F1A\u8BDD");
    }
    await this.dependencies.conversations.updateSessionMetadata(id, patch);
  }
  assertNotRunning(id, action) {
    var _a, _b;
    const session = this.requireSession(id);
    const live = (_a = this.dependencies.codex) == null ? void 0 : _a.getSnapshot(id);
    if ((live == null ? void 0 : live.status) === "running" || ((_b = session.pendingTurn) == null ? void 0 : _b.status) === "running") {
      throw new Error(`Codex \u4F1A\u8BDD\u6B63\u5728\u8FD0\u884C\uFF0C\u4E0D\u80FD${action}`);
    }
  }
};

// src/session-library-modal.ts
var import_obsidian4 = require("obsidian");

// src/modal-ui.ts
var controlId = 0;
function nextControlId(prefix) {
  controlId += 1;
  return `pdf-chat-${prefix}-${controlId}`;
}
function setElementLabel(element, label) {
  const compatibleElement = element;
  if (typeof compatibleElement.setAttr === "function") {
    compatibleElement.setAttr("aria-label", label);
  } else if (typeof compatibleElement.setAttribute === "function") {
    compatibleElement.setAttribute("aria-label", label);
  }
}
var labelControl = setElementLabel;
function buildWorkbenchHeader(parent, options) {
  const root = parent.createEl("header", { cls: "pdf-chat-workbench-header" });
  const identity = root.createDiv({ cls: "pdf-chat-identity" });
  identity.createEl("h2", { text: "PDF Chat" });
  identity.createEl("span", {
    text: options.filename,
    cls: "pdf-chat-document-name"
  });
  const modeBadge = identity.createEl("span", {
    text: "API MODE",
    cls: "pdf-chat-mode-badge",
    attr: { role: "status", "aria-live": "polite" }
  });
  const primaryControls = root.createDiv({ cls: "pdf-chat-header-primary-controls pdf-chat-interactive" });
  const secondaryControls = root.createDiv({ cls: "pdf-chat-header-secondary-controls pdf-chat-interactive" });
  const modelGroup = primaryControls.createDiv({ cls: "pdf-chat-control-group" });
  const modelId = nextControlId("model");
  modelGroup.createEl("label", { text: "\u6A21\u578B", attr: { for: modelId } });
  const modelSelect = modelGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modelId, "aria-label": "\u9009\u62E9\u804A\u5929\u6A21\u578B" }
  });
  for (const model of options.models) {
    modelSelect.createEl("option", { text: model.name, value: model.id });
  }
  modelSelect.value = options.currentModelId;
  const modeGroup = primaryControls.createDiv({ cls: "pdf-chat-control-group" });
  const modeId = nextControlId("mode");
  modeGroup.createEl("label", { text: "\u9605\u8BFB\u6A21\u5F0F", attr: { for: modeId } });
  const modeSelect = modeGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modeId, "aria-label": "\u9009\u62E9\u9605\u8BFB\u6A21\u5F0F" }
  });
  modeSelect.createEl("option", { text: "\u9ED8\u8BA4", value: "__default__" });
  for (const preset of options.presets) {
    modeSelect.createEl("option", { text: preset.name, value: preset.id });
  }
  modeSelect.value = options.currentPresetId;
  const zoomGroup = secondaryControls.createDiv({
    cls: "pdf-chat-zoom-group",
    attr: { role: "group", "aria-label": "\u5B57\u4F53\u5927\u5C0F" }
  });
  const zoomOutButton = zoomGroup.createEl("button", {
    text: "A\u2212",
    cls: "pdf-chat-zoom-btn",
    attr: { type: "button" }
  });
  const zoomResetButton = zoomGroup.createEl("button", {
    text: "100%",
    cls: "pdf-chat-zoom-label",
    attr: { type: "button" }
  });
  const zoomInButton = zoomGroup.createEl("button", {
    text: "A+",
    cls: "pdf-chat-zoom-btn",
    attr: { type: "button" }
  });
  setElementLabel(zoomOutButton, "\u7F29\u5C0F\u5185\u5BB9\u5B57\u4F53");
  setElementLabel(zoomResetButton, "\u91CD\u7F6E\u5185\u5BB9\u5B57\u4F53\u4E3A 100%");
  setElementLabel(zoomInButton, "\u653E\u5927\u5185\u5BB9\u5B57\u4F53");
  const moreWrapper = secondaryControls.createDiv({ cls: "pdf-chat-more-wrapper" });
  const moreButton = moreWrapper.createEl("button", {
    text: "\u22EF",
    cls: "pdf-chat-more-button",
    attr: {
      type: "button",
      "aria-haspopup": "menu",
      "aria-expanded": "false"
    }
  });
  setElementLabel(moreButton, "\u66F4\u591A\u64CD\u4F5C");
  const moreMenu = moreWrapper.createDiv({
    cls: "pdf-chat-more-menu is-hidden",
    attr: { role: "menu" }
  });
  const libraryButton = moreMenu.createEl("button", {
    text: "\u4F1A\u8BDD\u8D44\u6599\u5E93",
    cls: "pdf-chat-menu-item pdf-chat-session-library-button",
    attr: { type: "button" }
  });
  libraryButton.setAttr("role", "menuitem");
  setElementLabel(libraryButton, "\u6253\u5F00\u4F1A\u8BDD\u8D44\u6599\u5E93");
  const clearButton = moreMenu.createEl("button", {
    text: "\u6E05\u7A7A\u5BF9\u8BDD",
    cls: "pdf-chat-menu-item pdf-chat-reset-btn",
    attr: { type: "button" }
  });
  clearButton.setAttr("role", "menuitem");
  setElementLabel(clearButton, "\u6E05\u7A7A\u5F53\u524D\u5BF9\u8BDD");
  let removeTransientListeners = null;
  const closeMenu = () => {
    moreButton.setAttr("aria-expanded", "false");
    moreMenu.addClass("is-hidden");
    removeTransientListeners == null ? void 0 : removeTransientListeners();
    removeTransientListeners = null;
  };
  const openMenu = () => {
    moreButton.setAttr("aria-expanded", "true");
    moreMenu.removeClass("is-hidden");
    const ownerDocument = root.ownerDocument;
    const onDocumentClick = (event) => {
      const target = event.target;
      if (target && moreWrapper.contains(target)) return;
      closeMenu();
    };
    const onDocumentKeydown = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    ownerDocument.addEventListener("click", onDocumentClick);
    ownerDocument.addEventListener("keydown", onDocumentKeydown);
    removeTransientListeners = () => {
      ownerDocument.removeEventListener("click", onDocumentClick);
      ownerDocument.removeEventListener("keydown", onDocumentKeydown);
    };
  };
  moreButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (moreButton.getAttribute("aria-expanded") === "true") closeMenu();
    else openMenu();
  });
  clearButton.addEventListener("click", closeMenu);
  libraryButton.addEventListener("click", closeMenu);
  return {
    root,
    modeBadge,
    primaryControls,
    secondaryControls,
    modelSelect,
    modeSelect,
    zoomOutButton,
    zoomResetButton,
    zoomInButton,
    moreButton,
    moreMenu,
    libraryButton,
    clearButton
  };
}
function buildContextPanel(parent, options) {
  const bodyId = nextControlId("context");
  const root = parent.createEl("section", {
    cls: "pdf-chat-context-panel",
    attr: { "aria-label": "\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177" }
  });
  const toggle = root.createEl("button", {
    cls: "pdf-chat-context-toggle",
    attr: {
      type: "button",
      "aria-expanded": "false",
      "aria-controls": bodyId,
      "aria-label": "\u5C55\u5F00\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177"
    }
  });
  toggle.createEl("span", { text: "\u8BBA\u6587\u4E0A\u4E0B\u6587", cls: "pdf-chat-context-title" });
  toggle.createEl("span", {
    text: `${options.selectionText.length} \u5B57`,
    cls: "pdf-chat-status-chip pdf-chat-status-chip-count pdf-chat-selection-count is-neutral"
  });
  const summaryStatus = toggle.createEl("span", {
    text: options.hasPdf ? "\u6458\u8981\u68C0\u67E5\u4E2D" : "\u4EC5\u9009\u533A",
    cls: "pdf-chat-status-chip pdf-chat-status-chip-summary pdf-chat-summary-status is-pending"
  });
  const ragStatus = toggle.createEl("span", {
    text: options.hasPdf ? "\u4E0A\u4E0B\u6587\u68C0\u67E5\u4E2D" : "\u9009\u533A\u4E0A\u4E0B\u6587",
    cls: "pdf-chat-status-chip pdf-chat-status-chip-context pdf-chat-rag-status is-pending"
  });
  toggle.createEl("span", { text: "\u2304", cls: "pdf-chat-context-chevron", attr: { "aria-hidden": "true" } });
  const body = root.createDiv({
    cls: "pdf-chat-context-body is-collapsed",
    attr: { id: bodyId }
  });
  body.createEl("h3", { text: "\u9009\u533A\u539F\u6587", cls: "pdf-chat-context-heading" });
  body.createDiv({ cls: "pdf-chat-context-text", text: options.selectionText });
  const tools = body.createDiv({ cls: "pdf-chat-context-tools" });
  const researchActions = body.createDiv({
    cls: "pdf-chat-research-actions",
    attr: {
      role: "group",
      "aria-label": "\u8BBA\u6587\u7814\u7A76\u6269\u5C55\u64CD\u4F5C",
      "data-research-action-slot": "context"
    }
  });
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttr("aria-expanded", String(expanded));
    toggle.setAttr("aria-label", expanded ? "\u6536\u8D77\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177" : "\u5C55\u5F00\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177");
    body.toggleClass("is-collapsed", !expanded);
    root.toggleClass("is-expanded", expanded);
  });
  return { root, toggle, body, tools, summaryStatus, ragStatus, researchActions };
}
function buildMessageRegion(parent, restoringHistory) {
  return parent.createEl("main", {
    cls: "pdf-chat-history",
    attr: {
      role: "log",
      "aria-live": restoringHistory ? "off" : "polite",
      "aria-relevant": "additions",
      "aria-atomic": "false"
    }
  });
}
function buildEmptyState(history) {
  return history.createDiv({
    cls: "pdf-chat-empty-state",
    text: "\u9009\u533A\u5DF2\u5C31\u7EEA\u3002\u53EF\u76F4\u63A5\u63D0\u95EE\uFF0C\u8F93\u5165 @ \u5F15\u7528\u5176\u4ED6 PDF\uFF1B\u9700\u8981 Codex \u6DF1\u5EA6\u9605\u8BFB\u65F6\u8F93\u5165 /codex \u52A0\u95EE\u9898\u3002",
    attr: { role: "status" }
  });
}
function resizeComposerTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}
function buildComposer(parent) {
  const root = parent.createEl("footer", {
    cls: "pdf-chat-composer",
    attr: { "aria-label": "\u63D0\u95EE\u7F16\u8F91\u5668" }
  });
  const card = root.createDiv({ cls: "pdf-chat-composer-card" });
  const inputRow = card.createDiv({ cls: "pdf-chat-input-row" });
  const input = inputRow.createEl("textarea", {
    cls: "pdf-chat-input",
    attr: {
      rows: "1",
      placeholder: "\u9488\u5BF9\u5F53\u524D\u9009\u533A\u63D0\u95EE\u2026",
      "aria-label": "\u9488\u5BF9\u5F53\u524D\u9009\u533A\u63D0\u95EE"
    }
  });
  const footer = card.createDiv({ cls: "pdf-chat-composer-footer" });
  const statusGroup = footer.createDiv({ cls: "pdf-chat-composer-status-group" });
  const status = statusGroup.createDiv({
    text: "\u5F53\u524D\u9009\u533A\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528",
    cls: "pdf-chat-composer-status"
  });
  const references = statusGroup.createDiv({
    cls: "pdf-chat-reference-chips",
    attr: { role: "list", "aria-label": "\u5DF2\u5F15\u7528 PDF" }
  });
  const actions = footer.createDiv({ cls: "pdf-chat-composer-actions" });
  const contextToggle = actions.createEl("button", {
    text: "\u9644\u9009\u533A",
    cls: "pdf-chat-codex-context-toggle",
    attr: { type: "button" }
  });
  setElementLabel(contextToggle, "\u5207\u6362\u662F\u5426\u628A\u5F53\u524D\u9009\u533A\u4F5C\u4E3A Codex \u4E0A\u4E0B\u6587");
  const hint = actions.createDiv({
    cls: "pdf-chat-hint",
    text: "Enter \u53D1\u9001 \xB7 Shift+Enter \u6362\u884C"
  });
  const sendButton = actions.createEl("button", {
    text: "\u2191",
    cls: "mod-cta pdf-chat-send-btn",
    attr: { type: "button" }
  });
  setElementLabel(sendButton, "\u53D1\u9001\u95EE\u9898");
  input.addEventListener("input", () => resizeComposerTextarea(input));
  return { root, card, status, references, input, actions, contextToggle, sendButton, hint };
}
function buildFollowupSuggestions(parent, suggestions) {
  var _a;
  const root = parent.createDiv({
    cls: "pdf-chat-followup-suggestions",
    attr: { role: "group", "aria-label": "\u5FEB\u6377\u8FFD\u95EE" }
  });
  const compatibleRoot = root;
  for (const suggestion of suggestions) {
    let button;
    if (typeof compatibleRoot.createEl === "function") {
      button = compatibleRoot.createEl("button", {
        text: suggestion,
        cls: "pdf-chat-followup-chip",
        attr: { type: "button" }
      });
    } else if (((_a = root.ownerDocument) == null ? void 0 : _a.createElement) && typeof root.appendChild === "function") {
      button = root.ownerDocument.createElement("button");
      button.textContent = suggestion;
      button.className = "pdf-chat-followup-chip";
      button.setAttribute("type", "button");
      root.appendChild(button);
    } else {
      continue;
    }
    setElementLabel(button, suggestion);
  }
  return root;
}
function buildAssistantMessageFooter(parent, options) {
  const root = parent.createDiv({ cls: "pdf-chat-message-footer" });
  const evidence = Array.isArray(options.evidence) ? options.evidence : [];
  let evidenceToggle;
  let evidenceList;
  if (evidence.length) {
    const evidenceId = nextControlId("evidence");
    evidenceToggle = root.createEl("button", {
      text: `${evidence.length} \u6761\u8BBA\u6587\u8BC1\u636E`,
      cls: "pdf-chat-footer-action pdf-chat-evidence-toggle",
      attr: {
        type: "button",
        "aria-expanded": "false",
        "aria-controls": evidenceId
      }
    });
    setElementLabel(evidenceToggle, `\u5C55\u5F00 ${evidence.length} \u6761\u8BBA\u6587\u8BC1\u636E`);
    evidenceList = root.createDiv({
      cls: "pdf-chat-evidence-list is-collapsed",
      attr: { id: evidenceId }
    });
    for (const item of evidence) {
      const row = evidenceList.createDiv({ cls: "pdf-chat-evidence-item" });
      row.createEl("span", {
        text: item.claim || item.raw,
        cls: "pdf-chat-evidence-claim"
      });
      if (item.verification === "located" && item.paperPath && Number.isInteger(item.page) && Number(item.page) > 0) {
        const pageButton = row.createEl("button", {
          text: `p.${item.page}`,
          cls: "pdf-chat-open-evidence",
          attr: { type: "button" }
        });
        setElementLabel(pageButton, `\u6253\u5F00 ${item.paperPath} \u7B2C ${item.page} \u9875`);
        pageButton.addEventListener("click", () => void options.onOpenEvidence(item));
      } else {
        row.createEl("span", {
          text: "\u672A\u9A8C\u8BC1",
          cls: "pdf-chat-evidence-unverified"
        });
      }
    }
    evidenceToggle.addEventListener("click", () => {
      const expanded = (evidenceToggle == null ? void 0 : evidenceToggle.getAttribute("aria-expanded")) !== "true";
      evidenceToggle == null ? void 0 : evidenceToggle.setAttr("aria-expanded", String(expanded));
      if (evidenceToggle) {
        setElementLabel(
          evidenceToggle,
          `${expanded ? "\u6536\u8D77" : "\u5C55\u5F00"} ${evidence.length} \u6761\u8BBA\u6587\u8BC1\u636E`
        );
      }
      evidenceList == null ? void 0 : evidenceList.toggleClass("is-collapsed", !expanded);
    });
  }
  const actionGroup = root.createDiv({ cls: "pdf-chat-message-footer-actions" });
  const saveButton = actionGroup.createEl("button", {
    text: "\u4FDD\u5B58\u56DE\u7B54",
    cls: "pdf-chat-footer-action pdf-chat-save-answer",
    attr: { type: "button" }
  });
  const copyButton = actionGroup.createEl("button", {
    text: "\u590D\u5236",
    cls: "pdf-chat-footer-action pdf-chat-copy-answer",
    attr: { type: "button" }
  });
  setElementLabel(saveButton, "\u4FDD\u5B58\u56DE\u7B54\u5230\u7814\u7A76\u7B14\u8BB0");
  setElementLabel(copyButton, "\u590D\u5236\u56DE\u7B54");
  saveButton.addEventListener("click", () => {
    saveButton.disabled = true;
    saveButton.setText("\u4FDD\u5B58\u4E2D\u2026");
    void options.onSave().then(
      () => {
        saveButton.setText("\u5DF2\u4FDD\u5B58");
        setElementLabel(saveButton, "\u56DE\u7B54\u5DF2\u4FDD\u5B58\u5230\u7814\u7A76\u7B14\u8BB0");
      },
      () => {
        saveButton.disabled = false;
        saveButton.setText("\u91CD\u8BD5\u4FDD\u5B58");
        setElementLabel(saveButton, "\u4FDD\u5B58\u5931\u8D25\uFF0C\u91CD\u8BD5\u4FDD\u5B58\u56DE\u7B54");
      }
    );
  });
  copyButton.addEventListener("click", () => {
    copyButton.disabled = true;
    void options.onCopy().then(
      () => {
        copyButton.setText("\u5DF2\u590D\u5236");
        setElementLabel(copyButton, "\u56DE\u7B54\u5DF2\u590D\u5236");
      },
      () => {
        copyButton.disabled = false;
        copyButton.setText("\u91CD\u8BD5\u590D\u5236");
        setElementLabel(copyButton, "\u590D\u5236\u5931\u8D25\uFF0C\u91CD\u8BD5\u590D\u5236\u56DE\u7B54");
      }
    );
  });
  return { root, evidenceToggle, evidenceList, saveButton, copyButton };
}
function formatTranslationUserDisplay(content) {
  const match = /^翻译当前选区（(.+?)）$/.exec(content.trim());
  if (!match) return null;
  return { title: "\u7FFB\u8BD1\u5F53\u524D\u9009\u533A", meta: match[1] };
}
function formatAssistantDisplayMarkdown(raw) {
  if (!raw || raw.includes("\n\n")) return raw;
  if (/```|`[^`]+`|\|.+\||^\s*[-*+]\s+/m.test(raw)) return raw;
  if (/\$\$|\\\[|\\\(|<table|<pre|<code/i.test(raw)) return raw;
  if (raw.length < 40) return raw;
  const split = raw.replace(/(。)(?=(?:提示生成|模型改进|实验结果|方法|贡献|局限|相关工作|结论|首先|其次|最后|此外|因此))/g, "$1\n\n").replace(/([.!?])\s+(?=(?:Prompt|Model|Experiment|Result|Method|Contribution|Limitation)\b)/g, "$1\n\n");
  return split === raw ? raw : split;
}

// src/session-library-modal.ts
var SessionLibraryModal = class extends import_obsidian4.Modal {
  constructor(app, library, options) {
    super(app);
    this.library = library;
    this.options = options;
    __publicField(this, "searchInput");
    __publicField(this, "resultsEl");
    __publicField(this, "queryState");
    this.queryState = {
      text: "",
      scope: "all",
      currentConversationKey: options.currentConversationKey,
      mode: "all",
      archived: "active"
    };
  }
  onOpen() {
    this.contentEl.empty();
    this.modalEl.addClass("pdf-chat-session-library-modal");
    const root = this.contentEl.createDiv({ cls: "pdf-chat-session-library" });
    root.createEl("h2", { text: "\u4F1A\u8BDD\u8D44\u6599\u5E93" });
    root.createEl("p", {
      text: "\u641C\u7D22\u3001\u6574\u7406\u548C\u6062\u590D PDF Chat / Codex \u9605\u8BFB\u8BA8\u8BBA\u3002\u5F52\u6863\u6216\u5220\u9664\u4F1A\u8BDD\u4E0D\u4F1A\u5220\u9664\u8BBA\u6587\u4E0E\u7814\u7A76\u7B14\u8BB0\u3002",
      cls: "pdf-chat-session-library-description"
    });
    const controls = root.createDiv({ cls: "pdf-chat-session-library-controls" });
    this.searchInput = controls.createEl("input", {
      cls: "pdf-chat-session-search",
      attr: { type: "search", placeholder: "\u641C\u7D22\u6807\u9898\u3001PDF\u3001\u6807\u7B7E\u6216\u53EF\u89C1\u95EE\u7B54\u2026" }
    });
    setElementLabel(this.searchInput, "\u641C\u7D22\u4F1A\u8BDD");
    this.searchInput.addEventListener("input", () => {
      var _a;
      this.queryState.text = ((_a = this.searchInput) == null ? void 0 : _a.value) || "";
      this.renderResults();
    });
    this.buildSelect(controls, "\u8303\u56F4", "\u4F1A\u8BDD\u8303\u56F4", [
      ["all", "\u5168\u90E8\u8BBA\u6587"],
      ["current", "\u5F53\u524D\u8BBA\u6587"]
    ], (value) => {
      this.queryState.scope = value === "current" ? "current" : "all";
    });
    this.buildSelect(controls, "\u6A21\u5F0F", "\u4F1A\u8BDD\u6A21\u5F0F", [
      ["all", "\u5168\u90E8\u6A21\u5F0F"],
      ["chat", "API"],
      ["codex", "Codex"]
    ], (value) => {
      this.queryState.mode = value === "chat" || value === "codex" ? value : "all";
    });
    this.buildSelect(controls, "\u72B6\u6001", "\u5F52\u6863\u72B6\u6001", [
      ["active", "\u4F7F\u7528\u4E2D"],
      ["archived", "\u5DF2\u5F52\u6863"],
      ["all", "\u5168\u90E8\u72B6\u6001"]
    ], (value) => {
      this.queryState.archived = value === "archived" || value === "all" ? value : "active";
    });
    this.resultsEl = root.createDiv({
      cls: "pdf-chat-session-results",
      attr: { role: "list", "aria-live": "polite" }
    });
    this.renderResults();
    this.searchInput.focus();
  }
  buildSelect(parent, label, ariaLabel, options, onChange) {
    const group = parent.createDiv({ cls: "pdf-chat-session-filter" });
    group.createEl("span", { text: label });
    const select = group.createEl("select", { attr: { "aria-label": ariaLabel } });
    for (const [value, text] of options) select.createEl("option", { value, text });
    select.addEventListener("change", () => {
      onChange(select.value);
      this.renderResults();
    });
  }
  renderResults() {
    if (!this.resultsEl) return;
    this.resultsEl.empty();
    const sessions = this.library.query(this.queryState).sort((left, right) => {
      const currentDifference = Number(right.conversationKey === this.options.currentConversationKey) - Number(left.conversationKey === this.options.currentConversationKey);
      return currentDifference || Number(right.pinned) - Number(left.pinned) || right.updatedAt - left.updatedAt;
    });
    if (!sessions.length) {
      this.resultsEl.createDiv({ cls: "pdf-chat-session-empty", text: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4F1A\u8BDD\u3002" });
      return;
    }
    for (const session of sessions) this.renderSession(session);
  }
  renderSession(session) {
    var _a;
    if (!this.resultsEl) return;
    const card = this.resultsEl.createDiv({
      cls: "pdf-chat-session-card",
      attr: { role: "listitem" }
    });
    const summary = card.createDiv({ cls: "pdf-chat-session-summary" });
    summary.createEl("strong", {
      text: `${session.pinned ? "\u2605 " : ""}${session.title || "\u672A\u547D\u540D\u4F1A\u8BDD"}`,
      cls: "pdf-chat-session-title"
    });
    const source = session.conversationKey.replace(/^pdf:/, "");
    summary.createEl("span", {
      text: `${session.mode === "codex" ? "Codex" : "API"} \xB7 ${source || "\u9009\u533A\u8BA8\u8BBA"} \xB7 ${new Date(session.updatedAt).toLocaleString()}`,
      cls: "pdf-chat-session-meta"
    });
    if ((_a = session.tags) == null ? void 0 : _a.length) {
      summary.createEl("span", {
        text: session.tags.map((tag) => `#${tag}`).join(" "),
        cls: "pdf-chat-session-tags"
      });
    }
    if (session.sourceStatus === "missing") {
      summary.createEl("span", { text: "\u539F PDF \u7F3A\u5931", cls: "pdf-chat-session-missing" });
    }
    const recovery = this.library.getCodexRecovery(session);
    if (recovery.reason) {
      const preview = this.library.previewCodexFork(session.id, {
        availablePdfPaths: this.options.availablePdfPaths || [],
        handoffMaxChars: 12e3
      });
      summary.createEl("span", {
        text: `\u672C\u673A\u65E0\u6CD5\u76F4\u63A5\u6062\u590D\u8BE5 Codex thread\uFF1B\u672C\u5730\u5206\u652F\u5C06\u643A\u5E26 ${preview.handoffChars} \u5B57\u53EF\u89C1\u4E0A\u4E0B\u6587 \xB7 ${preview.attachedPdfPaths.length} \u7BC7 PDF${preview.omittedPdfPaths.length ? ` \xB7 \u5FFD\u7565 ${preview.omittedPdfPaths.length} \u7BC7\u7F3A\u5931 PDF` : ""}`,
        cls: "pdf-chat-session-recovery"
      });
    }
    const actions = card.createDiv({ cls: "pdf-chat-session-actions" });
    this.action(actions, recovery.reason ? "\u67E5\u770B\u5386\u53F2" : "\u6062\u590D", recovery.reason ? "\u67E5\u770B\u5386\u53F2\u8BB0\u5F55" : "\u6062\u590D\u8FD9\u6BB5\u4F1A\u8BDD", async () => {
      const resumed = this.library.reactivate(session.id);
      await this.options.onResume(resumed);
      this.close();
    });
    if (recovery.reason) {
      this.action(actions, "\u521B\u5EFA\u672C\u5730\u5206\u652F", "\u521B\u5EFA\u672C\u5730\u5206\u652F\u5E76\u7EE7\u7EED\u8BA8\u8BBA", async () => {
        const fork = await this.library.createCodexFork(session.id, {
          availablePdfPaths: this.options.availablePdfPaths || [],
          handoffMaxChars: 12e3
        });
        await this.options.onResume(fork);
        this.close();
      }, "is-primary");
    }
    this.action(actions, session.pinned ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876", "\u5207\u6362\u4F1A\u8BDD\u7F6E\u9876\u72B6\u6001", async () => {
      await this.library.setPinned(session.id, !session.pinned);
      this.renderResults();
    });
    this.action(actions, "\u91CD\u547D\u540D", "\u91CD\u547D\u540D\u4F1A\u8BDD", async () => {
      const promptFn = typeof window !== "undefined" ? window.prompt : void 0;
      const title = promptFn == null ? void 0 : promptFn("\u65B0\u7684\u4F1A\u8BDD\u6807\u9898", session.title);
      if (title === null || title === void 0) return;
      await this.library.rename(session.id, title);
      this.renderResults();
    });
    this.action(actions, "\u6807\u7B7E", "\u7F16\u8F91\u4F1A\u8BDD\u6807\u7B7E", async () => {
      const promptFn = typeof window !== "undefined" ? window.prompt : void 0;
      const value = promptFn == null ? void 0 : promptFn("\u6807\u7B7E\uFF08\u7528\u9017\u53F7\u5206\u9694\uFF09", (session.tags || []).join(", "));
      if (value === null || value === void 0) return;
      await this.library.setTags(session.id, value.split(/[，,]/));
      this.renderResults();
    });
    this.action(actions, session.archivedAt ? "\u53D6\u6D88\u5F52\u6863" : "\u5F52\u6863", "\u5207\u6362\u4F1A\u8BDD\u5F52\u6863\u72B6\u6001", async () => {
      if (session.archivedAt) this.library.reactivate(session.id);
      else await this.library.archive(session.id);
      this.renderResults();
    });
    this.action(actions, "\u5BFC\u51FA", "\u5BFC\u51FA\u4F1A\u8BDD Markdown", async () => {
      const result = await this.library.export(session.id);
      new import_obsidian4.Notice(`\u4F1A\u8BDD\u5DF2\u5BFC\u51FA\u5230 ${result.path}`);
    });
    if (session.sourceStatus === "missing" && this.options.onRebind) {
      this.action(actions, "\u91CD\u65B0\u7ED1\u5B9A PDF", "\u4E3A\u7F3A\u5931\u6765\u6E90\u91CD\u65B0\u9009\u62E9 PDF", async () => {
        var _a2, _b;
        await ((_b = (_a2 = this.options).onRebind) == null ? void 0 : _b.call(_a2, session));
        this.renderResults();
      });
    }
    this.action(actions, "\u5220\u9664", "\u5220\u9664\u4F1A\u8BDD\u8BB0\u5F55", async () => {
      if (await this.library.delete(session.id)) this.renderResults();
    }, "is-danger");
  }
  action(parent, text, label, run, extraClass = "") {
    const button = parent.createEl("button", {
      text,
      cls: `pdf-chat-session-action ${extraClass}`.trim(),
      attr: { type: "button" }
    });
    setElementLabel(button, label);
    button.addEventListener("click", () => {
      button.disabled = true;
      void run().catch((error) => {
        new import_obsidian4.Notice(error instanceof Error ? error.message : String(error));
      }).finally(() => {
        button.disabled = false;
      });
    });
  }
};

// src/selection-limit-modal.ts
var import_obsidian5 = require("obsidian");
async function resolveSelectionForTurn(text, limit, requestDecision) {
  const normalizedText = typeof text === "string" ? text : "";
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 2e4;
  if (normalizedText.length <= normalizedLimit) {
    return { kind: "all", text: normalizedText, oversized: false };
  }
  const choice = await requestDecision({ textLength: normalizedText.length, limit: normalizedLimit });
  if (choice === "all") return { kind: "all", text: normalizedText, oversized: true };
  if (choice === "prefix") {
    return { kind: "prefix", text: normalizedText.slice(0, normalizedLimit), oversized: true };
  }
  return { kind: "cancel", text: "", oversized: true };
}
var SelectionLimitModal = class extends import_obsidian5.Modal {
  constructor(app, textLength, limit, resolveChoice) {
    super(app);
    this.textLength = textLength;
    this.limit = limit;
    this.resolveChoice = resolveChoice;
    __publicField(this, "settled", false);
  }
  finish(choice) {
    if (this.settled) return;
    this.settled = true;
    this.resolveChoice(choice);
    this.close();
  }
  onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("pdf-chat-selection-limit-modal");
    this.contentEl.createEl("h2", { text: "\u9009\u533A\u5185\u5BB9\u8F83\u957F" });
    this.contentEl.createEl("p", {
      text: `\u5F53\u524D\u9009\u533A ${this.textLength} \u5B57\uFF0C\u8D85\u8FC7\u5355\u8F6E\u5EFA\u8BAE\u4E0A\u9650 ${this.limit} \u5B57\u3002\u8BF7\u9009\u62E9\u672C\u8F6E\u5982\u4F55\u53D1\u9001\u3002`
    });
    const actions = this.contentEl.createDiv({ cls: "pdf-chat-selection-limit-actions" });
    const sendAll = actions.createEl("button", { text: "\u672C\u6B21\u53D1\u9001\u5168\u90E8" });
    sendAll.setAttr("aria-label", "\u672C\u6B21\u53D1\u9001\u5168\u90E8\u9009\u533A\u5185\u5BB9");
    sendAll.addEventListener("click", () => this.finish("all"));
    const sendPrefix = actions.createEl("button", { text: `\u53EA\u53D1\u9001\u524D ${this.limit} \u5B57` });
    sendPrefix.setAttr("aria-label", `\u53EA\u53D1\u9001\u9009\u533A\u524D ${this.limit} \u5B57`);
    sendPrefix.addEventListener("click", () => this.finish("prefix"));
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88\u5E76\u91CD\u65B0\u9009\u62E9" });
    cancel.setAttr("aria-label", "\u53D6\u6D88\u672C\u8F6E\u53D1\u9001\u5E76\u91CD\u65B0\u9009\u62E9\u5185\u5BB9");
    cancel.addEventListener("click", () => this.finish("cancel"));
    sendPrefix.focus();
  }
  onClose() {
    if (!this.settled) {
      this.settled = true;
      this.resolveChoice("cancel");
    }
    this.contentEl.empty();
  }
};
function requestSelectionLimitDecision(app, textLength, limit) {
  return new Promise((resolve) => {
    new SelectionLimitModal(app, textLength, limit, resolve).open();
  });
}

// src/pdf-chat-modal.ts
function errorMessage2(error) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
function isAbortError2(error) {
  return !!error && typeof error === "object" && "name" in error && error.name === "AbortError";
}
function isCodexUnavailableError(error) {
  const message = errorMessage2(error);
  return /failed to start|not available|ENOENT|not recognized|cannot find/i.test(message);
}
function isCodexTimeoutError(error) {
  return /timed out after \d+ms/i.test(errorMessage2(error));
}
function formatCodexElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1e3));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  const two = (value) => String(value).padStart(2, "0");
  return hours ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}
function codexProgressBubbleText(elapsedMs, detail) {
  return [
    `Codex \u5DF2\u8FD0\u884C ${formatCodexElapsed(elapsedMs)}`,
    detail || "\u7B49\u5F85 Codex CLI \u4E8B\u4EF6\u2026",
    "xhigh \u6DF1\u5EA6\u5206\u6790\u53EF\u80FD\u9700\u8981 10\u201330 \u5206\u949F\uFF1B\u5982\u679C\u4E0D\u60F3\u7EE7\u7EED\uFF0C\u53EF\u4EE5\u70B9\u51FB\u201C\u505C\u6B62\u201D\u3002"
  ].join("\n");
}
async function renderMarkdownInto(app, component, el, text) {
  el.empty();
  el.addClass("markdown-rendered");
  try {
    if (import_obsidian6.MarkdownRenderer.render) {
      await import_obsidian6.MarkdownRenderer.render(app, text, el, "", component);
      return;
    }
    if (import_obsidian6.MarkdownRenderer.renderMarkdown) {
      await import_obsidian6.MarkdownRenderer.renderMarkdown(text, el, "", component);
      return;
    }
  } catch (e) {
  }
  el.setText(text);
}
function getBubbleContentEl(bubble) {
  return bubble.pdfChatContentEl || bubble;
}
function byBubbleClass(bubble, className) {
  return Array.from(bubble.children || []).some((child) => {
    var _a;
    return (_a = child.classList) == null ? void 0 : _a.contains(className);
  });
}
function setBubbleText(bubble, text) {
  getBubbleContentEl(bubble).setText(text);
}
function setTextByClass(root, className, text) {
  const found = root.getElementsByClassName ? root.getElementsByClassName(className)[0] : null;
  const compatible = found;
  if (typeof (compatible == null ? void 0 : compatible.setText) === "function") compatible.setText(text);
  else if (compatible) compatible.textContent = text;
}
function createBubbleDiv(parent, options) {
  const compatibleParent = parent;
  if (typeof compatibleParent.createDiv === "function") return compatibleParent.createDiv(options);
  if (typeof compatibleParent.createEl === "function") return compatibleParent.createEl("div", options);
  const child = parent.ownerDocument.createElement("div");
  if (options.cls) child.className = options.cls;
  if (options.text !== void 0) child.textContent = options.text;
  parent.appendChild(child);
  return child;
}
function canCreateBubbleChildren(parent) {
  var _a;
  const compatibleParent = parent;
  return typeof compatibleParent.createDiv === "function" || typeof compatibleParent.createEl === "function" || typeof ((_a = parent.ownerDocument) == null ? void 0 : _a.createElement) === "function";
}
async function renderMarkdownIntoBubble(app, component, bubble, text) {
  await renderMarkdownInto(app, component, getBubbleContentEl(bubble), formatAssistantDisplayMarkdown(text));
}
var PDFChatModal = class _PDFChatModal extends import_obsidian6.Modal {
  constructor(app, plugin, contextText, pdfFile, startFresh, services, autoTranslateOnOpen) {
    var _a, _b, _c;
    super(app);
    __publicField(this, "plugin");
    __publicField(this, "services");
    __publicField(this, "paperContext");
    __publicField(this, "contextText");
    __publicField(this, "pdfFile");
    __publicField(this, "startFresh");
    __publicField(this, "autoTranslateOnOpen");
    __publicField(this, "conversationKey");
    __publicField(this, "translateConversationKey");
    __publicField(this, "hadExistingHistory");
    __publicField(this, "currentPresetId");
    __publicField(this, "currentModelId");
    __publicField(this, "useDocSummary", false);
    __publicField(this, "docSummaryEntry", null);
    __publicField(this, "isGeneratingSummary", false);
    __publicField(this, "useRag", false);
    __publicField(this, "docChunksEntry", null);
    __publicField(this, "isIndexingRag", false);
    __publicField(this, "useFullTextMode", false);
    __publicField(this, "fullTextForQA", null);
    __publicField(this, "fullTextAttached", false);
    __publicField(this, "transcript");
    __publicField(this, "translateTranscript", []);
    __publicField(this, "messages");
    __publicField(this, "activeComposerKind", "chat");
    __publicField(this, "runtimeMode", "api");
    __publicField(this, "currentSessionId");
    __publicField(this, "isSending", false);
    __publicField(this, "isCodexRunning", false);
    __publicField(this, "codexCloseIntent", "suspend");
    __publicField(this, "includeCurrentPdfInCodex", true);
    __publicField(this, "includeSelectionContextInCodex", true);
    __publicField(this, "abortController", null);
    __publicField(this, "codexUnsubscribe");
    __publicField(this, "codexTaskBubble");
    __publicField(this, "codexTaskQuestion");
    __publicField(this, "codexProgressTimer");
    __publicField(this, "lastCodexSnapshot");
    __publicField(this, "promptHistoryCursor", null);
    __publicField(this, "promptHistoryDraft", "");
    __publicField(this, "zoomOutBtn");
    __publicField(this, "zoomLabel");
    __publicField(this, "zoomInBtn");
    __publicField(this, "moreButton");
    __publicField(this, "moreMenu");
    __publicField(this, "modeBadgeEl");
    __publicField(this, "modelSelect");
    __publicField(this, "modeSelect");
    __publicField(this, "summaryCheckbox");
    __publicField(this, "summaryStatusEl");
    __publicField(this, "summaryRefreshBtn");
    __publicField(this, "ragCheckbox");
    __publicField(this, "ragStatusEl");
    __publicField(this, "ragRefreshBtn");
    __publicField(this, "referencedPdfFiles", []);
    __publicField(this, "multiPaperStatusEl");
    __publicField(this, "historyEl");
    __publicField(this, "emptyStateEl");
    __publicField(this, "suggestionsEl");
    __publicField(this, "composerStatusEl");
    __publicField(this, "referencedPdfsEl");
    __publicField(this, "composerCardEl");
    __publicField(this, "codexContextToggleBtn");
    __publicField(this, "composerMentionSuggestionsEl");
    __publicField(this, "composerMentionRange");
    __publicField(this, "composerMentionCandidates", []);
    __publicField(this, "composerMentionActiveIndex", 0);
    __publicField(this, "commandMenuEl");
    __publicField(this, "inputEl");
    __publicField(this, "sendBtn");
    this.plugin = plugin;
    this.services = services || createPDFChatModalServices(plugin);
    const paperContext = typeof contextText === "string" ? {
      app,
      file: pdfFile || null,
      selectedText: contextText,
      conversationKey: this.services.conversations.getKey(pdfFile || null, contextText)
    } : contextText;
    this.paperContext = paperContext;
    this.contextText = paperContext.selectedText;
    this.includeSelectionContextInCodex = this.contextText.trim() ? true : this.plugin.settings.codexDeepAnalysis.includeSelectionContext === true;
    this.pdfFile = paperContext.file || null;
    this.startFresh = !!startFresh;
    this.autoTranslateOnOpen = !!autoTranslateOnOpen;
    const lastPresetId = this.plugin.settings.lastPresetId;
    this.currentPresetId = lastPresetId && (lastPresetId === "__default__" || this.plugin.settings.promptPresets.find((p) => p.id === lastPresetId)) ? lastPresetId : "__default__";
    if (this.startFresh) {
      const lastModelId = this.plugin.settings.lastModelId;
      this.currentModelId = lastModelId && this.plugin.settings.models.find((m) => m.id === lastModelId) ? lastModelId : this.plugin.settings.activeModelId;
    } else {
      this.currentModelId = this.services.models.resolveContinueId();
    }
    this.conversationKey = paperContext.conversationKey;
    this.translateConversationKey = this.services.conversations.getKey(
      this.pdfFile,
      this.contextText,
      "translate"
    );
    const activeSession = this.startFresh ? null : ((_b = (_a = this.services.conversations).getActiveSession) == null ? void 0 : _b.call(_a, this.conversationKey)) || null;
    this.currentSessionId = activeSession == null ? void 0 : activeSession.id;
    if ((activeSession == null ? void 0 : activeSession.mode) === "codex") {
      this.runtimeMode = "codex";
      if (activeSession.codex) {
        this.plugin.settings.codexDeepAnalysis.model = activeSession.codex.model;
        this.plugin.settings.codexDeepAnalysis.reasoningEffort = activeSession.codex.reasoningEffort;
        if (activeSession.codex.profile !== void 0) {
          this.plugin.settings.codexDeepAnalysis.profile = activeSession.codex.profile || "";
        }
      }
    }
    if (activeSession == null ? void 0 : activeSession.api) {
      if (activeSession.api.modelId && this.plugin.settings.models.some((model) => model.id === activeSession.api.modelId)) {
        this.currentModelId = activeSession.api.modelId;
      }
      if (activeSession.api.presetId && (activeSession.api.presetId === "__default__" || this.plugin.settings.promptPresets.some((preset) => preset.id === activeSession.api.presetId))) {
        this.currentPresetId = activeSession.api.presetId;
      }
    }
    if ((_c = activeSession == null ? void 0 : activeSession.referencedPdfPaths) == null ? void 0 : _c.length) {
      this.referencedPdfFiles = activeSession.referencedPdfPaths.map((path) => this.findPdfFileByPath(path)).filter((file) => !!file);
    }
    this.includeCurrentPdfInCodex = (activeSession == null ? void 0 : activeSession.includeCurrentPdfInCodex) !== false;
    const existingTranscript = (activeSession == null ? void 0 : activeSession.messages) || this.services.conversations.get(this.conversationKey);
    this.hadExistingHistory = existingTranscript.length > 0;
    this.transcript = this.startFresh ? [] : existingTranscript;
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content }))
    ];
  }
  buildSystemMessage(selectionContext = this.contextText) {
    const preset = this.currentPresetId === "__default__" ? null : this.plugin.settings.promptPresets.find((p) => p.id === this.currentPresetId);
    const promptText = preset && preset.prompt || this.plugin.settings.systemPrompt;
    let content = promptText;
    if (this.useDocSummary && this.docSummaryEntry && this.docSummaryEntry.summary) {
      content += "\n\n\u3010\u5168\u6587\u80CC\u666F\u6458\u8981\u3011(\u7531\u5FEB\u901F\u6A21\u578B\u6D53\u7F29\u6574\u7BC7 PDF \u5F97\u5230,\u4EC5\u4F9B\u7406\u89E3\u80CC\u666F,\u4E0D\u662F\u6211\u5F53\u524D\u95EE\u9898\u7684\u5177\u4F53\u5185\u5BB9):\n" + this.docSummaryEntry.summary;
    }
    content += `

\u3010\u6211\u5F53\u524D\u9009\u4E2D\u5E76\u60F3\u8BA8\u8BBA\u7684\u539F\u6587\u7247\u6BB5\u3011:
${selectionContext}`;
    return { role: "system", content };
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("pdf-chat-modal");
    const header = buildWorkbenchHeader(contentEl, {
      filename: this.getDocumentName(),
      models: this.plugin.settings.models,
      currentModelId: this.currentModelId,
      presets: this.plugin.settings.promptPresets,
      currentPresetId: this.currentPresetId
    });
    this.modeBadgeEl = header.modeBadge;
    this.modelSelect = header.modelSelect;
    this.modeSelect = header.modeSelect;
    this.zoomOutBtn = header.zoomOutButton;
    this.zoomLabel = header.zoomResetButton;
    this.zoomInBtn = header.zoomInButton;
    this.moreButton = header.moreButton;
    this.moreMenu = header.moreMenu;
    this.setupDragging(header.root);
    header.clearButton.addEventListener("click", () => void this.resetConversation());
    header.libraryButton.addEventListener("click", () => this.showResumeMenu());
    this.modelSelect.addEventListener("change", () => this.applyModel(this.modelSelect.value));
    this.modeSelect.addEventListener("change", () => this.applyPreset(this.modeSelect.value));
    this.zoomOutBtn.addEventListener(
      "click",
      () => this.applyFontScale((this.plugin.settings.fontScale || 1) - 0.1)
    );
    this.zoomInBtn.addEventListener(
      "click",
      () => this.applyFontScale((this.plugin.settings.fontScale || 1) + 0.1)
    );
    this.zoomLabel.addEventListener("click", () => this.applyFontScale(1));
    this.applyFontScale(this.plugin.settings.fontScale || 1);
    this.updateRuntimeModeUi();
    const contextPanel = buildContextPanel(contentEl, {
      selectionText: this.contextText,
      hasPdf: !!this.pdfFile
    });
    this.summaryStatusEl = contextPanel.summaryStatus;
    this.ragStatusEl = contextPanel.ragStatus;
    if (this.pdfFile) this.buildPaperContextControls(contextPanel.tools);
    this.renderResearchActions(contextPanel.researchActions);
    const restoringHistory = this.transcript.length > 0;
    this.historyEl = buildMessageRegion(contentEl, restoringHistory);
    if (!restoringHistory) this.showEmptyState();
    const composer = buildComposer(contentEl);
    this.composerCardEl = composer.card;
    this.composerStatusEl = composer.status;
    this.referencedPdfsEl = composer.references;
    this.codexContextToggleBtn = composer.contextToggle;
    this.inputEl = composer.input;
    this.sendBtn = composer.sendButton;
    this.updateComposerContextStatus();
    this.codexContextToggleBtn.addEventListener("click", () => this.toggleCodexSelectionContext());
    const submit = () => this.handleSubmit();
    this.sendBtn.addEventListener("click", () => {
      if (this.isSending) {
        this.stopGenerating();
      } else {
        submit();
      }
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (this.handleComposerMentionKey(evt)) return;
      if (this.handlePromptHistoryKey(evt)) return;
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    });
    this.inputEl.addEventListener("input", () => {
      if (this.promptHistoryCursor !== null) {
        this.promptHistoryCursor = null;
        this.promptHistoryDraft = "";
      }
      this.hideFollowupSuggestions();
      this.updateComposerMentionSuggestions();
    });
    this.setupCloseIntentHandling();
    if (restoringHistory) {
      void this.restoreConversationHistory().catch((err) => {
        this.setHistoryLiveMode("polite");
        new import_obsidian6.Notice("\u6062\u590D\u4E0A\u6B21\u5BF9\u8BDD\u663E\u793A\u5931\u8D25: " + errorMessage2(err));
      }).finally(() => {
        if (this.currentSessionId) this.attachCodexRuntime(this.currentSessionId);
      });
    } else if (this.startFresh && this.hadExistingHistory) {
      new import_obsidian6.Notice("\u5DF2\u5F00\u59CB\u65B0\u5BF9\u8BDD(\u53D1\u51FA\u7B2C\u4E00\u6761\u6D88\u606F\u540E\u4F1A\u66FF\u6362\u6389\u4E0A\u6B21\u4FDD\u5B58\u7684\u8BB0\u5F55)");
    } else if (this.currentSessionId) {
      this.attachCodexRuntime(this.currentSessionId);
    }
    if (this.autoTranslateOnOpen) this.handleTranslate();
    else this.inputEl.focus();
  }
  setupCloseIntentHandling() {
    var _a, _b, _c, _d, _e;
    const closeButton = ((_b = (_a = this.modalEl).querySelector) == null ? void 0 : _b.call(_a, ".modal-close-button")) || ((_d = (_c = this.containerEl) == null ? void 0 : _c.querySelector) == null ? void 0 : _d.call(_c, ".modal-close-button"));
    closeButton == null ? void 0 : closeButton.addEventListener(
      "click",
      () => {
        this.codexCloseIntent = "terminate";
      },
      { capture: true }
    );
    (_e = this.scope) == null ? void 0 : _e.register([], "Escape", () => {
      var _a2;
      if (this.composerMentionSuggestionsEl) {
        this.hideComposerMentionSuggestions();
        return false;
      }
      if (this.commandMenuEl) {
        this.hideCommandMenu();
        return false;
      }
      if (this.moreMenu && !this.moreMenu.hasClass("is-hidden")) {
        (_a2 = this.moreButton) == null ? void 0 : _a2.click();
        return false;
      }
      this.codexCloseIntent = "suspend";
      this.close();
      return false;
    });
  }
  getDocumentName() {
    if (!this.pdfFile) return "\u9009\u533A\u5BF9\u8BDD";
    return this.pdfFile.name || this.pdfFile.path.split(/[\\/]/).pop() || "\u9009\u533A\u5BF9\u8BDD";
  }
  getCodexModel() {
    return this.plugin.settings.codexDeepAnalysis.model || DEFAULT_SETTINGS.codexDeepAnalysis.model;
  }
  getCodexReasoningEffort() {
    return this.plugin.settings.codexDeepAnalysis.reasoningEffort || DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort;
  }
  getCodexVerbosity() {
    return this.plugin.settings.codexDeepAnalysis.verbosity || DEFAULT_SETTINGS.codexDeepAnalysis.verbosity;
  }
  getCodexInputMode() {
    const value = this.plugin.settings.codexDeepAnalysis.inputMode;
    return value === "debug-full" ? "debug-full" : "pdf-only";
  }
  codexInputModeLabel() {
    const mode = this.getCodexInputMode();
    if (mode === "debug-full") return "Debug full";
    return "PDF-only";
  }
  getCodexOutputMode() {
    const value = this.plugin.settings.codexDeepAnalysis.outputMode;
    return value === "json-schema" ? "json-schema" : "markdown";
  }
  codexOutputModeLabel() {
    return this.getCodexOutputMode() === "json-schema" ? "JSON schema" : "Markdown";
  }
  codexMetaText(fallback = false) {
    if (fallback) return "Codex CLI \u4E0D\u53EF\u7528\u6216\u5931\u8D25\uFF0C\u5DF2\u6539\u7528\u5F53\u524D API \u6A21\u578B";
    const profile = this.plugin.settings.codexDeepAnalysis.profile || "default profile";
    const context = this.shouldAttachSelectionContext() ? "selection context on" : "selection context off";
    return `requested model: ${this.getCodexModel()} \xB7 effort: ${this.getCodexReasoningEffort()} \xB7 input: ${this.codexInputModeLabel()} \xB7 ${context} \xB7 output: ${this.codexOutputModeLabel()} \xB7 profile: ${profile}`;
  }
  hasSelectionContext() {
    return !!(this.contextText || "").trim();
  }
  shouldAttachSelectionContext() {
    return this.includeSelectionContextInCodex && this.hasSelectionContext();
  }
  setCodexSelectionContextEnabled(value) {
    this.includeSelectionContextInCodex = value;
    this.plugin.settings.codexDeepAnalysis.includeSelectionContext = value;
    this.saveSettingsInBackground();
    this.updateComposerContextStatus();
  }
  toggleCodexSelectionContext() {
    if (!this.hasSelectionContext()) {
      new import_obsidian6.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u9644\u5E26\u7684\u9009\u533A\u4E0A\u4E0B\u6587\u3002");
      this.updateComposerContextStatus();
      return;
    }
    this.setCodexSelectionContextEnabled(!this.includeSelectionContextInCodex);
  }
  applyContextCommand(args) {
    const value = args.trim().toLowerCase();
    if (!this.hasSelectionContext()) {
      new import_obsidian6.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u9644\u5E26\u7684\u9009\u533A\u4E0A\u4E0B\u6587\u3002");
      this.updateComposerContextStatus();
      return;
    }
    if (!value) {
      this.toggleCodexSelectionContext();
      return;
    }
    if (["on", "true", "yes", "1", "with"].includes(value)) {
      this.setCodexSelectionContextEnabled(true);
      return;
    }
    if (["off", "false", "no", "0", "without"].includes(value)) {
      this.setCodexSelectionContextEnabled(false);
      return;
    }
    new import_obsidian6.Notice("\u7528\u6CD5\uFF1A/context\u3001/context on \u6216 /context off");
  }
  updateCodexContextToggle() {
    if (!this.codexContextToggleBtn) return;
    const hasContext = this.hasSelectionContext();
    const enabled = this.includeSelectionContextInCodex;
    this.codexContextToggleBtn.disabled = !hasContext;
    this.codexContextToggleBtn.toggleClass("is-enabled", hasContext && enabled);
    this.codexContextToggleBtn.toggleClass("is-disabled", !hasContext || !enabled);
    const text = !hasContext ? "\u65E0\u9009\u533A" : enabled ? "\u9644\u9009\u533A" : "\u4E0D\u9644\u9009\u533A";
    this.codexContextToggleBtn.setText(text);
    labelControl(
      this.codexContextToggleBtn,
      !hasContext ? "\u5F53\u524D\u6CA1\u6709\u53EF\u9644\u5E26\u7684\u9009\u533A\u4E0A\u4E0B\u6587" : enabled ? "Codex \u4F1A\u9644\u5E26\u5F53\u524D\u9009\u533A\u4E0A\u4E0B\u6587\uFF0C\u70B9\u51FB\u5173\u95ED" : "Codex \u4E0D\u9644\u5E26\u5F53\u524D\u9009\u533A\u4E0A\u4E0B\u6587\uFF0C\u70B9\u51FB\u5F00\u542F"
    );
  }
  updateRuntimeModeUi() {
    var _a, _b, _c, _d;
    const codexMode = this.runtimeMode === "codex";
    this.contentEl.toggleClass("is-codex-mode", codexMode);
    this.modalEl.toggleClass("is-codex-mode", codexMode);
    if (this.modeBadgeEl) {
      const snapshot = this.lastCodexSnapshot;
      const persistedThread = this.currentSessionId ? (_d = (_c = (_b = (_a = this.services.conversations).getSession) == null ? void 0 : _b.call(_a, this.currentSessionId)) == null ? void 0 : _c.codex) == null ? void 0 : _d.threadId : void 0;
      const threadId = (snapshot == null ? void 0 : snapshot.threadId) || persistedThread;
      const running = (snapshot == null ? void 0 : snapshot.status) === "running" && snapshot.startedAt ? ` \xB7 Running ${formatCodexElapsed(Date.now() - snapshot.startedAt)}` : "";
      this.modeBadgeEl.setText(
        codexMode ? `CODEX MODE \xB7 ${this.getCodexModel()} \xB7 ${this.getCodexReasoningEffort()}${threadId ? ` \xB7 Thread ${threadId.slice(0, 8)}\u2026` : " \xB7 New thread"}${running}` : "API MODE"
      );
    }
    this.updateComposerContextStatus();
  }
  enterCodexMode() {
    this.runtimeMode = "codex";
    this.activeComposerKind = "chat";
    this.plugin.settings.codexDeepAnalysis.enabled = true;
    this.saveSettingsInBackground();
    this.updateRuntimeModeUi();
    this.saveSessionMetadataInBackground();
  }
  exitCodexMode() {
    this.runtimeMode = "api";
    this.updateRuntimeModeUi();
    this.saveSessionMetadataInBackground();
  }
  clearComposerInput() {
    if (!this.inputEl) return;
    this.inputEl.value = "";
    if (this.inputEl.style) this.inputEl.style.height = "";
  }
  rememberPromptHistory(raw) {
    const text = raw.trim();
    if (!text) return;
    const history = Array.isArray(this.plugin.settings.promptHistory) ? [...this.plugin.settings.promptHistory] : [];
    if (history[history.length - 1] !== text) history.push(text);
    this.plugin.settings.promptHistory = history.slice(-100);
    this.promptHistoryCursor = null;
    this.promptHistoryDraft = "";
    this.saveSettingsInBackground();
  }
  saveSettingsInBackground() {
    Promise.resolve(this.plugin.saveSettings()).catch(() => void 0);
  }
  saveSessionMetadataInBackground() {
    const session = this.ensureCurrentSessionForWrite();
    if (session && this.services.conversations.saveSessionById) {
      Promise.resolve(
        this.services.conversations.saveSessionById(
          session.id,
          this.transcript,
          this.sessionMetadata()
        )
      ).catch(() => void 0);
      return;
    }
    if (!session && this.services.conversations.ensureSession) {
      try {
        const session2 = this.services.conversations.ensureSession(this.conversationKey, this.sessionMetadata());
        this.currentSessionId = (session2 == null ? void 0 : session2.id) || this.currentSessionId;
        this.saveSettingsInBackground();
      } catch (error) {
        void error;
      }
    }
  }
  handlePromptHistoryKey(event) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return false;
    if (this.composerMentionSuggestionsEl) return false;
    const history = this.plugin.settings.promptHistory || [];
    if (!history.length) return false;
    const value = this.inputEl.value || "";
    const selectionStart = typeof this.inputEl.selectionStart === "number" ? this.inputEl.selectionStart : value.length;
    const selectionEnd = typeof this.inputEl.selectionEnd === "number" ? this.inputEl.selectionEnd : selectionStart;
    if (selectionStart !== selectionEnd) return false;
    if (event.key === "ArrowUp" && value.slice(0, selectionStart).includes("\n")) return false;
    if (event.key === "ArrowDown" && value.slice(selectionEnd).includes("\n")) return false;
    event.preventDefault();
    if (event.key === "ArrowUp") {
      if (this.promptHistoryCursor === null) this.promptHistoryDraft = value;
      const next = this.promptHistoryCursor === null ? history.length - 1 : Math.max(0, this.promptHistoryCursor - 1);
      this.promptHistoryCursor = next;
      this.inputEl.value = history[next] || "";
    } else {
      if (this.promptHistoryCursor === null) return true;
      const next = this.promptHistoryCursor + 1;
      if (next >= history.length) {
        this.promptHistoryCursor = null;
        this.inputEl.value = this.promptHistoryDraft;
        this.promptHistoryDraft = "";
      } else {
        this.promptHistoryCursor = next;
        this.inputEl.value = history[next] || "";
      }
    }
    const caret = this.inputEl.value.length;
    if (typeof this.inputEl.setSelectionRange === "function") {
      this.inputEl.setSelectionRange(caret, caret);
    } else {
      this.inputEl.selectionStart = caret;
      this.inputEl.selectionEnd = caret;
    }
    return true;
  }
  hideCommandMenu() {
    var _a;
    const removable = this.commandMenuEl;
    if (typeof (removable == null ? void 0 : removable.remove) === "function") {
      removable.remove();
    } else if ((_a = this.commandMenuEl) == null ? void 0 : _a.parentElement) {
      this.commandMenuEl.parentElement.removeChild(this.commandMenuEl);
    }
    this.commandMenuEl = void 0;
  }
  showCommandMenu(label, options) {
    this.hideCommandMenu();
    const parent = this.composerCardEl || this.contentEl;
    const menu = parent.createDiv({
      cls: "pdf-chat-command-menu",
      attr: { role: "listbox", "aria-label": label }
    });
    if (!options.length) {
      menu.createDiv({ cls: "pdf-chat-command-empty", text: "\u6CA1\u6709\u53EF\u7528\u9009\u9879" });
      this.commandMenuEl = menu;
      return;
    }
    for (const option of options) {
      const button = menu.createEl("button", {
        cls: "pdf-chat-command-option",
        attr: { type: "button", role: "option" }
      });
      button.createEl("span", { text: option.label, cls: "pdf-chat-command-option-label" });
      if (option.detail) {
        button.createEl("span", { text: option.detail, cls: "pdf-chat-command-option-detail" });
      }
      labelControl(button, option.label);
      button.addEventListener("click", () => {
        this.hideCommandMenu();
        void option.run();
      });
    }
    this.commandMenuEl = menu;
  }
  applyCodexModel(model, reasoningEffort) {
    const allowed = /* @__PURE__ */ new Set(["minimal", "low", "medium", "high", "xhigh"]);
    const normalizedModel = model.trim();
    const normalizedEffort = reasoningEffort.trim();
    if (!normalizedModel || !allowed.has(normalizedEffort)) {
      new import_obsidian6.Notice("Codex \u6A21\u578B\u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u4F7F\u7528 /model <model> <minimal|low|medium|high|xhigh>");
      return false;
    }
    this.plugin.settings.codexDeepAnalysis.model = normalizedModel;
    this.plugin.settings.codexDeepAnalysis.reasoningEffort = normalizedEffort;
    this.saveSettingsInBackground();
    this.updateRuntimeModeUi();
    this.saveSessionMetadataInBackground();
    new import_obsidian6.Notice(`Codex \u6A21\u578B\u5DF2\u5207\u6362\u5230 ${normalizedModel} \xB7 ${normalizedEffort}`);
    return true;
  }
  showModelMenu() {
    var _a;
    if (this.runtimeMode === "codex") {
      const presets = ((_a = this.plugin.settings.codexDeepAnalysis.modelPresets) == null ? void 0 : _a.length) ? this.plugin.settings.codexDeepAnalysis.modelPresets : DEFAULT_SETTINGS.codexDeepAnalysis.modelPresets;
      this.showCommandMenu(
        "\u9009\u62E9 Codex \u6A21\u578B",
        presets.map((preset) => ({
          label: preset.label || `${preset.model} \xB7 ${preset.reasoningEffort}`,
          detail: "Codex CLI",
          run: () => {
            this.applyCodexModel(preset.model, preset.reasoningEffort);
          }
        }))
      );
      return;
    }
    this.showCommandMenu(
      "\u9009\u62E9 PDF Chat API \u6A21\u578B",
      this.plugin.settings.models.map((model) => ({
        label: model.name || model.id,
        detail: model.model || model.id,
        run: () => this.applyModel(model.id)
      }))
    );
  }
  applyModelCommand(args) {
    const trimmed = args.trim();
    if (!trimmed) {
      this.showModelMenu();
      return;
    }
    if (this.runtimeMode === "codex") {
      const [model, effort = this.getCodexReasoningEffort()] = trimmed.split(/\s+/);
      this.applyCodexModel(model, effort);
      return;
    }
    const lower = trimmed.toLowerCase();
    const match = this.plugin.settings.models.find(
      (model) => [model.id, model.name, model.model].some((value) => String(value || "").toLowerCase() === lower)
    );
    if (!match) {
      new import_obsidian6.Notice("\u6CA1\u6709\u627E\u5230\u8FD9\u4E2A API \u6A21\u578B\uFF0C\u8F93\u5165 /model \u53EF\u4ECE\u5217\u8868\u9009\u62E9\u3002");
      return;
    }
    this.applyModel(match.id);
  }
  sessionMetadata(title) {
    var _a, _b, _c, _d;
    const fallbackTitle = title || ((_a = this.transcript.find((message) => message.role === "user")) == null ? void 0 : _a.content) || this.getDocumentName();
    const existingCodex = this.currentSessionId ? (_d = (_c = (_b = this.services.conversations).getSession) == null ? void 0 : _c.call(_b, this.currentSessionId)) == null ? void 0 : _d.codex : void 0;
    return {
      title: fallbackTitle.slice(0, 80),
      mode: this.runtimeMode === "codex" ? "codex" : "chat",
      referencedPdfPaths: this.referencedPdfFiles.map((file) => file.path).filter(Boolean),
      includeCurrentPdfInCodex: this.includeCurrentPdfInCodex,
      api: { modelId: this.currentModelId, presetId: this.currentPresetId },
      codex: this.runtimeMode === "codex" ? {
        model: this.getCodexModel(),
        reasoningEffort: this.getCodexReasoningEffort(),
        profile: this.plugin.settings.codexDeepAnalysis.profile || "",
        threadId: existingCodex == null ? void 0 : existingCodex.threadId,
        lifecycle: (existingCodex == null ? void 0 : existingCodex.lifecycle) || "active"
      } : void 0
    };
  }
  ensureCurrentSessionForWrite() {
    var _a, _b, _c, _d, _e, _f;
    if (this.currentSessionId) {
      return ((_b = (_a = this.services.conversations).getSession) == null ? void 0 : _b.call(_a, this.currentSessionId)) || {
        id: this.currentSessionId
      };
    }
    const metadata = this.sessionMetadata();
    const session = this.startFresh ? (_d = (_c = this.services.conversations).startSession) == null ? void 0 : _d.call(_c, this.conversationKey, metadata) : (_f = (_e = this.services.conversations).ensureSession) == null ? void 0 : _f.call(_e, this.conversationKey, metadata);
    this.currentSessionId = session == null ? void 0 : session.id;
    return session || null;
  }
  async startNewSession() {
    var _a, _b, _c;
    (_a = this.codexUnsubscribe) == null ? void 0 : _a.call(this);
    this.codexUnsubscribe = void 0;
    const metadata = this.sessionMetadata(this.getDocumentName());
    if (metadata.codex) {
      metadata.codex = {
        model: metadata.codex.model,
        reasoningEffort: metadata.codex.reasoningEffort,
        profile: metadata.codex.profile,
        lifecycle: "active"
      };
    }
    const session = (_c = (_b = this.services.conversations).startSession) == null ? void 0 : _c.call(
      _b,
      this.conversationKey,
      metadata
    );
    this.currentSessionId = session == null ? void 0 : session.id;
    this.transcript = [];
    this.messages = [this.buildSystemMessage()];
    this.activeComposerKind = "chat";
    this.fullTextAttached = false;
    this.includeCurrentPdfInCodex = true;
    this.historyEl.empty();
    this.hideFollowupSuggestions();
    this.emptyStateEl = void 0;
    this.showEmptyState();
    if (this.currentSessionId) this.attachCodexRuntime(this.currentSessionId);
    await this.plugin.saveSettings();
    new import_obsidian6.Notice("\u5DF2\u65B0\u5EFA\u8BA8\u8BBA\uFF0C\u65E7\u8BA8\u8BBA\u53EF\u7528 /resume \u627E\u56DE\u3002");
  }
  async resumeConversationSession(sessionId) {
    var _a, _b, _c, _d, _e;
    const session = (_b = (_a = this.services.conversations).resumeSession) == null ? void 0 : _b.call(_a, sessionId);
    if (!session) {
      new import_obsidian6.Notice("\u6CA1\u6709\u627E\u5230\u8FD9\u6BB5\u5386\u53F2\u8BA8\u8BBA\u3002");
      return;
    }
    this.currentSessionId = session.id;
    (_c = this.services.codex) == null ? void 0 : _c.reactivateSession(session.id);
    if (session.conversationKey !== this.conversationKey && session.conversationKey.startsWith("pdf:")) {
      const targetPath = session.conversationKey.slice("pdf:".length);
      const targetFile = this.findPdfFileByPath(targetPath);
      if (!targetFile) {
        new import_obsidian6.Notice("\u8FD9\u6BB5\u4F1A\u8BDD\u5BF9\u5E94\u7684 PDF \u5DF2\u79FB\u52A8\u6216\u4E0D\u5B58\u5728\uFF1B\u804A\u5929\u8BB0\u5F55\u4ECD\u4FDD\u7559\u3002");
        return;
      }
      await this.plugin.saveSettings();
      await this.app.workspace.getLeaf(false).openFile(targetFile);
      this.codexCloseIntent = "suspend";
      this.close();
      const paperContext = {
        app: this.app,
        file: targetFile,
        selectedText: "",
        conversationKey: session.conversationKey
      };
      new _PDFChatModal(this.app, this.plugin, paperContext, null, false, this.services).open();
      return;
    }
    this.runtimeMode = session.mode === "codex" ? "codex" : "api";
    if (session.codex) {
      this.plugin.settings.codexDeepAnalysis.model = session.codex.model;
      this.plugin.settings.codexDeepAnalysis.reasoningEffort = session.codex.reasoningEffort;
      this.plugin.settings.codexDeepAnalysis.profile = session.codex.profile || "";
    }
    if (((_d = session.api) == null ? void 0 : _d.modelId) && this.plugin.settings.models.some((model) => model.id === session.api.modelId)) {
      this.currentModelId = session.api.modelId;
    }
    if (((_e = session.api) == null ? void 0 : _e.presetId) && (session.api.presetId === "__default__" || this.plugin.settings.promptPresets.some((preset) => preset.id === session.api.presetId))) {
      this.currentPresetId = session.api.presetId;
    }
    this.referencedPdfFiles = (session.referencedPdfPaths || []).map((path) => this.findPdfFileByPath(path)).filter((file) => !!file);
    this.includeCurrentPdfInCodex = session.includeCurrentPdfInCodex !== false;
    this.transcript = session.messages || [];
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content }))
    ];
    this.historyEl.empty();
    this.emptyStateEl = void 0;
    this.updateRuntimeModeUi();
    this.attachCodexRuntime(session.id);
    await this.plugin.saveSettings();
    await this.restoreConversationHistory();
  }
  showResumeMenu() {
    var _a, _b;
    const availablePdfPaths = (((_b = (_a = this.app.vault) == null ? void 0 : _a.getFiles) == null ? void 0 : _b.call(_a)) || []).filter((file) => (file.extension || "").toLowerCase() === "pdf").map((file) => file.path);
    const library = new SessionLibraryService({
      conversations: this.services.conversations,
      artifacts: this.services.artifacts,
      codex: this.services.codex,
      installationId: () => this.plugin.settings.installationId,
      confirmDelete: (session) => window.confirm(
        `\u786E\u5B9A\u5220\u9664\u4F1A\u8BDD\u201C${session.title}\u201D\u5417\uFF1F

\u53EA\u4F1A\u5220\u9664\u804A\u5929\u8BB0\u5F55\uFF0C\u4E0D\u4F1A\u5220\u9664 PDF \u6216\u7814\u7A76\u7B14\u8BB0\u3002`
      )
    });
    new SessionLibraryModal(this.app, library, {
      currentConversationKey: this.conversationKey,
      availablePdfPaths,
      onResume: (session) => this.resumeConversationSession(session.id),
      onRebind: (session) => this.showSessionRebindPicker(library, session)
    }).open();
  }
  showSessionRebindPicker(library, session) {
    return new Promise((resolve) => {
      const files = this.app.vault.getFiles().filter((file) => (file.extension || "").toLowerCase() === "pdf");
      class RebindPdfSuggestModal extends import_obsidian6.FuzzySuggestModal {
        getItems() {
          return files;
        }
        getItemText(file) {
          return `${file.name || file.path} \xB7 ${file.path}`;
        }
        onChooseItem(file) {
          void library.rebind(session.id, file.path).then(
            () => {
              new import_obsidian6.Notice(`\u4F1A\u8BDD\u5DF2\u91CD\u65B0\u7ED1\u5B9A\u5230 ${file.path}\uFF1B\u65E7\u9875\u7801\u8BC1\u636E\u5DF2\u6807\u8BB0\u4E3A\u672A\u9A8C\u8BC1\u3002`);
              resolve();
            },
            (error) => {
              new import_obsidian6.Notice("\u91CD\u65B0\u7ED1\u5B9A PDF \u5931\u8D25\uFF1A" + errorMessage2(error));
              resolve();
            }
          );
        }
        onClose() {
          resolve();
        }
      }
      const picker = new RebindPdfSuggestModal(this.app);
      picker.setPlaceholder("\u9009\u62E9\u65B0\u7684 PDF \u6765\u6E90\u2026");
      picker.open();
    });
  }
  showTasksMenu() {
    var _a;
    const tasks = ((_a = this.services.codex) == null ? void 0 : _a.listSnapshots()) || [];
    const items = tasks.map((task) => {
      var _a2, _b;
      return {
        task,
        session: ((_b = (_a2 = this.services.conversations).getSession) == null ? void 0 : _b.call(_a2, task.sessionId)) || null
      };
    });
    const owner = this;
    class CodexTaskSuggestModal extends import_obsidian6.FuzzySuggestModal {
      getItems() {
        return items;
      }
      getItemText(item) {
        const { task, session } = item;
        const state = task.status === "running" ? "\u8FD0\u884C\u4E2D" : task.status === "failed" ? "\u5931\u8D25" : "\u5DF2\u4E2D\u65AD";
        return `${(session == null ? void 0 : session.title) || task.question || task.sessionId} \xB7 ${state}${task.progress ? ` \xB7 ${task.progress}` : ""}`;
      }
      onChooseItem(item) {
        void owner.resumeConversationSession(item.task.sessionId);
      }
    }
    const picker = new CodexTaskSuggestModal(this.app);
    picker.setPlaceholder("\u641C\u7D22 Codex \u540E\u53F0\u4EFB\u52A1\u2026");
    picker.open();
  }
  async retryCurrentCodexSave() {
    if (!this.currentSessionId || !this.services.codex) {
      new import_obsidian6.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u91CD\u65B0\u4FDD\u5B58\u7684 Codex \u56DE\u7B54\u3002");
      return;
    }
    try {
      const saved = await this.services.codex.retryPersistResult(this.currentSessionId);
      new import_obsidian6.Notice(saved ? "Codex \u56DE\u7B54\u5DF2\u91CD\u65B0\u4FDD\u5B58\u3002" : "\u5F53\u524D\u6CA1\u6709\u5F85\u91CD\u65B0\u4FDD\u5B58\u7684 Codex \u56DE\u7B54\u3002");
    } catch (error) {
      new import_obsidian6.Notice(`\u91CD\u65B0\u4FDD\u5B58\u5931\u8D25\uFF1A${errorMessage2(error)}`);
    }
  }
  async runCodexDoctor(runRealCheck) {
    var _a, _b;
    if (!this.pdfFile) {
      new import_obsidian6.Notice("\u8BF7\u5148\u4ECE\u4E00\u4E2A PDF \u89C6\u56FE\u6253\u5F00 PDF Chat\uFF0C\u518D\u8FD0\u884C /doctor\u3002");
      return;
    }
    let workingDirectory;
    try {
      workingDirectory = resolveCodexPdfLocation(this.app, this.pdfFile.path).workingDirectory;
    } catch (error) {
      new import_obsidian6.Notice(`Codex \u672C\u5730\u8DEF\u5F84\u68C0\u67E5\u5931\u8D25\uFF1A${errorMessage2(error)}`);
      return;
    }
    if (runRealCheck) {
      const candidateWindow = (_a = this.contentEl.ownerDocument) == null ? void 0 : _a.defaultView;
      const confirmFn = (_b = candidateWindow == null ? void 0 : candidateWindow.confirm) == null ? void 0 : _b.bind(candidateWindow);
      if (!(confirmFn == null ? void 0 : confirmFn(
        "\u771F\u5B9E Codex \u8BCA\u65AD\u4F1A\u6267\u884C\u4E24\u6B21\u6A21\u578B\u8C03\u7528\uFF1A\u5148\u521B\u5EFA thread\uFF0C\u518D resume \u540C\u4E00\u4E2A thread\u3002\u662F\u5426\u7EE7\u7EED\uFF1F"
      ))) {
        new import_obsidian6.Notice("\u5DF2\u53D6\u6D88\u771F\u5B9E Codex \u8BCA\u65AD\u3002");
        return;
      }
    }
    this.hideFollowupSuggestions();
    this.setSendingState(true);
    const bubble = this.addBubble("assistant", "\u6B63\u5728\u68C0\u67E5 Codex CLI\u2026", {
      loading: true,
      assistantAuthor: "Codex Doctor",
      assistantContext: runRealCheck ? "\u771F\u5B9E thread/resume \u8BCA\u65AD" : "\u514D\u8D39\u672C\u5730\u8BCA\u65AD"
    });
    const settings = this.plugin.settings.codexDeepAnalysis;
    try {
      const version = await runCodexVersionCheck(settings.command, {
        workingDirectory,
        timeoutMs: 1e4
      });
      if (!runRealCheck) {
        bubble.removeClass("is-loading");
        setBubbleText(
          bubble,
          `Codex CLI \u672C\u5730\u68C0\u67E5\u901A\u8FC7\u3002

- \u7248\u672C\uFF1A${version}
- \u547D\u4EE4\uFF1A${settings.command}
- \u5DE5\u4F5C\u76EE\u5F55\uFF1A${workingDirectory}
- \u672A\u8C03\u7528\u6A21\u578B\uFF0C\u672A\u4EA7\u751F Codex token \u6D88\u8017\u3002`
        );
        return;
      }
      setBubbleText(bubble, "Codex CLI \u53EF\u7528\uFF1B\u6B63\u5728\u9A8C\u8BC1\u65B0 thread \u4E0E\u539F\u751F resume\u2026");
      const result = await runCodexThreadDoctor({
        command: settings.command,
        workingDirectory,
        profile: settings.profile,
        model: settings.model,
        reasoningEffort: settings.reasoningEffort,
        verbosity: settings.verbosity,
        timeoutMs: Math.min(settings.timeoutMs, 18e4)
      });
      bubble.removeClass("is-loading");
      setBubbleText(
        bubble,
        [
          "Codex CLI \u771F\u5B9E\u8BCA\u65AD\u901A\u8FC7\u3002",
          "",
          `- \u7248\u672C\uFF1A${version}`,
          `- \u6A21\u578B\uFF1A${settings.model} \xB7 ${settings.reasoningEffort}`,
          `- Thread\uFF1A${result.threadId}`,
          `- \u9996\u8F6E\uFF1A${result.firstTurnMs} ms \xB7 ${result.firstReply}`,
          `- Resume\uFF1A${result.resumeTurnMs} ms \xB7 ${result.resumeReply}`
        ].join("\n")
      );
    } catch (error) {
      bubble.removeClass("is-loading");
      bubble.addClass("is-error");
      setBubbleText(bubble, `Codex \u8BCA\u65AD\u5931\u8D25\uFF1A${errorMessage2(error)}`);
    } finally {
      this.setSendingState(false);
      this.inputEl.focus();
    }
  }
  showStatusMessage() {
    var _a, _b, _c, _d, _e;
    const refs = this.referencedPdfFiles.length ? this.referencedPdfFiles.map((file) => file.name || file.path).join("\u3001") : "\u65E0";
    const codexSnapshot = this.currentSessionId ? (_a = this.services.codex) == null ? void 0 : _a.getSnapshot(this.currentSessionId) : void 0;
    const session = this.currentSessionId ? (_c = (_b = this.services.conversations).getSession) == null ? void 0 : _c.call(_b, this.currentSessionId) : void 0;
    const lines = [
      `\u5F53\u524D\u6A21\u5F0F\uFF1A${this.runtimeMode === "codex" ? "Codex CLI" : "PDF Chat API"}`,
      `API \u6A21\u578B\uFF1A${((_d = this.plugin.settings.models.find((model) => model.id === this.currentModelId)) == null ? void 0 : _d.name) || this.currentModelId}`,
      `Codex\uFF1A${this.getCodexModel()} \xB7 ${this.getCodexReasoningEffort()} \xB7 ${this.plugin.settings.codexDeepAnalysis.profile || "default profile"}`,
      `\u5F15\u7528 PDF\uFF1A${refs}`,
      `\u9009\u533A\u4E0A\u4E0B\u6587\uFF1A${this.shouldAttachSelectionContext() ? `\u4E0B\u4E00\u8F6E\u76F4\u63A5\u9644\u5E26 ${this.contextText.length} \u5B57` : "\u4E0D\u9644\u5E26"}`,
      `Session\uFF1A${this.currentSessionId || "\u672A\u521B\u5EFA"}`,
      `Codex Thread\uFF1A${(codexSnapshot == null ? void 0 : codexSnapshot.threadId) || ((_e = session == null ? void 0 : session.codex) == null ? void 0 : _e.threadId) || "\u5C1A\u672A\u521B\u5EFA"}`,
      `Codex \u72B6\u6001\uFF1A${(codexSnapshot == null ? void 0 : codexSnapshot.status) || "idle"}`,
      `\u5DE5\u4F5C\u76EE\u5F55\uFF1A${(codexSnapshot == null ? void 0 : codexSnapshot.workingDirectory) || (this.pdfFile ? "\u5F53\u524D PDF \u6240\u5728\u6587\u4EF6\u5939" : "vault \u6839\u76EE\u5F55")}`
    ];
    this.addBubble("assistant", lines.join("\n"), {
      assistantAuthor: this.runtimeMode === "codex" ? "Codex Mode" : "PDF Chat",
      assistantContext: "\u72B6\u6001",
      assistantClass: "is-status-message"
    });
  }
  showHelpMessage() {
    this.addBubble(
      "assistant",
      [
        "\u652F\u6301\u7684\u547D\u4EE4\uFF1A",
        "- /codex\uFF1A\u8FDB\u5165 Codex \u6A21\u5F0F",
        "- /codex <\u95EE\u9898>\uFF1A\u8FDB\u5165 Codex \u6A21\u5F0F\u5E76\u7ACB\u5373\u8BA9 Codex \u8BFB\u53D6\u5F53\u524D/\u5F15\u7528 PDF",
        "- /exit\uFF1A\u56DE\u5230\u666E\u901A API \u804A\u5929",
        "- /stop\uFF1A\u505C\u6B62\u5F53\u524D Codex turn\uFF0C\u4F46\u4FDD\u7559 thread",
        "- /model\uFF1A\u9009\u62E9\u5F53\u524D\u6A21\u5F0F\u4E0B\u7684\u6A21\u578B",
        "- /model <model> <effort>\uFF1A\u5207\u6362 Codex \u6A21\u578B\u548C\u63A8\u7406\u5F3A\u5EA6",
        "- /new\uFF1A\u65B0\u5EFA\u8BA8\u8BBA\uFF0C\u4E0D\u5220\u9664\u65E7\u8BA8\u8BBA",
        "- /resume\uFF1A\u6062\u590D\u5386\u53F2\u8BA8\u8BBA",
        "- /tasks\uFF1A\u67E5\u770B\u8FD0\u884C\u4E2D\u3001\u5931\u8D25\u6216\u4E2D\u65AD\u7684 Codex \u540E\u53F0\u4EFB\u52A1",
        "- /retry-save\uFF1A\u91CD\u65B0\u4FDD\u5B58\u5DF2\u7ECF\u751F\u6210\u4F46\u5199\u5165\u5931\u8D25\u7684 Codex \u56DE\u7B54",
        "- /doctor\uFF1A\u514D\u8D39\u68C0\u67E5 Codex \u547D\u4EE4\u4E0E\u7248\u672C\uFF1B/doctor real \u660E\u786E\u6267\u884C thread/resume \u771F\u5B9E\u8BCA\u65AD",
        "- /refs\uFF1A\u67E5\u770B\u5E76\u79FB\u9664\u5F53\u524D\u5F15\u7528\u7684 PDF",
        "- /unref <\u5E8F\u53F7\u6216\u540D\u79F0>\uFF1A\u79FB\u9664\u67D0\u7BC7\u5F15\u7528 PDF",
        "- /clearrefs\uFF1A\u6E05\u7A7A\u5F53\u524D\u8BA8\u8BBA\u5F15\u7528\u7684 PDF",
        "- /context\uFF1A\u5207\u6362\u662F\u5426\u628A\u5F53\u524D\u9009\u533A\u4F5C\u4E3A Codex \u4E0A\u4E0B\u6587",
        "- /context on|off\uFF1A\u5F00\u542F\u6216\u5173\u95ED Codex \u9009\u533A\u4E0A\u4E0B\u6587",
        "- /status\uFF1A\u67E5\u770B\u5F53\u524D\u6A21\u5F0F\u3001\u6A21\u578B\u3001\u5F15\u7528 PDF \u548C session"
      ].join("\n"),
      {
        assistantAuthor: this.runtimeMode === "codex" ? "Codex Mode" : "PDF Chat",
        assistantContext: "\u5E2E\u52A9"
      }
    );
  }
  async handleSlashCommand(question, usingOverride) {
    var _a;
    if (usingOverride || !question.startsWith("/")) return false;
    const match = /^\/([A-Za-z][\w-]*)(?:\s+([\s\S]*))?$/.exec(question.trim());
    if (!match) return false;
    const command = match[1].toLowerCase();
    const args = (match[2] || "").trim();
    switch (command) {
      case "codex":
        this.enterCodexMode();
        this.clearComposerInput();
        if (args) await this.runCodexDeepAnalysis(args);
        return true;
      case "exit":
        this.exitCodexMode();
        this.clearComposerInput();
        new import_obsidian6.Notice("\u5DF2\u9000\u51FA Codex \u6A21\u5F0F\uFF0C\u56DE\u5230 PDF Chat API\u3002");
        return true;
      case "stop":
        this.clearComposerInput();
        if (this.runtimeMode === "codex" && this.currentSessionId && ((_a = this.services.codex) == null ? void 0 : _a.stopTurn(this.currentSessionId))) {
          new import_obsidian6.Notice("\u6B63\u5728\u505C\u6B62\u5F53\u524D Codex turn\uFF1Bthread \u4F1A\u4FDD\u7559\uFF0C\u53EF\u7EE7\u7EED\u8FFD\u95EE\u3002");
        } else {
          new import_obsidian6.Notice("\u5F53\u524D\u6CA1\u6709\u6B63\u5728\u8FD0\u884C\u7684 Codex turn\u3002");
        }
        return true;
      case "status":
        this.clearComposerInput();
        this.showStatusMessage();
        return true;
      case "help":
        this.clearComposerInput();
        this.showHelpMessage();
        return true;
      case "model":
        this.clearComposerInput();
        this.applyModelCommand(args);
        return true;
      case "new":
        this.clearComposerInput();
        await this.startNewSession();
        return true;
      case "resume":
        this.clearComposerInput();
        this.showResumeMenu();
        return true;
      case "tasks":
        this.clearComposerInput();
        this.showTasksMenu();
        return true;
      case "retry-save":
        this.clearComposerInput();
        await this.retryCurrentCodexSave();
        return true;
      case "doctor":
        this.clearComposerInput();
        await this.runCodexDoctor(args.toLowerCase() === "real");
        return true;
      case "refs":
        this.clearComposerInput();
        this.showReferencesMenu();
        return true;
      case "unref":
        this.clearComposerInput();
        this.applyUnrefCommand(args);
        return true;
      case "clearrefs":
        this.clearComposerInput();
        if (this.clearReferencedPdfs()) new import_obsidian6.Notice("\u5DF2\u6E05\u7A7A\u5F53\u524D\u8BA8\u8BBA\u5F15\u7528\u7684 PDF\u3002");
        else new import_obsidian6.Notice("\u5F53\u524D\u6CA1\u6709\u5F15\u7528 PDF\u3002");
        return true;
      case "context":
        this.clearComposerInput();
        this.applyContextCommand(args);
        return true;
      default:
        if (this.runtimeMode === "codex") {
          this.clearComposerInput();
          this.addBubble(
            "assistant",
            `\u5F53\u524D\u63D2\u4EF6\u6682\u4E0D\u652F\u6301 Codex TUI \u547D\u4EE4\uFF1A/${command}\u3002\u8F93\u5165 /help \u67E5\u770B\u53EF\u7528\u547D\u4EE4\u3002`,
            { assistantAuthor: "Codex Mode", assistantContext: "\u547D\u4EE4\u672A\u652F\u6301" }
          );
          return true;
        }
        return false;
    }
  }
  buildPaperContextControls(container) {
    const summaryRow = container.createDiv({ cls: "pdf-chat-summary-row" });
    const summaryLabel = summaryRow.createEl("label", { cls: "pdf-chat-check-label" });
    const summaryCheckbox = this.summaryCheckbox = summaryLabel.createEl("input", { type: "checkbox" });
    summaryLabel.createEl("span", { text: "\u9644\u5E26\u5168\u6587\u6458\u8981\u4F5C\u4E3A\u80CC\u666F" });
    labelControl(summaryCheckbox, "\u9644\u5E26\u5168\u6587\u6458\u8981\u4F5C\u4E3A\u80CC\u666F");
    const summaryRefreshBtn = this.summaryRefreshBtn = summaryRow.createEl("button", {
      text: "\u751F\u6210/\u5237\u65B0\u6458\u8981",
      cls: "pdf-chat-summary-btn",
      attr: { type: "button" }
    });
    labelControl(summaryRefreshBtn, "\u751F\u6210\u6216\u5237\u65B0\u5168\u6587\u6458\u8981");
    this.refreshSummaryStatus();
    summaryCheckbox.addEventListener("change", async () => {
      if (summaryCheckbox.checked) {
        await this.ensureDocSummary(false);
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        summaryCheckbox.checked = this.useDocSummary;
      } else {
        this.useDocSummary = false;
      }
      this.messages[0] = this.buildSystemMessage();
      this.updateComposerContextStatus();
    });
    summaryRefreshBtn.addEventListener("click", async () => {
      await this.ensureDocSummary(true);
      if (summaryCheckbox.checked) {
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
      }
      this.messages[0] = this.buildSystemMessage();
      this.updateComposerContextStatus();
    });
    if (this.plugin.settings.autoDocSummary) {
      summaryCheckbox.checked = true;
      this.useDocSummary = true;
      void this.ensureDocSummary(false).then(() => {
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        summaryCheckbox.checked = this.useDocSummary;
        this.messages[0] = this.buildSystemMessage();
        this.updateComposerContextStatus();
      });
    }
    const ragRow = container.createDiv({ cls: "pdf-chat-summary-row" });
    const ragLabel = ragRow.createEl("label", { cls: "pdf-chat-check-label" });
    const ragCheckbox = this.ragCheckbox = ragLabel.createEl("input", { type: "checkbox" });
    ragLabel.createEl("span", { text: "\u5168\u6587\u76F4\u8BFB / RAG \u68C0\u7D22" });
    labelControl(ragCheckbox, "\u542F\u7528\u5168\u6587\u76F4\u8BFB\u6216 RAG \u68C0\u7D22");
    const ragRefreshBtn = this.ragRefreshBtn = ragRow.createEl("button", {
      text: "\u5EFA\u7ACB/\u5237\u65B0\u7D22\u5F15",
      cls: "pdf-chat-summary-btn",
      attr: { type: "button" }
    });
    labelControl(ragRefreshBtn, "\u5EFA\u7ACB\u6216\u5237\u65B0\u5168\u6587\u68C0\u7D22\u7D22\u5F15");
    this.refreshRagStatus();
    ragCheckbox.addEventListener("change", async () => {
      if (ragCheckbox.checked) {
        await this.ensureDocChunks(false);
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
        ragCheckbox.checked = this.useRag;
      } else {
        this.useRag = false;
      }
      this.updateComposerContextStatus();
    });
    ragRefreshBtn.addEventListener("click", async () => {
      await this.ensureDocChunks(true);
      if (ragCheckbox.checked) {
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
      }
      this.updateComposerContextStatus();
    });
    if (this.plugin.settings.autoRag) {
      ragCheckbox.checked = true;
      this.useRag = true;
      void this.ensureDocChunks(false).then(() => {
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
        ragCheckbox.checked = this.useRag;
        this.updateComposerContextStatus();
      });
    }
  }
  isPdfLikeFile(file) {
    const candidate = file;
    if (!candidate) return false;
    if (String(candidate.extension || "").toLowerCase() === "pdf") return true;
    return /\.pdf$/i.test(candidate.path || candidate.name || "");
  }
  findPdfFileByPath(path) {
    var _a;
    const vault = (_a = this.app) == null ? void 0 : _a.vault;
    const direct = (vault == null ? void 0 : vault.getAbstractFileByPath) ? vault.getAbstractFileByPath(path) : null;
    if (this.isPdfLikeFile(direct)) return direct;
    const files = (vault == null ? void 0 : vault.getFiles) ? vault.getFiles() : [];
    return files.find((file) => file.path === path && this.isPdfLikeFile(file)) || null;
  }
  addReferencedPdf(file) {
    if (!file || !this.isPdfLikeFile(file)) return;
    if (this.pdfFile && file.path === this.pdfFile.path) {
      new import_obsidian6.Notice("\u5F53\u524D PDF \u5DF2\u7ECF\u4F5C\u4E3A Codex \u9644\u4EF6\uFF0C\u65E0\u9700\u91CD\u590D\u6DFB\u52A0\u3002");
      return;
    }
    if (this.referencedPdfFiles.find((existing) => existing.path === file.path)) return;
    if (this.referencedPdfFiles.length >= 3) {
      new import_obsidian6.Notice("\u7B2C\u4E00\u7248\u6700\u591A\u989D\u5916\u5F15\u7528 3 \u7BC7 PDF\u3002");
      return;
    }
    this.referencedPdfFiles.push(file);
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
  }
  removeReferencedPdfByPath(path) {
    const before = this.referencedPdfFiles.length;
    this.referencedPdfFiles = this.referencedPdfFiles.filter((file) => file.path !== path);
    if (this.referencedPdfFiles.length === before) return false;
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
    return true;
  }
  clearReferencedPdfs() {
    if (!this.referencedPdfFiles.length) return false;
    this.referencedPdfFiles = [];
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
    return true;
  }
  setCurrentPdfCodexAttachment(enabled) {
    if (!this.pdfFile) return;
    this.includeCurrentPdfInCodex = enabled;
    this.updateComposerContextStatus();
    this.saveSessionMetadataInBackground();
  }
  findReferencedPdf(query) {
    const trimmed = query.trim();
    if (!trimmed) return null;
    const index = Number.parseInt(trimmed, 10);
    if (Number.isFinite(index) && String(index) === trimmed && index >= 1) {
      return this.referencedPdfFiles[index - 1] || null;
    }
    const lower = trimmed.toLowerCase();
    return this.referencedPdfFiles.find(
      (file) => [file.name, file.path].some((value) => String(value || "").toLowerCase().includes(lower))
    ) || null;
  }
  renderReferencedPdfChips() {
    if (!this.referencedPdfsEl) return;
    this.referencedPdfsEl.empty();
    const showCurrentPdfChip = this.runtimeMode === "codex" && !!this.pdfFile;
    this.referencedPdfsEl.toggleClass("is-empty", !showCurrentPdfChip && !this.referencedPdfFiles.length);
    if (showCurrentPdfChip && this.pdfFile) {
      const currentChip = this.referencedPdfsEl.createDiv({
        cls: `pdf-chat-reference-chip pdf-chat-current-pdf-chip${this.includeCurrentPdfInCodex ? "" : " is-detached"}`,
        attr: { role: "listitem" }
      });
      currentChip.createEl("span", {
        text: `${this.includeCurrentPdfInCodex ? "\u5F53\u524D PDF" : "\u672A\u9644\u5F53\u524D PDF"} \xB7 ${this.pdfFile.name || this.pdfFile.path}`,
        cls: "pdf-chat-reference-chip-label pdf-chat-current-pdf-label"
      });
      const currentButton = currentChip.createEl("button", {
        text: this.includeCurrentPdfInCodex ? "\xD7" : "\u9644\u4E0A",
        cls: this.includeCurrentPdfInCodex ? "pdf-chat-reference-chip-remove pdf-chat-current-pdf-remove" : "pdf-chat-reference-chip-restore pdf-chat-current-pdf-restore",
        attr: { type: "button" }
      });
      labelControl(
        currentButton,
        this.includeCurrentPdfInCodex ? "\u672C\u8F6E Codex \u4E0D\u518D\u9644\u5E26\u5F53\u524D PDF" : "\u91CD\u65B0\u628A\u5F53\u524D PDF \u9644\u7ED9 Codex"
      );
      currentButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.setCurrentPdfCodexAttachment(!this.includeCurrentPdfInCodex);
      });
    }
    for (const [index, file] of this.referencedPdfFiles.entries()) {
      const chip = this.referencedPdfsEl.createDiv({
        cls: "pdf-chat-reference-chip",
        attr: { role: "listitem" }
      });
      chip.createEl("span", {
        text: file.name || file.path || `PDF ${index + 1}`,
        cls: "pdf-chat-reference-chip-label"
      });
      const removeButton = chip.createEl("button", {
        text: "\xD7",
        cls: "pdf-chat-reference-chip-remove",
        attr: { type: "button" }
      });
      labelControl(removeButton, `\u79FB\u9664\u5F15\u7528 PDF\uFF1A${file.name || file.path}`);
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.removeReferencedPdfByPath(file.path);
      });
    }
  }
  showReferencesMenu() {
    this.showCommandMenu(
      "\u7BA1\u7406\u5F15\u7528 PDF",
      this.referencedPdfFiles.map((file, index) => ({
        label: `${index + 1}. ${file.name || file.path}`,
        detail: "\u70B9\u51FB\u79FB\u9664\u8FD9\u4E2A\u5F15\u7528",
        run: () => {
          this.removeReferencedPdfByPath(file.path);
        }
      }))
    );
  }
  applyUnrefCommand(args) {
    const trimmed = args.trim();
    if (!trimmed) {
      this.showReferencesMenu();
      return;
    }
    const match = this.findReferencedPdf(trimmed);
    if (!match) {
      new import_obsidian6.Notice("\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u5F15\u7528 PDF\u3002\u8F93\u5165 /refs \u53EF\u67E5\u770B\u5F53\u524D\u5F15\u7528\u3002");
      return;
    }
    this.removeReferencedPdfByPath(match.path);
    new import_obsidian6.Notice(`\u5DF2\u79FB\u9664\u5F15\u7528\uFF1A${match.name || match.path}`);
  }
  getComposerMentionRange() {
    if (!this.inputEl) return null;
    const value = this.inputEl.value || "";
    const cursor = typeof this.inputEl.selectionStart === "number" ? this.inputEl.selectionStart : value.length;
    const beforeCursor = value.slice(0, cursor);
    const match = /(?:^|\s)@([^\n@]*)$/.exec(beforeCursor);
    if (!match) return null;
    const atOffset = match[0].indexOf("@");
    return {
      start: match.index + atOffset,
      end: cursor,
      query: match[1].trim()
    };
  }
  updateComposerMentionSuggestions() {
    const range = this.getComposerMentionRange();
    this.composerMentionRange = range || void 0;
    if (!range) {
      this.hideComposerMentionSuggestions();
      return;
    }
    const excludePaths = new Set(this.referencedPdfFiles.map((file) => file.path));
    if (this.pdfFile) excludePaths.add(this.pdfFile.path);
    const cachedPaths = /* @__PURE__ */ new Set([
      ...Object.keys(this.plugin.settings.docSummaries || {}),
      ...Object.keys(this.plugin.settings.docChunks || {})
    ]);
    const results = searchPdfFiles(this.app, range.query, { limit: 6, excludePaths, cachedPaths });
    if (!results.length) {
      this.hideComposerMentionSuggestions();
      return;
    }
    this.composerMentionCandidates = results;
    this.composerMentionActiveIndex = 0;
    const parent = this.composerCardEl || this.contentEl;
    if (!this.composerMentionSuggestionsEl) {
      this.composerMentionSuggestionsEl = parent.createDiv({
        cls: "pdf-chat-composer-mention-suggestions",
        attr: { role: "listbox", "aria-label": "PDF mention suggestions" }
      });
    }
    this.composerMentionSuggestionsEl.empty();
    for (const [index, candidate] of results.entries()) {
      const button = this.composerMentionSuggestionsEl.createEl("button", {
        cls: "pdf-chat-composer-mention-option",
        attr: {
          type: "button",
          role: "option",
          "aria-selected": index === this.composerMentionActiveIndex ? "true" : "false"
        }
      });
      button.toggleClass("is-active", index === this.composerMentionActiveIndex);
      button.createEl("span", { text: candidate.name, cls: "pdf-chat-pdf-search-name" });
      button.createEl("span", {
        text: `${candidate.path}${candidate.cached ? " \xB7 \u5DF2\u6709\u7F13\u5B58" : ""}`,
        cls: "pdf-chat-pdf-search-path"
      });
      labelControl(button, `\u5F15\u7528 ${candidate.name}`);
      button.addEventListener("click", () => this.chooseComposerMention(candidate.path));
    }
  }
  updateComposerMentionActiveOption() {
    if (!this.composerMentionSuggestionsEl) return;
    const options = Array.from(this.composerMentionSuggestionsEl.children).filter(
      (element) => element.hasClass("pdf-chat-composer-mention-option")
    );
    for (const [index, option] of options.entries()) {
      const active = index === this.composerMentionActiveIndex;
      option.toggleClass("is-active", active);
      option.setAttr("aria-selected", active ? "true" : "false");
      if (active && typeof option.scrollIntoView === "function") {
        option.scrollIntoView({ block: "nearest" });
      }
    }
  }
  handleComposerMentionKey(event) {
    if (!this.composerMentionSuggestionsEl || !this.composerMentionCandidates.length) return false;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.hideComposerMentionSuggestions();
      return true;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const count = this.composerMentionCandidates.length;
      this.composerMentionActiveIndex = (this.composerMentionActiveIndex + delta + count) % count;
      this.updateComposerMentionActiveOption();
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const candidate = this.composerMentionCandidates[this.composerMentionActiveIndex];
      if (candidate) this.chooseComposerMention(candidate.path);
      return true;
    }
    return false;
  }
  hideComposerMentionSuggestions() {
    var _a;
    const removable = this.composerMentionSuggestionsEl;
    if (typeof (removable == null ? void 0 : removable.remove) === "function") {
      removable.remove();
    } else if ((_a = this.composerMentionSuggestionsEl) == null ? void 0 : _a.parentElement) {
      this.composerMentionSuggestionsEl.parentElement.removeChild(this.composerMentionSuggestionsEl);
    }
    this.composerMentionSuggestionsEl = void 0;
    this.composerMentionRange = void 0;
    this.composerMentionCandidates = [];
    this.composerMentionActiveIndex = 0;
  }
  chooseComposerMention(path) {
    const file = this.findPdfFileByPath(path);
    if (!file) {
      this.hideComposerMentionSuggestions();
      return;
    }
    const range = this.composerMentionRange || this.getComposerMentionRange();
    this.addReferencedPdf(file);
    if (range && this.inputEl) {
      const label = `@${file.name || file.path} `;
      const value = this.inputEl.value || "";
      this.inputEl.value = value.slice(0, range.start) + label + value.slice(range.end);
      const cursor = range.start + label.length;
      if (typeof this.inputEl.setSelectionRange === "function") {
        this.inputEl.setSelectionRange(cursor, cursor);
      } else {
        this.inputEl.selectionStart = cursor;
        this.inputEl.selectionEnd = cursor;
      }
    }
    this.hideComposerMentionSuggestions();
    this.inputEl.focus();
  }
  renderResearchActions(container) {
    for (const action of listResearchActionsForSlot(this.services.actions, "context")) {
      const button = container.createEl("button", {
        text: action.name,
        cls: "pdf-chat-research-action-btn",
        attr: { type: "button" }
      });
      labelControl(button, action.name);
      button.addEventListener("click", () => {
        void this.services.actions.execute(action.id, { translate: () => this.runTranslation() }).catch((error) => new import_obsidian6.Notice("\u7814\u7A76\u64CD\u4F5C\u5931\u8D25: " + errorMessage2(error)));
      });
    }
  }
  showEmptyState() {
    if (this.emptyStateEl) return;
    const history = this.historyEl;
    if (typeof history.createDiv !== "function") return;
    this.emptyStateEl = buildEmptyState(history);
  }
  removeEmptyState() {
    var _a;
    (_a = this.emptyStateEl) == null ? void 0 : _a.remove();
    this.emptyStateEl = void 0;
  }
  setHistoryLiveMode(value) {
    const history = this.historyEl;
    if (typeof history.setAttr === "function") history.setAttr("aria-live", value);
    else if (typeof history.setAttribute === "function") history.setAttribute("aria-live", value);
  }
  setChipState(element, state) {
    if (!element) return;
    element.removeClass("is-neutral", "is-success", "is-accent", "is-pending");
    element.addClass(`is-${state}`);
  }
  updateComposerContextStatus() {
    if (!this.composerStatusEl) return;
    this.renderReferencedPdfChips();
    this.updateCodexContextToggle();
    const modePrefix = this.runtimeMode === "codex" ? "CODEX MODE \xB7 " : "";
    const referenceSuffix = this.referencedPdfFiles.length ? ` \xB7 \u5DF2\u5F15\u7528 ${this.referencedPdfFiles.length} \u7BC7\u8BBA\u6587` : "";
    const selectionSuffix = this.runtimeMode === "codex" && this.hasSelectionContext() ? this.shouldAttachSelectionContext() ? " \xB7 \u9644\u9009\u533A" : " \xB7 \u4E0D\u9644\u9009\u533A" : "";
    if (!this.pdfFile) {
      this.composerStatusEl.setText(modePrefix + "\u9009\u533A\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528" + referenceSuffix + selectionSuffix);
      return;
    }
    if (this.useRag && this.useFullTextMode) {
      this.composerStatusEl.setText(modePrefix + "\u5168\u6587\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528" + referenceSuffix + selectionSuffix);
    } else if (this.useRag) {
      this.composerStatusEl.setText(modePrefix + "RAG \u68C0\u7D22\u5DF2\u542F\u7528" + referenceSuffix + selectionSuffix);
    } else if (this.useDocSummary) {
      this.composerStatusEl.setText(modePrefix + "\u6458\u8981\u80CC\u666F\u5DF2\u542F\u7528" + referenceSuffix + selectionSuffix);
    } else {
      this.composerStatusEl.setText(modePrefix + "\u5F53\u524D\u9009\u533A\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528" + referenceSuffix + selectionSuffix);
    }
  }
  followupSuggestions() {
    return [
      "\u4E3E\u4E00\u4E2A\u4F8B\u5B50",
      "\u8BF7\u8FDB\u4E00\u6B65\u901A\u4FD7\u6613\u61C2\u5730\u8BB2\u89E3\u6E05\u695A",
      "\u8BF7\u8FDB\u4E00\u6B65\u7ED9\u51FA\u8BE6\u7EC6\u7684\u63A8\u5BFC\u6B65\u9AA4",
      "\u8FDB\u4E00\u6B65\u5206\u6790\u4E3A\u4EC0\u4E48\u662F\u8FD9\u6837\u7684"
    ];
  }
  showFollowupSuggestions(kind = "chat") {
    this.hideFollowupSuggestions();
    try {
      this.suggestionsEl = buildFollowupSuggestions(this.historyEl, this.followupSuggestions());
      const children = this.suggestionsEl.children;
      if (!children) return;
      for (const button of Array.from(children)) {
        if (button.tagName !== "BUTTON") continue;
        button.addEventListener("click", () => {
          this.inputEl.value = button.textContent || "";
          this.activeComposerKind = kind;
          this.inputEl.focus();
          this.hideFollowupSuggestions();
        });
      }
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    } catch (error) {
      void error;
      this.suggestionsEl = void 0;
    }
  }
  hideFollowupSuggestions() {
    var _a;
    const removable = this.suggestionsEl;
    if (typeof (removable == null ? void 0 : removable.remove) === "function") {
      removable.remove();
    } else if ((_a = this.suggestionsEl) == null ? void 0 : _a.parentElement) {
      this.suggestionsEl.parentElement.removeChild(this.suggestionsEl);
    }
    this.suggestionsEl = void 0;
  }
  async restoreConversationHistory() {
    var _a;
    const renderJobs = [];
    let precedingUserMessage;
    for (const message of this.transcript) {
      if (message.role === "user") {
        this.addBubble("user", message.content, { skipScroll: true });
        precedingUserMessage = message;
        continue;
      }
      if (message.status === "complete" && !((_a = message.evidence) == null ? void 0 : _a.length)) {
        const evidence = this.parseAnswerEvidence(message.content);
        if (evidence.length) message.evidence = evidence;
      }
      const bubble = this.addBubble("assistant", message.content, { skipScroll: true });
      const userMessage = precedingUserMessage;
      bubble.addClass("is-rendered");
      renderJobs.push(
        renderMarkdownIntoBubble(this.app, this.plugin, bubble, message.content).then(() => {
          if (message.status === "stopped") {
            bubble.addClass("is-stopped");
            bubble.createEl("p", { cls: "pdf-chat-stopped-label", text: "[\u5DF2\u505C\u6B62\u751F\u6210]" });
          } else if (userMessage) {
            this.attachAssistantActions(bubble, userMessage, message);
          }
        })
      );
    }
    await Promise.all(renderJobs);
    this.setHistoryLiveMode("polite");
    this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
    const lastMessage = this.transcript[this.transcript.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.status !== "stopped") {
      this.showFollowupSuggestions();
    }
    const scope = this.pdfFile ? "\u672C PDF" : "\u5F53\u524D\u9009\u533A";
    new import_obsidian6.Notice(`\u5DF2\u6062\u590D${scope}\u4E0A\u6B21\u5BF9\u8BDD(${this.transcript.length} \u6761\u6D88\u606F)`);
  }
  async persistConversation() {
    try {
      const session = this.ensureCurrentSessionForWrite();
      if (session && this.services.conversations.saveSessionById) {
        await this.services.conversations.saveSessionById(
          session.id,
          this.transcript,
          this.sessionMetadata()
        );
      } else {
        await this.services.conversations.save(this.conversationKey, this.transcript);
      }
      return true;
    } catch (err) {
      new import_obsidian6.Notice("\u4FDD\u5B58\u5BF9\u8BDD\u5931\u8D25: " + errorMessage2(err));
      return false;
    }
  }
  async persistTranslationConversation() {
    try {
      await this.services.conversations.save(
        this.translateConversationKey,
        this.translateTranscript
      );
      return true;
    } catch (err) {
      new import_obsidian6.Notice("\u4FDD\u5B58\u7FFB\u8BD1\u8BB0\u5F55\u5931\u8D25: " + errorMessage2(err));
      return false;
    }
  }
  async recordTranscriptTurn(question, answer, status, evidence = []) {
    if (typeof answer !== "string" || !answer.trim()) return false;
    this.transcript.push(
      { role: "user", content: question, status: "complete" },
      {
        role: "assistant",
        content: answer,
        status: status === "stopped" ? "stopped" : "complete",
        ...evidence.length ? { evidence } : {}
      }
    );
    await this.persistConversation();
    return true;
  }
  async recordTranslateTurn(question, answer, status) {
    if (typeof answer !== "string" || !answer.trim()) return false;
    this.translateTranscript.push(
      { role: "user", content: question, status: "complete" },
      { role: "assistant", content: answer, status: status === "stopped" ? "stopped" : "complete" }
    );
    await this.persistTranslationConversation();
    return true;
  }
  async resetConversation() {
    if (this.isSending) {
      new import_obsidian6.Notice("\u6B63\u5728\u751F\u6210\u4E2D,\u8BF7\u5148\u505C\u6B62\u6216\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u6E05\u7A7A");
      return;
    }
    this.transcript = [];
    this.messages = [this.buildSystemMessage()];
    this.activeComposerKind = "chat";
    this.fullTextAttached = false;
    this.historyEl.empty();
    this.hideFollowupSuggestions();
    this.emptyStateEl = void 0;
    this.showEmptyState();
    try {
      if (this.currentSessionId && this.services.conversations.clearSession) {
        await this.services.conversations.clearSession(this.currentSessionId);
      } else {
        await this.services.conversations.clear(this.conversationKey);
      }
      new import_obsidian6.Notice("\u5BF9\u8BDD\u5DF2\u6E05\u7A7A,\u539F\u6587\u4E0A\u4E0B\u6587\u4FDD\u7559");
    } catch (err) {
      new import_obsidian6.Notice("\u754C\u9762\u5DF2\u6E05\u7A7A,\u4F46\u5220\u9664\u5DF2\u4FDD\u5B58\u5BF9\u8BDD\u5931\u8D25: " + errorMessage2(err));
    }
  }
  applyPreset(id) {
    if (this.isSending) {
      new import_obsidian6.Notice("\u6B63\u5728\u751F\u6210\u4E2D,\u8BF7\u5148\u505C\u6B62\u6216\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u5207\u6362\u9605\u8BFB\u6A21\u5F0F");
      this.modeSelect.value = this.currentPresetId;
      return;
    }
    this.currentPresetId = id;
    this.plugin.settings.lastPresetId = id;
    this.plugin.saveSettings();
    this.messages[0] = this.buildSystemMessage();
    const preset = this.plugin.settings.promptPresets.find((p) => p.id === id);
    const name = id === "__default__" ? "\u9ED8\u8BA4" : preset && preset.name || id;
    new import_obsidian6.Notice(`\u5DF2\u5207\u6362\u5230\u300C${name}\u300D\u6A21\u5F0F,\u540E\u7EED\u56DE\u7B54\u4F1A\u6309\u65B0\u8BBE\u5B9A\u8FDB\u884C`);
  }
  applyModel(id) {
    if (this.isSending) {
      new import_obsidian6.Notice("\u6B63\u5728\u751F\u6210\u4E2D,\u8BF7\u5148\u505C\u6B62\u6216\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u5207\u6362\u6A21\u578B");
      this.modelSelect.value = this.currentModelId;
      return;
    }
    this.currentModelId = id;
    this.plugin.settings.lastModelId = id;
    this.plugin.saveSettings();
    const m = this.plugin.settings.models.find((x) => x.id === id);
    new import_obsidian6.Notice(`\u5DF2\u5207\u6362\u5230\u6A21\u578B\u300C${m && m.name || id}\u300D`);
  }
  applyFontScale(scale) {
    const clamped = Math.round(Math.min(1.6, Math.max(0.7, scale)) * 100) / 100;
    this.plugin.settings.fontScale = clamped;
    this.contentEl.style.setProperty("--pdf-chat-font-scale", String(clamped));
    if (this.zoomLabel) this.zoomLabel.setText(Math.round(clamped * 100) + "%");
    this.plugin.saveSettings();
  }
  refreshSummaryStatus() {
    var _a;
    if (!this.summaryStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    if (cached && cached.summary) {
      this.docSummaryEntry = cached;
      const date = new Date(cached.generatedAt);
      const truncatedNote = cached.truncated ? " \xB7 \u539F\u6587\u8FC7\u957F,\u4EC5\u6458\u8981\u4E86\u524D\u9762\u90E8\u5206" : "";
      const weakExtraction = ((_a = cached.extractionQuality) == null ? void 0 : _a.quality) === "poor";
      this.summaryStatusEl.setText(weakExtraction ? "\u6458\u8981\u8BC1\u636E\u8F83\u5F31" : "\u6458\u8981\u5DF2\u7F13\u5B58");
      this.setChipState(this.summaryStatusEl, weakExtraction ? "pending" : "success");
      this.summaryStatusEl.setAttr(
        "aria-label",
        weakExtraction ? `PDF \u6587\u672C\u63D0\u53D6\u8F83\u5DEE\uFF0C\u6458\u8981\u53EF\u80FD\u4E0D\u5B8C\u6574 \xB7 ${date.toLocaleString()} \xB7 \u5EFA\u8BAE\u4F7F\u7528 Codex \u76F4\u63A5\u9605\u8BFB PDF \u6216\u5148\u505A OCR` : `\u6458\u8981\u5DF2\u7F13\u5B58 \xB7 ${date.toLocaleString()}${truncatedNote}`
      );
    } else {
      this.docSummaryEntry = null;
      this.summaryStatusEl.setText("\u6458\u8981\u672A\u751F\u6210");
      this.setChipState(this.summaryStatusEl, "neutral");
      this.summaryStatusEl.setAttr("aria-label", "\u5C1A\u672A\u751F\u6210\u5168\u6587\u6458\u8981");
    }
    this.updateComposerContextStatus();
  }
  async ensureDocSummary(forceRefresh) {
    var _a;
    if (this.isGeneratingSummary || !this.pdfFile) return;
    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docSummaryEntry = cached;
      this.refreshSummaryStatus();
      return;
    }
    this.isGeneratingSummary = true;
    (_a = this.summaryStatusEl) == null ? void 0 : _a.setText("\u6458\u8981\u751F\u6210\u4E2D");
    this.setChipState(this.summaryStatusEl, "pending");
    if (this.summaryRefreshBtn) {
      this.summaryRefreshBtn.setText("\u751F\u6210\u4E2D\u2026");
      this.summaryRefreshBtn.disabled = true;
    }
    if (this.summaryCheckbox) this.summaryCheckbox.disabled = true;
    const notice = new import_obsidian6.Notice("\u6B63\u5728\u7528\u5FEB\u901F\u6A21\u578B\u63D0\u70BC\u5168\u6587\u6458\u8981,\u53EF\u80FD\u9700\u8981\u51E0\u5341\u79D2\u2026", 0);
    try {
      this.docSummaryEntry = await this.services.papers.getOrCreateDocSummary(this.pdfFile, forceRefresh);
      this.refreshSummaryStatus();
      notice.hide();
      new import_obsidian6.Notice("\u5168\u6587\u6458\u8981\u5DF2\u751F\u6210/\u66F4\u65B0");
    } catch (err) {
      notice.hide();
      new import_obsidian6.Notice("\u751F\u6210\u6458\u8981\u5931\u8D25: " + errorMessage2(err));
      if (this.summaryCheckbox) this.summaryCheckbox.checked = false;
      this.useDocSummary = false;
    } finally {
      this.isGeneratingSummary = false;
      if (this.summaryRefreshBtn) {
        this.summaryRefreshBtn.setText("\u751F\u6210/\u5237\u65B0\u6458\u8981");
        this.summaryRefreshBtn.disabled = false;
      }
      if (this.summaryCheckbox) this.summaryCheckbox.disabled = false;
      this.updateComposerContextStatus();
    }
  }
  refreshRagStatus() {
    var _a;
    if (!this.ragStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    if (cached && cached.chunks && cached.chunks.length) {
      this.docChunksEntry = cached;
      const threshold = this.plugin.settings.ragFullTextThreshold || DEFAULT_SETTINGS.ragFullTextThreshold;
      const weakExtraction = ((_a = cached.extractionQuality) == null ? void 0 : _a.quality) === "poor";
      this.useFullTextMode = !weakExtraction && !!(cached.fullTextLength && cached.fullTextLength <= threshold);
      const date = new Date(cached.generatedAt);
      if (weakExtraction) {
        this.ragStatusEl.setText("\u6587\u672C\u63D0\u53D6\u8F83\u5DEE");
        this.setChipState(this.ragStatusEl, "pending");
        this.ragStatusEl.setAttr(
          "aria-label",
          `PDF \u6587\u672C\u63D0\u53D6\u8F83\u5DEE\uFF0C\u5DF2\u7981\u7528\u81EA\u52A8\u5168\u6587\u76F4\u8BFB \xB7 ${date.toLocaleString()} \xB7 \u53EF\u5C1D\u8BD5 RAG\uFF0C\u5EFA\u8BAE\u4F7F\u7528 Codex \u76F4\u63A5\u9605\u8BFB PDF \u6216\u5148\u505A OCR`
        );
      } else if (this.useFullTextMode) {
        this.ragStatusEl.setText("\u5168\u6587\u76F4\u8BFB");
        this.setChipState(this.ragStatusEl, "accent");
        this.ragStatusEl.setAttr(
          "aria-label",
          `\u5168\u6587\u7EA6 ${cached.fullTextLength} \u5B57\uFF0C\u76F4\u63A5\u8BFB\u5168\u6587 \xB7 ${date.toLocaleString()}`
        );
      } else {
        this.ragStatusEl.setText("RAG \u5C31\u7EEA");
        this.setChipState(this.ragStatusEl, "success");
        this.ragStatusEl.setAttr("aria-label", `\u5DF2\u5EFA\u7D22\u5F15 \xB7 ${cached.chunks.length} \u5757 \xB7 ${date.toLocaleString()}`);
      }
    } else {
      this.docChunksEntry = null;
      this.useFullTextMode = false;
      this.ragStatusEl.setText("\u9009\u533A\u4E0A\u4E0B\u6587");
      this.setChipState(this.ragStatusEl, "neutral");
      this.ragStatusEl.setAttr("aria-label", "\u5C1A\u672A\u5EFA\u7ACB\u5168\u6587\u68C0\u7D22\u7D22\u5F15");
    }
    this.updateComposerContextStatus();
  }
  async ensureDocChunks(forceRefresh) {
    var _a;
    if (this.isIndexingRag || !this.pdfFile) return;
    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docChunksEntry = cached;
      this.refreshRagStatus();
      return;
    }
    this.isIndexingRag = true;
    (_a = this.ragStatusEl) == null ? void 0 : _a.setText("\u7D22\u5F15\u5EFA\u7ACB\u4E2D");
    this.setChipState(this.ragStatusEl, "pending");
    if (this.ragRefreshBtn) {
      this.ragRefreshBtn.setText("\u5EFA\u7ACB\u4E2D\u2026");
      this.ragRefreshBtn.disabled = true;
    }
    if (this.ragCheckbox) this.ragCheckbox.disabled = true;
    try {
      this.docChunksEntry = await this.services.papers.getOrCreateDocChunks(this.pdfFile, forceRefresh);
      this.refreshRagStatus();
    } catch (err) {
      new import_obsidian6.Notice("\u5EFA\u7ACB\u68C0\u7D22\u7D22\u5F15\u5931\u8D25: " + errorMessage2(err));
      if (this.ragCheckbox) this.ragCheckbox.checked = false;
      this.useRag = false;
    } finally {
      this.isIndexingRag = false;
      if (this.ragRefreshBtn) {
        this.ragRefreshBtn.setText("\u5EFA\u7ACB/\u5237\u65B0\u7D22\u5F15");
        this.ragRefreshBtn.disabled = false;
      }
      if (this.ragCheckbox) this.ragCheckbox.disabled = false;
      this.updateComposerContextStatus();
    }
  }
  selectedPaperFiles() {
    const papers = [];
    if (this.pdfFile && this.includeCurrentPdfInCodex) papers.push({ file: this.pdfFile, role: "current" });
    for (const file of this.referencedPdfFiles) papers.push({ file, role: "referenced" });
    return papers;
  }
  evidencePromptSources() {
    return this.selectedPaperFiles().map(({ file }, index) => ({
      alias: `P${index + 1}`,
      name: file.name || file.path,
      paperPath: file.path
    }));
  }
  evidenceSources() {
    return this.evidencePromptSources().map((source) => {
      var _a, _b;
      const summary = (this.plugin.settings.docSummaries || {})[source.paperPath];
      const chunks = (this.plugin.settings.docChunks || {})[source.paperPath];
      const pageCount = ((_a = chunks == null ? void 0 : chunks.extractionQuality) == null ? void 0 : _a.pageCount) || ((_b = summary == null ? void 0 : summary.extractionQuality) == null ? void 0 : _b.pageCount);
      return { ...source, ...pageCount ? { pageCount } : {} };
    });
  }
  parseAnswerEvidence(markdown) {
    return parseResearchEvidence(markdown, this.evidenceSources());
  }
  attachAssistantActions(bubble, userMessage, assistantMessage) {
    var _a, _b, _c;
    if (assistantMessage.status !== "complete" || ((_a = bubble.classList) == null ? void 0 : _a.contains("is-loading")) || ((_b = bubble.classList) == null ? void 0 : _b.contains("is-error")) || ((_c = bubble.classList) == null ? void 0 : _c.contains("is-stopped")) || typeof bubble.createDiv !== "function" || !canCreateBubbleChildren(bubble)) {
      return;
    }
    if (byBubbleClass(bubble, "pdf-chat-message-footer")) return;
    buildAssistantMessageFooter(bubble, {
      evidence: assistantMessage.evidence || [],
      onOpenEvidence: async (evidence) => {
        var _a2;
        const opened = await ((_a2 = this.services.artifacts) == null ? void 0 : _a2.openEvidence(evidence));
        if (!opened && !this.services.artifacts) {
          new import_obsidian6.Notice("\u8BBA\u6587\u8BC1\u636E\u5BFC\u822A\u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u63D2\u4EF6\u3002");
        }
      },
      onSave: async () => {
        var _a2, _b2, _c2, _d, _e;
        const session = this.currentSessionId ? (_b2 = (_a2 = this.services.conversations).getSession) == null ? void 0 : _b2.call(_a2, this.currentSessionId) : (_d = (_c2 = this.services.conversations).getActiveSession) == null ? void 0 : _d.call(_c2, this.conversationKey);
        if (!session || !this.services.artifacts) {
          new import_obsidian6.Notice("\u7814\u7A76\u7B14\u8BB0\u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u63D2\u4EF6\u3002");
          throw new Error("Research note service is unavailable");
        }
        try {
          const result = await this.services.artifacts.appendTurn({
            session,
            userMessage,
            assistantMessage,
            includeSelectionText: this.plugin.settings.researchNotes.includeSelectionText,
            selection: this.contextText ? { text: this.contextText, paperPath: (_e = this.pdfFile) == null ? void 0 : _e.path } : void 0
          });
          new import_obsidian6.Notice(`\u56DE\u7B54\u5DF2\u4FDD\u5B58\u5230 ${result.path}`);
        } catch (error) {
          new import_obsidian6.Notice("\u4FDD\u5B58\u56DE\u7B54\u5931\u8D25\uFF0C\u53EF\u70B9\u51FB\u91CD\u8BD5\uFF1A" + errorMessage2(error));
          throw error;
        }
      },
      onCopy: async () => {
        try {
          await navigator.clipboard.writeText(assistantMessage.content);
        } catch (error) {
          new import_obsidian6.Notice("\u590D\u5236\u56DE\u7B54\u5931\u8D25\uFF1A" + errorMessage2(error));
          throw error;
        }
      }
    });
  }
  attachLatestAssistantActions(bubble) {
    const assistantMessage = this.transcript[this.transcript.length - 1];
    const userMessage = this.transcript[this.transcript.length - 2];
    if ((userMessage == null ? void 0 : userMessage.role) !== "user" || (assistantMessage == null ? void 0 : assistantMessage.role) !== "assistant") return;
    this.attachAssistantActions(bubble, userMessage, assistantMessage);
  }
  getMultiPaperQuestion() {
    var _a, _b;
    const typed = (_b = (_a = this.inputEl) == null ? void 0 : _a.value) == null ? void 0 : _b.trim();
    return typed || "\u8BF7\u57FA\u4E8E\u5F53\u524D\u8BBA\u6587\u548C\u5DF2\u5F15\u7528\u8BBA\u6587\u56DE\u7B54\u6211\u7684\u95EE\u9898\u3002";
  }
  setAssistantBubbleMeta(bubble, author, context) {
    setTextByClass(bubble, "pdf-chat-message-author", author);
    setTextByClass(bubble, "pdf-chat-message-context", context);
  }
  multiPaperUserLabel(question) {
    const refs = this.referencedPdfFiles.map((file) => file.name || file.path).join("\u3001");
    return refs ? `\u591A\u8BBA\u6587\u95EE\u9898\uFF1A${question}

\u5F15\u7528\u8BBA\u6587\uFF1A${refs}` : `\u591A\u8BBA\u6587\u95EE\u9898\uFF1A${question}`;
  }
  async buildApiMultiPaperContext(question, progress) {
    const papers = this.selectedPaperFiles();
    const parts = [];
    for (const [index, { file, role }] of papers.entries()) {
      const alias = `P${index + 1}`;
      progress == null ? void 0 : progress(`\u6B63\u5728\u51C6\u5907 ${file.name || file.path} \u7684\u6458\u8981\u548C\u68C0\u7D22\u7247\u6BB5\u2026`);
      const summary = await this.services.papers.getOrCreateDocSummary(file, false);
      const chunksEntry = await this.services.papers.getOrCreateDocChunks(file, false);
      const retrieved = this.services.papers.retrieveContext(
        chunksEntry.chunks || [],
        [question],
        this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK
      );
      const evidence = retrieved.length ? retrieved.map((chunk) => {
        var _a;
        return `[${alias}, p.${chunk.page}] [chunk ${(_a = chunk.idx) != null ? _a : "?"}]
${chunk.text}`;
      }).join("\n\n") : "(\u672A\u68C0\u7D22\u5230\u660E\u663E\u76F8\u5173\u7247\u6BB5)";
      parts.push(
        [
          `## [${alias}] ${role === "current" ? "\u5F53\u524D\u8BBA\u6587" : "\u5F15\u7528\u8BBA\u6587"}\uFF1A${file.name || file.path}`,
          `\u8DEF\u5F84\uFF1A${file.path}`,
          "### \u6458\u8981",
          summary.summary || "(\u65E0\u6458\u8981)",
          "### \u53EF\u80FD\u76F8\u5173\u7247\u6BB5",
          evidence
        ].join("\n")
      );
    }
    return [
      "\u4F60\u6B63\u5728\u540C\u65F6\u9605\u8BFB\u591A\u7BC7\u8BBA\u6587\u3002\u4E0B\u9762\u662F\u591A\u7BC7\u8BBA\u6587\u9605\u8BFB\u4E0A\u4E0B\u6587\uFF0C\u8BF7\u53EA\u57FA\u4E8E\u63D0\u4F9B\u7684\u8BBA\u6587\u6458\u8981\u548C\u68C0\u7D22\u7247\u6BB5\u56DE\u7B54\u7528\u6237\u95EE\u9898\u3002",
      "\u4E0D\u8981\u9ED8\u8BA4\u6539\u5199\u7528\u6237\u95EE\u9898\uFF1B\u53EA\u6709\u5F53\u7528\u6237\u660E\u786E\u8981\u6C42\u8DE8\u8BBA\u6587\u5173\u7CFB\u5206\u6790\u65F6\uFF0C\u624D\u7EC4\u7EC7\u6210\u5173\u7CFB\u5206\u6790\u5F0F\u56DE\u7B54\u3002",
      "\u9700\u8981\u533A\u5206\u4F9D\u636E\u65F6\uFF0C\u8BF7\u6807\u660E\u6765\u81EA\u54EA\u7BC7\u8BBA\u6587\u3002",
      "\u5982\u679C\u8BC1\u636E\u4E0D\u8DB3\uFF0C\u8BF7\u660E\u786E\u8BF4\u660E\u4E0D\u8DB3\uFF0C\u4E0D\u8981\u7F16\u9020\u3002",
      "",
      parts.join("\n\n---\n\n")
    ].join("\n");
  }
  requestSelectionDecision(request) {
    return requestSelectionLimitDecision(this.app, request.textLength, request.limit);
  }
  async resolveTurnSelection() {
    const budget = this.plugin.settings.contextBudget || DEFAULT_SETTINGS.contextBudget;
    return resolveSelectionForTurn(
      this.contextText,
      budget.maxSelectionChars,
      (request) => this.requestSelectionDecision(request)
    );
  }
  async composeApiContext(question, currentContext, selection) {
    var _a, _b, _c, _d, _e;
    const budget = this.plugin.settings.contextBudget || DEFAULT_SETTINGS.contextBudget;
    const session = this.currentSessionId ? (_b = (_a = this.services.conversations).getSession) == null ? void 0 : _b.call(_a, this.currentSessionId) : (_d = (_c = this.services.conversations).getActiveSession) == null ? void 0 : _d.call(_c, this.conversationKey);
    const citationInstructions = buildEvidenceCitationInstructions(this.evidencePromptSources());
    const system = [this.buildSystemMessage(selection.text).content, citationInstructions].filter(Boolean).join("\n\n");
    const maxInputChars = selection.kind === "all" && selection.oversized ? Math.max(budget.maxInputChars, system.length + question.length + 2) : budget.maxInputChars;
    const compose = (memory) => composeBoundedContext({
      system,
      transcript: this.transcript,
      currentUser: question,
      currentContext,
      memory,
      maxInputChars,
      minRecentTurns: budget.minRecentTurns
    });
    const initial = compose();
    if (!initial.omittedMessageCount) return initial;
    if ((session == null ? void 0 : session.memory) && session.memory.coveredMessageCount >= initial.omittedMessageCount) {
      return compose(session.memory.content);
    }
    try {
      const memory = await summarizeSessionMemory({
        transcript: this.transcript,
        coveredMessageCount: initial.omittedMessageCount,
        llm: this.services.llm,
        modelProfile: this.services.models.get(
          this.plugin.settings.summaryModelId || this.currentModelId
        ),
        signal: (_e = this.abortController) == null ? void 0 : _e.signal
      });
      const writableSession = session || this.ensureCurrentSessionForWrite();
      if ((writableSession == null ? void 0 : writableSession.id) && this.services.conversations.updateSessionMetadata) {
        await this.services.conversations.updateSessionMetadata(writableSession.id, { memory });
      }
      return compose(memory.content);
    } catch (error) {
      if (!isAbortError2(error)) {
        new import_obsidian6.Notice("\u8F83\u65E9\u5BF9\u8BDD\u6458\u8981\u751F\u6210\u5931\u8D25\uFF0C\u672C\u8F6E\u4EC5\u643A\u5E26\u6700\u8FD1\u5BF9\u8BDD\u3002" + errorMessage2(error));
      }
      return initial;
    }
  }
  async completeApiMultiPaperAnswer(question, userLabel, bubble, selectionOverride) {
    var _a, _b;
    const currentContext = await this.buildApiMultiPaperContext(question, (message) => {
      var _a2;
      (_a2 = this.multiPaperStatusEl) == null ? void 0 : _a2.setText(message);
      setBubbleText(bubble, message);
    });
    const selection = selectionOverride || await this.resolveTurnSelection();
    if (selection.kind === "cancel") return;
    const composition = await this.composeApiContext(question, currentContext, selection);
    let fullText = "";
    let firstChunkArrived = false;
    fullText = await this.services.llm.chat({
      messages: composition.messages,
      onChunk: (_piece, acc) => {
        fullText = acc;
        if (!firstChunkArrived) {
          firstChunkArrived = true;
          bubble.removeClass("is-loading");
        }
        setBubbleText(bubble, acc);
        this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
      },
      signal: (_a = this.abortController) == null ? void 0 : _a.signal,
      modelProfile: this.services.models.get(this.currentModelId)
    });
    bubble.removeClass("is-loading");
    bubble.addClass("is-rendered");
    await renderMarkdownIntoBubble(this.app, this.plugin, bubble, fullText);
    this.messages.push({ role: "user", content: userLabel }, { role: "assistant", content: fullText });
    await this.recordTranscriptTurn(
      userLabel,
      fullText,
      "complete",
      this.parseAnswerEvidence(fullText)
    );
    this.attachLatestAssistantActions(bubble);
    this.showFollowupSuggestions("chat");
    (_b = this.multiPaperStatusEl) == null ? void 0 : _b.setText("\u5DF2\u6539\u7528\u5F53\u524D\u6A21\u578B\u57FA\u4E8E\u591A\u8BBA\u6587\u4E0A\u4E0B\u6587\u56DE\u7B54\u3002");
  }
  async prepareCodexPdfFiles(progress) {
    const prepared = [];
    const usedIds = /* @__PURE__ */ new Map();
    for (const { file, role } of this.selectedPaperFiles()) {
      progress == null ? void 0 : progress(`\u6B63\u5728\u590D\u5236 ${file.name || file.path} \u5230 Codex \u4E34\u65F6\u76EE\u5F55\u2026`);
      const originalPdfBuffer = await this.app.vault.readBinary(file);
      const baseId = file.path || file.name || `paper-${prepared.length + 1}`;
      const seen = usedIds.get(baseId) || 0;
      usedIds.set(baseId, seen + 1);
      prepared.push({
        id: seen ? `${baseId}-${seen + 1}` : baseId,
        role,
        name: file.name || file.path,
        vaultPath: file.path,
        mtime: file.stat && file.stat.mtime,
        originalPdfData: new Uint8Array(originalPdfBuffer)
      });
    }
    return prepared;
  }
  async prepareCodexTextAssets(progress) {
    const prepared = [];
    const usedIds = /* @__PURE__ */ new Map();
    for (const { file, role } of this.selectedPaperFiles()) {
      progress == null ? void 0 : progress(`\u6B63\u5728\u62BD\u53D6 ${file.name || file.path} \u7684\u5168\u6587\u3001\u5206\u9875\u6587\u672C\u548C\u7F13\u5B58\u8D44\u4EA7\u2026`);
      const [pages, summary, chunksEntry, originalPdfBuffer] = await Promise.all([
        this.services.papers.extractPages(file),
        this.services.papers.getOrCreateDocSummary(file, false),
        this.services.papers.getOrCreateDocChunks(file, false),
        this.app.vault.readBinary(file)
      ]);
      const baseId = file.path || file.name || `paper-${prepared.length + 1}`;
      const seen = usedIds.get(baseId) || 0;
      usedIds.set(baseId, seen + 1);
      prepared.push({
        id: seen ? `${baseId}-${seen + 1}` : baseId,
        role,
        name: file.name || file.path,
        vaultPath: file.path,
        mtime: file.stat && file.stat.mtime,
        summary: summary.summary || "",
        chunks: chunksEntry.chunks || [],
        pages,
        originalPdfData: new Uint8Array(originalPdfBuffer)
      });
    }
    return prepared;
  }
  async runCodexDeepAnalysis(questionOverride) {
    var _a, _b, _c;
    if (!this.plugin.settings.codexDeepAnalysis.enabled) {
      new import_obsidian6.Notice("\u9700\u8981\u5148\u5728 PDF Chat \u8BBE\u7F6E\u4E2D\u542F\u7528 Codex CLI\u3002");
      return;
    }
    if (this.isSending) return;
    const question = questionOverride && questionOverride.trim() || this.getMultiPaperQuestion();
    const selection = this.shouldAttachSelectionContext() ? await this.resolveTurnSelection() : { kind: "all", text: "", oversized: false };
    if (selection.kind === "cancel") return;
    if (this.getCodexInputMode() === "debug-full") {
      await this.runLegacyCodexDebugAnalysis(question, selection);
      return;
    }
    const runtime = this.services.codex;
    if (!runtime) {
      new import_obsidian6.Notice("Codex \u4F1A\u8BDD\u7BA1\u7406\u5668\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u63D2\u4EF6\u3002");
      return;
    }
    this.enterCodexMode();
    const session = this.ensureCurrentSessionForWrite();
    this.currentSessionId = (session == null ? void 0 : session.id) || this.currentSessionId;
    if (!this.currentSessionId) {
      new import_obsidian6.Notice("\u65E0\u6CD5\u521B\u5EFA Codex \u4F1A\u8BDD\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00 PDF Chat\u3002");
      return;
    }
    const papers = this.selectedPaperFiles().map(({ file, role }) => {
      const location = resolveCodexPdfLocation(this.app, file.path);
      return {
        role,
        name: file.name || file.path,
        absolutePath: location.absolutePath
      };
    });
    const currentLocation = this.pdfFile ? resolveCodexPdfLocation(this.app, this.pdfFile.path) : null;
    const adapter = (_a = this.app.vault) == null ? void 0 : _a.adapter;
    const workingDirectory = (currentLocation == null ? void 0 : currentLocation.workingDirectory) || ((_b = adapter == null ? void 0 : adapter.getBasePath) == null ? void 0 : _b.call(adapter)) || ".";
    const selectedContext = selection.text;
    const turnPrompt = buildCodexTurnPrompt({ question, papers, selectedContext });
    const forkHandoff = (session == null ? void 0 : session.parentSessionId) && !((_c = session.codex) == null ? void 0 : _c.threadId) ? formatCodexForkHandoff(session) : "";
    const prompt = forkHandoff ? `${forkHandoff}

${turnPrompt}` : turnPrompt;
    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.clearComposerInput();
    this.rememberPromptHistory(question);
    this.attachCodexRuntime(this.currentSessionId);
    void runtime.startTurn({
      sessionId: this.currentSessionId,
      question,
      userContent: question,
      prompt,
      command: this.plugin.settings.codexDeepAnalysis.command || DEFAULT_SETTINGS.codexDeepAnalysis.command,
      workingDirectory,
      attachedPdfPaths: this.selectedPaperFiles().map(({ file }) => file.path),
      selectionChars: selectedContext.length,
      profile: this.plugin.settings.codexDeepAnalysis.profile || "",
      model: this.getCodexModel(),
      reasoningEffort: this.getCodexReasoningEffort(),
      verbosity: this.plugin.settings.codexDeepAnalysis.verbosity || DEFAULT_SETTINGS.codexDeepAnalysis.verbosity,
      timeoutMs: this.plugin.settings.codexDeepAnalysis.timeoutMs || DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs
    }).catch((error) => {
      new import_obsidian6.Notice("Codex \u542F\u52A8\u5931\u8D25: " + errorMessage2(error));
    });
  }
  async runLegacyCodexDebugAnalysis(questionOverride, selectionOverride) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!this.pdfFile) {
      new import_obsidian6.Notice("Codex \u6DF1\u5EA6\u5206\u6790\u9700\u8981\u4ECE PDF \u89C6\u56FE\u6253\u5F00\u3002");
      return;
    }
    if (!this.plugin.settings.codexDeepAnalysis.enabled) {
      new import_obsidian6.Notice("\u9700\u8981\u5148\u5728 PDF Chat \u8BBE\u7F6E\u4E2D\u542F\u7528 Codex CLI \u6DF1\u5EA6\u5206\u6790\u3002");
      (_a = this.multiPaperStatusEl) == null ? void 0 : _a.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5C1A\u672A\u542F\u7528\u3002");
      return;
    }
    if (this.isSending) return;
    const question = questionOverride && questionOverride.trim() || this.getMultiPaperQuestion();
    const userLabel = this.multiPaperUserLabel(question);
    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.addBubble("user", userLabel);
    this.inputEl.value = "";
    if (this.inputEl.style) this.inputEl.style.height = "";
    this.setSendingState(true);
    this.isCodexRunning = true;
    const inputMode = this.getCodexInputMode();
    const loadingBubble = this.addBubble("assistant", `\u6B63\u5728\u51C6\u5907 Codex ${this.codexInputModeLabel()} \u5206\u6790\u5305\u2026`, {
      loading: true,
      assistantAuthor: "Codex CLI",
      assistantContext: this.codexMetaText(),
      assistantClass: "is-codex-response"
    });
    this.abortController = new AbortController();
    let analysisDir = "";
    let codexTimeoutMs = DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs;
    let codexProgressTimer = null;
    const codexStartedAt = Date.now();
    let codexProgressDetail = `\u6B63\u5728\u51C6\u5907 Codex ${this.codexInputModeLabel()} \u5206\u6790\u5305\u2026`;
    const stopCodexProgressTimer = () => {
      if (!codexProgressTimer) return;
      clearInterval(codexProgressTimer);
      codexProgressTimer = null;
    };
    const updateCodexProgress = (detail) => {
      var _a2;
      if (detail) codexProgressDetail = detail;
      const elapsedMs = Date.now() - codexStartedAt;
      const bubbleText = codexProgressBubbleText(elapsedMs, codexProgressDetail);
      setBubbleText(loadingBubble, bubbleText);
      (_a2 = this.multiPaperStatusEl) == null ? void 0 : _a2.setText(`Codex \u5DF2\u8FD0\u884C ${formatCodexElapsed(elapsedMs)} \xB7 ${codexProgressDetail}`);
    };
    try {
      const taskId = String(Date.now());
      const papers = inputMode === "debug-full" ? await this.prepareCodexTextAssets((message) => {
        var _a2;
        (_a2 = this.multiPaperStatusEl) == null ? void 0 : _a2.setText(message);
        setBubbleText(loadingBubble, message);
      }) : await this.prepareCodexPdfFiles((message) => {
        var _a2;
        (_a2 = this.multiPaperStatusEl) == null ? void 0 : _a2.setText(message);
        setBubbleText(loadingBubble, message);
      });
      analysisDir = createCodexAnalysisTempDir(taskId);
      const packageRequest = {
        baseDir: analysisDir,
        taskId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        question,
        papers,
        selectedContext: (selectionOverride == null ? void 0 : selectionOverride.text) || ""
      };
      let selectedContextPath;
      if (inputMode === "debug-full") {
        const codexPackage = await writeCodexDebugFullPackage(packageRequest);
        selectedContextPath = codexPackage.selectedContextPath;
      } else {
        const codexPackage = await writeCodexAnalysisPackage(packageRequest);
        selectedContextPath = codexPackage.selectedContextPath;
      }
      const settings = this.plugin.settings.codexDeepAnalysis;
      codexTimeoutMs = settings.timeoutMs || DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs;
      const outputMode = this.getCodexOutputMode();
      if (outputMode === "json-schema" && inputMode !== "debug-full") writeCodexOutputSchema(analysisDir);
      const outputFileName = outputMode === "json-schema" ? "codex-output.json" : "codex-output.md";
      const execArgs = buildCodexExecArgs({
        analysisDir,
        command: settings.command || DEFAULT_SETTINGS.codexDeepAnalysis.command,
        profile: settings.profile,
        model: settings.model || DEFAULT_SETTINGS.codexDeepAnalysis.model,
        reasoningEffort: settings.reasoningEffort || DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort,
        verbosity: settings.verbosity || DEFAULT_SETTINGS.codexDeepAnalysis.verbosity,
        outputMode,
        outputFileName,
        prompt: outputMode === "json-schema" ? inputMode === "debug-full" ? buildCodexDebugFullPrompt() : buildCodexPdfOnlyPrompt(question, papers, { selectedContextPath }) : inputMode === "debug-full" ? buildCodexDebugFullMarkdownPrompt() : buildCodexMarkdownPrompt(question, papers, { selectedContextPath })
      });
      const runningMessage = `Codex \u6B63\u5728\u8BFB\u53D6 ${papers.length} \u7BC7 PDF${selectedContextPath ? " + \u9009\u533A\u4E0A\u4E0B\u6587" : ""} \xB7 ${this.codexInputModeLabel()} \xB7 ${this.codexOutputModeLabel()}\u2026`;
      updateCodexProgress(runningMessage);
      codexProgressTimer = setInterval(() => updateCodexProgress(), 1e3);
      const raw = await runCodexExec(execArgs, {
        timeoutMs: codexTimeoutMs,
        outputFileName,
        signal: this.abortController.signal,
        onProgress: (progress) => {
          updateCodexProgress(progress.message);
        }
      });
      stopCodexProgressTimer();
      const markdown = outputMode === "json-schema" ? renderCodexAnalysisMarkdown(parseCodexAnalysisOutput(raw)) : parseCodexMarkdownOutput(raw);
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, markdown);
      this.messages.push({ role: "user", content: userLabel }, { role: "assistant", content: markdown });
      await this.recordTranscriptTurn(
        userLabel,
        markdown,
        "complete",
        this.parseAnswerEvidence(markdown)
      );
      this.attachLatestAssistantActions(loadingBubble);
      this.showFollowupSuggestions("chat");
      (_b = this.multiPaperStatusEl) == null ? void 0 : _b.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5DF2\u5B8C\u6210\u3002");
    } catch (error) {
      stopCodexProgressTimer();
      loadingBubble.removeClass("is-loading");
      if (isAbortError2(error)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, "Codex \u6DF1\u5EA6\u5206\u6790\u5DF2\u505C\u6B62\u3002");
        (_c = this.multiPaperStatusEl) == null ? void 0 : _c.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5DF2\u505C\u6B62\u3002");
      } else if (isCodexUnavailableError(error)) {
        this.setAssistantBubbleMeta(loadingBubble, "PDF Chat API", this.codexMetaText(true));
        setBubbleText(loadingBubble, "Codex CLI \u4E0D\u53EF\u7528\uFF0C\u6B63\u5728\u6539\u7528\u5F53\u524D\u6A21\u578B\u57FA\u4E8E\u591A\u8BBA\u6587\u4E0A\u4E0B\u6587\u56DE\u7B54\u2026");
        (_d = this.multiPaperStatusEl) == null ? void 0 : _d.setText("Codex \u4E0D\u53EF\u7528\uFF0C\u6539\u7528\u5F53\u524D\u6A21\u578B\u56DE\u7B54\u3002");
        try {
          await this.completeApiMultiPaperAnswer(question, userLabel, loadingBubble, selectionOverride);
        } catch (fallbackError) {
          loadingBubble.removeClass("is-loading");
          loadingBubble.addClass("is-error");
          setBubbleText(loadingBubble, "\u591A\u8BBA\u6587\u4E0A\u4E0B\u6587\u56DE\u7B54\u4E5F\u5931\u8D25: " + errorMessage2(fallbackError));
          (_e = this.multiPaperStatusEl) == null ? void 0 : _e.setText("\u591A\u8BBA\u6587\u4E0A\u4E0B\u6587\u56DE\u7B54\u5931\u8D25\u3002");
        }
      } else if (isCodexTimeoutError(error)) {
        loadingBubble.addClass("is-error");
        setBubbleText(
          loadingBubble,
          `Codex \u6DF1\u5EA6\u5206\u6790\u8D85\u8FC7 ${formatCodexElapsed(codexTimeoutMs)} \u540E\u5DF2\u505C\u6B62\u3002
\u53EF\u80FD\u662F Codex \u8BFB\u53D6 PDF \u6216\u9AD8\u5F3A\u5EA6\u63A8\u7406\u8017\u65F6\u8FC7\u957F\u3002\u53EF\u4EE5\u5207\u6362\u5230 /model gpt-5.5 medium\uFF0C\u51CF\u5C11\u5F15\u7528 PDF\uFF0C\u6216\u91CD\u8BD5\u3002`
        );
        (_f = this.multiPaperStatusEl) == null ? void 0 : _f.setText(`Codex \u8D85\u8FC7 ${formatCodexElapsed(codexTimeoutMs)} \u540E\u505C\u6B62\u3002`);
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "Codex \u6DF1\u5EA6\u5206\u6790\u5931\u8D25: " + errorMessage2(error));
        (_g = this.multiPaperStatusEl) == null ? void 0 : _g.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5931\u8D25\uFF0C\u53EF\u6539\u7528\u5F53\u524D\u6A21\u578B\u56DE\u7B54\u3002");
      }
    } finally {
      stopCodexProgressTimer();
      const keep = this.plugin.settings.codexDeepAnalysis.keepTempFiles;
      if (analysisDir && !keep) {
        try {
          removeCodexAnalysisTempDir(analysisDir);
        } catch (error) {
          void error;
        }
      }
      this.setSendingState(false);
      this.isCodexRunning = false;
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  setupDragging(handleEl) {
    handleEl.addClass("pdf-chat-drag-handle");
    handleEl.addEventListener("mousedown", (evt) => {
      if (evt.target instanceof Element && evt.target.closest("button, select, input, textarea, label, .pdf-chat-interactive")) {
        return;
      }
      evt.preventDefault();
      const modalEl = this.modalEl;
      const doc = modalEl.ownerDocument;
      const rect = modalEl.getBoundingClientRect();
      modalEl.style.position = "fixed";
      modalEl.style.margin = "0";
      modalEl.style.left = rect.left + "px";
      modalEl.style.top = rect.top + "px";
      const startX = evt.clientX;
      const startY = evt.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      const onMouseMove = (moveEvt) => {
        modalEl.style.left = startLeft + (moveEvt.clientX - startX) + "px";
        modalEl.style.top = startTop + (moveEvt.clientY - startY) + "px";
      };
      const onMouseUp = () => {
        doc.removeEventListener("mousemove", onMouseMove);
        doc.removeEventListener("mouseup", onMouseUp);
      };
      doc.addEventListener("mousemove", onMouseMove);
      doc.addEventListener("mouseup", onMouseUp);
    });
  }
  stopGenerating() {
    var _a;
    if (this.isCodexRunning && this.currentSessionId && ((_a = this.services.codex) == null ? void 0 : _a.stopTurn(this.currentSessionId))) {
      return;
    }
    if (this.abortController) {
      this.abortController.abort();
    }
  }
  setSendingState(sending) {
    this.isSending = sending;
    if (sending) this.hideFollowupSuggestions();
    this.sendBtn.setText(sending ? "\u505C\u6B62" : "\u2191");
    this.sendBtn.toggleClass("is-stop", sending);
    labelControl(this.sendBtn, sending ? "\u505C\u6B62\u751F\u6210" : "\u53D1\u9001\u95EE\u9898");
  }
  stopCodexUiTimer() {
    if (!this.codexProgressTimer) return;
    clearInterval(this.codexProgressTimer);
    this.codexProgressTimer = void 0;
  }
  updateCodexProgressBubble(snapshot) {
    var _a;
    if (!this.codexTaskBubble || snapshot.status !== "running") return;
    const elapsed = snapshot.startedAt ? Date.now() - snapshot.startedAt : 0;
    setBubbleText(
      this.codexTaskBubble,
      `Codex \u6B63\u5728\u8FD0\u884C ${formatCodexElapsed(elapsed)}
${snapshot.progress || "\u6B63\u5728\u7B49\u5F85 Codex CLI \u4E8B\u4EF6\u2026"}`
    );
    this.setAssistantBubbleMeta(
      this.codexTaskBubble,
      "Codex CLI",
      `${this.getCodexModel()} \xB7 ${this.getCodexReasoningEffort()} \xB7 Thread ${snapshot.threadId || "starting"}`
    );
    (_a = this.multiPaperStatusEl) == null ? void 0 : _a.setText(
      `Codex ${snapshot.threadId ? `Thread ${snapshot.threadId.slice(0, 8)}\u2026` : "\u6B63\u5728\u542F\u52A8"} \xB7 ${formatCodexElapsed(elapsed)}`
    );
    if (this.modeBadgeEl) {
      this.modeBadgeEl.setText(
        `CODEX MODE \xB7 ${this.getCodexModel()} \xB7 ${this.getCodexReasoningEffort()} \xB7 ${snapshot.threadId ? `Thread ${snapshot.threadId.slice(0, 8)}\u2026` : "New thread"} \xB7 Running ${formatCodexElapsed(elapsed)}`
      );
    }
  }
  async applyCodexSnapshot(snapshot) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    if (snapshot.sessionId !== this.currentSessionId) return;
    this.lastCodexSnapshot = snapshot;
    if (snapshot.status === "running") {
      this.isCodexRunning = true;
      this.setSendingState(true);
      this.hideFollowupSuggestions();
      if (!this.codexTaskBubble || this.codexTaskQuestion !== snapshot.question) {
        (_a = this.emptyStateEl) == null ? void 0 : _a.remove();
        this.emptyStateEl = void 0;
        if (snapshot.question) this.addBubble("user", snapshot.question);
        this.codexTaskQuestion = snapshot.question;
        this.codexTaskBubble = this.addBubble("assistant", "Codex \u6B63\u5728\u542F\u52A8\u2026", {
          loading: true,
          assistantAuthor: "Codex CLI",
          assistantContext: this.codexMetaText(),
          assistantClass: "is-codex-response"
        });
      }
      this.updateCodexProgressBubble(snapshot);
      if (!this.codexProgressTimer) {
        this.codexProgressTimer = setInterval(() => {
          if (this.lastCodexSnapshot) this.updateCodexProgressBubble(this.lastCodexSnapshot);
        }, 1e3);
      }
      return;
    }
    this.stopCodexUiTimer();
    this.isCodexRunning = false;
    this.setSendingState(false);
    this.updateRuntimeModeUi();
    if (snapshot.finalMarkdown) {
      const session = (_c = (_b = this.services.conversations).getSession) == null ? void 0 : _c.call(_b, snapshot.sessionId);
      if (session) {
        const assistantMessage = session.messages[session.messages.length - 1];
        if ((assistantMessage == null ? void 0 : assistantMessage.role) === "assistant" && assistantMessage.content === snapshot.finalMarkdown && !((_d = assistantMessage.evidence) == null ? void 0 : _d.length)) {
          const evidence = this.parseAnswerEvidence(snapshot.finalMarkdown);
          if (evidence.length) {
            assistantMessage.evidence = evidence;
            await ((_f = (_e = this.services.conversations).saveSessionById) == null ? void 0 : _f.call(
              _e,
              session.id,
              session.messages,
              this.sessionMetadata()
            ));
          }
        }
        this.transcript = [...session.messages];
        this.messages = [
          this.buildSystemMessage(),
          ...this.transcript.map((message) => ({ role: message.role, content: message.content }))
        ];
      }
      const alreadyVisible = !this.codexTaskBubble && ((_g = this.transcript[this.transcript.length - 1]) == null ? void 0 : _g.role) === "assistant" && ((_h = this.transcript[this.transcript.length - 1]) == null ? void 0 : _h.content) === snapshot.finalMarkdown;
      if (!alreadyVisible) {
        const bubble = this.codexTaskBubble || this.addBubble("assistant", "", {
          assistantAuthor: "Codex CLI",
          assistantContext: this.codexMetaText(),
          assistantClass: "is-codex-response"
        });
        bubble.removeClass("is-loading", "is-error", "is-stopped");
        bubble.addClass("is-rendered");
        this.setAssistantBubbleMeta(
          bubble,
          "Codex CLI",
          `${this.getCodexModel()} \xB7 ${this.getCodexReasoningEffort()} \xB7 Thread ${snapshot.threadId || "unknown"}`
        );
        await renderMarkdownIntoBubble(this.app, this.plugin, bubble, snapshot.finalMarkdown);
        this.attachLatestAssistantActions(bubble);
      }
      (_i = this.multiPaperStatusEl) == null ? void 0 : _i.setText("Codex \u672C\u8F6E\u56DE\u7B54\u5DF2\u5B8C\u6210\u3002");
      this.showFollowupSuggestions("chat");
    } else if (snapshot.status === "failed" || snapshot.status === "stopped") {
      const bubble = this.codexTaskBubble || this.addBubble("assistant", "", {
        assistantAuthor: "Codex CLI",
        assistantContext: this.codexMetaText(),
        assistantClass: "is-codex-response"
      });
      bubble.removeClass("is-loading");
      bubble.addClass(snapshot.status === "failed" ? "is-error" : "is-stopped");
      setBubbleText(
        bubble,
        snapshot.status === "failed" ? `Codex \u672C\u8F6E\u5931\u8D25\uFF1A${snapshot.error || snapshot.progress || "\u672A\u77E5\u9519\u8BEF"}` : snapshot.progress || "Codex \u672C\u8F6E\u5DF2\u505C\u6B62\uFF0C\u53EF\u7EE7\u7EED\u4F7F\u7528\u540C\u4E00 thread \u63D0\u95EE\u3002"
      );
      if (snapshot.status === "failed" && snapshot.recoveryReason) {
        const actions = getBubbleContentEl(bubble).createDiv({
          cls: "pdf-chat-codex-recovery-actions"
        });
        const historyButton = actions.createEl("button", {
          text: "\u67E5\u770B\u5386\u53F2",
          cls: "pdf-chat-codex-recovery-action",
          attr: { type: "button" }
        });
        labelControl(historyButton, "\u67E5\u770B\u5386\u53F2\u8BB0\u5F55");
        historyButton.addEventListener("click", () => this.showResumeMenu());
        const forkButton = actions.createEl("button", {
          text: "\u521B\u5EFA\u672C\u5730\u5206\u652F",
          cls: "pdf-chat-codex-recovery-action is-primary",
          attr: { type: "button" }
        });
        labelControl(forkButton, "\u521B\u5EFA\u672C\u5730\u5206\u652F\u5E76\u7EE7\u7EED\u8BA8\u8BBA");
        forkButton.addEventListener("click", () => this.showResumeMenu());
      }
      (_j = this.multiPaperStatusEl) == null ? void 0 : _j.setText(snapshot.progress || "Codex \u672C\u8F6E\u5DF2\u505C\u6B62\u3002");
    }
    this.codexTaskBubble = void 0;
    this.codexTaskQuestion = void 0;
    (_k = this.inputEl) == null ? void 0 : _k.focus();
  }
  attachCodexRuntime(sessionId) {
    var _a;
    const runtime = this.services.codex;
    if (!runtime) return;
    (_a = this.codexUnsubscribe) == null ? void 0 : _a.call(this);
    this.codexUnsubscribe = runtime.subscribe(sessionId, (snapshot) => {
      void this.applyCodexSnapshot(snapshot);
    });
  }
  handleTranslate() {
    void this.services.actions.execute("translate", {
      translate: () => this.runTranslation()
    });
  }
  async runTranslation() {
    if (!this.contextText || this.isSending) return;
    this.hideFollowupSuggestions();
    const friendlyLabel = `\u7FFB\u8BD1\u5F53\u524D\u9009\u533A\uFF08${this.contextText.length} \u5B57\uFF09`;
    this.addBubble("user", friendlyLabel);
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "\u6B63\u5728\u7FFB\u8BD1\u2026", { loading: true });
    this.abortController = new AbortController();
    let fullText = "";
    try {
      const result = await this.services.translations.translate({
        source: this.contextText,
        settings: this.plugin.settings.translation,
        modelProfile: this.services.models.get(this.services.models.resolveTranslateId()),
        signal: this.abortController.signal,
        onChunk: (progress) => {
          fullText = progress.combinedText;
          loadingBubble.removeClass("is-loading");
          const progressText = progress.chunkCount > 1 ? `${progress.combinedText}

\u6B63\u5728\u7FFB\u8BD1 ${progress.chunkIndex}/${progress.chunkCount}\u2026` : progress.combinedText;
          setBubbleText(loadingBubble, progressText);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        }
      });
      fullText = result.text;
      loadingBubble.removeClass("is-loading");
      if (!fullText.trim()) {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u7FFB\u8BD1\u672A\u8FD4\u56DE\u5185\u5BB9");
        return;
      }
      const hasFallbackChunks = result.failedChunkIndexes.length > 0;
      const isPartial = result.stoppedEarly || hasFallbackChunks;
      const status = isPartial ? "stopped" : "complete";
      if (isPartial) {
        const notices = [];
        if (result.stoppedEarly) notices.push("[\u5DF2\u505C\u6B62\u751F\u6210]");
        if (hasFallbackChunks) notices.push("[\u90E8\u5206\u5206\u5757\u7FFB\u8BD1\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u539F\u6587]");
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, fullText + "\n\n" + notices.join("\n"));
      } else {
        loadingBubble.addClass("is-rendered");
        await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      }
      await this.recordTranslateTurn(friendlyLabel, fullText, status);
      this.activeComposerKind = "translate";
      if (!isPartial) this.showFollowupSuggestions("translate");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError2(err) && fullText.trim()) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, fullText + "\n\n[\u5DF2\u505C\u6B62\u751F\u6210]");
        await this.recordTranslateTurn(friendlyLabel, fullText, "stopped");
        this.activeComposerKind = "translate";
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u7FFB\u8BD1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6A21\u578B\u914D\u7F6E\u6216\u7A0D\u540E\u91CD\u8BD5\u3002");
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  async handleTranslateFollowup(question, usingOverride) {
    this.hideFollowupSuggestions();
    this.addBubble("user", question);
    if (!usingOverride) {
      this.inputEl.value = "";
      if (this.inputEl.style) this.inputEl.style.height = "";
    }
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "\u601D\u8003\u4E2D\u2026", { loading: true });
    this.abortController = new AbortController();
    let fullText = "";
    let firstChunkArrived = false;
    const requestMessages = [
      this.buildSystemMessage(),
      ...this.translateTranscript.map((message) => ({
        role: message.role,
        content: message.content
      })),
      { role: "user", content: question }
    ];
    try {
      fullText = await this.services.llm.chat({
        messages: requestMessages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          setBubbleText(loadingBubble, acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: this.abortController.signal,
        modelProfile: this.services.models.get(this.currentModelId)
      });
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranslateTurn(question, fullText, "complete");
      this.activeComposerKind = "translate";
      this.showFollowupSuggestions("translate");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError2(err)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, (fullText || "") + "\n\n[\u5DF2\u505C\u6B62\u751F\u6210]");
        if (fullText) await this.recordTranslateTurn(question, fullText, "stopped");
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u8BF7\u6C42\u5931\u8D25: " + errorMessage2(err));
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  async handleSubmit(options = {}) {
    const opts = options || {};
    const usingOverride = typeof opts.question === "string";
    const question = typeof opts.question === "string" ? opts.question.trim() : this.inputEl.value.trim();
    if (!question) return;
    if (!usingOverride) this.rememberPromptHistory(question);
    if (await this.handleSlashCommand(question, usingOverride)) {
      return;
    }
    if (this.isSending) {
      new import_obsidian6.Notice("\u4E0A\u4E00\u4E2A\u95EE\u9898\u8FD8\u5728\u751F\u6210\u4E2D,\u8BF7\u7A0D\u5019\u6216\u70B9\u51FB\u505C\u6B62");
      return;
    }
    if (!usingOverride && this.runtimeMode === "codex") {
      await this.runCodexDeepAnalysis(question);
      return;
    }
    if (this.activeComposerKind === "translate" && this.translateTranscript.length) {
      await this.handleTranslateFollowup(question, usingOverride);
      return;
    }
    const selection = await this.resolveTurnSelection();
    if (selection.kind === "cancel") return;
    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.addBubble("user", question);
    if (!usingOverride) {
      this.inputEl.value = "";
      if (this.inputEl.style) this.inputEl.style.height = "";
    }
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "\u601D\u8003\u4E2D\u2026", { loading: true });
    const abortController = new AbortController();
    this.abortController = abortController;
    let currentContext = opts.outgoingContentOverride || "";
    if (opts.outgoingContentOverride) {
    } else if (opts.skipContextAugmentation) {
    } else if (this.referencedPdfFiles.length) {
      setBubbleText(loadingBubble, "\u6B63\u5728\u51C6\u5907\u591A\u8BBA\u6587\u4E0A\u4E0B\u6587\u2026");
      try {
        currentContext = await this.buildApiMultiPaperContext(question, (message) => {
          var _a;
          (_a = this.multiPaperStatusEl) == null ? void 0 : _a.setText(message);
          setBubbleText(loadingBubble, message);
        });
      } catch (err) {
        new import_obsidian6.Notice("\u591A\u8BBA\u6587\u4E0A\u4E0B\u6587\u51C6\u5907\u5931\u8D25\uFF0C\u5DF2\u9000\u56DE\u5F53\u524D\u95EE\u9898: " + errorMessage2(err));
        currentContext = "";
      }
      setBubbleText(loadingBubble, "\u601D\u8003\u4E2D\u2026");
    } else if (this.useRag && this.useFullTextMode && this.pdfFile) {
      setBubbleText(loadingBubble, "\u6B63\u5728\u8BFB\u53D6\u5168\u6587\u2026");
      try {
        if (!this.fullTextForQA) {
          this.fullTextForQA = await this.services.papers.extractFullText(this.pdfFile);
        }
        currentContext = "\u3010\u8BBA\u6587\u5168\u6587\u3011:\n" + this.fullTextForQA;
        this.fullTextAttached = true;
      } catch (err) {
      }
      setBubbleText(loadingBubble, "\u601D\u8003\u4E2D\u2026");
    } else if (!this.useFullTextMode && this.useRag && this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length) {
      const retrievalQueries = [question];
      if (this.plugin.settings.ragQueryTranslate) {
        setBubbleText(loadingBubble, "\u6B63\u5728\u601D\u8003\u68C0\u7D22\u89D2\u5EA6\u2026");
        try {
          const variants = await this.services.papers.planRagQueries(question);
          if (variants && variants.length) retrievalQueries.push(...variants);
        } catch (err) {
        }
      }
      const topK = this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK;
      const expanded = this.services.papers.retrieveContext(
        this.docChunksEntry.chunks,
        retrievalQueries,
        topK
      );
      if (expanded.length) {
        const retrievedText = expanded.map((c) => `[\u7B2C${c.page}\u9875]
${c.text}`).join("\n\n---\n\n");
        currentContext = "\u3010\u4ECE\u5168\u6587\u4E2D\u6309\u5173\u952E\u8BCD\u68C0\u7D22\u5230\u7684\u53EF\u80FD\u76F8\u5173\u7247\u6BB5(\u4E0D\u4E00\u5B9A\u5B8C\u5168\u51C6\u786E,\u4EC5\u4F9B\u53C2\u8003)\u3011:\n" + retrievedText;
      }
      setBubbleText(loadingBubble, "\u601D\u8003\u4E2D\u2026");
    }
    const composition = await this.composeApiContext(question, currentContext, selection);
    if (composition.currentInputTruncated) {
      new import_obsidian6.Notice("\u672C\u8F6E\u8BBA\u6587\u4E0A\u4E0B\u6587\u8D85\u8FC7\u8F93\u5165\u9884\u7B97\uFF0C\u5DF2\u4FDD\u7559\u95EE\u9898\u5E76\u622A\u53D6\u53EF\u53D1\u9001\u7684\u4E0A\u4E0B\u6587\u3002");
    }
    this.messages.push({ role: "user", content: question });
    let fullText = "";
    let firstChunkArrived = false;
    try {
      fullText = await this.services.llm.chat({
        messages: composition.messages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          setBubbleText(loadingBubble, acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: abortController.signal,
        modelProfile: this.services.models.get(this.currentModelId)
      });
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      this.messages.push({ role: "assistant", content: fullText });
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranscriptTurn(
        question,
        fullText,
        "complete",
        this.parseAnswerEvidence(fullText)
      );
      this.attachLatestAssistantActions(loadingBubble);
      this.showFollowupSuggestions("chat");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError2(err)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, (fullText || "") + "\n\n[\u5DF2\u505C\u6B62\u751F\u6210]");
        if (fullText) {
          this.messages.push({ role: "assistant", content: fullText });
          await this.recordTranscriptTurn(question, fullText, "stopped");
        } else {
          this.messages.pop();
        }
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u8BF7\u6C42\u5931\u8D25: " + errorMessage2(err));
        this.messages.pop();
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  addBubble(role, text, opts = {}) {
    this.removeEmptyState();
    const bubble = this.historyEl.createDiv({ cls: `pdf-chat-bubble ${role}` });
    const compatibleBubble = bubble;
    if (typeof compatibleBubble.setAttr === "function") {
      compatibleBubble.setAttr("aria-label", role === "user" ? "\u4F60\u7684\u6D88\u606F" : `${opts.assistantAuthor || "PDF Chat"} \u7684\u6D88\u606F`);
    } else if (typeof compatibleBubble.setAttribute === "function") {
      compatibleBubble.setAttribute("aria-label", role === "user" ? "\u4F60\u7684\u6D88\u606F" : `${opts.assistantAuthor || "PDF Chat"} \u7684\u6D88\u606F`);
    }
    if (opts && opts.loading) bubble.addClass("is-loading");
    if (opts.assistantClass) bubble.addClass(opts.assistantClass);
    if (!canCreateBubbleChildren(bubble)) {
      setBubbleText(bubble, text);
    } else if (role === "assistant") {
      const meta = createBubbleDiv(bubble, { cls: "pdf-chat-message-meta" });
      meta.createEl("span", { text: opts.assistantAuthor || "PDF Chat", cls: "pdf-chat-message-author" });
      meta.createEl("span", {
        text: opts.assistantContext || "\u57FA\u4E8E\u5F53\u524D\u8BBA\u6587\u4E0A\u4E0B\u6587",
        cls: "pdf-chat-message-context"
      });
      bubble.pdfChatContentEl = createBubbleDiv(bubble, { cls: "pdf-chat-message-content" });
      setBubbleText(bubble, text);
    } else {
      const translationDisplay = formatTranslationUserDisplay(text);
      bubble.pdfChatContentEl = createBubbleDiv(bubble, { cls: "pdf-chat-message-content" });
      if (translationDisplay) {
        bubble.addClass("is-translation-request");
        createBubbleDiv(bubble.pdfChatContentEl, {
          text: translationDisplay.title,
          cls: "pdf-chat-user-message-title"
        });
        if (translationDisplay.meta) {
          createBubbleDiv(bubble.pdfChatContentEl, {
            text: translationDisplay.meta,
            cls: "pdf-chat-user-message-meta"
          });
        }
      } else {
        setBubbleText(bubble, text);
      }
    }
    if (!(opts && opts.skipScroll)) {
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    }
    return bubble;
  }
  onClose() {
    var _a, _b;
    (_a = this.codexUnsubscribe) == null ? void 0 : _a.call(this);
    this.codexUnsubscribe = void 0;
    this.stopCodexUiTimer();
    const terminateCodex = this.codexCloseIntent === "terminate" && this.runtimeMode === "codex" && !!this.currentSessionId;
    if (terminateCodex && this.currentSessionId) {
      void ((_b = this.services.codex) == null ? void 0 : _b.closeSession(this.currentSessionId));
      new import_obsidian6.Notice("Codex \u4F1A\u8BDD\u5DF2\u5173\u95ED\uFF1B\u5386\u53F2\u4E0E thread \u5DF2\u4FDD\u7559\uFF0C\u53EF\u901A\u8FC7 /resume \u627E\u56DE\u3002");
    } else if (this.isCodexRunning) {
      new import_obsidian6.Notice("Codex \u4ECD\u5728\u540E\u53F0\u8FD0\u884C\uFF0C\u5B8C\u6210\u540E\u4F1A\u4FDD\u5B58\u5230\u5F53\u524D\u4F1A\u8BDD\uFF1B\u7A0D\u540E\u91CD\u65B0\u6253\u5F00\u5373\u53EF\u67E5\u770B\u7ED3\u679C\u3002");
    } else {
      this.stopGenerating();
    }
    if (this.transcript.length && !terminateCodex && !this.isCodexRunning) {
      void this.persistConversation();
    }
    if (this.translateTranscript.length) {
      void this.persistTranslationConversation();
    }
    this.contentEl.empty();
  }
};

// src/research-notes.ts
var HIDDEN_CONTEXT_LINE = /^(?:【(?:论文全文|全文背景摘要|从全文中按关键词检索到的可能相关片段|我当前选中并想讨论的原文片段)】|\[(?:RAG|SYSTEM|HIDDEN)[^\]]*\]).*$/gim;
function stableTextHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
function sanitizeResearchArtifact(value) {
  if (typeof value !== "string") return "";
  return value.replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi, "[REDACTED PRIVATE KEY]").replace(/\b(api[_-]?key|authorization)\s*[:=]\s*[^\s\n]+/gi, "$1: [REDACTED]").replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]").replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "sk-[REDACTED]").replace(/\b[A-Za-z]:\\[^\s\n]+/g, "[\u672C\u5730\u8DEF\u5F84\u5DF2\u9690\u85CF]").replace(/\/(?:Users|home)\/[^\s\n]+/g, "[\u672C\u5730\u8DEF\u5F84\u5DF2\u9690\u85CF]").replace(HIDDEN_CONTEXT_LINE, "[\u9690\u85CF\u4E0A\u4E0B\u6587\u5DF2\u7701\u7565]").replace(/\n{3,}/g, "\n\n").trim();
}
function normalizeFolder(value, fallback) {
  const parts = (value || fallback).replace(/\\/g, "/").split("/").filter((part) => part && part !== "." && part !== "..");
  return parts.join("/") || fallback;
}
function safeFileName(value, fallback) {
  const normalized = (value || fallback).replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "").slice(0, 120);
  return normalized || fallback;
}
function primaryPaperPath(session) {
  if (!session.conversationKey.startsWith("pdf:")) return void 0;
  const path = session.conversationKey.slice("pdf:".length).trim();
  return path || void 0;
}
function paperBaseName(path) {
  const name = path.replace(/\\/g, "/").split("/").pop() || "Paper";
  return name.replace(/\.pdf$/i, "") || "Paper";
}
function evidenceMarkdown(evidence) {
  const items = Array.isArray(evidence) ? evidence : [];
  if (!items.length) return "";
  const lines = items.map((item) => {
    const claim = sanitizeResearchArtifact(item.claim || item.raw || "\u8BBA\u6587\u8BC1\u636E");
    if (item.verification === "located" && item.paperPath && Number.isInteger(item.page) && Number(item.page) > 0) {
      const path = item.paperPath.replace(/\\/g, "/");
      const name = path.split("/").pop() || path;
      return `- ${claim} \u2014 [[${path}#page=${item.page}|${name} p.${item.page}]]`;
    }
    return `- ${claim} \u2014 \u672A\u9A8C\u8BC1\u6765\u6E90 ${item.raw || ""}`.trimEnd();
  });
  return `
#### \u8BBA\u6587\u8BC1\u636E

${lines.join("\n")}`;
}
function selectionMarkdown(selection, includeText) {
  const text = (selection == null ? void 0 : selection.text) || "";
  if (!text) return "";
  const metadata = `\u9009\u533A\uFF1A${text.length} \u5B57 \xB7 hash:${stableTextHash(text)}`;
  if (!includeText) return `
> ${metadata}`;
  return `
> ${metadata}
>
${sanitizeResearchArtifact(text).split("\n").map((line) => `> ${line}`).join("\n")}`;
}
function buildResearchTurnMarkdown(request, timestamp) {
  const user = sanitizeResearchArtifact(request.userMessage.content);
  const assistant = sanitizeResearchArtifact(request.assistantMessage.content);
  const date = new Date(timestamp).toISOString();
  return [
    `## ${date} \xB7 ${safeFileName(request.session.title, "\u9605\u8BFB\u8BA8\u8BBA")}`,
    selectionMarkdown(request.selection, request.includeSelectionText),
    "### \u95EE\u9898",
    user,
    "### \u56DE\u7B54",
    assistant,
    evidenceMarkdown(request.assistantMessage.evidence)
  ].filter((section) => section !== "").join("\n\n").trim();
}
function exportSessionMarkdown(session) {
  const lines = [
    `# ${safeFileName(session.title, "PDF Chat \u4F1A\u8BDD")}`,
    "",
    `- \u6A21\u5F0F\uFF1A${session.mode === "codex" ? "Codex CLI" : "PDF Chat API"}`,
    `- \u521B\u5EFA\uFF1A${new Date(session.createdAt).toISOString()}`,
    `- \u66F4\u65B0\uFF1A${new Date(session.updatedAt).toISOString()}`
  ];
  const paperPath = primaryPaperPath(session);
  if (paperPath) lines.push(`- \u5F53\u524D\u8BBA\u6587\uFF1A[[${paperPath}]]`);
  for (const reference of session.referencedPdfPaths || []) lines.push(`- \u5F15\u7528\u8BBA\u6587\uFF1A[[${reference}]]`);
  lines.push("");
  for (const message of session.messages || []) {
    lines.push(message.role === "user" ? "## \u7528\u6237" : "## \u52A9\u624B", "");
    lines.push(sanitizeResearchArtifact(message.content), "");
    const evidence = evidenceMarkdown(message.evidence);
    if (evidence) lines.push(evidence.trim(), "");
  }
  return lines.join("\n").trim() + "\n";
}
var ResearchNoteService = class {
  constructor(vault, getSettings, now = Date.now) {
    this.vault = vault;
    this.getSettings = getSettings;
    this.now = now;
    __publicField(this, "queues", /* @__PURE__ */ new Map());
  }
  async appendTurn(request) {
    const settings = this.getSettings();
    const paperPath = primaryPaperPath(request.session);
    const isSynthesis = !paperPath || (request.session.referencedPdfPaths || []).length > 0;
    const fileName = isSynthesis ? "Synthesis.md" : `${safeFileName(paperBaseName(paperPath), "Paper")}.md`;
    const path = `${normalizeFolder(settings.folder, "PDF Chat/Reading Notes")}/${fileName}`;
    const block = buildResearchTurnMarkdown(
      { ...request, includeSelectionText: request.includeSelectionText === true },
      this.now()
    );
    return this.enqueue(path, async () => {
      const existing = this.vault.getAbstractFileByPath(path);
      if (existing) {
        const previous = await this.vault.read(existing);
        await this.vault.modify(existing, `${previous.trimEnd()}

---

${block}
`);
        return { path, created: false };
      }
      await this.ensureParentFolder(path);
      const title = isSynthesis ? "# PDF Chat \u7EFC\u5408\u7814\u7A76\u7B14\u8BB0" : `# ${paperBaseName(paperPath)} \u9605\u8BFB\u7B14\u8BB0`;
      await this.vault.create(path, `${title}

${block}
`);
      return { path, created: true };
    });
  }
  async exportSessionMarkdown(session, targetPath) {
    const settings = this.getSettings();
    const fallbackName = `${safeFileName(session.title, "PDF Chat \u4F1A\u8BDD")}.md`;
    const path = targetPath ? normalizeFolder(targetPath, fallbackName) : `${normalizeFolder(settings.exportFolder, "PDF Chat/Exports")}/${fallbackName}`;
    const markdown = exportSessionMarkdown(session);
    return this.enqueue(path, async () => {
      const existing = this.vault.getAbstractFileByPath(path);
      if (existing) {
        await this.vault.modify(existing, markdown);
        return { path, created: false };
      }
      await this.ensureParentFolder(path);
      await this.vault.create(path, markdown);
      return { path, created: true };
    });
  }
  enqueue(path, task) {
    const previous = this.queues.get(path) || Promise.resolve({ path, created: false });
    const next = previous.catch(() => ({ path, created: false })).then(task);
    this.queues.set(path, next);
    const clean = () => {
      if (this.queues.get(path) === next) this.queues.delete(path);
    };
    next.then(clean, clean);
    return next;
  }
  async ensureParentFolder(path) {
    const parts = path.split("/").slice(0, -1);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.vault.getAbstractFileByPath(current)) await this.vault.createFolder(current);
    }
  }
};

// src/json-store.ts
var JsonStoreError = class extends Error {
  constructor(message, operation, options) {
    super(message);
    this.operation = operation;
    __publicField(this, "cause");
    this.name = "JsonStoreError";
    this.cause = options == null ? void 0 : options.cause;
  }
};
function parentDirectory(path) {
  const normalized = path.replace(/\\/g, "/");
  const separator = normalized.lastIndexOf("/");
  return separator > 0 ? normalized.slice(0, separator) : "";
}
var AtomicJsonStore = class {
  constructor(adapter, path, validate) {
    this.adapter = adapter;
    this.path = path;
    this.validate = validate;
    __publicField(this, "writeQueue", Promise.resolve());
  }
  parseAndValidate(raw) {
    try {
      return this.validate(JSON.parse(raw));
    } catch (error) {
      throw new JsonStoreError("JSON document validation failed", "validation", { cause: error });
    }
  }
  serialize(value) {
    let validated;
    try {
      validated = this.validate(value);
    } catch (error) {
      throw new JsonStoreError("JSON document validation failed", "validation", { cause: error });
    }
    return JSON.stringify(validated, null, 2) + "\n";
  }
  async ensureParentDirectory() {
    const directory = parentDirectory(this.path);
    if (!directory || await this.adapter.exists(directory)) return;
    const parts = directory.split("/").filter(Boolean);
    let current = directory.startsWith("/") ? "/" : "";
    for (const part of parts) {
      current = current && current !== "/" ? `${current}/${part}` : `${current}${part}`;
      if (!await this.adapter.exists(current)) await this.adapter.mkdir(current);
    }
  }
  async readValidated(path) {
    const raw = await this.adapter.read(path);
    return this.parseAndValidate(raw);
  }
  async read() {
    return this.readWithBackup();
  }
  async readWithBackup() {
    const backupPath = `${this.path}.bak`;
    const primaryExists = await this.adapter.exists(this.path);
    if (primaryExists) {
      try {
        return await this.readValidated(this.path);
      } catch (error) {
        void error;
      }
    }
    if (!await this.adapter.exists(backupPath)) {
      if (!primaryExists) return null;
      throw new JsonStoreError("JSON document and backup are unreadable", "read");
    }
    try {
      const backup = await this.readValidated(backupPath);
      await this.ensureParentDirectory();
      await this.adapter.write(this.path, this.serialize(backup));
      return backup;
    } catch (error) {
      if (error instanceof JsonStoreError) throw error;
      throw new JsonStoreError("JSON backup recovery failed", "read", { cause: error });
    }
  }
  write(value) {
    const operation = this.writeQueue.then(() => this.writeNow(value));
    this.writeQueue = operation.catch(() => void 0);
    return operation;
  }
  async safeRemove(path) {
    try {
      if (await this.adapter.exists(path)) await this.adapter.remove(path);
    } catch (error) {
      void error;
    }
  }
  async writeNow(value) {
    const serialized = this.serialize(value);
    const tempPath = `${this.path}.tmp`;
    const backupPath = `${this.path}.bak`;
    let rotatedPrimary = false;
    try {
      await this.ensureParentDirectory();
      await this.safeRemove(tempPath);
      await this.adapter.write(tempPath, serialized);
      await this.readValidated(tempPath);
      if (await this.adapter.exists(this.path)) {
        let primaryIsValid = false;
        try {
          await this.readValidated(this.path);
          primaryIsValid = true;
        } catch (error) {
          void error;
        }
        if (primaryIsValid) {
          await this.safeRemove(backupPath);
          await this.adapter.rename(this.path, backupPath);
          rotatedPrimary = true;
        } else {
          await this.safeRemove(this.path);
        }
      }
      await this.adapter.rename(tempPath, this.path);
      await this.readValidated(this.path);
    } catch (error) {
      if (rotatedPrimary && !await this.adapter.exists(this.path) && await this.adapter.exists(backupPath)) {
        try {
          const backup = await this.readValidated(backupPath);
          await this.adapter.write(this.path, this.serialize(backup));
        } catch (restoreError) {
          void restoreError;
        }
      }
      await this.safeRemove(tempPath);
      if (error instanceof JsonStoreError) throw error;
      throw new JsonStoreError("Atomic JSON write or replace failed", "write", { cause: error });
    }
  }
};

// src/paper-asset-repository.ts
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function isAbsolutePath2(value) {
  return /^(?:[A-Za-z]:[\\/]|[\\/]{1,2})/.test(value);
}
function assertRelativeVaultPath(value) {
  if (!value || isAbsolutePath2(value) || value.split(/[\\/]/).includes("..")) {
    throw new Error("Paper assets require a vault-relative path");
  }
}
function validatePaperAsset(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid paper asset");
  const candidate = value;
  if (candidate.version !== 1 || typeof candidate.vaultPath !== "string") throw new Error("Invalid paper asset");
  assertRelativeVaultPath(candidate.vaultPath);
  const updatedAt = typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : 0;
  const lastAccessedAt = typeof candidate.lastAccessedAt === "number" && Number.isFinite(candidate.lastAccessedAt) ? candidate.lastAccessedAt : updatedAt;
  const estimatedBytes = typeof candidate.estimatedBytes === "number" && Number.isFinite(candidate.estimatedBytes) ? Math.max(0, Math.floor(candidate.estimatedBytes)) : 0;
  return {
    version: 1,
    vaultPath: candidate.vaultPath,
    summary: candidate.summary && typeof candidate.summary === "object" ? clone(candidate.summary) : void 0,
    chunks: candidate.chunks && typeof candidate.chunks === "object" ? clone(candidate.chunks) : void 0,
    updatedAt,
    lastAccessedAt,
    estimatedBytes
  };
}
function validateIndex(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid paper index");
  const candidate = value;
  if (candidate.version !== 1 || !Array.isArray(candidate.entries)) throw new Error("Invalid paper index");
  const entries = [];
  for (const raw of candidate.entries) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw;
    if (typeof entry.vaultPath !== "string" || typeof entry.fileName !== "string") continue;
    assertRelativeVaultPath(entry.vaultPath);
    if (!/^[a-z0-9._-]+\.json$/i.test(entry.fileName)) continue;
    entries.push({
      vaultPath: entry.vaultPath,
      fileName: entry.fileName,
      updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : 0,
      lastAccessedAt: typeof entry.lastAccessedAt === "number" ? entry.lastAccessedAt : 0,
      estimatedBytes: typeof entry.estimatedBytes === "number" ? Math.max(0, Math.floor(entry.estimatedBytes)) : 0
    });
  }
  return { version: 1, entries };
}
var PaperAssetRepository = class {
  constructor(adapter, root = "reader-data/papers", now = Date.now) {
    this.adapter = adapter;
    this.root = root;
    this.now = now;
    __publicField(this, "indexStore");
    __publicField(this, "assets", /* @__PURE__ */ new Map());
    __publicField(this, "indexEntries", /* @__PURE__ */ new Map());
    __publicField(this, "indexWriteQueue", Promise.resolve());
    this.indexStore = new AtomicJsonStore(adapter, `${root}/index.json`, validateIndex);
  }
  entityStore(fileName) {
    return new AtomicJsonStore(this.adapter, `${this.root}/${fileName}`, validatePaperAsset);
  }
  chooseFileName(vaultPath) {
    const base = `paper-${stableConversationHash(vaultPath)}`;
    let suffix = 0;
    while (true) {
      const fileName = `${base}${suffix ? `-${suffix}` : ""}.json`;
      const collision = Array.from(this.indexEntries.values()).find(
        (entry) => entry.fileName === fileName && entry.vaultPath !== vaultPath
      );
      if (!collision) return fileName;
      suffix += 1;
    }
  }
  async persistIndex() {
    const document2 = {
      version: 1,
      entries: Array.from(this.indexEntries.values()).sort((left, right) => left.vaultPath.localeCompare(right.vaultPath))
    };
    const operation = this.indexWriteQueue.then(() => this.indexStore.write(document2));
    this.indexWriteQueue = operation.catch(() => void 0);
    await operation;
  }
  async initialize() {
    const index = await this.indexStore.readWithBackup() || { version: 1, entries: [] };
    let repaired = false;
    for (const entry of index.entries) {
      const asset = await this.entityStore(entry.fileName).readWithBackup();
      if (!asset || asset.vaultPath !== entry.vaultPath) {
        repaired = true;
        continue;
      }
      this.assets.set(asset.vaultPath, asset);
      this.indexEntries.set(asset.vaultPath, {
        vaultPath: asset.vaultPath,
        fileName: entry.fileName,
        updatedAt: asset.updatedAt,
        lastAccessedAt: asset.lastAccessedAt,
        estimatedBytes: asset.estimatedBytes
      });
    }
    if (repaired) await this.persistIndex();
    return Object.fromEntries(Array.from(this.assets.entries()).map(([path, value]) => [path, clone(value)]));
  }
  get(vaultPath) {
    assertRelativeVaultPath(vaultPath);
    const asset = this.assets.get(vaultPath);
    if (!asset) return null;
    asset.lastAccessedAt = this.now();
    const index = this.indexEntries.get(vaultPath);
    if (index) index.lastAccessedAt = asset.lastAccessedAt;
    void this.persistIndex();
    return clone(asset);
  }
  async save(vaultPath, input) {
    var _a;
    assertRelativeVaultPath(vaultPath);
    const timestamp = this.now();
    const existing = this.assets.get(vaultPath);
    const fileName = ((_a = this.indexEntries.get(vaultPath)) == null ? void 0 : _a.fileName) || this.chooseFileName(vaultPath);
    const draft = {
      version: 1,
      vaultPath,
      summary: input.summary === void 0 ? existing == null ? void 0 : existing.summary : input.summary,
      chunks: input.chunks === void 0 ? existing == null ? void 0 : existing.chunks : input.chunks,
      updatedAt: timestamp,
      lastAccessedAt: timestamp,
      estimatedBytes: 0
    };
    draft.estimatedBytes = JSON.stringify(draft).length;
    const asset = validatePaperAsset(draft);
    await this.entityStore(fileName).write(asset);
    this.assets.set(vaultPath, clone(asset));
    this.indexEntries.set(vaultPath, {
      vaultPath,
      fileName,
      updatedAt: asset.updatedAt,
      lastAccessedAt: asset.lastAccessedAt,
      estimatedBytes: asset.estimatedBytes
    });
    await this.persistIndex();
  }
  async removeFileSet(path) {
    for (const candidate of [path, `${path}.bak`, `${path}.tmp`]) {
      if (await this.adapter.exists(candidate)) await this.adapter.remove(candidate);
    }
  }
  async remove(vaultPath) {
    assertRelativeVaultPath(vaultPath);
    const index = this.indexEntries.get(vaultPath);
    if (!index) return;
    await this.removeFileSet(`${this.root}/${index.fileName}`);
    this.assets.delete(vaultPath);
    this.indexEntries.delete(vaultPath);
    await this.persistIndex();
  }
  async rename(oldPath, newPath) {
    assertRelativeVaultPath(oldPath);
    assertRelativeVaultPath(newPath);
    const asset = this.assets.get(oldPath);
    if (!asset) return;
    await this.save(newPath, { summary: asset.summary, chunks: asset.chunks });
    await this.remove(oldPath);
  }
  usage() {
    return {
      entries: this.assets.size,
      bytes: Array.from(this.assets.values()).reduce((sum, asset) => sum + asset.estimatedBytes, 0)
    };
  }
  async evict(options) {
    const maxEntries = Math.max(0, Math.floor(options.maxEntries));
    const maxBytes = Math.max(0, Math.floor(options.maxBytes));
    const protectedPaths = new Set(options.protectedPaths || []);
    const candidates = Array.from(this.assets.values()).filter((asset) => !protectedPaths.has(asset.vaultPath)).sort((left, right) => left.lastAccessedAt - right.lastAccessedAt || left.vaultPath.localeCompare(right.vaultPath));
    const evicted = [];
    while ((this.usage().entries > maxEntries || this.usage().bytes > maxBytes) && candidates.length) {
      const candidate = candidates.shift();
      await this.remove(candidate.vaultPath);
      evicted.push(candidate.vaultPath);
    }
    return evicted;
  }
};

// src/reader-data-migration.ts
function clone2(value) {
  return JSON.parse(JSON.stringify(value));
}
function validateMeta(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid reader data metadata");
  }
  const candidate = value;
  if (candidate.version !== 1) throw new Error("Unsupported reader data metadata");
  if (candidate.migration === void 0) return { version: 1 };
  if (!candidate.migration || typeof candidate.migration !== "object" || Array.isArray(candidate.migration)) {
    throw new Error("Invalid reader data migration checkpoint");
  }
  const migration = candidate.migration;
  if (typeof migration.sourceVersion !== "string" || migration.state !== "writing" && migration.state !== "validated" && migration.state !== "complete") {
    throw new Error("Invalid reader data migration checkpoint");
  }
  return {
    version: 1,
    migration: {
      sourceVersion: migration.sourceVersion,
      state: migration.state,
      completedAt: typeof migration.completedAt === "number" && Number.isFinite(migration.completedAt) ? migration.completedAt : void 0
    }
  };
}
function validateSnapshot(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid legacy reader data snapshot");
  }
  const candidate = value;
  if (candidate.version !== 1) throw new Error("Unsupported legacy reader data snapshot");
  return {
    version: 1,
    conversationHistories: candidate.conversationHistories && typeof candidate.conversationHistories === "object" ? clone2(candidate.conversationHistories) : {},
    conversationSessions: normalizeConversationSessions(candidate.conversationSessions),
    activeConversationSessionIds: candidate.activeConversationSessionIds && typeof candidate.activeConversationSessionIds === "object" ? clone2(candidate.activeConversationSessionIds) : {},
    docSummaries: candidate.docSummaries && typeof candidate.docSummaries === "object" ? clone2(candidate.docSummaries) : {},
    docChunks: candidate.docChunks && typeof candidate.docChunks === "object" ? clone2(candidate.docChunks) : {}
  };
}
function buildSnapshot(settings) {
  return validateSnapshot({
    version: 1,
    conversationHistories: settings.conversationHistories,
    conversationSessions: settings.conversationSessions,
    activeConversationSessionIds: settings.activeConversationSessionIds,
    docSummaries: settings.docSummaries,
    docChunks: settings.docChunks
  });
}
function strippedSettings(settings) {
  return {
    ...clone2(settings),
    readerDataVersion: 1,
    conversationHistories: {},
    conversationSessions: {},
    docSummaries: {},
    docChunks: {}
  };
}
var ReaderDataMigrator = class {
  constructor(adapter, sessions, papers, commitSettings, now = Date.now, root = "reader-data") {
    this.sessions = sessions;
    this.papers = papers;
    this.commitSettings = commitSettings;
    this.now = now;
    this.root = root;
    __publicField(this, "metaStore");
    __publicField(this, "snapshotStore");
    this.metaStore = new AtomicJsonStore(adapter, `${root}/meta.json`, validateMeta);
    this.snapshotStore = new AtomicJsonStore(
      adapter,
      `${root}/migration/legacy-reader-data.json`,
      validateSnapshot
    );
  }
  paperPaths(snapshot) {
    return Array.from(
      /* @__PURE__ */ new Set([...Object.keys(snapshot.docSummaries), ...Object.keys(snapshot.docChunks)])
    ).sort();
  }
  validateEntities(snapshot) {
    for (const session of Object.values(snapshot.conversationSessions)) {
      const saved = this.sessions.get(session.id);
      if (!saved || saved.id !== session.id) throw new Error("Conversation migration validation failed");
    }
    for (const vaultPath of this.paperPaths(snapshot)) {
      const saved = this.papers.get(vaultPath);
      if (!saved || saved.vaultPath !== vaultPath) throw new Error("Paper migration validation failed");
    }
  }
  async writeEntities(snapshot) {
    for (const session of Object.values(snapshot.conversationSessions)) {
      await this.sessions.save(session);
    }
    for (const vaultPath of this.paperPaths(snapshot)) {
      await this.papers.save(vaultPath, {
        summary: snapshot.docSummaries[vaultPath],
        chunks: snapshot.docChunks[vaultPath]
      });
    }
  }
  async migrate(settings) {
    var _a, _b;
    const legacy = clone2(settings);
    try {
      const meta = await this.metaStore.readWithBackup();
      if (settings.readerDataVersion === 1 && ((_a = meta == null ? void 0 : meta.migration) == null ? void 0 : _a.state) === "complete") {
        await this.sessions.initialize();
        await this.papers.initialize();
        return { migrated: false, fallback: false, settings: clone2(settings) };
      }
      await this.sessions.initialize();
      await this.papers.initialize();
      const snapshot = buildSnapshot(settings);
      const sourceVersion = String(settings.readerDataVersion || 0);
      if (((_b = meta == null ? void 0 : meta.migration) == null ? void 0 : _b.state) !== "validated") {
        await this.metaStore.write({
          version: 1,
          migration: { sourceVersion, state: "writing" }
        });
        await this.snapshotStore.write(snapshot);
        await this.writeEntities(snapshot);
        this.validateEntities(snapshot);
        await this.metaStore.write({
          version: 1,
          migration: { sourceVersion, state: "validated" }
        });
      } else {
        this.validateEntities(snapshot);
      }
      const migrated = strippedSettings(settings);
      await this.commitSettings(migrated);
      await this.metaStore.write({
        version: 1,
        migration: { sourceVersion, state: "complete", completedAt: this.now() }
      });
      return { migrated: true, fallback: false, settings: migrated };
    } catch (error) {
      void error;
      return {
        migrated: false,
        fallback: true,
        settings: legacy,
        error: "Reader data migration incomplete"
      };
    }
  }
};

// src/session-repository.ts
function clone3(value) {
  return JSON.parse(JSON.stringify(value));
}
function isAbsolutePath3(value) {
  return /^(?:[A-Za-z]:[\\/]|[\\/]{1,2})/.test(value);
}
function assertRelativeVaultPath2(value) {
  if (!value || isAbsolutePath3(value) || value.split(/[\\/]/).includes("..")) {
    throw new Error("Reader data requires a vault-relative path");
  }
}
function validateSession(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid conversation session");
  }
  const candidate = value;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  if (!id) throw new Error("Invalid conversation session ID");
  const rawKey = typeof candidate.conversationKey === "string" ? candidate.conversationKey : "";
  if (rawKey.startsWith("pdf:")) assertRelativeVaultPath2(rawKey.slice(4));
  if (Array.isArray(candidate.referencedPdfPaths)) {
    for (const path of candidate.referencedPdfPaths) {
      if (typeof path === "string") assertRelativeVaultPath2(path);
    }
  }
  const normalized = normalizeConversationSessions({ [id]: value })[id];
  if (!normalized) throw new Error("Invalid conversation session");
  return normalized;
}
function validateIndex2(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid session index");
  }
  const candidate = value;
  if (candidate.version !== 1 || !Array.isArray(candidate.entries)) {
    throw new Error("Invalid session index");
  }
  const entries = [];
  for (const raw of candidate.entries) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw;
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const fileName = typeof entry.fileName === "string" ? entry.fileName.trim() : "";
    const conversationKey = typeof entry.conversationKey === "string" ? entry.conversationKey : "";
    if (!id || !/^[a-z0-9._-]+\.json$/i.test(fileName) || !conversationKey) continue;
    if (conversationKey.startsWith("pdf:")) assertRelativeVaultPath2(conversationKey.slice(4));
    entries.push({
      id,
      fileName,
      title: typeof entry.title === "string" ? entry.title : id,
      conversationKey,
      mode: entry.mode === "codex" ? "codex" : "chat",
      pinned: entry.pinned === true,
      archived: entry.archived === true,
      missing: entry.missing === true,
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === "string" && !!tag.trim()).map((tag) => tag.trim()) : [],
      createdAt: typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt) ? entry.createdAt : 0,
      updatedAt: typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0
    });
  }
  return { version: 1, entries };
}
var SessionRepository = class {
  constructor(adapter, root = "reader-data/sessions") {
    this.adapter = adapter;
    this.root = root;
    __publicField(this, "indexStore");
    __publicField(this, "sessions", /* @__PURE__ */ new Map());
    __publicField(this, "indexEntries", /* @__PURE__ */ new Map());
    __publicField(this, "initialized", false);
    this.indexStore = new AtomicJsonStore(adapter, `${root}/index.json`, validateIndex2);
  }
  entityStore(fileName) {
    return new AtomicJsonStore(this.adapter, `${this.root}/${fileName}`, validateSession);
  }
  chooseFileName(id) {
    const base = `session-${stableConversationHash(id)}`;
    let suffix = 0;
    while (true) {
      const fileName = `${base}${suffix ? `-${suffix}` : ""}.json`;
      const collision = Array.from(this.indexEntries.values()).find(
        (entry) => entry.fileName === fileName && entry.id !== id
      );
      if (!collision) return fileName;
      suffix += 1;
    }
  }
  indexEntry(session, fileName) {
    return {
      id: session.id,
      fileName,
      title: session.title,
      conversationKey: session.conversationKey,
      mode: session.mode,
      pinned: session.pinned,
      archived: Boolean(session.archivedAt),
      missing: session.sourceStatus === "missing",
      tags: [...session.tags],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }
  async persistIndex() {
    await this.indexStore.write({ version: 1, entries: this.list() });
  }
  async initialize() {
    if (this.initialized) return this.loadAll();
    this.initialized = true;
    const index = await this.indexStore.readWithBackup() || { version: 1, entries: [] };
    let repaired = false;
    for (const entry of index.entries) {
      const entity = await this.entityStore(entry.fileName).readWithBackup();
      if (!entity || entity.id !== entry.id) {
        repaired = true;
        continue;
      }
      this.sessions.set(entity.id, entity);
      this.indexEntries.set(entity.id, this.indexEntry(entity, entry.fileName));
    }
    if (repaired) await this.persistIndex();
    return this.loadAll();
  }
  async loadAll() {
    const result = {};
    for (const [id, session] of this.sessions) result[id] = clone3(session);
    return result;
  }
  get(id) {
    const session = this.sessions.get(id);
    return session ? clone3(session) : null;
  }
  list() {
    return Array.from(this.indexEntries.values()).map(clone3).sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt - left.updatedAt || left.id.localeCompare(right.id));
  }
  async save(input) {
    const session = validateSession(input);
    const existing = this.indexEntries.get(session.id);
    const fileName = (existing == null ? void 0 : existing.fileName) || this.chooseFileName(session.id);
    await this.entityStore(fileName).write(session);
    this.sessions.set(session.id, clone3(session));
    this.indexEntries.set(session.id, {
      ...this.indexEntry(session, fileName),
      pinned: session.pinned,
      archived: Boolean(session.archivedAt),
      tags: [...session.tags]
    });
    await this.persistIndex();
  }
  async updateMetadata(id, patch) {
    const session = this.get(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    if (typeof patch.title === "string" && patch.title.trim()) session.title = patch.title.trim();
    if (typeof patch.pinned === "boolean") session.pinned = patch.pinned;
    if (Array.isArray(patch.tags)) {
      session.tags = Array.from(
        new Set(patch.tags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim().toLowerCase()))
      );
    }
    session.updatedAt = Date.now();
    await this.save(session);
  }
  async archive(id) {
    const session = this.get(id);
    if (!session) return;
    session.archivedAt = Date.now();
    session.updatedAt = session.archivedAt;
    await this.save(session);
  }
  async reactivate(id) {
    const session = this.get(id);
    if (!session) return;
    session.archivedAt = void 0;
    session.updatedAt = Date.now();
    await this.save(session);
  }
  async rebindSource(id, newPath) {
    assertRelativeVaultPath2(newPath);
    if (!newPath.toLowerCase().endsWith(".pdf")) throw new Error("Session source must be a PDF");
    const session = this.get(id);
    if (!session) throw new Error(`Conversation session not found: ${id}`);
    const oldPath = session.conversationKey.startsWith("pdf:") ? session.conversationKey.slice("pdf:".length) : "";
    session.conversationKey = ["pdf", newPath].join(":");
    session.sourceStatus = "available";
    session.messages = session.messages.map((message) => {
      var _a;
      return {
        ...message,
        ...((_a = message.evidence) == null ? void 0 : _a.length) ? {
          evidence: message.evidence.map(
            (evidence) => evidence.paperPath === oldPath ? { ...evidence, verification: "unverified" } : { ...evidence }
          )
        } : {}
      };
    });
    session.updatedAt = Date.now();
    await this.save(session);
  }
  async removeFileSet(path) {
    for (const candidate of [path, `${path}.bak`, `${path}.tmp`]) {
      if (await this.adapter.exists(candidate)) await this.adapter.remove(candidate);
    }
  }
  async remove(id) {
    const entry = this.indexEntries.get(id);
    if (!entry) return;
    await this.removeFileSet(`${this.root}/${entry.fileName}`);
    this.sessions.delete(id);
    this.indexEntries.delete(id);
    await this.persistIndex();
  }
  async rekeyPdf(oldPath, newPath) {
    assertRelativeVaultPath2(oldPath);
    assertRelativeVaultPath2(newPath);
    for (const session of Array.from(this.sessions.values())) {
      let changed = false;
      const next = clone3(session);
      if (next.conversationKey === ["pdf", oldPath].join(":")) {
        next.conversationKey = ["pdf", newPath].join(":");
        next.sourceStatus = "available";
        changed = true;
      }
      const references = next.referencedPdfPaths.map((path) => path === oldPath ? newPath : path);
      if (references.some((path, index) => path !== next.referencedPdfPaths[index])) {
        next.referencedPdfPaths = Array.from(new Set(references));
        changed = true;
      }
      if (changed) await this.save(next);
    }
  }
};

// src/reader-data-store.ts
function clone4(value) {
  return JSON.parse(JSON.stringify(value));
}
function fingerprint(value) {
  return JSON.stringify(value);
}
function isJsonAdapter(value) {
  if (!value || typeof value !== "object") return false;
  const adapter = value;
  return ["exists", "read", "write", "rename", "remove", "mkdir"].every(
    (method) => typeof adapter[method] === "function"
  );
}
var ReaderDataStore = class {
  constructor(adapter, root = "reader-data", now = Date.now) {
    this.adapter = adapter;
    this.root = root;
    this.now = now;
    __publicField(this, "sessions");
    __publicField(this, "papers");
    __publicField(this, "active", false);
    __publicField(this, "sessionFingerprints", /* @__PURE__ */ new Map());
    __publicField(this, "paperFingerprints", /* @__PURE__ */ new Map());
    __publicField(this, "syncQueue", Promise.resolve());
    this.sessions = new SessionRepository(adapter, `${root}/sessions`);
    this.papers = new PaperAssetRepository(adapter, `${root}/papers`, now);
  }
  runtimePapers(settings) {
    var _a, _b;
    const assets = {};
    for (const vaultPath of /* @__PURE__ */ new Set([
      ...Object.keys(settings.docSummaries || {}),
      ...Object.keys(settings.docChunks || {})
    ])) {
      assets[vaultPath] = {
        summary: (_a = settings.docSummaries) == null ? void 0 : _a[vaultPath],
        chunks: (_b = settings.docChunks) == null ? void 0 : _b[vaultPath]
      };
    }
    return assets;
  }
  captureBaseline(settings) {
    this.sessionFingerprints = new Map(
      Object.entries(normalizeConversationSessions(settings.conversationSessions)).map(([id, session]) => [
        id,
        fingerprint(session)
      ])
    );
    this.paperFingerprints = new Map(
      Object.entries(this.runtimePapers(settings)).map(([vaultPath, asset]) => [
        vaultPath,
        fingerprint(asset)
      ])
    );
  }
  async initialize(settings, commitSettings) {
    const migrator = new ReaderDataMigrator(
      this.adapter,
      this.sessions,
      this.papers,
      commitSettings,
      this.now,
      this.root
    );
    const migration = await migrator.migrate(settings);
    if (migration.fallback) {
      this.active = false;
      return migration;
    }
    const storedSessions = await this.sessions.initialize();
    const storedPapers = await this.papers.initialize();
    const runtime = clone4(migration.settings);
    runtime.conversationSessions = storedSessions;
    runtime.docSummaries = {};
    runtime.docChunks = {};
    for (const [vaultPath, asset] of Object.entries(storedPapers)) {
      if (asset.summary) runtime.docSummaries[vaultPath] = clone4(asset.summary);
      if (asset.chunks) runtime.docChunks[vaultPath] = clone4(asset.chunks);
    }
    this.active = true;
    this.captureBaseline(runtime);
    return { ...migration, settings: runtime };
  }
  settingsForPersistence(settings) {
    if (!this.active || settings.readerDataVersion !== 1) return clone4(settings);
    return {
      ...clone4(settings),
      conversationHistories: {},
      conversationSessions: {},
      docSummaries: {},
      docChunks: {}
    };
  }
  synchronize(settings, options = {}) {
    if (!this.active) return Promise.resolve({ evictedPaths: [] });
    const operation = this.syncQueue.then(() => this.synchronizeNow(settings, options));
    this.syncQueue = operation.catch(() => void 0);
    return operation;
  }
  async synchronizeNow(settings, options) {
    const desiredSessions = normalizeConversationSessions(settings.conversationSessions);
    for (const id of this.sessionFingerprints.keys()) {
      if (!(id in desiredSessions)) await this.sessions.remove(id);
    }
    for (const [id, session] of Object.entries(desiredSessions)) {
      const nextFingerprint = fingerprint(session);
      if (this.sessionFingerprints.get(id) !== nextFingerprint) await this.sessions.save(session);
    }
    const desiredPapers = this.runtimePapers(settings);
    let wrotePaperAsset = false;
    for (const vaultPath of this.paperFingerprints.keys()) {
      if (!(vaultPath in desiredPapers)) await this.papers.remove(vaultPath);
    }
    for (const [vaultPath, asset] of Object.entries(desiredPapers)) {
      const nextFingerprint = fingerprint(asset);
      if (this.paperFingerprints.get(vaultPath) === nextFingerprint) continue;
      if (this.paperFingerprints.has(vaultPath)) await this.papers.remove(vaultPath);
      await this.papers.save(vaultPath, asset);
      wrotePaperAsset = true;
    }
    const evictedPaths = wrotePaperAsset ? await this.papers.evict({
      maxEntries: settings.paperCacheQuota.maxEntries,
      maxBytes: settings.paperCacheQuota.maxBytes,
      protectedPaths: options.protectedPaths
    }) : [];
    for (const vaultPath of evictedPaths) {
      delete settings.docSummaries[vaultPath];
      delete settings.docChunks[vaultPath];
    }
    this.captureBaseline(settings);
    return { evictedPaths };
  }
  usage() {
    return this.papers.usage();
  }
  async clearPaperCache() {
    for (const vaultPath of Array.from(this.paperFingerprints.keys())) {
      await this.papers.remove(vaultPath);
    }
    this.paperFingerprints.clear();
    return this.papers.usage();
  }
  async clearMigrationSnapshot() {
    let removed = false;
    const path = `${this.root}/migration/legacy-reader-data.json`;
    for (const candidate of [path, `${path}.bak`, `${path}.tmp`]) {
      if (!await this.adapter.exists(candidate)) continue;
      await this.adapter.remove(candidate);
      removed = true;
    }
    return removed;
  }
};

// src/quick-translate-marker.ts
var MARKER_GAP = 8;
var SELECTION_DEBOUNCE_MS = 150;
function readSelection(doc) {
  var _a;
  const selection = (_a = doc.defaultView) == null ? void 0 : _a.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const text = cleanSelectionText(selection.toString());
  if (!text) return null;
  const range = selection.getRangeAt(selection.rangeCount - 1);
  const rectangles = Array.from(range.getClientRects());
  const rect = rectangles.length ? rectangles[rectangles.length - 1] : range.getBoundingClientRect();
  if (!rect) return null;
  return { selection, snapshot: { text, rect } };
}
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
var QuickTranslateMarker = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
    __publicField(this, "attached", /* @__PURE__ */ new Map());
    __publicField(this, "markerEl", null);
    __publicField(this, "markerDocument", null);
    __publicField(this, "pendingTimer", null);
    __publicField(this, "setTimer");
    __publicField(this, "clearTimer");
    var _a, _b;
    this.setTimer = (_a = dependencies.setTimer) != null ? _a : ((callback, delay) => setTimeout(callback, delay));
    this.clearTimer = (_b = dependencies.clearTimer) != null ? _b : ((timer) => clearTimeout(timer));
  }
  attach(doc) {
    if (!doc || this.attached.has(doc)) return;
    const selectionChange = () => this.scheduleUpdate(doc);
    const mouseDown = (event) => {
      const target = event.target;
      if (this.markerEl && target && this.markerEl.contains(target)) return;
      this.hide();
    };
    const scroll = () => this.hide();
    const keyDown = (event) => {
      if (event.key === "Escape") this.hide();
    };
    doc.addEventListener("selectionchange", selectionChange);
    doc.addEventListener("mousedown", mouseDown, true);
    doc.addEventListener("scroll", scroll, true);
    doc.addEventListener("keydown", keyDown);
    this.attached.set(doc, { selectionChange, mouseDown, scroll, keyDown });
  }
  hide() {
    this.cancelPendingUpdate();
    if (this.markerEl) this.markerEl.hidden = true;
  }
  detach(doc) {
    var _a;
    const listeners = this.attached.get(doc);
    if (!listeners) return;
    doc.removeEventListener("selectionchange", listeners.selectionChange);
    doc.removeEventListener("mousedown", listeners.mouseDown, true);
    doc.removeEventListener("scroll", listeners.scroll, true);
    doc.removeEventListener("keydown", listeners.keyDown);
    this.attached.delete(doc);
    if (this.markerDocument === doc) {
      this.cancelPendingUpdate();
      (_a = this.markerEl) == null ? void 0 : _a.remove();
      this.markerEl = null;
      this.markerDocument = null;
    }
  }
  destroy() {
    var _a;
    this.cancelPendingUpdate();
    for (const doc of Array.from(this.attached.keys())) this.detach(doc);
    (_a = this.markerEl) == null ? void 0 : _a.remove();
    this.markerEl = null;
    this.markerDocument = null;
  }
  scheduleUpdate(doc) {
    this.cancelPendingUpdate();
    this.pendingTimer = this.setTimer(() => {
      this.pendingTimer = null;
      this.updateFromSelection(doc);
    }, SELECTION_DEBOUNCE_MS);
  }
  cancelPendingUpdate() {
    if (this.pendingTimer === null) return;
    this.clearTimer(this.pendingTimer);
    this.pendingTimer = null;
  }
  updateFromSelection(doc) {
    if (!this.dependencies.isEnabled() || !this.dependencies.getActivePdfFile()) {
      this.hide();
      return;
    }
    const selectionState = readSelection(doc);
    if (!selectionState || this.dependencies.isSelectionInsideActivePdf && !this.dependencies.isSelectionInsideActivePdf(selectionState.selection, doc)) {
      this.hide();
      return;
    }
    const marker = this.ensureMarker(doc);
    marker.hidden = false;
    this.position(marker, doc, selectionState.snapshot.rect);
  }
  ensureMarker(doc) {
    var _a;
    if (this.markerEl && this.markerDocument === doc) return this.markerEl;
    (_a = this.markerEl) == null ? void 0 : _a.remove();
    const marker = doc.createElement("button");
    marker.type = "button";
    marker.className = "pdf-chat-quick-translate-marker";
    marker.textContent = "\u8BD1";
    marker.setAttribute("aria-label", "\u7FFB\u8BD1\u5F53\u524D PDF \u9009\u533A");
    marker.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openCurrentSelection(doc);
    });
    doc.body.appendChild(marker);
    this.markerEl = marker;
    this.markerDocument = doc;
    return marker;
  }
  openCurrentSelection(doc) {
    const selectionState = readSelection(doc);
    const file = this.dependencies.getActivePdfFile();
    if (!this.dependencies.isEnabled() || !selectionState || !file || this.dependencies.isSelectionInsideActivePdf && !this.dependencies.isSelectionInsideActivePdf(selectionState.selection, doc)) {
      this.hide();
      return;
    }
    this.hide();
    this.dependencies.openModal({
      file,
      selectedText: selectionState.snapshot.text,
      startFresh: true,
      autoTranslateOnOpen: true
    });
  }
  position(marker, doc, selectionRect) {
    var _a, _b, _c, _d;
    const viewportWidth = (_b = (_a = doc.defaultView) == null ? void 0 : _a.innerWidth) != null ? _b : doc.documentElement.clientWidth;
    const viewportHeight = (_d = (_c = doc.defaultView) == null ? void 0 : _c.innerHeight) != null ? _d : doc.documentElement.clientHeight;
    const markerRect = marker.getBoundingClientRect();
    const width = markerRect.width || 32;
    const height = markerRect.height || 32;
    let left = selectionRect.right + MARKER_GAP;
    if (left + width + MARKER_GAP > viewportWidth) {
      left = selectionRect.left - width - MARKER_GAP;
    }
    let top = selectionRect.top - height - MARKER_GAP;
    if (top < MARKER_GAP) top = selectionRect.bottom + MARKER_GAP;
    marker.style.left = `${clamp(left, MARKER_GAP, viewportWidth - width - MARKER_GAP)}px`;
    marker.style.top = `${clamp(top, MARKER_GAP, viewportHeight - height - MARKER_GAP)}px`;
  }
};

// src/settings.ts
function normalizeVaultFolder(value, fallback) {
  if (typeof value !== "string") return fallback;
  const parts = value.trim().replace(/\\/g, "/").split("/").filter((part) => part && part !== "." && part !== "..");
  return parts.join("/") || fallback;
}
function normalizePromptHistory(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const text = item.trim();
    if (!text || result[result.length - 1] === text) continue;
    result.push(text);
  }
  return result.slice(-100);
}
function normalizeActiveSessionIds(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized = {};
  for (const [key, id] of Object.entries(value)) {
    if (typeof id === "string" && key.trim() && id.trim()) normalized[key] = id.trim();
  }
  return normalized;
}
function normalizeReasoningEffort2(value) {
  return value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh" ? value : DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort;
}
function normalizeVerbosity(value) {
  return value === "low" || value === "medium" || value === "high" ? value : DEFAULT_SETTINGS.codexDeepAnalysis.verbosity;
}
function normalizeCodexInputMode(value) {
  if (value === "debug-full" || value === "text-fallback") return "debug-full";
  return value === "pdf-only" ? "pdf-only" : DEFAULT_SETTINGS.codexDeepAnalysis.inputMode;
}
function normalizeCodexOutputMode(value) {
  return value === "json-schema" ? "json-schema" : DEFAULT_SETTINGS.codexDeepAnalysis.outputMode;
}
var LEGACY_CODEX_TIMEOUT_MS = 6e5;
function legacySessionFromHistory(key, history) {
  const messages = normalizeConversationMessages(history.messages);
  if (!messages.length) return null;
  const id = `legacy-${stableConversationHash(key)}`;
  const timestamp = typeof history.updatedAt === "number" && Number.isFinite(history.updatedAt) ? history.updatedAt : 0;
  const session = {
    version: 3,
    id,
    conversationKey: key,
    title: key.replace(/^pdf:/, ""),
    mode: "chat",
    messages,
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    pinned: false,
    tags: [],
    sourceStatus: "available",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  return normalizeConversationSessions({ [id]: session })[id] || null;
}
function normalizePositiveInteger(value, fallback) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}
function normalizeContextBudget(value) {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const contextBudget = {
    maxInputChars: normalizePositiveInteger(
      candidate.maxInputChars,
      DEFAULT_SETTINGS.contextBudget.maxInputChars
    ),
    minRecentTurns: normalizePositiveInteger(
      candidate.minRecentTurns,
      DEFAULT_SETTINGS.contextBudget.minRecentTurns
    ),
    maxSelectionChars: normalizePositiveInteger(
      candidate.maxSelectionChars,
      DEFAULT_SETTINGS.contextBudget.maxSelectionChars
    )
  };
  return {
    contextBudget,
    changed: candidate.maxInputChars !== contextBudget.maxInputChars || candidate.minRecentTurns !== contextBudget.minRecentTurns || candidate.maxSelectionChars !== contextBudget.maxSelectionChars
  };
}
function normalizePaperCacheQuota(value) {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const quota = {
    maxEntries: normalizePositiveInteger(
      candidate.maxEntries,
      DEFAULT_SETTINGS.paperCacheQuota.maxEntries
    ),
    maxBytes: normalizePositiveInteger(
      candidate.maxBytes,
      DEFAULT_SETTINGS.paperCacheQuota.maxBytes
    )
  };
  return {
    quota,
    changed: candidate.maxEntries !== quota.maxEntries || candidate.maxBytes !== quota.maxBytes
  };
}
function normalizeRagChunkSettings(chunkSize, chunkOverlap) {
  const ragChunkSize = typeof chunkSize === "number" && Number.isInteger(chunkSize) && chunkSize > 0 ? chunkSize : DEFAULT_SETTINGS.ragChunkSize;
  const fallbackOverlap = Math.min(DEFAULT_SETTINGS.ragChunkOverlap, ragChunkSize - 1);
  const ragChunkOverlap = typeof chunkOverlap === "number" && Number.isInteger(chunkOverlap) && chunkOverlap >= 0 && chunkOverlap < ragChunkSize ? chunkOverlap : fallbackOverlap;
  return {
    ragChunkSize,
    ragChunkOverlap,
    changed: chunkSize !== ragChunkSize || chunkOverlap !== ragChunkOverlap
  };
}
function createInstallationId(randomId) {
  const createRandom = randomId || (() => {
    const cryptoObject = globalThis.crypto;
    if (typeof (cryptoObject == null ? void 0 : cryptoObject.randomUUID) === "function") return cryptoObject.randomUUID();
    if (typeof (cryptoObject == null ? void 0 : cryptoObject.getRandomValues) === "function") {
      const values = new Uint32Array(4);
      cryptoObject.getRandomValues(values);
      return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  });
  const token = String(createRandom() || "").trim().replace(/[^A-Za-z0-9._-]/g, "-");
  if (!token) throw new Error("Unable to create a random installation identity");
  return token.startsWith("install-") ? token : `install-${token}`;
}
function migrateSettings(savedValue, now = Date.now, createId = createInstallationId) {
  var _a, _b, _c;
  const saved = savedValue && typeof savedValue === "object" && !Array.isArray(savedValue) ? savedValue : null;
  const settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  let needsSave = false;
  settings.installationId = typeof (saved == null ? void 0 : saved.installationId) === "string" && saved.installationId.trim() ? saved.installationId.trim() : createId();
  if (!(saved == null ? void 0 : saved.installationId) || saved.installationId !== settings.installationId) needsSave = true;
  settings.readerDataVersion = (saved == null ? void 0 : saved.readerDataVersion) === 1 ? 1 : 0;
  if (saved && saved.readerDataVersion !== settings.readerDataVersion) needsSave = true;
  settings.models = saved && Array.isArray(saved.models) && saved.models.length ? saved.models.map((model) => ({ ...model })) : DEFAULT_SETTINGS.models.map((model) => ({ ...model }));
  settings.promptPresets = saved && Array.isArray(saved.promptPresets) && saved.promptPresets.length ? saved.promptPresets.map((preset) => ({ ...preset })) : DEFAULT_SETTINGS.promptPresets.map((preset) => ({ ...preset }));
  settings.docSummaries = saved && saved.docSummaries && typeof saved.docSummaries === "object" ? { ...saved.docSummaries } : {};
  settings.docChunks = saved && saved.docChunks && typeof saved.docChunks === "object" ? { ...saved.docChunks } : {};
  settings.conversationHistories = normalizeConversationHistories(saved && saved.conversationHistories);
  settings.conversationSessions = normalizeConversationSessions(saved && saved.conversationSessions);
  settings.activeConversationSessionIds = normalizeActiveSessionIds(saved && saved.activeConversationSessionIds);
  settings.promptHistory = normalizePromptHistory(saved && saved.promptHistory);
  const savedResearchNotes = (saved == null ? void 0 : saved.researchNotes) && typeof saved.researchNotes === "object" && !Array.isArray(saved.researchNotes) ? saved.researchNotes : {};
  settings.researchNotes = {
    folder: normalizeVaultFolder(
      savedResearchNotes.folder,
      DEFAULT_SETTINGS.researchNotes.folder
    ),
    exportFolder: normalizeVaultFolder(
      savedResearchNotes.exportFolder,
      DEFAULT_SETTINGS.researchNotes.exportFolder
    ),
    includeSelectionText: savedResearchNotes.includeSelectionText === true
  };
  if (!(saved == null ? void 0 : saved.researchNotes) || savedResearchNotes.folder !== settings.researchNotes.folder || savedResearchNotes.exportFolder !== settings.researchNotes.exportFolder || savedResearchNotes.includeSelectionText !== settings.researchNotes.includeSelectionText) {
    needsSave = true;
  }
  const normalizedContextBudget = normalizeContextBudget(saved == null ? void 0 : saved.contextBudget);
  settings.contextBudget = normalizedContextBudget.contextBudget;
  if (saved && normalizedContextBudget.changed) needsSave = true;
  const normalizedPaperCacheQuota = normalizePaperCacheQuota(saved == null ? void 0 : saved.paperCacheQuota);
  settings.paperCacheQuota = normalizedPaperCacheQuota.quota;
  if (saved && normalizedPaperCacheQuota.changed) needsSave = true;
  for (const session of Object.values(settings.conversationSessions)) {
    if (((_a = session.pendingTurn) == null ? void 0 : _a.status) !== "running") continue;
    session.pendingTurn = {
      ...session.pendingTurn,
      status: "interrupted",
      progress: session.pendingTurn.progress || "Obsidian \u6216 PDF Chat \u5728\u4EFB\u52A1\u5B8C\u6210\u524D\u9000\u51FA"
    };
    needsSave = true;
  }
  for (const [key, history] of Object.entries(settings.conversationHistories)) {
    const hasSession = Object.values(settings.conversationSessions).some((session2) => session2.conversationKey === key);
    if (hasSession) continue;
    const session = legacySessionFromHistory(key, history);
    if (!session) continue;
    settings.conversationSessions[session.id] = session;
    settings.activeConversationSessionIds[key] = session.id;
    needsSave = true;
  }
  const normalizedRag = normalizeRagChunkSettings(settings.ragChunkSize, settings.ragChunkOverlap);
  settings.ragChunkSize = normalizedRag.ragChunkSize;
  settings.ragChunkOverlap = normalizedRag.ragChunkOverlap;
  if (normalizedRag.changed) needsSave = true;
  const hasTranslationObject = Boolean(
    saved && saved.translation && typeof saved.translation === "object" && !Array.isArray(saved.translation)
  );
  const nestedChunkChars = (_b = saved == null ? void 0 : saved.translation) == null ? void 0 : _b.chunkChars;
  const validNestedChunkChars = typeof nestedChunkChars === "number" && Number.isInteger(nestedChunkChars) && nestedChunkChars > 0 ? nestedChunkChars : null;
  const legacyChunkChars = saved == null ? void 0 : saved.translateChunkMaxChars;
  const validLegacyChunkChars = typeof legacyChunkChars === "number" && Number.isInteger(legacyChunkChars) && legacyChunkChars > 0 ? legacyChunkChars : null;
  if (nestedChunkChars !== void 0 && validNestedChunkChars === null) needsSave = true;
  if (hasTranslationObject) {
    settings.translation = {
      ...DEFAULT_SETTINGS.translation,
      ...saved.translation,
      chunkChars: (_c = validNestedChunkChars != null ? validNestedChunkChars : validLegacyChunkChars) != null ? _c : DEFAULT_SETTINGS.translation.chunkChars
    };
  } else {
    const legacyInstruction = typeof (saved == null ? void 0 : saved.translatePrompt) === "string" ? saved.translatePrompt : "";
    settings.translation = {
      ...DEFAULT_SETTINGS.translation,
      additionalInstruction: legacyInstruction.trim() && legacyInstruction !== LEGACY_0_4_0_TRANSLATE_PROMPT ? legacyInstruction : "",
      chunkChars: validLegacyChunkChars != null ? validLegacyChunkChars : DEFAULT_SETTINGS.translation.chunkChars
    };
    needsSave = true;
  }
  const savedCodex = saved && saved.codexDeepAnalysis && typeof saved.codexDeepAnalysis === "object" && !Array.isArray(saved.codexDeepAnalysis) ? saved.codexDeepAnalysis : {};
  const savedCodexTimeout = typeof savedCodex.timeoutMs === "number" && Number.isFinite(savedCodex.timeoutMs) && savedCodex.timeoutMs >= 3e4 ? Math.floor(savedCodex.timeoutMs) : null;
  const normalizedCodexTimeout = savedCodexTimeout === null || savedCodexTimeout === LEGACY_CODEX_TIMEOUT_MS ? DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs : savedCodexTimeout;
  if (savedCodexTimeout !== normalizedCodexTimeout) needsSave = true;
  settings.codexDeepAnalysis = {
    ...DEFAULT_SETTINGS.codexDeepAnalysis,
    ...savedCodex,
    enabled: savedCodex.enabled === true,
    command: typeof savedCodex.command === "string" && savedCodex.command.trim() ? savedCodex.command.trim() : DEFAULT_SETTINGS.codexDeepAnalysis.command,
    profile: typeof savedCodex.profile === "string" ? savedCodex.profile.trim() : "",
    model: typeof savedCodex.model === "string" && savedCodex.model.trim() ? savedCodex.model.trim() : DEFAULT_SETTINGS.codexDeepAnalysis.model,
    reasoningEffort: normalizeReasoningEffort2(savedCodex.reasoningEffort),
    verbosity: normalizeVerbosity(savedCodex.verbosity),
    inputMode: normalizeCodexInputMode(savedCodex.inputMode),
    outputMode: normalizeCodexOutputMode(savedCodex.outputMode),
    modelPresets: Array.isArray(savedCodex.modelPresets) && savedCodex.modelPresets.length ? savedCodex.modelPresets.filter(
      (preset) => !!preset && typeof preset === "object" && typeof preset.model === "string" && !!preset.model.trim()
    ).map((preset) => ({
      model: preset.model.trim(),
      reasoningEffort: normalizeReasoningEffort2(preset.reasoningEffort),
      label: typeof preset.label === "string" && preset.label.trim() ? preset.label.trim() : `${preset.model.trim()} \xB7 ${normalizeReasoningEffort2(preset.reasoningEffort)}`
    })) : DEFAULT_SETTINGS.codexDeepAnalysis.modelPresets.map((preset) => ({ ...preset })),
    timeoutMs: normalizedCodexTimeout,
    keepTempFiles: savedCodex.keepTempFiles === true,
    includeSelectionContext: typeof savedCodex.includeSelectionContext === "boolean" ? savedCodex.includeSelectionContext : DEFAULT_SETTINGS.codexDeepAnalysis.includeSelectionContext
  };
  if (saved && (saved.endpoint || saved.apiKey || saved.model) && !(saved.models && saved.models.length)) {
    const migrated = {
      id: "migrated-" + now(),
      name: "\u8FC1\u79FB\u81EA\u65E7\u8BBE\u7F6E",
      endpoint: saved.endpoint || DEFAULT_SETTINGS.models[0].endpoint,
      apiKey: saved.apiKey || DEFAULT_SETTINGS.models[0].apiKey,
      model: saved.model || DEFAULT_SETTINGS.models[0].model
    };
    settings.models = [migrated, ...DEFAULT_SETTINGS.models.map((model) => ({ ...model }))];
    settings.activeModelId = migrated.id;
    needsSave = true;
  }
  if (!settings.models.length) {
    settings.models = DEFAULT_SETTINGS.models.map((model) => ({ ...model }));
    needsSave = true;
  }
  if (!settings.models.find((model) => model.id === settings.activeModelId)) {
    settings.activeModelId = settings.models[0].id;
    needsSave = true;
  }
  if (settings.endpoint !== void 0 || settings.apiKey !== void 0 || settings.model !== void 0) {
    delete settings.endpoint;
    delete settings.apiKey;
    delete settings.model;
    needsSave = true;
  }
  if (settings.translatePrompt !== void 0) {
    delete settings.translatePrompt;
    needsSave = true;
  }
  if (settings.translateChunkMaxChars !== void 0) {
    delete settings.translateChunkMaxChars;
    needsSave = true;
  }
  return { settings, needsSave };
}

// src/settings-tab.ts
var import_obsidian7 = require("obsidian");

// src/settings-ui.ts
function createSettingsSection(parent, title) {
  const section = parent.createEl("section", {
    cls: "pdf-chat-settings-section",
    attr: { "aria-labelledby": `pdf-chat-settings-${title}` }
  });
  const compatibleSection = section;
  if (typeof compatibleSection.createEl !== "function") return parent;
  section.createEl("h3", {
    text: title,
    attr: { id: `pdf-chat-settings-${title}` }
  });
  return section;
}

// src/settings-tab.ts
function labelExtraButton(button, label) {
  if (!button.extraSettingsEl) return;
  button.extraSettingsEl.setAttr("aria-label", label);
}
var PDFChatSettingTab = class extends import_obsidian7.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PDF Chat \u8BBE\u7F6E" });
    this.renderModelSection(createSettingsSection(containerEl, "\u6A21\u578B"));
    this.renderChatSection(createSettingsSection(containerEl, "\u804A\u5929"));
    this.renderTranslationSection(createSettingsSection(containerEl, "\u7FFB\u8BD1"));
    this.renderPaperContextSection(createSettingsSection(containerEl, "\u8BBA\u6587\u4E0A\u4E0B\u6587"));
    this.renderResearchNotesSection(createSettingsSection(containerEl, "\u7814\u7A76\u7B14\u8BB0"));
    this.renderAdvancedSection(createSettingsSection(containerEl, "\u9AD8\u7EA7"));
  }
  renderResearchNotesSection(containerEl) {
    containerEl.createEl("p", {
      text: "\u628A\u53EF\u89C1\u95EE\u7B54\u548C\u5DF2\u9A8C\u8BC1\u7684\u8BBA\u6587\u9875\u7801\u4FDD\u5B58\u4E3A Obsidian Markdown\u3002\u7B14\u8BB0\u4E0D\u4F1A\u5305\u542B API Key\u3001\u9690\u85CF\u63D0\u793A\u8BCD\u3001RAG \u5305\u88C5\u6216\u672C\u673A\u7EDD\u5BF9\u8DEF\u5F84\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian7.Setting(containerEl).setName("\u9605\u8BFB\u7B14\u8BB0\u6587\u4EF6\u5939").setDesc("\u5355\u7BC7\u8BBA\u6587\u5199\u5165\u4EE5\u8BBA\u6587\u547D\u540D\u7684\u7B14\u8BB0\uFF1B\u5F15\u7528\u591A\u7BC7\u8BBA\u6587\u7684\u8BA8\u8BBA\u5199\u5165 Synthesis.md\u3002").addText(
      (text) => text.setValue(this.plugin.settings.researchNotes.folder).onChange(async (value) => {
        this.plugin.settings.researchNotes.folder = value.trim() || DEFAULT_SETTINGS.researchNotes.folder;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u4F1A\u8BDD\u5BFC\u51FA\u6587\u4EF6\u5939").setDesc("\u4F1A\u8BDD\u8D44\u6599\u5E93\u5BFC\u51FA Markdown \u65F6\u4F7F\u7528\u7684\u9ED8\u8BA4\u4F4D\u7F6E\u3002").addText(
      (text) => text.setValue(this.plugin.settings.researchNotes.exportFolder).onChange(async (value) => {
        this.plugin.settings.researchNotes.exportFolder = value.trim() || DEFAULT_SETTINGS.researchNotes.exportFolder;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u4FDD\u5B58\u9009\u533A\u539F\u6587").setDesc("\u9ED8\u8BA4\u5173\u95ED\u3002\u5173\u95ED\u65F6\u7B14\u8BB0\u53EA\u4FDD\u5B58\u9009\u533A\u5B57\u6570\u4E0E\u54C8\u5E0C\uFF1B\u5F00\u542F\u540E\u624D\u4FDD\u5B58\u9009\u533A\u6B63\u6587\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.researchNotes.includeSelectionText).onChange(async (value) => {
        this.plugin.settings.researchNotes.includeSelectionText = value;
        await this.plugin.saveSettings();
      })
    );
  }
  renderModelSection(containerEl) {
    containerEl.createEl("p", {
      text: "\u65E5\u5E38\u53EA\u9700\u8981\u7EF4\u62A4\u4E3B\u8981 API \u6A21\u578B\uFF1B\u591A\u6A21\u578B\u914D\u7F6E\u4ECD\u7136\u4FDD\u7559\u5728\u4E0B\u65B9\u9AD8\u7EA7\u6298\u53E0\u533A\u3002",
      cls: "setting-item-description"
    });
    const renderModelConfig = (targetEl, model, index) => {
      const isActive = model.id === this.plugin.settings.activeModelId;
      const header = new import_obsidian7.Setting(targetEl).setName(`\u6A21\u578B ${index + 1}${isActive ? " \xB7 \u9ED8\u8BA4" : ""}`);
      header.addText(
        (text) => text.setPlaceholder("\u540D\u79F0").setValue(model.name).onChange(async (value) => {
          model.name = value;
          await this.plugin.saveSettings();
        })
      );
      if (!isActive) {
        header.addExtraButton((button) => {
          labelExtraButton(button, "\u8BBE\u4E3A\u9ED8\u8BA4");
          button.setIcon("star").onClick(async () => {
            this.plugin.settings.activeModelId = model.id;
            await this.plugin.saveSettings();
            this.display();
          });
        });
      }
      header.addExtraButton((button) => {
        labelExtraButton(button, "\u5220\u9664\u8FD9\u4E2A\u6A21\u578B");
        button.setIcon("trash").onClick(async () => {
          if (this.plugin.settings.models.length <= 1) {
            new import_obsidian7.Notice("\u81F3\u5C11\u8981\u4FDD\u7559\u4E00\u4E2A\u6A21\u578B\u914D\u7F6E");
            return;
          }
          this.plugin.settings.models.splice(index, 1);
          if (this.plugin.settings.activeModelId === model.id) {
            this.plugin.settings.activeModelId = this.plugin.settings.models[0].id;
          }
          await this.plugin.saveSettings();
          this.display();
        });
      });
      new import_obsidian7.Setting(targetEl).setName("Endpoint").addText(
        (text) => text.setPlaceholder("OpenAI \u517C\u5BB9\u7684 chat/completions \u63A5\u53E3\u5730\u5740").setValue(model.endpoint).onChange(async (value) => {
          model.endpoint = value.trim();
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian7.Setting(targetEl).setName("API Key").addText((text) => {
        text.inputEl.type = "password";
        text.setValue(model.apiKey).onChange(async (value) => {
          model.apiKey = value.trim();
          await this.plugin.saveSettings();
        });
      });
      new import_obsidian7.Setting(targetEl).setName("\u6A21\u578B\u540D(model \u5B57\u6BB5)").addText(
        (text) => text.setValue(model.model).onChange(async (value) => {
          model.model = value.trim();
          await this.plugin.saveSettings();
        })
      );
      targetEl.createEl("hr");
    };
    const activeIndex = Math.max(
      0,
      this.plugin.settings.models.findIndex((model) => model.id === this.plugin.settings.activeModelId)
    );
    const activeModel = this.plugin.settings.models[activeIndex] || this.plugin.settings.models[0];
    if (activeModel) renderModelConfig(containerEl, activeModel, activeIndex);
    const maybeAdvancedEl = containerEl.createEl("details", { cls: "pdf-chat-settings-advanced-models" });
    const advancedEl = maybeAdvancedEl && typeof maybeAdvancedEl.createEl === "function" ? maybeAdvancedEl : containerEl;
    if (advancedEl !== containerEl) {
      advancedEl.createEl("summary", { text: "\u9AD8\u7EA7\u6A21\u578B\u914D\u7F6E" });
    }
    this.plugin.settings.models.forEach((model, index) => {
      if (index === activeIndex) return;
      renderModelConfig(advancedEl, model, index);
    });
    new import_obsidian7.Setting(advancedEl).addButton(
      (button) => button.setButtonText("+ \u6DFB\u52A0\u6A21\u578B").setCta().onClick(async () => {
        this.plugin.settings.models.push({
          id: "model-" + Date.now(),
          name: "\u65B0\u6A21\u578B",
          endpoint: "",
          apiKey: "",
          model: ""
        });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
  renderChatSection(containerEl) {
    new import_obsidian7.Setting(containerEl).setName("\u6D41\u5F0F\u8F93\u51FA").setDesc("\u5F00\u542F\u540E\u7B54\u6848\u4F1A\u4E00\u8FB9\u751F\u6210\u4E00\u8FB9\u663E\u793A\uFF1B\u5173\u95ED\u5219\u7B49\u751F\u6210\u5B8C\u518D\u4E00\u6B21\u6027\u663E\u793A").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.stream).onChange(async (value) => {
        this.plugin.settings.stream = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Temperature").addText(
      (text) => text.setValue(String(this.plugin.settings.temperature)).onChange(async (value) => {
        const parsed = parseFloat(value);
        this.plugin.settings.temperature = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.temperature;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Max Tokens").addText(
      (text) => text.setValue(String(this.plugin.settings.maxTokens)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.maxTokens = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.maxTokens;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u7EE7\u7EED\u5BF9\u8BDD\u4F7F\u7528\u7684\u6A21\u578B").setDesc("\u7559\u7A7A\u65F6\u4F18\u5148\u9009\u62E9 id\u3001\u6A21\u578B\u540D\u6216\u663E\u793A\u540D\u79F0\u4E2D\u5305\u542B GLM \u7684\u6A21\u578B\uFF0C\u7136\u540E\u56DE\u9000\u5230\u9ED8\u8BA4\u6A21\u578B\u3002").addDropdown((dropdown) => {
      dropdown.addOption("", "\u81EA\u52A8\uFF08\u4F18\u5148 GLM\uFF09");
      this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
      dropdown.setValue(this.plugin.settings.continueModelId);
      dropdown.onChange(async (value) => {
        this.plugin.settings.continueModelId = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("\u7CFB\u7EDF\u63D0\u793A\u8BCD").setDesc("\u4F1A\u81EA\u52A8\u9644\u52A0\u9009\u4E2D\u7684\u539F\u6587\u7247\u6BB5\u5728\u5176\u540E").addTextArea((text) => {
      text.inputEl.rows = 6;
      text.setValue(this.plugin.settings.systemPrompt).onChange(async (value) => {
        this.plugin.settings.systemPrompt = value;
        await this.plugin.saveSettings();
      });
    });
  }
  renderTranslationSection(containerEl) {
    new import_obsidian7.Setting(containerEl).setName("\u7FFB\u8BD1\u4F7F\u7528\u7684\u6A21\u578B").setDesc("\u7559\u7A7A\u65F6\u4F18\u5148\u9009\u62E9 id\u3001\u6A21\u578B\u540D\u6216\u663E\u793A\u540D\u79F0\u4E2D\u5305\u542B DeepSeek \u7684\u6A21\u578B\uFF0C\u7136\u540E\u56DE\u9000\u5230\u9ED8\u8BA4\u6A21\u578B\u3002").addDropdown((dropdown) => {
      dropdown.addOption("", "\u81EA\u52A8\uFF08\u4F18\u5148 DeepSeek\uFF09");
      this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
      dropdown.setValue(this.plugin.settings.translateModelId);
      dropdown.onChange(async (value) => {
        this.plugin.settings.translateModelId = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("\u5212\u8BCD\u540E\u81EA\u52A8\u51FA\u73B0\u300C\u8BD1\u300D\u60AC\u6D6E\u56FE\u6807").setDesc("\u4EC5\u5728\u6D3B\u52A8\u89C6\u56FE\u662F PDF \u4E14\u9009\u533A\u975E\u7A7A\u65F6\u663E\u793A\uFF1B\u70B9\u51FB\u540E\u6253\u5F00\u65B0\u5F39\u7A97\u5E76\u81EA\u52A8\u7FFB\u8BD1\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.quickTranslateMarkerEnabled).onChange(async (value) => {
        this.plugin.settings.quickTranslateMarkerEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u7FFB\u8BD1\u76EE\u6807\u8BED\u8A00").setDesc("\u7528\u4E8E\u5F39\u7A97\u4E2D\u7684\u9009\u533A\u7FFB\u8BD1\uFF0C\u4F8B\u5982 zh-CN\u3001en \u6216 ja").addText(
      (text) => text.setValue(this.plugin.settings.translation.targetLanguage).onChange(async (value) => {
        this.plugin.settings.translation.targetLanguage = value.trim() || DEFAULT_SETTINGS.translation.targetLanguage;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u7FFB\u8BD1\u5206\u5757\u5927\u5C0F\uFF08Unicode \u5B57\u7B26\uFF09").setDesc("\u957F\u9009\u533A\u4F1A\u6309 Unicode \u5B57\u7B26\u6570\u5206\u5757\u53D1\u9001\u3002\u8BF7\u8F93\u5165\u5927\u4E8E 0 \u7684\u6574\u6570\uFF1B\u65E0\u6548\u503C\u6062\u590D\u4E3A 8000\u3002").addText(
      (text) => text.setValue(String(this.plugin.settings.translation.chunkChars)).onChange(async (value) => {
        const parsed = Number(value.trim());
        this.plugin.settings.translation.chunkChars = Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_SETTINGS.translation.chunkChars;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u7FFB\u8BD1\u9644\u52A0\u8981\u6C42").setDesc("\u53EF\u9009\u3002\u7528\u4E8E\u8865\u5145\u672F\u8BED\u3001\u98CE\u683C\u6216\u9886\u57DF\u7EA6\u5B9A\uFF1B\u539F\u6587\u7531\u72EC\u7ACB\u7FFB\u8BD1\u4EFB\u52A1\u5B89\u5168\u9644\u52A0\u3002").addTextArea((text) => {
      text.inputEl.rows = 4;
      text.setValue(this.plugin.settings.translation.additionalInstruction).onChange(async (value) => {
        this.plugin.settings.translation.additionalInstruction = value;
        await this.plugin.saveSettings();
      });
    });
  }
  renderPaperContextSection(containerEl) {
    var _a;
    containerEl.createEl("h4", { text: "\u5168\u6587\u6458\u8981" });
    containerEl.createEl("p", {
      text: "\u5168\u6587\u6458\u8981\u6309\u6587\u4EF6\u8DEF\u5F84\u548C\u4FEE\u6539\u65F6\u95F4\u7F13\u5B58\uFF0C\u53EF\u4F5C\u4E3A\u5F53\u524D\u9009\u533A\u4E4B\u5916\u7684\u7B80\u8981\u80CC\u666F\u3002\u4EC5\u5BF9 PDF \u751F\u6548\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian7.Setting(containerEl).setName("\u6253\u5F00 PDF \u5212\u8BCD\u5F39\u7A97\u65F6\u81EA\u52A8\u9644\u5E26\u5168\u6587\u6458\u8981").setDesc("\u6709\u7F13\u5B58\u65F6\u76F4\u63A5\u4F7F\u7528\uFF1B\u6CA1\u6709\u7F13\u5B58\u65F6\u81EA\u52A8\u751F\u6210\u4E00\u6B21\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoDocSummary).onChange(async (value) => {
        this.plugin.settings.autoDocSummary = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6458\u8981\u751F\u6210\u7528\u7684\u6A21\u578B").setDesc("\u5EFA\u8BAE\u9009\u62E9\u901F\u5EA6\u5FEB\u3001\u6210\u672C\u4F4E\u7684\u6A21\u578B\uFF0C\u804A\u5929\u4E3B\u6A21\u578B\u53EF\u4EE5\u4E0D\u540C\u3002").addDropdown((dropdown) => {
      this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
      dropdown.setValue(this.plugin.settings.summaryModelId || this.plugin.settings.activeModelId);
      dropdown.onChange(async (value) => {
        this.plugin.settings.summaryModelId = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("\u5168\u6587\u622A\u65AD\u5B57\u7B26\u6570\u4E0A\u9650").addText(
      (text) => text.setValue(String(this.plugin.settings.summaryMaxChars)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.summaryMaxChars = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.summaryMaxChars;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6458\u8981\u6700\u5927\u8F93\u51FA token \u6570").addText(
      (text) => text.setValue(String(this.plugin.settings.summaryMaxTokens)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.summaryMaxTokens = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.summaryMaxTokens;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6458\u8981\u751F\u6210\u63D0\u793A\u8BCD").addTextArea((text) => {
      text.inputEl.rows = 5;
      text.inputEl.style.width = "100%";
      text.setValue(this.plugin.settings.summaryPrompt).onChange(async (value) => {
        this.plugin.settings.summaryPrompt = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("\u6E05\u7A7A\u5DF2\u7F13\u5B58\u7684\u5168\u6587\u6458\u8981").setDesc(`\u5F53\u524D\u5DF2\u7F13\u5B58 ${Object.keys(this.plugin.settings.docSummaries || {}).length} \u7BC7\u6587\u6863\u7684\u6458\u8981`).addButton(
      (button) => button.setButtonText("\u6E05\u7A7A\u7F13\u5B58").onClick(async () => {
        this.plugin.settings.docSummaries = {};
        await this.plugin.saveSettings();
        this.display();
      })
    );
    containerEl.createEl("h4", { text: "\u5168\u6587\u76F4\u8BFB / RAG \u68C0\u7D22" });
    containerEl.createEl("p", {
      text: "\u8F83\u77ED PDF \u76F4\u63A5\u63D0\u4F9B\u5168\u6587\uFF1B\u8D85\u8FC7\u9608\u503C\u65F6\u9000\u56DE\u672C\u5730 BM25 \u68C0\u7D22\u3002\u68C0\u7D22\u4E0E\u6458\u8981\u4E92\u8865\uFF0C\u4E0D\u9700\u8981 embedding \u6A21\u578B\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian7.Setting(containerEl).setName("\u5168\u6587\u76F4\u8BFB\u7684\u5B57\u6570\u9608\u503C").setDesc("\u5168\u6587\u4E0D\u8D85\u8FC7\u6B64\u503C\u65F6\u76F4\u63A5\u4EA4\u7ED9\u6A21\u578B\u56DE\u7B54\uFF1B\u8D85\u8FC7\u65F6\u4F7F\u7528\u5173\u952E\u8BCD\u68C0\u7D22\u3002").addText(
      (text) => text.setValue(String(this.plugin.settings.ragFullTextThreshold)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.ragFullTextThreshold = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.ragFullTextThreshold;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6253\u5F00 PDF \u5212\u8BCD\u5F39\u7A97\u65F6\u81EA\u52A8\u5EFA\u7ACB\u68C0\u7D22\u7D22\u5F15").setDesc("\u7D22\u5F15\u662F\u7EAF\u672C\u5730\u6587\u672C\u5207\u5757\uFF0C\u51E0\u4E4E\u4E0D\u8017\u65F6\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoRag).onChange(async (value) => {
        this.plugin.settings.autoRag = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u63D0\u95EE\u524D\u5148\u8BA9\u5FEB\u6A21\u578B\u601D\u8003\u68C0\u7D22\u89D2\u5EA6").setDesc("\u751F\u6210\u591A\u7EC4\u4E2D\u82F1\u53CC\u8BED\u68C0\u7D22\u8BCD\u540E\u878D\u5408\u6392\u5E8F\uFF0C\u4EE3\u4EF7\u662F\u6BCF\u6B21\u63D0\u95EE\u591A\u4E00\u6B21\u6A21\u578B\u8C03\u7528\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ragQueryTranslate).onChange(async (value) => {
        this.plugin.settings.ragQueryTranslate = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u68C0\u7D22\u89D2\u5EA6\u89C4\u5212\u63D0\u793A\u8BCD").addTextArea((text) => {
      text.inputEl.rows = 5;
      text.inputEl.style.width = "100%";
      text.setValue(this.plugin.settings.ragQueryPrompt).onChange(async (value) => {
        this.plugin.settings.ragQueryPrompt = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("\u6BCF\u6B21\u68C0\u7D22\u8FD4\u56DE\u7684\u7247\u6BB5\u6570(Top K)").addText(
      (text) => text.setValue(String(this.plugin.settings.ragTopK)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.ragTopK = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.ragTopK;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u5355\u5757\u6700\u5927\u5B57\u7B26\u6570").addText(
      (text) => text.setValue(String(this.plugin.settings.ragChunkSize)).onChange(async (value) => {
        const normalized = normalizeRagChunkSettings(
          Number(value.trim()),
          this.plugin.settings.ragChunkOverlap
        );
        this.plugin.settings.ragChunkSize = normalized.ragChunkSize;
        this.plugin.settings.ragChunkOverlap = normalized.ragChunkOverlap;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u5207\u5757\u91CD\u53E0\u5B57\u7B26\u6570").addText(
      (text) => text.setValue(String(this.plugin.settings.ragChunkOverlap)).onChange(async (value) => {
        const normalized = normalizeRagChunkSettings(
          this.plugin.settings.ragChunkSize,
          Number(value.trim())
        );
        this.plugin.settings.ragChunkSize = normalized.ragChunkSize;
        this.plugin.settings.ragChunkOverlap = normalized.ragChunkOverlap;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6E05\u7A7A\u5DF2\u7F13\u5B58\u7684\u68C0\u7D22\u7D22\u5F15").setDesc(`\u5F53\u524D\u5DF2\u4E3A ${Object.keys(this.plugin.settings.docChunks || {}).length} \u7BC7\u6587\u6863\u5EFA\u7ACB\u8FC7\u7D22\u5F15`).addButton(
      (button) => button.setButtonText("\u6E05\u7A7A\u7F13\u5B58").onClick(async () => {
        this.plugin.settings.docChunks = {};
        await this.plugin.saveSettings();
        this.display();
      })
    );
    containerEl.createEl("h4", { text: "\u672C\u5730\u8BBA\u6587\u7F13\u5B58" });
    const runtimeUsage = (_a = this.plugin.readerDataStore) == null ? void 0 : _a.usage();
    const fallbackPaths = /* @__PURE__ */ new Set([
      ...Object.keys(this.plugin.settings.docSummaries || {}),
      ...Object.keys(this.plugin.settings.docChunks || {})
    ]);
    const usage = runtimeUsage || {
      entries: fallbackPaths.size,
      bytes: JSON.stringify({
        summaries: this.plugin.settings.docSummaries || {},
        chunks: this.plugin.settings.docChunks || {}
      }).length
    };
    const usageMiB = (usage.bytes / (1024 * 1024)).toFixed(1);
    const limitMiB = Math.round(this.plugin.settings.paperCacheQuota.maxBytes / (1024 * 1024));
    new import_obsidian7.Setting(containerEl).setName("\u8BBA\u6587\u7F13\u5B58\u7528\u91CF").setDesc(`${usage.entries} \u7BC7 \xB7 ${usageMiB} MiB / ${limitMiB} MiB\uFF1B\u53EA\u5305\u542B\u53EF\u91CD\u65B0\u751F\u6210\u7684\u6458\u8981\u548C RAG \u7D22\u5F15\u3002`).addButton((button) => button.setButtonText("\u5237\u65B0").onClick(() => this.display()));
    new import_obsidian7.Setting(containerEl).setName("\u8BBA\u6587\u7F13\u5B58\u4E0A\u9650\uFF08\u7BC7\uFF09").setDesc("\u5199\u5165\u65B0\u7684\u8BBA\u6587\u8D44\u4EA7\u540E\u6309\u6700\u4E45\u672A\u4F7F\u7528\u987A\u5E8F\u6E05\u7406\uFF1B\u5F53\u524D\u6B63\u5728\u9605\u8BFB\u7684\u8BBA\u6587\u4E0D\u4F1A\u88AB\u81EA\u52A8\u6E05\u7406\u3002").addText(
      (text) => text.setValue(String(this.plugin.settings.paperCacheQuota.maxEntries)).onChange(async (value) => {
        const parsed = Number(value.trim());
        this.plugin.settings.paperCacheQuota.maxEntries = Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_SETTINGS.paperCacheQuota.maxEntries;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u8BBA\u6587\u7F13\u5B58\u4E0A\u9650\uFF08MiB\uFF09").setDesc("\u53EA\u9650\u5236\u53EF\u91CD\u5EFA\u8BBA\u6587\u7F13\u5B58\uFF0C\u4E0D\u4F1A\u5220\u9664\u5BF9\u8BDD\u3001Codex thread \u6216\u7528\u6237\u7B54\u6848\u3002").addText(
      (text) => text.setValue(String(limitMiB)).onChange(async (value) => {
        const parsed = Number(value.trim());
        this.plugin.settings.paperCacheQuota.maxBytes = Number.isInteger(parsed) && parsed > 0 ? parsed * 1024 * 1024 : DEFAULT_SETTINGS.paperCacheQuota.maxBytes;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6E05\u7A7A\u6240\u6709\u53EF\u91CD\u5EFA\u8BBA\u6587\u7F13\u5B58").setDesc("\u5220\u9664\u672C\u5730\u6458\u8981\u548C RAG \u7D22\u5F15\uFF1B\u4E0B\u6B21\u9700\u8981\u65F6\u4F1A\u91CD\u65B0\u751F\u6210\uFF0C\u4E0D\u5F71\u54CD\u4EFB\u4F55\u4F1A\u8BDD\u3002").addButton(
      (button) => button.setButtonText("\u6E05\u7A7A\u8BBA\u6587\u7F13\u5B58").onClick(async () => {
        var _a2;
        this.plugin.settings.docSummaries = {};
        this.plugin.settings.docChunks = {};
        await ((_a2 = this.plugin.readerDataStore) == null ? void 0 : _a2.clearPaperCache());
        await this.plugin.saveSettings();
        new import_obsidian7.Notice("\u5DF2\u6E05\u7A7A\u53EF\u91CD\u5EFA\u8BBA\u6587\u7F13\u5B58\uFF1B\u5BF9\u8BDD\u8BB0\u5F55\u672A\u53D7\u5F71\u54CD\u3002");
        this.display();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u5220\u9664\u8FC1\u79FB\u5907\u4EFD").setDesc("\u4EC5\u5220\u9664\u5206\u5C42\u5B58\u50A8\u8FC1\u79FB\u65F6\u751F\u6210\u7684\u8131\u654F\u9605\u8BFB\u6570\u636E\u5FEB\u7167\uFF1B\u4E0D\u4F1A\u5220\u9664\u5F53\u524D\u4F1A\u8BDD\u6216\u8BBA\u6587\u7F13\u5B58\u3002").addButton(
      (button) => button.setButtonText("\u5220\u9664\u8FC1\u79FB\u5907\u4EFD").onClick(async () => {
        var _a2;
        const removed = await ((_a2 = this.plugin.readerDataStore) == null ? void 0 : _a2.clearMigrationSnapshot());
        new import_obsidian7.Notice(removed ? "\u8FC1\u79FB\u5907\u4EFD\u5DF2\u5220\u9664\u3002" : "\u6CA1\u6709\u53EF\u5220\u9664\u7684\u8FC1\u79FB\u5907\u4EFD\u3002");
        this.display();
      })
    );
  }
  renderAdvancedSection(containerEl) {
    containerEl.createEl("p", {
      text: "\u9ED8\u8BA4\u5FEB\u6377\u952E\uFF1ACtrl+Alt+Q \u65B0\u5F00\u5BF9\u8BDD\uFF1BCtrl+Q \u7EE7\u7EED\u4E0A\u6B21\u5BF9\u8BDD\u3002\u53EF\u5728 \u8BBE\u7F6E\u2192\u5FEB\u6377\u952E\u2192\u641C\u7D22\u201CPDF Chat\u201D\u4E2D\u4FEE\u6539\u3002\u5F39\u7A97\u652F\u6301\u62D6\u52A8\u3001\u7F29\u653E\u3001\u8FDE\u7EED\u8FFD\u95EE\u548C\u505C\u6B62\u751F\u6210\u3002",
      cls: "setting-item-description"
    });
    containerEl.createEl("h4", { text: "Codex \u8BBA\u6587\u7EC8\u7AEF" });
    containerEl.createEl("p", {
      text: "\u542F\u7528\u540E\uFF0C\u53EF\u5728\u804A\u5929\u6846\u8F93\u5165 /codex \u8FDB\u5165 Codex CLI \u591A\u8F6E\u4F1A\u8BDD\u3002\u666E\u901A\u6A21\u5F0F\u4E0D\u4F1A\u6839\u636E\u5173\u952E\u8BCD\u81EA\u52A8\u5207\u6362\u3002\u9ED8\u8BA4\u53EA\u5411 Codex \u63D0\u4F9B\u7528\u6237\u95EE\u9898\u3001\u6240\u9009 PDF \u7684\u672C\u5730\u8DEF\u5F84\u548C\u53EF\u9009\u7684\u5F53\u524D\u9009\u533A\uFF0C\u4E0D\u4F1A\u4F20\u9012 data.json\u3001API key \u6216\u6A21\u578B endpoint\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian7.Setting(containerEl).setName("\u542F\u7528 Codex CLI \u6DF1\u5EA6\u5206\u6790").setDesc("\u4EC5\u684C\u9762\u7AEF\u53EF\u7528\u3002Codex \u4F7F\u7528\u5B83\u81EA\u5DF1\u7684\u767B\u5F55/\u914D\u7F6E\uFF0C\u4E0D\u4F7F\u7528 PDF Chat \u7684 API key\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.codexDeepAnalysis.enabled).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.enabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Codex \u547D\u4EE4").setDesc("\u9ED8\u8BA4 codex\uFF1B\u5982\u679C\u4E0D\u5728 PATH \u4E2D\uFF0C\u53EF\u586B\u5199 codex \u53EF\u6267\u884C\u6587\u4EF6\u7684\u5B8C\u6574\u8DEF\u5F84\u3002").addText(
      (text) => text.setValue(this.plugin.settings.codexDeepAnalysis.command).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.command = value.trim() || DEFAULT_SETTINGS.codexDeepAnalysis.command;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Codex profile").setDesc("\u53EF\u9009\uFF1B\u5BF9\u5E94 codex exec --profile\u3002\u7559\u7A7A\u5219\u4F7F\u7528 Codex \u9ED8\u8BA4\u914D\u7F6E\u3002").addText(
      (text) => text.setValue(this.plugin.settings.codexDeepAnalysis.profile).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.profile = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Codex model").setDesc("\u5BF9\u5E94 codex exec --model\u3002\u9ED8\u8BA4 gpt-5.5\uFF1B\u4E5F\u53EF\u4EE5\u5728\u804A\u5929\u6846\u7528 /model \u5207\u6362\u3002").addText(
      (text) => text.setValue(this.plugin.settings.codexDeepAnalysis.model).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.model = value.trim() || DEFAULT_SETTINGS.codexDeepAnalysis.model;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Codex reasoning effort").setDesc("\u5BF9\u5E94 -c model_reasoning_effort\u3002\u9ED8\u8BA4 medium\uFF1B\u6DF1\u5EA6\u4EFB\u52A1\u53EF\u5347\u5230 high/xhigh\u3002").addDropdown((dropdown) => {
      for (const effort of ["minimal", "low", "medium", "high", "xhigh"]) {
        dropdown.addOption(effort, effort);
      }
      dropdown.setValue(this.plugin.settings.codexDeepAnalysis.reasoningEffort).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.reasoningEffort = value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh" ? value : DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("Codex verbosity").setDesc("\u5BF9\u5E94 -c model_verbosity\u3002\u9ED8\u8BA4 medium\uFF0C\u9700\u8981\u66F4\u5145\u5206\u65F6\u53EF\u6539 high\u3002").addDropdown((dropdown) => {
      for (const verbosity of ["low", "medium", "high"]) dropdown.addOption(verbosity, verbosity);
      dropdown.setValue(this.plugin.settings.codexDeepAnalysis.verbosity).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.verbosity = value === "low" || value === "medium" || value === "high" ? value : DEFAULT_SETTINGS.codexDeepAnalysis.verbosity;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("Codex input mode").setDesc("\u9ED8\u8BA4 PDF-only\uFF1ACodex \u5728\u5F53\u524D PDF \u6587\u4EF6\u5939\u4E2D\u76F4\u63A5\u8BFB\u53D6\u6240\u9009 PDF \u8DEF\u5F84\uFF1BDebug full \u4EC5\u4FDD\u7559\u7ED9\u65E7\u7684\u4E00\u6B21\u6027\u8BCA\u65AD\u6D41\u7A0B\u3002").addDropdown((dropdown) => {
      dropdown.addOption("pdf-only", "PDF-only");
      dropdown.addOption("debug-full", "Debug full");
      dropdown.setValue(this.plugin.settings.codexDeepAnalysis.inputMode || DEFAULT_SETTINGS.codexDeepAnalysis.inputMode);
      dropdown.onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.inputMode = value === "debug-full" ? value : "pdf-only";
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("Codex output mode").setDesc("\u9ED8\u8BA4 Markdown\uFF1A\u8BA9 Codex \u81EA\u7136\u56DE\u7B54\uFF1BJSON schema \u4EC5\u7528\u4E8E\u7ED3\u6784\u5316\u517C\u5BB9\u6216\u8C03\u8BD5\u3002").addDropdown((dropdown) => {
      dropdown.addOption("markdown", "Markdown (natural)");
      dropdown.addOption("json-schema", "JSON schema (structured/debug)");
      dropdown.setValue(this.plugin.settings.codexDeepAnalysis.outputMode || DEFAULT_SETTINGS.codexDeepAnalysis.outputMode);
      dropdown.onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.outputMode = value === "json-schema" ? "json-schema" : "markdown";
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("Codex \u9ED8\u8BA4\u9644\u5E26\u9009\u533A\u4E0A\u4E0B\u6587").setDesc("\u5F00\u542F\u540E\uFF0CPDF Chat \u4F1A\u628A\u5F53\u524D\u5212\u9009\u6BB5\u843D\u76F4\u63A5\u9644\u5728\u4E0B\u4E00\u8F6E Codex prompt \u4E2D\uFF1B\u5F39\u7A97\u5185\u4E5F\u53EF\u7528\u201C\u9644\u9009\u533A\u201D\u6309\u94AE\u6216 /context \u4E34\u65F6\u5207\u6362\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.codexDeepAnalysis.includeSelectionContext).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.includeSelectionContext = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("Codex \u8D85\u65F6\u6BEB\u79D2").setDesc("\u9ED8\u8BA4 1800000\uFF0C\u5373 30 \u5206\u949F\uFF1BPDF \u8BFB\u53D6\u6216\u9AD8\u5F3A\u5EA6\u63A8\u7406\u53EF\u80FD\u8F83\u6162\uFF0C\u8D85\u65F6\u540E\u4F1A\u7EC8\u6B62 Codex \u8FDB\u7A0B\u3002").addText(
      (text) => text.setValue(String(this.plugin.settings.codexDeepAnalysis.timeoutMs)).onChange(async (value) => {
        const parsed = Number(value.trim());
        this.plugin.settings.codexDeepAnalysis.timeoutMs = Number.isFinite(parsed) && parsed >= 3e4 ? Math.floor(parsed) : DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u4FDD\u7559 Codex \u4E34\u65F6\u5206\u6790\u5305").setDesc("\u4EC5\u5F71\u54CD\u65E7\u7684 Debug full \u4E00\u6B21\u6027\u8BCA\u65AD\u6D41\u7A0B\uFF1B\u5E38\u89C4 /codex \u591A\u8F6E\u4F1A\u8BDD\u4E0D\u4F1A\u521B\u5EFA\u4E34\u65F6\u5206\u6790\u5305\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.codexDeepAnalysis.keepTempFiles).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.keepTempFiles = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h4", { text: "\u9605\u8BFB\u6A21\u5F0F\u9884\u8BBE" });
    containerEl.createEl("p", {
      text: "\u5F39\u7A97\u7684\u9605\u8BFB\u6A21\u5F0F\u4F1A\u5217\u51FA\u8FD9\u4E9B\u9884\u8BBE\uFF1B\u5207\u6362\u540E\u66FF\u6362\u7CFB\u7EDF\u63D0\u793A\u8BCD\uFF0C\u9009\u533A\u539F\u6587\u4ECD\u4F1A\u81EA\u52A8\u9644\u52A0\u3002",
      cls: "setting-item-description"
    });
    this.plugin.settings.promptPresets.forEach((preset, index) => {
      const nameSetting = new import_obsidian7.Setting(containerEl).setName(`\u9884\u8BBE ${index + 1}`);
      nameSetting.addText(
        (text) => text.setPlaceholder("\u540D\u79F0").setValue(preset.name).onChange(async (value) => {
          preset.name = value;
          await this.plugin.saveSettings();
        })
      );
      nameSetting.addExtraButton((button) => {
        labelExtraButton(button, "\u5220\u9664\u8FD9\u4E2A\u9884\u8BBE");
        button.setIcon("trash").onClick(async () => {
          this.plugin.settings.promptPresets.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      });
      new import_obsidian7.Setting(containerEl).addTextArea((text) => {
        text.inputEl.rows = 4;
        text.inputEl.style.width = "100%";
        text.setPlaceholder("\u8FD9\u5957\u6A21\u5F0F\u7684\u7CFB\u7EDF\u63D0\u793A\u8BCD/\u6307\u4EE4").setValue(preset.prompt).onChange(async (value) => {
          preset.prompt = value;
          await this.plugin.saveSettings();
        });
      });
    });
    new import_obsidian7.Setting(containerEl).addButton(
      (button) => button.setButtonText("+ \u6DFB\u52A0\u9884\u8BBE").setCta().onClick(async () => {
        this.plugin.settings.promptPresets.push({
          id: "preset-" + Date.now(),
          name: "\u65B0\u9884\u8BBE",
          prompt: ""
        });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};

// src/vault-lifecycle.ts
function pdfKey(path) {
  return `pdf:${path}`;
}
function replaceExactPath(paths, oldPath, newPath) {
  return Array.from(new Set(paths.map((path) => path === oldPath ? newPath : path)));
}
function chooseNewer(current, candidate) {
  var _a, _b, _c, _d;
  if (!candidate) return current;
  if (!current) return candidate;
  const currentTime = (_b = (_a = current.updatedAt) != null ? _a : current.generatedAt) != null ? _b : 0;
  const candidateTime = (_d = (_c = candidate.updatedAt) != null ? _c : candidate.generatedAt) != null ? _d : 0;
  return candidateTime > currentTime ? candidate : current;
}
function sessionUpdatedAt(sessions, id) {
  return id && sessions[id] ? sessions[id].updatedAt : 0;
}
function reconcilePdfRenameState(input, oldPath, newPath) {
  if (!oldPath || !newPath || oldPath === newPath) return input;
  const oldKey = pdfKey(oldPath);
  const newKey = pdfKey(newPath);
  const conversationSessions = Object.fromEntries(
    Object.entries(input.conversationSessions).map(([id, session]) => [
      id,
      {
        ...session,
        conversationKey: session.conversationKey === oldKey ? newKey : session.conversationKey,
        referencedPdfPaths: replaceExactPath(session.referencedPdfPaths, oldPath, newPath),
        sourceStatus: session.conversationKey === oldKey ? "available" : session.sourceStatus
      }
    ])
  );
  const activeConversationSessionIds = { ...input.activeConversationSessionIds };
  const oldActiveId = activeConversationSessionIds[oldKey];
  if (oldActiveId) {
    const currentNewId = activeConversationSessionIds[newKey];
    if (!currentNewId || sessionUpdatedAt(conversationSessions, oldActiveId) >= sessionUpdatedAt(conversationSessions, currentNewId)) {
      activeConversationSessionIds[newKey] = oldActiveId;
    }
    delete activeConversationSessionIds[oldKey];
  }
  const conversationHistories = { ...input.conversationHistories };
  const migratedHistory = chooseNewer(conversationHistories[newKey], conversationHistories[oldKey]);
  if (migratedHistory) conversationHistories[newKey] = migratedHistory;
  delete conversationHistories[oldKey];
  const docSummaries = { ...input.docSummaries };
  const migratedSummary = chooseNewer(docSummaries[newPath], docSummaries[oldPath]);
  if (migratedSummary) docSummaries[newPath] = migratedSummary;
  delete docSummaries[oldPath];
  const docChunks = { ...input.docChunks };
  const migratedChunks = chooseNewer(docChunks[newPath], docChunks[oldPath]);
  if (migratedChunks) docChunks[newPath] = migratedChunks;
  delete docChunks[oldPath];
  return {
    ...input,
    conversationSessions,
    activeConversationSessionIds,
    conversationHistories,
    docSummaries,
    docChunks
  };
}
function reconcilePdfDeleteState(input, path) {
  if (!path) return input;
  const key = pdfKey(path);
  const conversationSessions = Object.fromEntries(
    Object.entries(input.conversationSessions).map(([id, session]) => [
      id,
      session.conversationKey === key ? { ...session, sourceStatus: "missing" } : { ...session }
    ])
  );
  const docSummaries = { ...input.docSummaries };
  const docChunks = { ...input.docChunks };
  delete docSummaries[path];
  delete docChunks[path];
  return { ...input, conversationSessions, docSummaries, docChunks };
}
function isPdfPath(path) {
  return /\.pdf$/i.test(path);
}
var VaultLifecycleService = class {
  constructor(vault, getSettings, replaceSettings, persist) {
    this.vault = vault;
    this.getSettings = getSettings;
    this.replaceSettings = replaceSettings;
    this.persist = persist;
    __publicField(this, "queue", Promise.resolve());
  }
  attach(register) {
    register(
      this.vault.on("rename", (file, oldPath) => {
        const newPath = file.path;
        if (isPdfPath(oldPath) && isPdfPath(newPath)) {
          this.enqueue(() => reconcilePdfRenameState(this.getSettings(), oldPath, newPath));
        } else if (isPdfPath(oldPath)) {
          this.enqueue(() => reconcilePdfDeleteState(this.getSettings(), oldPath));
        }
      })
    );
    register(
      this.vault.on("delete", (file) => {
        if (isPdfPath(file.path)) {
          this.enqueue(() => reconcilePdfDeleteState(this.getSettings(), file.path));
        }
      })
    );
  }
  enqueue(update) {
    this.queue = this.queue.catch(() => void 0).then(async () => {
      this.replaceSettings(update());
      await this.persist();
    });
  }
};

// src/main.ts
function nodeInsideElement(container, node) {
  if (!node) return false;
  const candidate = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !!candidate && container.contains(candidate);
}
function getActivePdfViewContainer(app) {
  var _a;
  const leaf = (_a = app.workspace) == null ? void 0 : _a.activeLeaf;
  const view = leaf == null ? void 0 : leaf.view;
  if (!view || typeof view.getViewType !== "function" || view.getViewType() !== "pdf") return null;
  return view.containerEl || view.contentEl || (leaf == null ? void 0 : leaf.containerEl) || null;
}
function isSelectionInsideActivePdfView(app, selection, doc) {
  if (!getActivePdfFile(app)) return false;
  const container = getActivePdfViewContainer(app);
  if (!container || container.ownerDocument !== doc) return false;
  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (anchorNode || focusNode) {
    return nodeInsideElement(container, anchorNode) && nodeInsideElement(container, focusNode);
  }
  if (selection.rangeCount > 0) {
    const ancestor = selection.getRangeAt(selection.rangeCount - 1).commonAncestorContainer;
    return nodeInsideElement(container, ancestor);
  }
  return false;
}
var PDFChatPlugin = class extends import_obsidian8.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "_saveQueue", Promise.resolve());
    __publicField(this, "conversationStore");
    __publicField(this, "llmTransport");
    __publicField(this, "paperContextService");
    __publicField(this, "translationService");
    __publicField(this, "actionRegistry");
    __publicField(this, "modalServices");
    __publicField(this, "quickTranslateMarker");
    __publicField(this, "codexSessionManager");
    __publicField(this, "vaultLifecycleService");
    __publicField(this, "readerDataStore");
    __publicField(this, "researchArtifacts");
    __publicField(this, "codexGlobalUnsubscribe");
    __publicField(this, "codexRunningSessionIds", /* @__PURE__ */ new Set());
  }
  async onload() {
    var _a, _b, _c;
    this._saveQueue = Promise.resolve();
    await this.loadSettings();
    this.conversationStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    this.codexSessionManager = new CodexSessionManager(this.conversationStore, void 0, {
      installationId: this.settings.installationId
    });
    this.codexGlobalUnsubscribe = this.codexSessionManager.subscribeAll(
      ({ snapshot, hasSessionSubscribers }) => {
        var _a2;
        if (snapshot.status === "running") {
          this.codexRunningSessionIds.add(snapshot.sessionId);
          return;
        }
        if (!this.codexRunningSessionIds.delete(snapshot.sessionId)) return;
        if (hasSessionSubscribers || !["idle", "failed", "stopped"].includes(snapshot.status)) return;
        const session = (_a2 = this.conversationStore) == null ? void 0 : _a2.getSession(snapshot.sessionId);
        const title = (session == null ? void 0 : session.title) || snapshot.question || "Codex \u4EFB\u52A1";
        if (snapshot.status === "idle") {
          new import_obsidian8.Notice(`Codex \u5DF2\u5B8C\u6210\uFF1A${title}`);
        } else if (snapshot.status === "stopped") {
          new import_obsidian8.Notice(`Codex \u5DF2\u505C\u6B62\uFF1A${title}`);
        } else {
          new import_obsidian8.Notice(`Codex \u4EFB\u52A1\u5931\u8D25\uFF1A${title}`);
        }
      }
    );
    this.llmTransport = new OpenAICompatibleTransport(
      () => this.settings,
      (id) => this.getModelProfile(id)
    );
    this.paperContextService = new PaperContextService(
      this.app,
      () => this.settings,
      () => this.saveSettings(),
      this.llmTransport,
      (id) => this.getModelProfile(id)
    );
    this.translationService = new TranslationService(this.llmTransport);
    if ((_a = this.app) == null ? void 0 : _a.vault) {
      const researchNoteService = new ResearchNoteService(
        this.app.vault,
        () => this.settings.researchNotes
      );
      this.researchArtifacts = {
        appendTurn: (request) => researchNoteService.appendTurn(request),
        exportSessionMarkdown: (session, targetPath) => researchNoteService.exportSessionMarkdown(session, targetPath),
        openEvidence: (evidence) => openPdfEvidence(this.app, evidence)
      };
    }
    this.actionRegistry = createResearchActionRegistry();
    if (((_b = this.app) == null ? void 0 : _b.vault) && typeof this.app.vault.on === "function") {
      this.vaultLifecycleService = new VaultLifecycleService(
        this.app.vault,
        () => this.settings,
        (settings) => {
          this.settings = settings;
        },
        () => this.saveSettings()
      );
      this.vaultLifecycleService.attach((event) => this.registerEvent(event));
    }
    this.modalServices = createPDFChatModalServices(this, {
      conversations: {
        getKey: (file, selectedText, kind) => getConversationKey(file, selectedText, kind),
        get: (key) => this.conversationStore.get(key),
        save: (key, messages) => this.conversationStore.save(key, messages),
        clear: (key) => this.conversationStore.clear(key),
        getActiveSession: (key) => this.conversationStore.getActiveSession(key),
        ensureSession: (key, metadata) => this.conversationStore.ensureSession(key, metadata),
        startSession: (key, metadata) => this.conversationStore.startSession(key, metadata),
        saveActiveSession: (key, messages, metadata) => this.conversationStore.saveActiveSession(key, messages, metadata),
        getSession: (id) => this.conversationStore.getSession(id),
        saveSessionById: (id, messages, metadata) => this.conversationStore.saveSessionById(id, messages, metadata),
        appendSessionTurn: (id, userContent, assistantContent) => this.conversationStore.appendSessionTurn(id, userContent, assistantContent),
        updateSessionMetadata: (id, metadata) => this.conversationStore.updateSessionMetadata(id, metadata),
        beginCodexTurn: (id, pendingTurn) => this.conversationStore.beginCodexTurn(id, pendingTurn),
        updateCodexTurn: (id, turnId, patch, codex) => this.conversationStore.updateCodexTurn(id, turnId, patch, codex),
        completeCodexTurn: (id, turnId, userContent, assistantContent, codex) => this.conversationStore.completeCodexTurn(
          id,
          turnId,
          userContent,
          assistantContent,
          codex
        ),
        clearSession: (id) => this.conversationStore.clearSession(id),
        closeSession: (id) => this.conversationStore.closeSession(id),
        archiveSession: (id) => this.conversationStore.archiveSession(id),
        rebindSessionSource: (id, newPath) => this.conversationStore.rebindSessionSource(id, newPath),
        resumeSession: (id) => this.conversationStore.resumeSession(id),
        listSessions: (query) => this.conversationStore.listSessions(query)
      },
      papers: {
        getOrCreateDocSummary: (file, forceRefresh) => this.paperContextService.getOrCreateDocSummary(file, forceRefresh),
        getOrCreateDocChunks: (file, forceRefresh) => this.paperContextService.getOrCreateDocChunks(file, forceRefresh),
        extractPages: (file) => this.paperContextService.extractPages(file),
        extractFullText: (file) => this.paperContextService.extractFullText(file),
        planRagQueries: (question) => this.paperContextService.planRagQueries(question),
        retrieveContext: (chunks, queries, topK) => this.paperContextService.retrieveContext(chunks, queries, topK)
      },
      llm: { chat: (request) => this.llmTransport.chat(request) },
      models: {
        get: (id) => this.getModelProfile(id),
        resolveTranslateId: () => this.resolveTranslateModelId(),
        resolveContinueId: () => this.resolveContinueModelId()
      },
      actions: this.actionRegistry,
      translations: this.translationService,
      codex: this.codexSessionManager,
      artifacts: this.researchArtifacts
    });
    this.addSettingTab(new PDFChatSettingTab(this.app, this));
    this.addCommand({
      id: "ask-about-selection",
      name: "\u9488\u5BF9\u9009\u4E2D\u5185\u5BB9\u63D0\u95EE,\u65B0\u5F00\u5BF9\u8BDD (PDF Chat)",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "Q" }],
      callback: () => this.openChatModal(true)
    });
    this.addCommand({
      id: "continue-conversation",
      name: "\u9488\u5BF9\u9009\u4E2D\u5185\u5BB9\u63D0\u95EE,\u7EE7\u7EED\u4E0A\u6B21\u5BF9\u8BDD (PDF Chat)",
      hotkeys: [{ modifiers: ["Mod"], key: "Q" }],
      callback: () => this.openChatModal(false)
    });
    this.quickTranslateMarker = new QuickTranslateMarker({
      isEnabled: () => this.settings.quickTranslateMarkerEnabled,
      getActivePdfFile: () => getActivePdfFile(this.app),
      isSelectionInsideActivePdf: (selection, doc) => isSelectionInsideActivePdfView(this.app, selection, doc),
      openModal: (request) => this.openQuickTranslateModal(request)
    });
    if (typeof document !== "undefined") this.quickTranslateMarker.attach(document);
    const workspace = (_c = this.app) == null ? void 0 : _c.workspace;
    workspace == null ? void 0 : workspace.onLayoutReady(() => {
      const windowOpenRef = workspace.on("window-open", (workspaceWindow) => {
        var _a2;
        if (workspaceWindow == null ? void 0 : workspaceWindow.doc) (_a2 = this.quickTranslateMarker) == null ? void 0 : _a2.attach(workspaceWindow.doc);
      });
      const windowCloseRef = workspace.on("window-close", (workspaceWindow) => {
        var _a2;
        if (workspaceWindow == null ? void 0 : workspaceWindow.doc) (_a2 = this.quickTranslateMarker) == null ? void 0 : _a2.detach(workspaceWindow.doc);
      });
      const activeLeafRef = workspace.on("active-leaf-change", () => {
        var _a2;
        (_a2 = this.quickTranslateMarker) == null ? void 0 : _a2.hide();
      });
      this.registerEvent(windowOpenRef);
      this.registerEvent(windowCloseRef);
      this.registerEvent(activeLeafRef);
    });
  }
  onunload() {
    var _a, _b, _c;
    (_a = this.codexGlobalUnsubscribe) == null ? void 0 : _a.call(this);
    this.codexGlobalUnsubscribe = void 0;
    this.codexRunningSessionIds.clear();
    (_b = this.codexSessionManager) == null ? void 0 : _b.dispose();
    this.codexSessionManager = void 0;
    this.vaultLifecycleService = void 0;
    (_c = this.quickTranslateMarker) == null ? void 0 : _c.destroy();
    this.quickTranslateMarker = void 0;
  }
  // startFresh=true: 新开一份对话,不加载这个 PDF(或选区)之前保存的记录;
  // startFresh=false: 加载并接续之前保存的记录(如果有)。两个快捷键共用同一段取选中文字的逻辑。
  openChatModal(startFresh) {
    const win = activeWindow || window;
    const sel = win.getSelection ? win.getSelection() : null;
    const raw = sel ? sel.toString() : "";
    const text = cleanSelectionText(raw || "");
    const pdfFile = getActivePdfFile(this.app);
    if (!text && !pdfFile) {
      new import_obsidian8.Notice("\u6CA1\u6709\u68C0\u6D4B\u5230\u9009\u4E2D\u7684\u6587\u5B57,\u8BF7\u5148\u5212\u9009\u4E00\u6BB5\u5185\u5BB9\u518D\u6309\u5FEB\u6377\u952E");
      return;
    }
    const paperContext = this.paperContextService.createContext(
      pdfFile,
      text,
      getConversationKey(pdfFile, text)
    );
    new PDFChatModal(this.app, this, paperContext, null, startFresh, this.modalServices).open();
  }
  openQuickTranslateModal(request) {
    const paperContext = this.paperContextService.createContext(
      request.file,
      request.selectedText,
      getConversationKey(request.file, request.selectedText)
    );
    new PDFChatModal(
      this.app,
      this,
      paperContext,
      null,
      request.startFresh,
      this.modalServices,
      request.autoTranslateOnOpen
    ).open();
  }
  async loadSettings() {
    var _a, _b, _c;
    const { settings, needsSave } = migrateSettings(await this.loadData());
    this.settings = settings;
    const adapter = (_b = (_a = this.app) == null ? void 0 : _a.vault) == null ? void 0 : _b.adapter;
    if (isJsonAdapter(adapter)) {
      const pluginId = ((_c = this.manifest) == null ? void 0 : _c.id) || "pdf-chat";
      const root = `.obsidian/plugins/${pluginId}/reader-data`;
      const readerDataStore = new ReaderDataStore(adapter, root);
      const initialized = await readerDataStore.initialize(
        this.settings,
        (persistedSettings) => this.enqueueRawDataSave(persistedSettings)
      );
      this.settings = initialized.settings;
      if (initialized.fallback) {
        this.readerDataStore = void 0;
        new import_obsidian8.Notice("\u9605\u8BFB\u6570\u636E\u8FC1\u79FB\u5C1A\u672A\u5B8C\u6210\uFF0C\u5F53\u524D\u7EE7\u7EED\u4F7F\u7528\u517C\u5BB9\u5B58\u50A8\uFF1B\u4F60\u7684\u539F\u6709\u6570\u636E\u672A\u88AB\u5220\u9664\u3002");
      } else {
        this.readerDataStore = readerDataStore;
      }
    }
    if (needsSave) await this.saveSettings();
  }
  enqueueRawDataSave(data) {
    const snapshot = JSON.parse(JSON.stringify(data));
    const previousSave = this._saveQueue || Promise.resolve();
    const nextSave = previousSave.catch(() => void 0).then(() => this.saveData(snapshot));
    this._saveQueue = nextSave;
    return nextSave;
  }
  async saveSettings() {
    const snapshot = JSON.parse(JSON.stringify(this.settings));
    const previousSave = this._saveQueue || Promise.resolve();
    const nextSave = previousSave.catch(() => void 0).then(async () => {
      var _a, _b, _c;
      const activePdfPath = ((_a = this.app) == null ? void 0 : _a.workspace) ? (_b = getActivePdfFile(this.app)) == null ? void 0 : _b.path : void 0;
      const synchronized = await ((_c = this.readerDataStore) == null ? void 0 : _c.synchronize(snapshot, {
        protectedPaths: activePdfPath ? [activePdfPath] : []
      }));
      for (const vaultPath of (synchronized == null ? void 0 : synchronized.evictedPaths) || []) {
        delete this.settings.docSummaries[vaultPath];
        delete this.settings.docChunks[vaultPath];
      }
      const persisted = this.readerDataStore ? this.readerDataStore.settingsForPersistence(snapshot) : snapshot;
      await this.saveData(persisted);
    });
    this._saveQueue = nextSave;
    return nextSave;
  }
  getConversationKey(pdfFile, contextText, kind = "chat") {
    return getConversationKey(pdfFile, contextText, kind);
  }
  getConversation(key) {
    if (this.conversationStore) return this.conversationStore.get(key);
    const histories = this.settings.conversationHistories || {};
    const entry = histories[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }
  async saveConversation(key, messages) {
    if (this.conversationStore) return this.conversationStore.save(key, messages);
    const fallbackStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    return fallbackStore.save(key, messages);
  }
  async clearConversation(key) {
    if (this.conversationStore) return this.conversationStore.clear(key);
    const fallbackStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    return fallbackStore.clear(key);
  }
  getModelProfile(id) {
    return this.settings.models.find((m) => m.id === id) || this.settings.models[0];
  }
  async generateDocSummary(file) {
    return this.paperContextService.generateDocSummary(file);
  }
  resolveTranslateModelId() {
    return resolveTranslateModelId(this.settings);
  }
  resolveContinueModelId() {
    return resolveContinueModelId(this.settings);
  }
  async getOrCreateDocSummary(file, forceRefresh) {
    return this.paperContextService.getOrCreateDocSummary(file, forceRefresh);
  }
  async generateDocChunks(file) {
    return this.paperContextService.generateDocChunks(file);
  }
  async planRagQueries(question) {
    return this.paperContextService.planRagQueries(question);
  }
  async getOrCreateDocChunks(file, forceRefresh) {
    return this.paperContextService.getOrCreateDocChunks(file, forceRefresh);
  }
  async chat(messages, onChunk, signal, modelProfile, options = {}) {
    return this.llmTransport.chat({
      messages,
      onChunk,
      signal,
      modelProfile,
      stream: options.stream,
      maxTokensOverride: options.maxTokensOverride,
      temperatureOverride: options.temperatureOverride
    });
  }
  async chatOnce(messages, signal, profile, maxTokensOverride) {
    return this.llmTransport.chatOnce(messages, signal, profile, maxTokensOverride);
  }
  async chatStream(messages, onChunk, signal, profile) {
    return this.llmTransport.chatStream(messages, onChunk, signal, profile);
  }
};
