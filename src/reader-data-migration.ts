import { normalizeConversationSessions } from "./conversation";
import { AtomicJsonStore, type JsonAdapter } from "./json-store";
import type { PaperAssetRepository } from "./paper-asset-repository";
import type { SessionRepository } from "./session-repository";
import type {
  ConversationSession,
  DocChunksEntry,
  DocSummaryEntry,
  PDFChatSettings,
} from "./types";

interface ReaderDataMigrationCheckpoint {
  sourceVersion: string;
  state: "writing" | "validated" | "complete";
  completedAt?: number;
}

export interface ReaderDataMeta {
  version: 1;
  migration?: ReaderDataMigrationCheckpoint;
}

interface LegacyReaderDataSnapshot {
  version: 1;
  conversationHistories: PDFChatSettings["conversationHistories"];
  conversationSessions: Record<string, ConversationSession>;
  activeConversationSessionIds: PDFChatSettings["activeConversationSessionIds"];
  docSummaries: Record<string, DocSummaryEntry>;
  docChunks: Record<string, DocChunksEntry>;
}

interface SessionMigrationRepository {
  initialize(): Promise<Record<string, ConversationSession>>;
  save(session: ConversationSession): Promise<void>;
  get(id: string): ConversationSession | null;
}

interface PaperMigrationRepository {
  initialize(): Promise<Record<string, unknown>>;
  save(
    vaultPath: string,
    entry: { summary?: DocSummaryEntry; chunks?: DocChunksEntry }
  ): Promise<void>;
  get(vaultPath: string): { vaultPath: string } | null;
}

export interface ReaderDataMigrationResult {
  migrated: boolean;
  fallback: boolean;
  settings: PDFChatSettings;
  error?: string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function validateMeta(value: unknown): ReaderDataMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid reader data metadata");
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1) throw new Error("Unsupported reader data metadata");
  if (candidate.migration === undefined) return { version: 1 };
  if (!candidate.migration || typeof candidate.migration !== "object" || Array.isArray(candidate.migration)) {
    throw new Error("Invalid reader data migration checkpoint");
  }
  const migration = candidate.migration as Record<string, unknown>;
  if (
    typeof migration.sourceVersion !== "string" ||
    (migration.state !== "writing" && migration.state !== "validated" && migration.state !== "complete")
  ) {
    throw new Error("Invalid reader data migration checkpoint");
  }
  return {
    version: 1,
    migration: {
      sourceVersion: migration.sourceVersion,
      state: migration.state,
      completedAt:
        typeof migration.completedAt === "number" && Number.isFinite(migration.completedAt)
          ? migration.completedAt
          : undefined,
    },
  };
}

function validateSnapshot(value: unknown): LegacyReaderDataSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid legacy reader data snapshot");
  }
  const candidate = value as Partial<LegacyReaderDataSnapshot>;
  if (candidate.version !== 1) throw new Error("Unsupported legacy reader data snapshot");
  return {
    version: 1,
    conversationHistories:
      candidate.conversationHistories && typeof candidate.conversationHistories === "object"
        ? clone(candidate.conversationHistories)
        : {},
    conversationSessions: normalizeConversationSessions(candidate.conversationSessions),
    activeConversationSessionIds:
      candidate.activeConversationSessionIds && typeof candidate.activeConversationSessionIds === "object"
        ? clone(candidate.activeConversationSessionIds)
        : {},
    docSummaries:
      candidate.docSummaries && typeof candidate.docSummaries === "object"
        ? clone(candidate.docSummaries)
        : {},
    docChunks:
      candidate.docChunks && typeof candidate.docChunks === "object"
        ? clone(candidate.docChunks)
        : {},
  };
}

function buildSnapshot(settings: PDFChatSettings): LegacyReaderDataSnapshot {
  return validateSnapshot({
    version: 1,
    conversationHistories: settings.conversationHistories,
    conversationSessions: settings.conversationSessions,
    activeConversationSessionIds: settings.activeConversationSessionIds,
    docSummaries: settings.docSummaries,
    docChunks: settings.docChunks,
  });
}

