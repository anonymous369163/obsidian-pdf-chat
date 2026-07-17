import type { App, TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "./default-settings";
import type { OpenAICompatibleTransport } from "./llm-transport";
import type {
  DocChunksEntry,
  DocSummaryEntry,
  ModelProfile,
  PaperContext,
  PdfChunk,
  PdfPageText,
  PDFChatSettings,
} from "./types";

interface PdfJsTextContent {
  items: Array<{ str?: string }>;
}

interface PdfJsPage {
  getTextContent(): Promise<PdfJsTextContent>;
}

interface PdfJsDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
}

interface PdfJsLoadingTask {
  promise: Promise<PdfJsDocument>;
}

interface PdfJsLibrary {
  getDocument(options: { data: ArrayBuffer }): PdfJsLoadingTask;
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLibrary;
  }
}

export function getActivePdfFile(app: App): TFile | null {
  const leaf = app.workspace.activeLeaf;
  const view = leaf && leaf.view;
  if (view && typeof view.getViewType === "function" && view.getViewType() === "pdf" && "file" in view) {
    return (view.file as TFile) || null;
  }
  return null;
}

export async function extractPdfPages(app: App, file: TFile): Promise<PdfPageText[]> {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib?.getDocument) {
    throw new Error("当前 Obsidian 版本没有暴露 pdfjsLib,无法提取全文");
  }
  const buffer = await app.vault.readBinary(file);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: PdfPageText[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: { str?: string }) => item.str || "").join(" ");
    pages.push({ page: pageNumber, text: pageText });
  }
  return pages;
}

export async function extractPdfFullText(app: App, file: TFile): Promise<string> {
  const pages = await extractPdfPages(app, file);
  return pages.map((page) => `[第${page.page}页]\n${page.text}`).join("\n\n").trim();
}

export function chunkPdfPages(pages: PdfPageText[], chunkSize: number, overlap: number): PdfChunk[] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError("chunkSize must be a positive integer");
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError("overlap must be an integer between 0 and chunkSize - 1");
  }
  const chunks: PdfChunk[] = [];
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
  chunks.forEach((chunk, index) => (chunk.idx = index));
  return chunks;
}

export function expandWithNeighbors(allChunks: PdfChunk[], retrieved: PdfChunk[]): PdfChunk[] {
  if (!retrieved?.length) return retrieved;
  const wanted = new Set<number>();
  retrieved.forEach((chunk) => {
    if (typeof chunk.idx !== "number") return;
    wanted.add(chunk.idx - 1);
    wanted.add(chunk.idx);
    wanted.add(chunk.idx + 1);
  });
  return allChunks
    .filter((chunk) => typeof chunk.idx === "number" && wanted.has(chunk.idx))
    .sort((left, right) => (left.idx || 0) - (right.idx || 0));
}

export function tokenizeForBM25(text: string): string[] {
  const lower = (text || "").toLowerCase();
  const tokens: string[] = [];
  const wordPattern = /[a-z0-9]+/g;
  let match: RegExpExecArray | null;
  while ((match = wordPattern.exec(lower))) tokens.push(match[0]);
  const cjk = lower.match(/[\u4e00-\u9fff]/g) || [];
  for (let index = 0; index < cjk.length; index++) {
    tokens.push(cjk[index]);
    if (index + 1 < cjk.length) tokens.push(cjk[index] + cjk[index + 1]);
  }
  return tokens;
}

export function bm25Retrieve(chunks: PdfChunk[], query: string, topK: number): PdfChunk[] {
  if (!chunks?.length) return [];
  const documentTokens = chunks.map((chunk) => tokenizeForBM25(chunk.text));
  const documentFrequency = new Map<string, number>();
  documentTokens.forEach((tokens) => {
    new Set(tokens).forEach((token) =>
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1)
    );
  });
  const documentCount = documentTokens.length;
  const averageLength =
    documentTokens.reduce((total, tokens) => total + tokens.length, 0) / (documentCount || 1) || 1;
  const k1 = 1.5;
  const b = 0.75;
  const queryTokens = Array.from(new Set(tokenizeForBM25(query)));

  const scored = chunks.map((chunk, index) => {
    const tokens = documentTokens[index];
    const documentLength = tokens.length || 1;
    const termFrequency = new Map<string, number>();
    tokens.forEach((token) => termFrequency.set(token, (termFrequency.get(token) || 0) + 1));
    let score = 0;
    for (const queryToken of queryTokens) {
      const frequency = termFrequency.get(queryToken) || 0;
      if (!frequency) continue;
      const containingDocuments = documentFrequency.get(queryToken) || 0;
      const inverseFrequency = Math.log(
        1 + (documentCount - containingDocuments + 0.5) / (containingDocuments + 0.5)
      );
      const denominator = frequency + k1 * (1 - b + (b * documentLength) / averageLength);
      score += inverseFrequency * ((frequency * (k1 + 1)) / denominator);
    }
    return { chunk, score };
  });

  return scored
    .sort((left, right) => right.score - left.score)
    .filter((entry) => entry.score > 0)
    .slice(0, topK)
    .map((entry) => entry.chunk);
}

