import { stableConversationHash } from "./conversation";
import { AtomicJsonStore, type JsonAdapter } from "./json-store";
import type {
  PaperAssetEntry,
  PaperCacheQuota,
  PaperCacheUsage,
} from "./types";

interface PaperIndexEntry {
  vaultPath: string;
  fileName: string;
  updatedAt: number;
  lastAccessedAt: number;
  estimatedBytes: number;
}

interface PaperIndexDocument {
  version: 1;
  entries: PaperIndexEntry[];
}

type PaperAssetInput = Partial<Omit<PaperAssetEntry, "version" | "vaultPath" | "updatedAt" | "lastAccessedAt" | "estimatedBytes">>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isAbsolutePath(value: string): boolean {
  return /^(?:[A-Za-z]:[\\/]|[\\/]{1,2})/.test(value);
}

function assertRelativeVaultPath(value: string): void {
  if (!value || isAbsolutePath(value) || value.split(/[\\/]/).includes("..")) {
    throw new Error("Paper assets require a vault-relative path");
  }
}

function validatePaperAsset(value: unknown): PaperAssetEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid paper asset");
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 || typeof candidate.vaultPath !== "string") throw new Error("Invalid paper asset");
  assertRelativeVaultPath(candidate.vaultPath);
  const updatedAt = typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : 0;
  const lastAccessedAt =
    typeof candidate.lastAccessedAt === "number" && Number.isFinite(candidate.lastAccessedAt)
      ? candidate.lastAccessedAt
      : updatedAt;
  const estimatedBytes =
    typeof candidate.estimatedBytes === "number" && Number.isFinite(candidate.estimatedBytes)
      ? Math.max(0, Math.floor(candidate.estimatedBytes))
      : 0;
  return {
    version: 1,
    vaultPath: candidate.vaultPath,
    summary: candidate.summary && typeof candidate.summary === "object" ? clone(candidate.summary) as PaperAssetEntry["summary"] : undefined,
    chunks: candidate.chunks && typeof candidate.chunks === "object" ? clone(candidate.chunks) as PaperAssetEntry["chunks"] : undefined,
    updatedAt,
    lastAccessedAt,
    estimatedBytes,
  };
}

function validateIndex(value: unknown): PaperIndexDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid paper index");
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 || !Array.isArray(candidate.entries)) throw new Error("Invalid paper index");
  const entries: PaperIndexEntry[] = [];
  for (const raw of candidate.entries) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    if (typeof entry.vaultPath !== "string" || typeof entry.fileName !== "string") continue;
    assertRelativeVaultPath(entry.vaultPath);
    if (!/^[a-z0-9._-]+\.json$/i.test(entry.fileName)) continue;
    entries.push({
      vaultPath: entry.vaultPath,
      fileName: entry.fileName,
      updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : 0,
      lastAccessedAt: typeof entry.lastAccessedAt === "number" ? entry.lastAccessedAt : 0,
      estimatedBytes: typeof entry.estimatedBytes === "number" ? Math.max(0, Math.floor(entry.estimatedBytes)) : 0,
    });
  }
  return { version: 1, entries };
}

