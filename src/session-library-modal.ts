import { Modal, Notice, type App } from "obsidian";
import { setElementLabel } from "./modal-ui";
import { SessionLibraryService, type SessionLibraryQuery } from "./session-library";
import type { ConversationSession } from "./types";

export interface SessionLibraryModalOptions {
  currentConversationKey: string;
  availablePdfPaths?: string[];
  onResume(session: ConversationSession): Promise<void> | void;
  onRebind?(session: ConversationSession): Promise<void> | void;
}

export class SessionLibraryModal extends Modal {
  private searchInput?: HTMLInputElement;
  private resultsEl?: HTMLElement;
  private queryState: SessionLibraryQuery;

  constructor(
    app: App,
    private readonly library: SessionLibraryService,
    private readonly options: SessionLibraryModalOptions
  ) {
    super(app);
    this.queryState = {
      text: "",
      scope: "all",
      currentConversationKey: options.currentConversationKey,
      mode: "all",
      archived: "active",
    };
  }

  onOpen(): void {
    this.contentEl.empty();
    this.modalEl.addClass("pdf-chat-session-library-modal");
    const root = this.contentEl.createDiv({ cls: "pdf-chat-session-library" });
    root.createEl("h2", { text: "会话资料库" });
    root.createEl("p", {
      text: "搜索、整理和恢复 PDF Chat / Codex 阅读讨论。归档或删除会话不会删除论文与研究笔记。",
      cls: "pdf-chat-session-library-description",
    });
    const controls = root.createDiv({ cls: "pdf-chat-session-library-controls" });
    this.searchInput = controls.createEl("input", {
      cls: "pdf-chat-session-search",
      attr: { type: "search", placeholder: "搜索标题、PDF、标签或可见问答…" },
    });
    setElementLabel(this.searchInput, "搜索会话");
    this.searchInput.addEventListener("input", () => {
      this.queryState.text = this.searchInput?.value || "";
      this.renderResults();
    });
    this.buildSelect(controls, "范围", "会话范围", [
      ["all", "全部论文"],
      ["current", "当前论文"],
    ], (value) => {
      this.queryState.scope = value === "current" ? "current" : "all";
    });
    this.buildSelect(controls, "模式", "会话模式", [
      ["all", "全部模式"],
      ["chat", "API"],
      ["codex", "Codex"],
    ], (value) => {
      this.queryState.mode = value === "chat" || value === "codex" ? value : "all";
    });
    this.buildSelect(controls, "状态", "归档状态", [
      ["active", "使用中"],
      ["archived", "已归档"],
      ["all", "全部状态"],
    ], (value) => {
      this.queryState.archived = value === "archived" || value === "all" ? value : "active";
    });
    this.resultsEl = root.createDiv({
      cls: "pdf-chat-session-results",
      attr: { role: "list", "aria-live": "polite" },
    });
    this.renderResults();
    this.searchInput.focus();
  }

  private buildSelect(
    parent: HTMLElement,
    label: string,
    ariaLabel: string,
    options: Array<[string, string]>,
    onChange: (value: string) => void
  ): void {
    const group = parent.createDiv({ cls: "pdf-chat-session-filter" });
    group.createEl("span", { text: label });
    const select = group.createEl("select", { attr: { "aria-label": ariaLabel } });
    for (const [value, text] of options) select.createEl("option", { value, text });
    select.addEventListener("change", () => {
      onChange(select.value);
      this.renderResults();
    });
  }

  private renderResults(): void {
    if (!this.resultsEl) return;
    this.resultsEl.empty();
    const sessions = this.library.query(this.queryState).sort((left, right) => {
      const currentDifference =
        Number(right.conversationKey === this.options.currentConversationKey) -
        Number(left.conversationKey === this.options.currentConversationKey);
      return currentDifference || Number(right.pinned) - Number(left.pinned) || right.updatedAt - left.updatedAt;
    });
    if (!sessions.length) {
      this.resultsEl.createDiv({ cls: "pdf-chat-session-empty", text: "没有符合条件的会话。" });
      return;
    }
    for (const session of sessions) this.renderSession(session);
  }

