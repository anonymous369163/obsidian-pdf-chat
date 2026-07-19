const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadBundle(pageTexts = []) {
  const source = fs.readFileSync(path.join(projectRoot, "main.js"), "utf8");
  class Plugin {}
  class Modal {}
  class PluginSettingTab {}
  class Notice {}
  class Setting {}
  const pdfjsLib = {
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: pageTexts.length,
        getPage: async (pageNumber) => ({
          getTextContent: async () => ({ items: [{ str: pageTexts[pageNumber - 1] }] }),
        }),
      }),
    }),
  };
  const sandbox = {
    AbortController,
    TextDecoder,
    URL,
    clearTimeout,
    console,
    module: { exports: {} },
    require(request) {
      if (request === "obsidian") {
        return { Plugin, Modal, PluginSettingTab, Notice, Setting, MarkdownRenderer: {}, requestUrl: async () => ({}) };
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    window: { pdfjsLib },
  };
  sandbox.exports = sandbox.module.exports;
  sandbox.fetch = async () => {
    throw new Error("Unexpected fetch in unit test");
  };
  vm.runInNewContext(source, sandbox, { filename: "main.js" });
  return sandbox.module.exports;
}

test("mostly empty scanned pages are classified as poor extraction", () => {
  const { assessExtractionQuality } = loadBundle();
  assert.equal(typeof assessExtractionQuality, "function");
  const report = assessExtractionQuality([
    { page: 1, text: "" },
    { page: 2, text: "x" },
    { page: 3, text: "   " },
  ]);
  assert.equal(report.quality, "poor");
  assert.equal(report.pageCount, 3);
  assert.ok(report.emptyPageRatio >= 2 / 3);
});

test("normal born-digital pages are classified as good extraction", () => {
  const { assessExtractionQuality } = loadBundle();
  const pages = Array.from({ length: 6 }, (_, index) => ({
    page: index + 1,
    text: `Section ${index + 1}. ` + "Readable academic prose with equations and evidence. ".repeat(20),
  }));
  const report = assessExtractionQuality(pages);
  assert.equal(report.quality, "good");
  assert.equal(report.emptyPageRatio, 0);
  assert.equal(report.replacementCharRatio, 0);
});

test("replacement-heavy text is classified as poor extraction", () => {
  const { assessExtractionQuality } = loadBundle();
  const report = assessExtractionQuality([
    { page: 1, text: `Readable prefix ${"�".repeat(60)} trailing text` },
  ]);
  assert.equal(report.quality, "poor");
  assert.ok(report.replacementCharRatio > 0.02);
});

test("summary and chunk caches persist the extraction-quality report", async () => {
  const pageTexts = Array.from({ length: 4 }, (_, index) =>
    `Page ${index + 1}. ` + "Readable paper content and experimental evidence. ".repeat(20)
  );
  const { PaperContextService } = loadBundle(pageTexts);
  const settings = {
    summaryMaxChars: 20000,
    summaryMaxTokens: 500,
    summaryPrompt: "Summarize",
    summaryModelId: "model",
    activeModelId: "model",
    ragChunkSize: 500,
    ragChunkOverlap: 50,
    ragQueryPrompt: "queries",
    docSummaries: {},
    docChunks: {},
  };
  let saves = 0;
  let binaryReads = 0;
  const service = new PaperContextService(
    { vault: { readBinary: async () => {
      binaryReads += 1;
      return new ArrayBuffer(8);
    } } },
    () => settings,
    async () => {
      saves += 1;
    },
    { chat: async () => "Summary" },
    () => ({ id: "model" })
  );
  const file = { path: "papers/demo.pdf", stat: { mtime: 7 } };

  const summary = await service.getOrCreateDocSummary(file, false);
  const chunks = await service.getOrCreateDocChunks(file, false);

  assert.equal(summary.extractionQuality.quality, "good");
  assert.equal(chunks.extractionQuality.quality, "good");
  assert.equal(settings.docSummaries[file.path].extractionQuality.pageCount, 4);
  assert.equal(settings.docChunks[file.path].extractionQuality.pageCount, 4);
  assert.equal(saves, 2);
  assert.equal(binaryReads, 1, "summary and RAG should share one PDF page extraction");
  assert.deepEqual(plain(chunks.extractionQuality), plain(summary.extractionQuality));
});
