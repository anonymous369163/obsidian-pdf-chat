import type { EventRef, TAbstractFile, Vault } from "obsidian";

import type { ConversationSession, PDFChatSettings } from "./types";

type ReaderLifecycleState = Pick<
  PDFChatSettings,
  | "conversationSessions"
  | "activeConversationSessionIds"
  | "conversationHistories"
  | "docSummaries"
  | "docChunks"
>;

function pdfKey(path: string): string {
  return `pdf:${path}`;
}

function replaceExactPath(paths: string[], oldPath: string, newPath: string): string[] {
  return Array.from(new Set(paths.map((path) => (path === oldPath ? newPath : path))));
}

function chooseNewer<T extends { updatedAt?: number; generatedAt?: number }>(
  current: T | undefined,
  candidate: T | undefined
): T | undefined {
  if (!candidate) return current;
  if (!current) return candidate;
  const currentTime = current.updatedAt ?? current.generatedAt ?? 0;
  const candidateTime = candidate.updatedAt ?? candidate.generatedAt ?? 0;
  return candidateTime > currentTime ? candidate : current;
}

function sessionUpdatedAt(sessions: Record<string, ConversationSession>, id: string | undefined): number {
  return id && sessions[id] ? sessions[id].updatedAt : 0;
}

export function reconcilePdfRenameState<T extends ReaderLifecycleState>(
  input: T,
  oldPath: string,
  newPath: string
): T {
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
        sourceStatus:
          session.conversationKey === oldKey ? ("available" as const) : session.sourceStatus,
      },
    ])
  );

  const activeConversationSessionIds = { ...input.activeConversationSessionIds };
  const oldActiveId = activeConversationSessionIds[oldKey];
  if (oldActiveId) {
    const currentNewId = activeConversationSessionIds[newKey];
    if (
      !currentNewId ||
      sessionUpdatedAt(conversationSessions, oldActiveId) >=
        sessionUpdatedAt(conversationSessions, currentNewId)
    ) {
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
    docChunks,
  };
}

export function reconcilePdfDeleteState<T extends ReaderLifecycleState>(input: T, path: string): T {
  if (!path) return input;
  const key = pdfKey(path);
  const conversationSessions = Object.fromEntries(
    Object.entries(input.conversationSessions).map(([id, session]) => [
      id,
      session.conversationKey === key
        ? { ...session, sourceStatus: "missing" as const }
        : { ...session },
    ])
  );
  const docSummaries = { ...input.docSummaries };
  const docChunks = { ...input.docChunks };
  delete docSummaries[path];
  delete docChunks[path];
  return { ...input, conversationSessions, docSummaries, docChunks };
}

function isPdfPath(path: string): boolean {
  return /\.pdf$/i.test(path);
}

export class VaultLifecycleService {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly vault: Pick<Vault, "on">,
    private readonly getSettings: () => PDFChatSettings,
    private readonly replaceSettings: (settings: PDFChatSettings) => void,
    private readonly persist: () => Promise<void>
  ) {}

  attach(register: (event: EventRef) => void): void {
    register(
      this.vault.on("rename", (file: TAbstractFile, oldPath: string) => {
        const newPath = file.path;
        if (isPdfPath(oldPath) && isPdfPath(newPath)) {
          this.enqueue(() => reconcilePdfRenameState(this.getSettings(), oldPath, newPath));
        } else if (isPdfPath(oldPath)) {
          this.enqueue(() => reconcilePdfDeleteState(this.getSettings(), oldPath));
        }
      })
    );
    register(
      this.vault.on("delete", (file: TAbstractFile) => {
        if (isPdfPath(file.path)) {
          this.enqueue(() => reconcilePdfDeleteState(this.getSettings(), file.path));
        }
      })
    );
  }

  private enqueue(update: () => PDFChatSettings): void {
    this.queue = this.queue
      .catch(() => undefined)
      .then(async () => {
        this.replaceSettings(update());
        await this.persist();
      });
  }
}
