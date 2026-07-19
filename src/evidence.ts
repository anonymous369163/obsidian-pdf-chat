import { Notice, type App } from "obsidian";
import type { ResearchEvidence } from "./types";

export interface EvidenceSource {
  alias: string;
  paperPath: string;
  pageCount?: number;
}

interface EvidenceCandidate {
  index: number;
  raw: string;
  alias?: string;
  path?: string;
  page: number;
}

const ALIAS_CITATION = /\[([A-Za-z][A-Za-z0-9_-]*)\s*,\s*p(?:age)?\.?\s*(-?\d+)\]/gi;
const PDF_LINK_CITATION = /\[\[([^\]#|]+\.pdf)#page=(-?\d+)(?:\|[^\]]*)?\]\]/gi;

function normalizedPath(value: string): string {
  return value.trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeClaim(markdown: string, index: number, rawLength: number): string {
  const lineStart = markdown.lastIndexOf("\n", index) + 1;
  const nextLineBreak = markdown.indexOf("\n", index + rawLength);
  const lineEnd = nextLineBreak >= 0 ? nextLineBreak : markdown.length;
  const cleaned = markdown
    .slice(lineStart, lineEnd)
    .replace(ALIAS_CITATION, "")
    .replace(PDF_LINK_CITATION, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:。！？；：])/g, "$1")
    .trim();
  return cleaned || "论文证据";
}

function collectCandidates(markdown: string): EvidenceCandidate[] {
  const candidates: EvidenceCandidate[] = [];
  for (const match of markdown.matchAll(ALIAS_CITATION)) {
    candidates.push({
      index: match.index || 0,
      raw: match[0],
      alias: match[1],
      page: Number(match[2]),
    });
  }
  for (const match of markdown.matchAll(PDF_LINK_CITATION)) {
    candidates.push({
      index: match.index || 0,
      raw: match[0],
      path: normalizedPath(match[1]),
      page: Number(match[2]),
    });
  }
  return candidates.sort((left, right) => left.index - right.index);
}

function validPage(page: number, source?: EvidenceSource): boolean {
  if (!Number.isInteger(page) || page < 1 || !source) return false;
  if (Number.isInteger(source.pageCount) && Number(source.pageCount) > 0) {
    return page <= Number(source.pageCount);
  }
  return true;
}

export function parseResearchEvidence(
  markdown: string,
  sources: EvidenceSource[]
): ResearchEvidence[] {
  if (typeof markdown !== "string" || !markdown.trim()) return [];
  const normalizedSources = (Array.isArray(sources) ? sources : [])
    .filter((source) => source && source.alias && source.paperPath)
    .map((source) => ({
      ...source,
      alias: source.alias.trim(),
      paperPath: normalizedPath(source.paperPath),
    }));
  const byAlias = new Map(normalizedSources.map((source) => [source.alias.toLowerCase(), source]));
  const byPath = new Map(normalizedSources.map((source) => [source.paperPath.toLowerCase(), source]));
  const seen = new Set<string>();
  const evidence: ResearchEvidence[] = [];

  for (const candidate of collectCandidates(markdown)) {
    const source = candidate.alias
      ? byAlias.get(candidate.alias.toLowerCase())
      : byPath.get((candidate.path || "").toLowerCase());
    const paperPath = source?.paperPath || candidate.path;
    const sourceAlias = source?.alias || candidate.alias;
    const claim = normalizeClaim(markdown, candidate.index, candidate.raw.length);
    const verification = validPage(candidate.page, source) ? "located" : "unverified";
    const dedupeKey = `${(paperPath || sourceAlias || "unknown").toLowerCase()}|${candidate.page}|${claim.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    evidence.push({
      id: `evidence-${stableHash(`${dedupeKey}|${candidate.raw}`)}`,
      claim,
      ...(paperPath ? { paperPath } : {}),
      ...(Number.isInteger(candidate.page) ? { page: candidate.page } : {}),
      ...(sourceAlias ? { sourceAlias } : {}),
      verification,
      raw: candidate.raw,
    });
  }
  return evidence;
}

export async function openPdfEvidence(
  app: Pick<App, "vault" | "workspace">,
  evidence: ResearchEvidence
): Promise<boolean> {
  if (
    !evidence ||
    evidence.verification !== "located" ||
    !evidence.paperPath ||
    !Number.isInteger(evidence.page) ||
    Number(evidence.page) < 1
  ) {
    new Notice("这条证据尚未验证，无法定位到 PDF 页面。");
    return false;
  }
  const paperPath = normalizedPath(evidence.paperPath);
  const file = app.vault.getAbstractFileByPath(paperPath);
  if (!file || !paperPath.toLowerCase().endsWith(".pdf")) {
    new Notice("证据对应的 PDF 已移动或不存在，无法打开页面。");
    return false;
  }
  await app.workspace.openLinkText(`${paperPath}#page=${evidence.page}`, "", false);
  return true;
}