  private renderSession(session: ConversationSession): void {
    if (!this.resultsEl) return;
    const card = this.resultsEl.createDiv({
      cls: "pdf-chat-session-card",
      attr: { role: "listitem" },
    });
    const summary = card.createDiv({ cls: "pdf-chat-session-summary" });
    summary.createEl("strong", {
      text: `${session.pinned ? "★ " : ""}${session.title || "未命名会话"}`,
      cls: "pdf-chat-session-title",
    });
    const source = session.conversationKey.replace(/^pdf:/, "");
    summary.createEl("span", {
      text: `${session.mode === "codex" ? "Codex" : "API"} · ${source || "选区讨论"} · ${new Date(session.updatedAt).toLocaleString()}`,
      cls: "pdf-chat-session-meta",
    });
    if (session.tags?.length) {
      summary.createEl("span", {
        text: session.tags.map((tag) => `#${tag}`).join(" "),
        cls: "pdf-chat-session-tags",
      });
    }
    if (session.sourceStatus === "missing") {
      summary.createEl("span", { text: "原 PDF 缺失", cls: "pdf-chat-session-missing" });
    }
    const recovery = this.library.getCodexRecovery(session);
    if (recovery.reason) {
      const preview = this.library.previewCodexFork(session.id, {
        availablePdfPaths: this.options.availablePdfPaths || [],
        handoffMaxChars: 12000,
      });
      summary.createEl("span", {
        text: `本机无法直接恢复该 Codex thread；本地分支将携带 ${preview.handoffChars} 字可见上下文 · ${preview.attachedPdfPaths.length} 篇 PDF${preview.omittedPdfPaths.length ? ` · 忽略 ${preview.omittedPdfPaths.length} 篇缺失 PDF` : ""}`,
        cls: "pdf-chat-session-recovery",
      });
    }
    const actions = card.createDiv({ cls: "pdf-chat-session-actions" });
    this.action(actions, recovery.reason ? "查看历史" : "恢复", recovery.reason ? "查看历史记录" : "恢复这段会话", async () => {
      const resumed = this.library.reactivate(session.id);
      await this.options.onResume(resumed);
      this.close();
    });
    if (recovery.reason) {
      this.action(actions, "创建本地分支", "创建本地分支并继续讨论", async () => {
        const fork = await this.library.createCodexFork(session.id, {
          availablePdfPaths: this.options.availablePdfPaths || [],
          handoffMaxChars: 12000,
        });
        await this.options.onResume(fork);
        this.close();
      }, "is-primary");
    }
    this.action(actions, session.pinned ? "取消置顶" : "置顶", "切换会话置顶状态", async () => {
      await this.library.setPinned(session.id, !session.pinned);
      this.renderResults();
    });
    this.action(actions, "重命名", "重命名会话", async () => {
      const promptFn = typeof window !== "undefined" ? window.prompt : undefined;
      const title = promptFn?.("新的会话标题", session.title);
      if (title === null || title === undefined) return;
      await this.library.rename(session.id, title);
      this.renderResults();
    });
    this.action(actions, "标签", "编辑会话标签", async () => {
      const promptFn = typeof window !== "undefined" ? window.prompt : undefined;
      const value = promptFn?.("标签（用逗号分隔）", (session.tags || []).join(", "));
      if (value === null || value === undefined) return;
      await this.library.setTags(session.id, value.split(/[，,]/));
      this.renderResults();
    });
    this.action(actions, session.archivedAt ? "取消归档" : "归档", "切换会话归档状态", async () => {
      if (session.archivedAt) this.library.reactivate(session.id);
      else await this.library.archive(session.id);
      this.renderResults();
    });
    this.action(actions, "导出", "导出会话 Markdown", async () => {
      const result = await this.library.export(session.id);
      new Notice(`会话已导出到 ${result.path}`);
    });
    if (session.sourceStatus === "missing" && this.options.onRebind) {
      this.action(actions, "重新绑定 PDF", "为缺失来源重新选择 PDF", async () => {
        await this.options.onRebind?.(session);
        this.renderResults();
      });
    }
    this.action(actions, "删除", "删除会话记录", async () => {
      if (await this.library.delete(session.id)) this.renderResults();
    }, "is-danger");
  }

  private action(
    parent: HTMLElement,
    text: string,
    label: string,
    run: () => Promise<void>,
    extraClass = ""
  ): void {
    const button = parent.createEl("button", {
      text,
      cls: `pdf-chat-session-action ${extraClass}`.trim(),
      attr: { type: "button" },
    });
    setElementLabel(button, label);
    button.addEventListener("click", () => {
      button.disabled = true;
      void run().catch((error) => {
        new Notice(error instanceof Error ? error.message : String(error));
      }).finally(() => {
        button.disabled = false;
      });
    });
  }
}