export function bm25RetrieveMulti(chunks: PdfChunk[], queries: string[], topK: number): PdfChunk[] {
  const uniqueQueries = Array.from(new Set((queries || []).filter(Boolean)));
  if (!uniqueQueries.length) return [];
  const keyOf = (chunk: PdfChunk) => chunk.page + "::" + chunk.text.slice(0, 60);
  const fused = new Map<string, { chunk: PdfChunk; score: number }>();
  for (const query of uniqueQueries) {
    const ranked = bm25Retrieve(chunks, query, Math.max(topK * 2, 8));
    ranked.forEach((chunk, rank) => {
      const key = keyOf(chunk);
      const entry = fused.get(key) || { chunk, score: 0 };
      entry.score += 1 / (rank + 1);
      fused.set(key, entry);
    });
  }
  return Array.from(fused.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, topK)
    .map((entry) => entry.chunk);
}

export type PaperServiceSettings = Pick<
  PDFChatSettings,
  | "summaryMaxChars"
  | "summaryMaxTokens"
  | "summaryPrompt"
  | "summaryModelId"
  | "activeModelId"
  | "ragChunkSize"
  | "ragChunkOverlap"
  | "ragQueryPrompt"
  | "docSummaries"
  | "docChunks"
>;

export class PaperContextService {
  constructor(
    private readonly app: App,
    private readonly getSettings: () => PaperServiceSettings,
    private readonly persistSettings: () => Promise<void>,
    private readonly transport: OpenAICompatibleTransport,
    private readonly getModelProfile: (id: string) => ModelProfile
  ) {}

  createContext(file: TFile | null, selectedText: string, conversationKey: string): PaperContext {
    return { app: this.app, file, selectedText, conversationKey };
  }

  extractPages(file: TFile): Promise<PdfPageText[]> {
    return extractPdfPages(this.app, file);
  }

  extractFullText(file: TFile): Promise<string> {
    return extractPdfFullText(this.app, file);
  }

  async generateDocSummary(file: TFile): Promise<{ summary: string; fullLength: number; truncated: boolean }> {
    const settings = this.getSettings();
    const fullText = await this.extractFullText(file);
    let textForSummary = fullText;
    let truncated = false;
    const maxChars = settings.summaryMaxChars || DEFAULT_SETTINGS.summaryMaxChars;
    if (textForSummary.length > maxChars) {
      textForSummary = textForSummary.slice(0, maxChars);
      truncated = true;
    }
    const profile =
      this.getModelProfile(settings.summaryModelId) || this.getModelProfile(settings.activeModelId);
    const systemPrompt =
      settings.summaryPrompt + (truncated ? "\n\n(注意:原文过长,以下只是截断后的前面部分)" : "");
    const summary = await this.transport.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textForSummary || "(未能提取到文本内容)" },
      ],
      modelProfile: profile,
      maxTokensOverride: settings.summaryMaxTokens || DEFAULT_SETTINGS.summaryMaxTokens,
      stream: false,
    });
    return { summary, fullLength: fullText.length, truncated };
  }

  async getOrCreateDocSummary(file: TFile, forceRefresh: boolean): Promise<DocSummaryEntry> {
    const settings = this.getSettings();
    const mtime = file.stat && file.stat.mtime;
    const cached = settings.docSummaries[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) return cached;
    const { summary, fullLength, truncated } = await this.generateDocSummary(file);
    const entry = { mtime, summary, generatedAt: Date.now(), fullLength, truncated };
    settings.docSummaries[file.path] = entry;
    await this.persistSettings();
    return entry;
  }

  async generateDocChunks(file: TFile): Promise<{ chunks: PdfChunk[]; fullTextLength: number }> {
    const settings = this.getSettings();
    const pages = await extractPdfPages(this.app, file);
    const chunks = chunkPdfPages(
      pages,
      settings.ragChunkSize,
      settings.ragChunkOverlap
    );
    const fullTextLength = pages.reduce((total, page) => total + (page.text ? page.text.length : 0), 0);
    return { chunks, fullTextLength };
  }

  async planRagQueries(question: string): Promise<string[]> {
    const settings = this.getSettings();
    const profile =
      this.getModelProfile(settings.summaryModelId) || this.getModelProfile(settings.activeModelId);
    const raw = await this.transport.chat({
      messages: [
        { role: "system", content: settings.ragQueryPrompt },
        { role: "user", content: question },
      ],
      modelProfile: profile,
      maxTokensOverride: 300,
      stream: false,
    });
    return (raw || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\s\-*•\d.、)]+/, "").trim())
      .filter(Boolean);
  }

  async getOrCreateDocChunks(file: TFile, forceRefresh: boolean): Promise<DocChunksEntry> {
    const settings = this.getSettings();
    const mtime = file.stat && file.stat.mtime;
    const cached = settings.docChunks[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) {
      if (cached.chunks?.length && typeof cached.chunks[0].idx !== "number") {
        cached.chunks.forEach((chunk: PdfChunk, index: number) => (chunk.idx = index));
      }
      return cached;
    }
    const { chunks, fullTextLength } = await this.generateDocChunks(file);
    const entry = { mtime, chunks, fullTextLength, generatedAt: Date.now() };
    settings.docChunks[file.path] = entry;
    await this.persistSettings();
    return entry;
  }

  retrieveContext(chunks: PdfChunk[], queries: string[], topK: number): PdfChunk[] {
    return expandWithNeighbors(chunks, bm25RetrieveMulti(chunks, queries, topK));
  }
}
