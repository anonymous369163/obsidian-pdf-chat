import { normalizeConversationSessions } from "./conversation";
import type { JsonAdapter } from "./json-store";
import { PaperAssetRepository } from "./paper-asset-repository";
import { ReaderDataMigrator, type ReaderDataMigrationResult } from "./reader-data-migration";
import { SessionRepository } from "./session-repository";
import type { DocChunksEntry, DocSummaryEntry, PDFChatSettings } from "./types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fingerprint(value: unknown): string {
  return JSON.stringify(value);
}

interface PaperRuntimeAsset {
  summary?: DocSummaryEntry;
  chunks?: DocChunksEntry;
}

export interface ReaderDataStoreInitialization extends ReaderDataMigrationResult {
  settings: PDFChatSettings;
}

export interface ReaderDataSyncOptions {
  protectedPaths?: string[];
}

export interface ReaderDataSyncResult {
  evictedPaths: string[];
}

export function isJsonAdapter(value: unknown): value is JsonAdapter {
  if (!value || typeof value !== "object") return false;
  const adapter = value as Record<string, unknown>;
  return ["exists", "read", "write", "rename", "remove", "mkdir"].every(
    (method) => typeof adapter[method] === "function"
  );
}

export class ReaderDataStore {
  readonly sessions: SessionRepository;
  readonly papers: PaperAssetRepository;
  private active = false;
  private sessionFingerprints = new Map<string, string>();
  private paperFingerprints = new Map<string, string>();
  private syncQueue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly adapter: JsonAdapter,
    private readonly root = "reader-data",
    private readonly now: () => number = Date.now
  ) {
    this.sessions = new SessionRepository(adapter, `${root}/sessions`);
    this.papers = new PaperAssetRepository(adapter, `${root}/papers`, now);
  }

  private runtimePapers(settings: PDFChatSettings): Record<string, PaperRuntimeAsset> {
    const assets: Record<string, PaperRuntimeAsset> = {};
    for (const vaultPath of new Set([
      ...Object.keys(settings.docSummaries || {}),
      ...Object.keys(settings.docChunks || {}),
    ])) {
      assets[vaultPath] = {
        summary: settings.docSummaries?.[vaultPath],
        chunks: settings.docChunks?.[vaultPath],
      };
    }
    return assets;
  }

  private captureBaseline(settings: PDFChatSettings): void {
    this.sessionFingerprints = new Map(
      Object.entries(normalizeConversationSessions(settings.conversationSessions)).map(([id, session]) => [
        id,
        fingerprint(session),
      ])
    );
    this.paperFingerprints = new Map(
      Object.entries(this.runtimePapers(settings)).map(([vaultPath, asset]) => [
        vaultPath,
        fingerprint(asset),
      ])
    );
  }

  async initialize(
    settings: PDFChatSettings,
    commitSettings: (settings: PDFChatSettings) => Promise<void>
  ): Promise<ReaderDataStoreInitialization> {
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
    const runtime = clone(migration.settings);
    runtime.conversationSessions = storedSessions;
    runtime.docSummaries = {};
    runtime.docChunks = {};
    for (const [vaultPath, asset] of Object.entries(storedPapers)) {
      if (asset.summary) runtime.docSummaries[vaultPath] = clone(asset.summary);
      if (asset.chunks) runtime.docChunks[vaultPath] = clone(asset.chunks);
    }
    this.active = true;
    this.captureBaseline(runtime);
    return { ...migration, settings: runtime };
  }

  settingsForPersistence(settings: PDFChatSettings): PDFChatSettings {
    if (!this.active || settings.readerDataVersion !== 1) return clone(settings);
    return {
      ...clone(settings),
      conversationHistories: {},
      conversationSessions: {},
      docSummaries: {},
      docChunks: {},
    };
  }

  synchronize(
    settings: PDFChatSettings,
    options: ReaderDataSyncOptions = {}
  ): Promise<ReaderDataSyncResult> {
    if (!this.active) return Promise.resolve({ evictedPaths: [] });
    const operation = this.syncQueue.then(() => this.synchronizeNow(settings, options));
    this.syncQueue = operation.catch(() => undefined);
    return operation;
  }

  private async synchronizeNow(
    settings: PDFChatSettings,
    options: ReaderDataSyncOptions
  ): Promise<ReaderDataSyncResult> {
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
    const evictedPaths = wrotePaperAsset
      ? await this.papers.evict({
          maxEntries: settings.paperCacheQuota.maxEntries,
          maxBytes: settings.paperCacheQuota.maxBytes,
          protectedPaths: options.protectedPaths,
        })
      : [];
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

  async clearMigrationSnapshot(): Promise<boolean> {
    let removed = false;
    const path = `${this.root}/migration/legacy-reader-data.json`;
    for (const candidate of [path, `${path}.bak`, `${path}.tmp`]) {
      if (!(await this.adapter.exists(candidate))) continue;
      await this.adapter.remove(candidate);
      removed = true;
    }
    return removed;
  }
}