export class PaperAssetRepository {
  private readonly indexStore: AtomicJsonStore<PaperIndexDocument>;
  private readonly assets = new Map<string, PaperAssetEntry>();
  private readonly indexEntries = new Map<string, PaperIndexEntry>();
  private indexWriteQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly adapter: JsonAdapter,
    private readonly root = "reader-data/papers",
    private readonly now: () => number = Date.now
  ) {
    this.indexStore = new AtomicJsonStore(adapter, `${root}/index.json`, validateIndex);
  }

  private entityStore(fileName: string): AtomicJsonStore<PaperAssetEntry> {
    return new AtomicJsonStore(this.adapter, `${this.root}/${fileName}`, validatePaperAsset);
  }

  private chooseFileName(vaultPath: string): string {
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

  private async persistIndex(): Promise<void> {
    const document = {
      version: 1 as const,
      entries: Array.from(this.indexEntries.values()).sort((left, right) => left.vaultPath.localeCompare(right.vaultPath)),
    };
    const operation = this.indexWriteQueue.then(() => this.indexStore.write(document));
    this.indexWriteQueue = operation.catch(() => undefined);
    await operation;
  }

  async initialize(): Promise<Record<string, PaperAssetEntry>> {
    const index = (await this.indexStore.readWithBackup()) || { version: 1 as const, entries: [] };
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
        estimatedBytes: asset.estimatedBytes,
      });
    }
    if (repaired) await this.persistIndex();
    return Object.fromEntries(Array.from(this.assets.entries()).map(([path, value]) => [path, clone(value)]));
  }

  get(vaultPath: string): PaperAssetEntry | null {
    assertRelativeVaultPath(vaultPath);
    const asset = this.assets.get(vaultPath);
    if (!asset) return null;
    asset.lastAccessedAt = this.now();
    const index = this.indexEntries.get(vaultPath);
    if (index) index.lastAccessedAt = asset.lastAccessedAt;
    void this.persistIndex();
    return clone(asset);
  }

  async save(vaultPath: string, input: PaperAssetInput): Promise<void> {
    assertRelativeVaultPath(vaultPath);
    const timestamp = this.now();
    const existing = this.assets.get(vaultPath);
    const fileName = this.indexEntries.get(vaultPath)?.fileName || this.chooseFileName(vaultPath);
    const draft: PaperAssetEntry = {
      version: 1,
      vaultPath,
      summary: input.summary === undefined ? existing?.summary : input.summary,
      chunks: input.chunks === undefined ? existing?.chunks : input.chunks,
      updatedAt: timestamp,
      lastAccessedAt: timestamp,
      estimatedBytes: 0,
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
      estimatedBytes: asset.estimatedBytes,
    });
    await this.persistIndex();
  }

  private async removeFileSet(path: string): Promise<void> {
    for (const candidate of [path, `${path}.bak`, `${path}.tmp`]) {
      if (await this.adapter.exists(candidate)) await this.adapter.remove(candidate);
    }
  }

  async remove(vaultPath: string): Promise<void> {
    assertRelativeVaultPath(vaultPath);
    const index = this.indexEntries.get(vaultPath);
    if (!index) return;
    await this.removeFileSet(`${this.root}/${index.fileName}`);
    this.assets.delete(vaultPath);
    this.indexEntries.delete(vaultPath);
    await this.persistIndex();
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    assertRelativeVaultPath(oldPath);
    assertRelativeVaultPath(newPath);
    const asset = this.assets.get(oldPath);
    if (!asset) return;
    await this.save(newPath, { summary: asset.summary, chunks: asset.chunks });
    await this.remove(oldPath);
  }

  usage(): PaperCacheUsage {
    return {
      entries: this.assets.size,
      bytes: Array.from(this.assets.values()).reduce((sum, asset) => sum + asset.estimatedBytes, 0),
    };
  }

  async evict(options: PaperCacheQuota): Promise<string[]> {
    const maxEntries = Math.max(0, Math.floor(options.maxEntries));
    const maxBytes = Math.max(0, Math.floor(options.maxBytes));
    const protectedPaths = new Set(options.protectedPaths || []);
    const candidates = Array.from(this.assets.values())
      .filter((asset) => !protectedPaths.has(asset.vaultPath))
      .sort((left, right) => left.lastAccessedAt - right.lastAccessedAt || left.vaultPath.localeCompare(right.vaultPath));
    const evicted: string[] = [];
    while ((this.usage().entries > maxEntries || this.usage().bytes > maxBytes) && candidates.length) {
      const candidate = candidates.shift()!;
      await this.remove(candidate.vaultPath);
      evicted.push(candidate.vaultPath);
    }
    return evicted;
  }
}
