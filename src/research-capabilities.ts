export type ResearchCapabilityKind = "related-papers" | "presentation";

export interface ResearchCapabilityDescriptor {
  kind: ResearchCapabilityKind;
  id: string;
  label: string;
}

export interface ResearchCapabilityPaper {
  vaultPath: string;
  name: string;
  role: "current" | "referenced";
}

export interface ResearchCapabilityEvidence {
  claim: string;
  paperPath: string;
  page: number;
  verification: "located";
}

export interface ResearchCapabilityContext {
  papers: ResearchCapabilityPaper[];
  evidence: ResearchCapabilityEvidence[];
  visibleAnswers: string[];
}

export interface RelatedPaperSearchRequest {
  query: string;
  context: ResearchCapabilityContext;
}

export interface RelatedPaperResult {
  title: string;
  url?: string;
  authors?: string[];
  year?: number;
  summary?: string;
}

export interface PresentationRequest {
  title: string;
  context: ResearchCapabilityContext;
}

export interface PresentationArtifact {
  kind: "file" | "vault-file" | "external";
  path?: string;
  url?: string;
}

export interface RelatedPaperSearchAdapter {
  id: string;
  label: string;
  isAvailable(): Promise<boolean>;
  search(request: RelatedPaperSearchRequest): Promise<RelatedPaperResult[]>;
}

export interface PresentationGeneratorAdapter {
  id: string;
  label: string;
  isAvailable(): Promise<boolean>;
  generate(request: PresentationRequest): Promise<PresentationArtifact>;
}

const UNSAFE_FIELD = /(?:^|[_-])(?:settings?|config|endpoint|credential|secret|password|token|api[_-]?key|access[_-]?key)(?:$|[_-])/i;

function compactFieldName(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function assertCredentialBlind(value: unknown, seen = new WeakSet<object>()): void {
  if (!value || typeof value !== "object") return;
  if (seen.has(value as object)) return;
  seen.add(value as object);
  if (Array.isArray(value)) {
    for (const item of value) assertCredentialBlind(item, seen);
    return;
  }
  for (const [field, nested] of Object.entries(value as Record<string, unknown>)) {
    const compact = compactFieldName(field);
    if (
      UNSAFE_FIELD.test(field) ||
      ["settings", "configuration", "endpoint", "apikey", "accesstoken", "refreshtoken", "bearertoken"].includes(compact)
    ) {
      throw new Error(`Unsafe settings or credential field rejected: ${field}`);
    }
    assertCredentialBlind(nested, seen);
  }
}

function normalizeVaultPdfPath(value: unknown): string {
  if (typeof value !== "string") throw new Error("Research capability paper path must be a vault-relative path");
  const normalized = value.trim().replace(/\\/g, "/");
  const parts = normalized.split("/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.startsWith("~/") ||
    normalized.includes("://") ||
    /^[A-Za-z]:\//.test(normalized) ||
    parts.some((part) => part === ".." || part === ".") ||
    !normalized.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Research capability paper path must be a vault-relative PDF path");
  }
  return parts.filter(Boolean).join("/");
}

function readableString(value: unknown, maxChars: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxChars) : "";
}

export function projectResearchCapabilityContext(value: unknown): ResearchCapabilityContext {
  assertCredentialBlind(value);
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const papers: ResearchCapabilityPaper[] = [];
  const seenPapers = new Set<string>();
  for (const item of Array.isArray(source.papers) ? source.papers : []) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const candidate = item as Record<string, unknown>;
    const vaultPath = normalizeVaultPdfPath(candidate.vaultPath);
    if (seenPapers.has(vaultPath)) continue;
    seenPapers.add(vaultPath);
    papers.push({
      vaultPath,
      name: readableString(candidate.name, 240) || vaultPath.split("/").pop() || vaultPath,
      role: candidate.role === "current" ? "current" : "referenced",
    });
  }
  const evidence: ResearchCapabilityEvidence[] = [];
  const seenEvidence = new Set<string>();
  for (const item of Array.isArray(source.evidence) ? source.evidence : []) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const candidate = item as Record<string, unknown>;
    if (candidate.verification !== "located") continue;
    const paperPath = normalizeVaultPdfPath(candidate.paperPath);
    const page = Number(candidate.page);
    const claim = readableString(candidate.claim, 4000);
    if (!claim || !Number.isInteger(page) || page < 1 || !seenPapers.has(paperPath)) continue;
    const key = `${paperPath}:${page}:${claim}`;
    if (seenEvidence.has(key)) continue;
    seenEvidence.add(key);
    evidence.push({ claim, paperPath, page, verification: "located" });
  }
  const visibleAnswers = (Array.isArray(source.visibleAnswers) ? source.visibleAnswers : [])
    .map((answer) => readableString(answer, 50000))
    .filter(Boolean)
    .slice(0, 20);
  return { papers, evidence, visibleAnswers };
}

function normalizeAdapterId(value: unknown): string {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id || !/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(id)) {
    throw new Error("Research capability adapter id is invalid");
  }
  return id;
}

async function available(adapter: { isAvailable(): Promise<boolean> }): Promise<boolean> {
  try {
    return await adapter.isAvailable();
  } catch {
    return false;
  }
}

export class ResearchCapabilityRegistry {
  private readonly relatedPaperAdapters = new Map<string, RelatedPaperSearchAdapter>();
  private readonly presentationAdapters = new Map<string, PresentationGeneratorAdapter>();

  registerRelatedPaperSearch(adapter: RelatedPaperSearchAdapter): this {
    const id = normalizeAdapterId(adapter.id);
    if (this.relatedPaperAdapters.has(id)) throw new Error(`Duplicate related-paper adapter: ${id}`);
    this.relatedPaperAdapters.set(id, { ...adapter, id });
    return this;
  }

  registerPresentationGenerator(adapter: PresentationGeneratorAdapter): this {
    const id = normalizeAdapterId(adapter.id);
    if (this.presentationAdapters.has(id)) throw new Error(`Duplicate presentation adapter: ${id}`);
    this.presentationAdapters.set(id, { ...adapter, id });
    return this;
  }

  async listAvailable(): Promise<ResearchCapabilityDescriptor[]> {
    const result: ResearchCapabilityDescriptor[] = [];
    for (const adapter of this.relatedPaperAdapters.values()) {
      if (await available(adapter)) result.push({ kind: "related-papers", id: adapter.id, label: adapter.label });
    }
    for (const adapter of this.presentationAdapters.values()) {
      if (await available(adapter)) result.push({ kind: "presentation", id: adapter.id, label: adapter.label });
    }
    return result;
  }

  async searchRelatedPapers(
    adapterId: string,
    request: { query: string; context: unknown }
  ): Promise<RelatedPaperResult[]> {
    const adapter = this.relatedPaperAdapters.get(adapterId);
    if (!adapter || !(await available(adapter))) throw new Error(`Related-paper adapter is unavailable: ${adapterId}`);
    const query = readableString(request.query, 4000);
    if (!query) throw new Error("Related-paper search query is empty");
    return adapter.search({ query, context: projectResearchCapabilityContext(request.context) });
  }

  async generatePresentation(
    adapterId: string,
    request: { title: string; context: unknown }
  ): Promise<PresentationArtifact> {
    const adapter = this.presentationAdapters.get(adapterId);
    if (!adapter || !(await available(adapter))) throw new Error(`Presentation adapter is unavailable: ${adapterId}`);
    const title = readableString(request.title, 500);
    if (!title) throw new Error("Presentation title is empty");
    return adapter.generate({ title, context: projectResearchCapabilityContext(request.context) });
  }
}
