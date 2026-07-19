import type {
  ConversationMessage,
  ConversationSession,
  ResearchEvidence,
  ResearchArtifactWriteResult,
  ResearchNoteSettings,
  SaveResearchTurnRequest,
} from "./types";

interface VaultFileLike {
  path: string;
}

interface ResearchNoteVault {
  getAbstractFileByPath(path: string): unknown;
  createFolder(path: string): Promise<unknown>;
  create(path: string, content: string): Promise<unknown>;
  read(file: VaultFileLike): Promise<string>;
  modify(file: VaultFileLike, content: string): Promise<void>;
}

const HIDDEN_CONTEXT_LINE = /^(?:【(?:论文全文|全文背景摘要|从全文中按关键词检索到的可能相关片段|我当前选中并想讨论的原文片段)】|\[(?:RAG|SYSTEM|HIDDEN)[^\]]*\]).*$/gim;

function stableTextHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function sanitizeResearchArtifact(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi, "[REDACTED PRIVATE KEY]")
    .replace(/\b(api[_-]?key|authorization)\s*[:=]\s*[^\s\n]+/gi, "$1: [REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "sk-[REDACTED]")
    .replace(/\b[A-Za-z]:\\[^\s\n]+/g, "[本地路径已隐藏]")
    .replace(/\/(?:Users|home)\/[^\s\n]+/g, "[本地路径已隐藏]")
    .replace(HIDDEN_CONTEXT_LINE, "[隐藏上下文已省略]")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeFolder(value: string, fallback: string): string {
  const parts = (value || fallback)
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..");
  return parts.join("/") || fallback;
}

function safeFileName(value: string, fallback: string): string {
  const normalized = (value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 120);
  return normalized || fallback;
}

function primaryPaperPath(session: ConversationSession): string | undefined {
  if (!session.conversationKey.startsWith("pdf:")) return undefined;
  const path = session.conversationKey.slice("pdf:".length).trim();
  return path || undefined;
}

function paperBaseName(path: string): string {
  const name = path.replace(/\\/g, "/").split("/").pop() || "Paper";
  return name.replace(/\.pdf$/i, "") || "Paper";
}

function evidenceMarkdown(evidence: ResearchEvidence[] | undefined): string {
  const items = Array.isArray(evidence) ? evidence : [];
  if (!items.length) return "";
  const lines = items.map((item) => {
    const claim = sanitizeResearchArtifact(item.claim || item.raw || "论文证据");
    if (
      item.verification === "located" &&
      item.paperPath &&
      Number.isInteger(item.page) &&
      Number(item.page) > 0
    ) {
      const path = item.paperPath.replace(/\\/g, "/");
      const name = path.split("/").pop() || path;
      return `- ${claim} — [[${path}#page=${item.page}|${name} p.${item.page}]]`;
    }
    return `- ${claim} — 未验证来源 ${item.raw || ""}`.trimEnd();
  });
  return `\n#### 论文证据\n\n${lines.join("\n")}`;
}

function selectionMarkdown(
  selection: SaveResearchTurnRequest["selection"],
  includeText: boolean
): string {
  const text = selection?.text || "";
  if (!text) return "";
  const metadata = `选区：${text.length} 字 · hash:${stableTextHash(text)}`;
  if (!includeText) return `\n> ${metadata}`;
  return `\n> ${metadata}\n>\n${sanitizeResearchArtifact(text)
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")}`;
}

export function buildResearchTurnMarkdown(
  request: SaveResearchTurnRequest,
  timestamp: number
): string {
  const user = sanitizeResearchArtifact(request.userMessage.content);
  const assistant = sanitizeResearchArtifact(request.assistantMessage.content);
  const date = new Date(timestamp).toISOString();
  return [
    `## ${date} · ${safeFileName(request.session.title, "阅读讨论")}`,
    selectionMarkdown(request.selection, request.includeSelectionText),
    "### 问题",
    user,
    "### 回答",
    assistant,
    evidenceMarkdown(request.assistantMessage.evidence),
  ]
    .filter((section) => section !== "")
    .join("\n\n")
    .trim();
}

export function exportSessionMarkdown(session: ConversationSession): string {
  const lines = [
    `# ${safeFileName(session.title, "PDF Chat 会话")}`,
    "",
    `- 模式：${session.mode === "codex" ? "Codex CLI" : "PDF Chat API"}`,
    `- 创建：${new Date(session.createdAt).toISOString()}`,
    `- 更新：${new Date(session.updatedAt).toISOString()}`,
  ];
  const paperPath = primaryPaperPath(session);
  if (paperPath) lines.push(`- 当前论文：[[${paperPath}]]`);
  for (const reference of session.referencedPdfPaths || []) lines.push(`- 引用论文：[[${reference}]]`);
  lines.push("");
  for (const message of session.messages || []) {
    lines.push(message.role === "user" ? "## 用户" : "## 助手", "");
    lines.push(sanitizeResearchArtifact(message.content), "");
    const evidence = evidenceMarkdown(message.evidence);
    if (evidence) lines.push(evidence.trim(), "");
  }
  return lines.join("\n").trim() + "\n";
}

export class ResearchNoteService {
  private readonly queues = new Map<string, Promise<ResearchArtifactWriteResult>>();

  constructor(
    private readonly vault: ResearchNoteVault,
    private readonly getSettings: () => ResearchNoteSettings,
    private readonly now: () => number = Date.now
  ) {}

  async appendTurn(request: SaveResearchTurnRequest): Promise<ResearchArtifactWriteResult> {
    const settings = this.getSettings();
    const paperPath = primaryPaperPath(request.session);
    const isSynthesis = !paperPath || (request.session.referencedPdfPaths || []).length > 0;
    const fileName = isSynthesis
      ? "Synthesis.md"
      : `${safeFileName(paperBaseName(paperPath), "Paper")}.md`;
    const path = `${normalizeFolder(settings.folder, "PDF Chat/Reading Notes")}/${fileName}`;
    const block = buildResearchTurnMarkdown(
      { ...request, includeSelectionText: request.includeSelectionText === true },
      this.now()
    );
    return this.enqueue(path, async () => {
      const existing = this.vault.getAbstractFileByPath(path) as VaultFileLike | null;
      if (existing) {
        const previous = await this.vault.read(existing);
        await this.vault.modify(existing, `${previous.trimEnd()}\n\n---\n\n${block}\n`);
        return { path, created: false };
      }
      await this.ensureParentFolder(path);
      const title = isSynthesis ? "# PDF Chat 综合研究笔记" : `# ${paperBaseName(paperPath!)} 阅读笔记`;
      await this.vault.create(path, `${title}\n\n${block}\n`);
      return { path, created: true };
    });
  }

  async exportSessionMarkdown(
    session: ConversationSession,
    targetPath?: string
  ): Promise<ResearchArtifactWriteResult> {
    const settings = this.getSettings();
    const fallbackName = `${safeFileName(session.title, "PDF Chat 会话")}.md`;
    const path = targetPath
      ? normalizeFolder(targetPath, fallbackName)
      : `${normalizeFolder(settings.exportFolder, "PDF Chat/Exports")}/${fallbackName}`;
    const markdown = exportSessionMarkdown(session);
    return this.enqueue(path, async () => {
      const existing = this.vault.getAbstractFileByPath(path) as VaultFileLike | null;
      if (existing) {
        await this.vault.modify(existing, markdown);
        return { path, created: false };
      }
      await this.ensureParentFolder(path);
      await this.vault.create(path, markdown);
      return { path, created: true };
    });
  }

  private enqueue(
    path: string,
    task: () => Promise<ResearchArtifactWriteResult>
  ): Promise<ResearchArtifactWriteResult> {
    const previous = this.queues.get(path) || Promise.resolve({ path, created: false });
    const next = previous.catch(() => ({ path, created: false })).then(task);
    this.queues.set(path, next);
    const clean = () => {
      if (this.queues.get(path) === next) this.queues.delete(path);
    };
    next.then(clean, clean);
    return next;
  }

  private async ensureParentFolder(path: string): Promise<void> {
    const parts = path.split("/").slice(0, -1);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.vault.getAbstractFileByPath(current)) await this.vault.createFolder(current);
    }
  }
}