function strippedSettings(settings: PDFChatSettings): PDFChatSettings {
  return {
    ...clone(settings),
    readerDataVersion: 1,
    conversationHistories: {},
    conversationSessions: {},
    docSummaries: {},
    docChunks: {},
  };
}

export class ReaderDataMigrator {
  private readonly metaStore: AtomicJsonStore<ReaderDataMeta>;
  private readonly snapshotStore: AtomicJsonStore<LegacyReaderDataSnapshot>;

  constructor(
    adapter: JsonAdapter,
    private readonly sessions: Pick<SessionRepository, "initialize" | "save" | "get"> | SessionMigrationRepository,
    private readonly papers: Pick<PaperAssetRepository, "initialize" | "save" | "get"> | PaperMigrationRepository,
    private readonly commitSettings: (settings: PDFChatSettings) => Promise<void>,
    private readonly now: () => number = Date.now,
    private readonly root = "reader-data"
  ) {
    this.metaStore = new AtomicJsonStore(adapter, `${root}/meta.json`, validateMeta);
    this.snapshotStore = new AtomicJsonStore(
      adapter,
      `${root}/migration/legacy-reader-data.json`,
      validateSnapshot
    );
  }

  private paperPaths(snapshot: LegacyReaderDataSnapshot): string[] {
    return Array.from(
      new Set([...Object.keys(snapshot.docSummaries), ...Object.keys(snapshot.docChunks)])
    ).sort();
  }

  private validateEntities(snapshot: LegacyReaderDataSnapshot): void {
    for (const session of Object.values(snapshot.conversationSessions)) {
      const saved = this.sessions.get(session.id);
      if (!saved || saved.id !== session.id) throw new Error("Conversation migration validation failed");
    }
    for (const vaultPath of this.paperPaths(snapshot)) {
      const saved = this.papers.get(vaultPath);
      if (!saved || saved.vaultPath !== vaultPath) throw new Error("Paper migration validation failed");
    }
  }

  private async writeEntities(snapshot: LegacyReaderDataSnapshot): Promise<void> {
    for (const session of Object.values(snapshot.conversationSessions)) {
      await this.sessions.save(session);
    }
    for (const vaultPath of this.paperPaths(snapshot)) {
      await this.papers.save(vaultPath, {
        summary: snapshot.docSummaries[vaultPath],
        chunks: snapshot.docChunks[vaultPath],
      });
    }
  }

  async migrate(settings: PDFChatSettings): Promise<ReaderDataMigrationResult> {
    const legacy = clone(settings);
    try {
      const meta = await this.metaStore.readWithBackup();
      if (settings.readerDataVersion === 1 && meta?.migration?.state === "complete") {
        await this.sessions.initialize();
        await this.papers.initialize();
        return { migrated: false, fallback: false, settings: clone(settings) };
      }

      await this.sessions.initialize();
      await this.papers.initialize();
      const snapshot = buildSnapshot(settings);
      const sourceVersion = String(settings.readerDataVersion || 0);

      if (meta?.migration?.state !== "validated") {
        await this.metaStore.write({
          version: 1,
          migration: { sourceVersion, state: "writing" },
        });
        await this.snapshotStore.write(snapshot);
        await this.writeEntities(snapshot);
        this.validateEntities(snapshot);
        await this.metaStore.write({
          version: 1,
          migration: { sourceVersion, state: "validated" },
        });
      } else {
        this.validateEntities(snapshot);
      }

      const migrated = strippedSettings(settings);
      await this.commitSettings(migrated);
      await this.metaStore.write({
        version: 1,
        migration: { sourceVersion, state: "complete", completedAt: this.now() },
      });
      return { migrated: true, fallback: false, settings: migrated };
    } catch (error) {
      void error;
      return {
        migrated: false,
        fallback: true,
        settings: legacy,
        error: "Reader data migration incomplete",
      };
    }
  }
}
