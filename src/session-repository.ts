import { normalizeConversationSessions, stableConversationHash } from "./conversation";
import { AtomicJsonStore, type JsonAdapter } from "./json-store";
import type { ConversationSession, ConversationSessionIndexEntry } from "./types";

interface SessionIndexDocument {
  version: 1;
  entries: ConversationSessionIndexEntry[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isAbsolutePath(value: string): boolean {
  return /^(?:[A-Za-z]:[\\/]|[\\/]{1,2})/.test(value);
}

function assertRelativeVaultPath(value: string): void {
  if (!value || isAbsolutePath(value) || value.split(/[\\/]/).includes("..")) {
    throw new Error("Reader data requires a vault-relative path");
  }
}

function validateSession(value: unknown): ConversationSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid conversation session");
  }
  const candidate = value as Record<string, unknown>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  if (!id) throw new Error("Invalid conversation session ID");
  const rawKey = typeof candidate.conversationKey === "string" ? candidate.conversationKey : "";
  if (rawKey.startsWith("pdf:")) assertRelativeVaultPath(rawKey.slice(4));
  if (Array.isArray(candidate.referencedPdfPaths)) {
    for (const path of candidate.referencedPdfPaths) {
      if (typeof path === "string") assertRelativeVaultPath(path);
    }
  }
  const normalized = normalizeConversationSessions({ [id]: value })[id];
  if (!normalized) throw new Error("Invalid conversation session");
  return normalized;
}

function validateIndex(value: unknown): SessionIndexDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid session index");
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 || !Array.isArray(candidate.entries)) {
    throw new Error("Invalid session index");
  }
  const entries: ConversationSessionIndexEntry[] = [];
  for (const raw of candidate.entries) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const fileName = typeof entry.fileName === "string" ? entry.fileName.trim() : "";
    const conversationKey = typeof entry.conversationKey === "string" ? entry.conversationKey : "";
    if (!id || !/^[a-z0-9._-]+\.json$/i.test(fileName) || !conversationKey) continue;
    if (conversationKey.startsWith("pdf:")) assertRelativeVaultPath(conversationKey.slice(4));
    entries.push({
      id,
      fileName,
      title: typeof entry.title === "string" ? entry.title : id,
      conversationKey,
      mode: entry.mode === "codex" ? "codex" : "chat",
      pinned: entry.pinned === true,
      archived: entry.archived === true,
      missing: entry.missing === true,
      tags: Array.isArray(entry.tags)
        ? entry.tags.filter((tag): tag is string => typeof tag === "string" && !!tag.trim()).map((tag) => tag.trim())
        : [],
      createdAt: typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt) ? entry.createdAt : 0,
      updatedAt: typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
    });
  }
  return { version: 1, entries };
}

export class SessionRepository {
  private readonly indexStore: AtomicJsonStore<SessionIndexDocument>;
  private readonly sessions = new Map<string, ConversationSession>();
  private readonly indexEntries = new Map<string, ConversationSessionIndexEntry>();
  private initialized = false;

  constructor(
    private readonly adapter: JsonAdapter,
    private readonly root = "reader-data/sessions"
  ) {
    this.indexStore = new AtomicJsonStore(adapter, `${root}/index.json`, validateIndex);
  }

  private entityStore(fileName: string): AtomicJsonStore<ConversationSession> {
    return new AtomicJsonStore(this.adapter, `${this.root}/${fileName}`, validateSession);
  }

  private chooseFileName(id: string): string {
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

  private indexEntry(session: ConversationSession, fileName: string): ConversationSessionIndexEntry {
    return {
      id: session.id,
      fileName,
      title: session.title,
      conversationKey: session.conversationKey,
      mode: session.mode,
      pinned: false,
      archived: false,
      missing: session.sourceStatus === "missing",
      tags: [],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  private async persistIndex(): Promise<void> {
    await this.indexStore.write({ version: 1, entries: this.list() });
  }

  async initialize(): Promise<Record<string, ConversationSession>> {
    if (this.initialized) return this.loadAll();
    this.initialized = true;
    const index = (await this.indexStore.readWithBackup()) || { version: 1 as const, entries: [] };
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

  async loadAll(): Promise<Record<string, ConversationSession>> {
    const result: Record<string, ConversationSession> = {};
    for (const [id, session] of this.sessions) result[id] = clone(session);
    return result;
  }

  get(id: string): ConversationSession | null {
    const session = this.sessions.get(id);
    return session ? clone(session) : null;
  }

  list(): ConversationSessionIndexEntry[] {
    return Array.from(this.indexEntries.values())
      .map(clone)
      .sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt - left.updatedAt || left.id.localeCompare(right.id));
  }

  async save(input: ConversationSession): Promise<void> {
    const session = validateSession(input);
    const existing = this.indexEntries.get(session.id);
    const fileName = existing?.fileName || this.chooseFileName(session.id);
    await this.entityStore(fileName).write(session);
    this.sessions.set(session.id, clone(session));
    this.indexEntries.set(session.id, {
      ...this.indexEntry(session, fileName),
      pinned: existing?.pinned || false,
      archived: existing?.archived || false,
      tags: existing?.tags || [],
    });
    await this.persistIndex();
  }

  private async removeFileSet(path: string): Promise<void> {
    for (const candidate of [path, `${path}.bak`, `${path}.tmp`]) {
      if (await this.adapter.exists(candidate)) await this.adapter.remove(candidate);
    }
  }

  async remove(id: string): Promise<void> {
    const entry = this.indexEntries.get(id);
    if (!entry) return;
    await this.removeFileSet(`${this.root}/${entry.fileName}`);
    this.sessions.delete(id);
    this.indexEntries.delete(id);
    await this.persistIndex();
  }

  async rekeyPdf(oldPath: string, newPath: string): Promise<void> {
    assertRelativeVaultPath(oldPath);
    assertRelativeVaultPath(newPath);
    for (const session of Array.from(this.sessions.values())) {
      let changed = false;
      const next = clone(session);
      if (next.conversationKey === ["pdf", oldPath].join(":")) {
        next.conversationKey = ["pdf", newPath].join(":");
        next.sourceStatus = "available";
        changed = true;
      }
      const references = next.referencedPdfPaths.map((path) => (path === oldPath ? newPath : path));
      if (references.some((path, index) => path !== next.referencedPdfPaths[index])) {
        next.referencedPdfPaths = Array.from(new Set(references));
        changed = true;
      }
      if (changed) await this.save(next);
    }
  }
}
