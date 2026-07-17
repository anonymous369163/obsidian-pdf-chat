import {
  MarkdownRenderer,
  Modal,
  Notice,
  type App,
  type Component,
  type TFile,
} from "obsidian";
import { DEFAULT_SETTINGS } from "./default-settings";
import { createPDFChatModalServices } from "./modal-services";
import type {
  ConversationMessage,
  DocChunksEntry,
  DocSummaryEntry,
  LlmMessage,
  PaperContext,
  PDFChatModalServices,
  PDFChatPluginApi,
} from "./types";

interface SubmitOptions {
  question?: string;
  skipContextAugmentation?: boolean;
}

interface BubbleOptions {
  loading?: boolean;
  skipScroll?: boolean;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

function isAbortError(error: unknown): boolean {
  return !!error && typeof error === "object" && "name" in error && error.name === "AbortError";
}

async function renderMarkdownInto(
  app: App,
  component: Component,
  el: HTMLElement,
  text: string
): Promise<void> {
  el.empty();
  // 加上 Obsidian 阅读视图用的样式类,公式(MathJax)、代码块、列表等才会套用主题自带的排版样式。
  el.addClass("markdown-rendered");
  try {
    if (MarkdownRenderer.render) {
      await MarkdownRenderer.render(app, text, el, "", component);
      return;
    }
    if (MarkdownRenderer.renderMarkdown) {
      await MarkdownRenderer.renderMarkdown(text, el, "", component);
      return;
    }
  } catch (e) {
    // fall through to plain text below
  }
  el.setText(text);
}

export class PDFChatModal extends Modal {
  private readonly plugin: PDFChatPluginApi;
  private readonly services: PDFChatModalServices;
  private readonly paperContext: PaperContext;
  private readonly contextText: string;
  private readonly pdfFile: TFile | null;
  readonly startFresh: boolean;
  readonly conversationKey: string;
  readonly hadExistingHistory: boolean;
  currentPresetId: string;
  currentModelId: string;
  useDocSummary = false;
  docSummaryEntry: DocSummaryEntry | null = null;
  isGeneratingSummary = false;
  useRag = false;
  docChunksEntry: DocChunksEntry | null = null;
  isIndexingRag = false;
  useFullTextMode = false;
  fullTextForQA: string | null = null;
  fullTextAttached = false;
  transcript: ConversationMessage[];
  messages: LlmMessage[];
  isSending = false;
  abortController: AbortController | null = null;

  zoomOutBtn!: HTMLButtonElement;
  zoomLabel!: HTMLSpanElement;
  zoomInBtn!: HTMLButtonElement;
  modelSelect!: HTMLSelectElement;
  modeSelect!: HTMLSelectElement;
  summaryCheckbox?: HTMLInputElement;
  summaryStatusEl?: HTMLSpanElement;
  summaryRefreshBtn?: HTMLButtonElement;
  ragCheckbox?: HTMLInputElement;
  ragStatusEl?: HTMLSpanElement;
  ragRefreshBtn?: HTMLButtonElement;
  historyEl!: HTMLDivElement;
  inputEl!: HTMLTextAreaElement;
  translateBtn!: HTMLButtonElement;
  sendBtn!: HTMLButtonElement;

  constructor(
    app: App,
    plugin: PDFChatPluginApi,
    contextText: string | PaperContext,
    pdfFile: TFile | null,
    startFresh?: boolean,
    services?: PDFChatModalServices
  ) {
    super(app);
    this.plugin = plugin;
    this.services = services || createPDFChatModalServices(plugin);
    const paperContext: PaperContext =
      typeof contextText === "string"
        ? {
            app,
            file: pdfFile || null,
            selectedText: contextText,
            conversationKey: this.services.conversations.getKey(pdfFile || null, contextText),
          }
        : contextText;
    this.paperContext = paperContext;
    this.contextText = paperContext.selectedText;
    this.pdfFile = paperContext.file || null;
    this.startFresh = !!startFresh;

    const lastPresetId = this.plugin.settings.lastPresetId;
    this.currentPresetId =
      lastPresetId &&
      (lastPresetId === "__default__" || this.plugin.settings.promptPresets.find((p) => p.id === lastPresetId))
        ? lastPresetId
        : "__default__";

    const lastModelId = this.plugin.settings.lastModelId;
    this.currentModelId =
      lastModelId && this.plugin.settings.models.find((m) => m.id === lastModelId)
        ? lastModelId
        : this.plugin.settings.activeModelId;

    // 全文只需要在对话历史里出现一次:聊天接口是无状态的,每轮都会把 this.messages 整个重新发送,
    // 已经进过历史的第一轮全文会随着后续每轮继续被带上,不需要再重复拼接一份,否则每多聊一轮,
    // 实际发给模型的内容就多一份完整全文,输入越滚越大、越聊越慢、越聊越贵。
    this.conversationKey = paperContext.conversationKey;
    // “新开对话”按快捷键触发时不加载旧记录:这次会话从空白开始,只要发出第一条消息,
    // 旧的这份记录就会被 recordTranscriptTurn 整份替换掉(每个 key 只保留一份最近对话)。
    // 如果只是打开看看什么都没问就关闭,onClose 里的保存会因为 transcript 仍是空数组而跳过,
    // 不会误删旧记录。
    const existingTranscript = this.services.conversations.get(this.conversationKey);
    this.hadExistingHistory = existingTranscript.length > 0;
    this.transcript = this.startFresh ? [] : existingTranscript;
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content })),
    ];
  }

  buildSystemMessage(): LlmMessage {
    const preset =
      this.currentPresetId === "__default__"
        ? null
        : this.plugin.settings.promptPresets.find((p) => p.id === this.currentPresetId);
    const promptText = (preset && preset.prompt) || this.plugin.settings.systemPrompt;

    let content = promptText;
    if (this.useDocSummary && this.docSummaryEntry && this.docSummaryEntry.summary) {
      content +=
        "\n\n【全文背景摘要】(由快速模型浓缩整篇 PDF 得到,仅供理解背景,不是我当前问题的具体内容):\n" +
        this.docSummaryEntry.summary;
    }
    content += `\n\n【我当前选中并想讨论的原文片段】:\n${this.contextText}`;
    return { role: "system", content };
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("pdf-chat-modal");

    const titleRow = contentEl.createDiv({ cls: "pdf-chat-title-row" });
    titleRow.createEl("h3", { text: "PDF Chat" });

    const titleActions = titleRow.createDiv({ cls: "pdf-chat-title-actions" });

    const zoomGroup = titleActions.createDiv({ cls: "pdf-chat-zoom-group" });
    this.zoomOutBtn = zoomGroup.createEl("button", { text: "A−", cls: "pdf-chat-zoom-btn" });
    this.zoomLabel = zoomGroup.createEl("span", { text: "100%", cls: "pdf-chat-zoom-label" });
    this.zoomInBtn = zoomGroup.createEl("button", { text: "A+", cls: "pdf-chat-zoom-btn" });
    this.zoomOutBtn.setAttr("title", "缩小内容字体");
    this.zoomInBtn.setAttr("title", "放大内容字体");
    this.zoomLabel.setAttr("title", "点击重置为 100%");

    const resetBtn = titleActions.createEl("button", {
      text: "清空对话",
      cls: "pdf-chat-reset-btn",
    });
    resetBtn.addEventListener("click", () => this.resetConversation());
    this.setupDragging(titleRow);

    this.zoomOutBtn.addEventListener("click", () =>
      this.applyFontScale((this.plugin.settings.fontScale || 1) - 0.1)
    );
    this.zoomInBtn.addEventListener("click", () =>
      this.applyFontScale((this.plugin.settings.fontScale || 1) + 0.1)
    );
    this.zoomLabel.addEventListener("click", () => this.applyFontScale(1));
    this.applyFontScale(this.plugin.settings.fontScale || 1);

    const modelRow = contentEl.createDiv({ cls: "pdf-chat-model-row" });
    modelRow.createEl("span", { text: "模型：", cls: "pdf-chat-select-label" });
    this.modelSelect = modelRow.createEl("select", { cls: "dropdown pdf-chat-select" });
    for (const m of this.plugin.settings.models) {
      this.modelSelect.createEl("option", { text: m.name, value: m.id });
    }
    this.modelSelect.value = this.currentModelId;
    this.modelSelect.addEventListener("change", () => this.applyModel(this.modelSelect.value));

    const modeRow = contentEl.createDiv({ cls: "pdf-chat-mode-row" });
    modeRow.createEl("span", { text: "阅读模式：", cls: "pdf-chat-select-label" });
    this.modeSelect = modeRow.createEl("select", { cls: "dropdown pdf-chat-select" });
    this.modeSelect.createEl("option", { text: "默认(设置里的系统提示词)", value: "__default__" });
    for (const preset of this.plugin.settings.promptPresets) {
      this.modeSelect.createEl("option", { text: preset.name, value: preset.id });
    }
    this.modeSelect.value = this.currentPresetId;
    this.modeSelect.addEventListener("change", () => this.applyPreset(this.modeSelect.value));

    const ctxWrapper = contentEl.createDiv({ cls: "pdf-chat-context-wrapper" });
    const toggle = ctxWrapper.createEl("p", {
      cls: "pdf-chat-context-toggle",
      text: `📄 已捕获选中内容(${this.contextText.length} 字) · 点击展开/收起`,
    });
    const ctxText = ctxWrapper.createDiv({
      cls: "pdf-chat-context-text is-collapsed",
      text: this.contextText,
    });
    toggle.addEventListener("click", () => {
      ctxText.toggleClass("is-collapsed", !ctxText.hasClass("is-collapsed"));
    });

    if (this.pdfFile) {
      const summaryRow = contentEl.createDiv({ cls: "pdf-chat-summary-row" });
      const summaryCheckbox = (this.summaryCheckbox = summaryRow.createEl("input", {
        type: "checkbox",
        attr: { id: "pdf-chat-summary-toggle" },
      }));
      summaryRow.createEl("label", {
        text: "附带全文摘要作为背景",
        attr: { for: "pdf-chat-summary-toggle" },
      });
      this.summaryStatusEl = summaryRow.createEl("span", { cls: "pdf-chat-summary-status" });
      const summaryRefreshBtn = (this.summaryRefreshBtn = summaryRow.createEl("button", {
        text: "生成/刷新摘要",
        cls: "pdf-chat-summary-btn",
      }));

      this.refreshSummaryStatus();

      summaryCheckbox.addEventListener("change", async () => {
        if (summaryCheckbox.checked) {
          await this.ensureDocSummary(false);
          this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
          summaryCheckbox.checked = this.useDocSummary;
        } else {
          this.useDocSummary = false;
        }
        this.messages[0] = this.buildSystemMessage();
      });
      summaryRefreshBtn.addEventListener("click", async () => {
        await this.ensureDocSummary(true);
        if (summaryCheckbox.checked) {
          this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        }
        this.messages[0] = this.buildSystemMessage();
      });

      // 自动模式:已缓存过的直接秒用,没缓存过的自动生成一次,不需要每次手动勾选/点击。
      // 缓存以文件路径+修改时间为 key,同一篇论文之后打开弹窗基本是瞬间命中缓存。
      if (this.plugin.settings.autoDocSummary) {
        summaryCheckbox.checked = true;
        this.useDocSummary = true;
        this.ensureDocSummary(false).then(() => {
          this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
          summaryCheckbox.checked = this.useDocSummary;
          this.messages[0] = this.buildSystemMessage();
        });
      }

      const ragRow = contentEl.createDiv({ cls: "pdf-chat-summary-row" });
      const ragCheckbox = (this.ragCheckbox = ragRow.createEl("input", {
        type: "checkbox",
        attr: { id: "pdf-chat-rag-toggle" },
      }));
      ragRow.createEl("label", {
        text: "全文/检索相关片段",
        attr: { for: "pdf-chat-rag-toggle" },
      });
      this.ragStatusEl = ragRow.createEl("span", { cls: "pdf-chat-summary-status" });
      const ragRefreshBtn = (this.ragRefreshBtn = ragRow.createEl("button", {
        text: "建立/刷新索引",
        cls: "pdf-chat-summary-btn",
      }));

      this.refreshRagStatus();

      ragCheckbox.addEventListener("change", async () => {
        if (ragCheckbox.checked) {
          await this.ensureDocChunks(false);
          this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length);
          ragCheckbox.checked = this.useRag;
        } else {
          this.useRag = false;
        }
      });
      ragRefreshBtn.addEventListener("click", async () => {
        await this.ensureDocChunks(true);
        if (ragCheckbox.checked) {
          this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length);
        }
      });

      // 建索引是纯本地文本切块,不调用模型,很快,可以放心自动做。
      if (this.plugin.settings.autoRag) {
        ragCheckbox.checked = true;
        this.useRag = true;
        this.ensureDocChunks(false).then(() => {
          this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length);
          ragCheckbox.checked = this.useRag;
        });
      }
    }

    this.historyEl = contentEl.createDiv({ cls: "pdf-chat-history" });

    const inputRow = contentEl.createDiv({ cls: "pdf-chat-input-row" });
    this.inputEl = inputRow.createEl("textarea", {
      cls: "pdf-chat-input",
      attr: { placeholder: "针对上面选中的内容提问,按 Enter 提交,Shift+Enter 换行…" },
    });
    // “翻译”不需要在输入框里打字:选中的原文片段已经在系统提示词里,点一下就直接把固定的
    // 翻译指令当作这一轮的问题发出去,走的还是同一套发送/流式/历史记录逻辑。
    this.translateBtn = inputRow.createEl("button", { text: "翻译", cls: "pdf-chat-translate-btn" });
    this.translateBtn.setAttr("title", "直接翻译当前选中的原文片段,无需输入内容");
    this.sendBtn = inputRow.createEl("button", { text: "发送", cls: "mod-cta" });

    const submit = () => this.handleSubmit();
    this.sendBtn.addEventListener("click", () => {
      if (this.isSending) {
        this.stopGenerating();
      } else {
        submit();
      }
    });
    this.translateBtn.addEventListener("click", () => {
      if (this.isSending) {
        this.stopGenerating();
      } else {
        this.handleTranslate();
      }
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    });

    contentEl.createEl("p", {
      cls: "pdf-chat-hint",
      text: "多轮追问会带着完整对话历史一起发送给模型,答案会实时流式显示。点「翻译」可直接翻译选中内容,不用输入任何文字。",
    });

    if (this.transcript.length) {
      this.restoreConversationHistory().catch((err) => {
        new Notice("恢复上次对话显示失败: " + errorMessage(err));
      });
    } else if (this.startFresh && this.hadExistingHistory) {
      new Notice("已开始新对话(发出第一条消息后会替换掉上次保存的记录)");
    }
    this.inputEl.focus();
  }

  async restoreConversationHistory(): Promise<void> {
    const renderJobs = [];
    for (const message of this.transcript) {
      if (message.role === "user") {
        this.addBubble("user", message.content, { skipScroll: true });
        continue;
      }
      const bubble = this.addBubble("assistant", message.content, { skipScroll: true });
      bubble.addClass("is-rendered");
      renderJobs.push(
        renderMarkdownInto(this.app, this.plugin, bubble, message.content).then(() => {
          if (message.status === "stopped") {
            bubble.addClass("is-stopped");
            bubble.createEl("p", { cls: "pdf-chat-stopped-label", text: "[已停止生成]" });
          }
        })
      );
    }
    await Promise.all(renderJobs);
    this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
    const scope = this.pdfFile ? "本 PDF" : "当前选区";
    new Notice(`已恢复${scope}上次对话(${this.transcript.length} 条消息)`);
  }

  async persistConversation(): Promise<boolean> {
    try {
      await this.services.conversations.save(this.conversationKey, this.transcript);
      return true;
    } catch (err) {
      new Notice("保存对话失败: " + errorMessage(err));
      return false;
    }
  }

  async recordTranscriptTurn(
    question: string,
    answer: string,
    status: ConversationMessage["status"]
  ): Promise<boolean> {
    if (typeof answer !== "string" || !answer.trim()) return false;
    this.transcript.push(
      { role: "user", content: question, status: "complete" },
      { role: "assistant", content: answer, status: status === "stopped" ? "stopped" : "complete" }
    );
    await this.persistConversation();
    return true;
  }

  async resetConversation(): Promise<void> {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再清空");
      return;
    }
    this.transcript = [];
    this.messages = [this.buildSystemMessage()];
    this.fullTextAttached = false;
    this.historyEl.empty();
    try {
      await this.services.conversations.clear(this.conversationKey);
      new Notice("对话已清空,原文上下文保留");
    } catch (err) {
      new Notice("界面已清空,但删除已保存对话失败: " + errorMessage(err));
    }
  }

  applyPreset(id: string): void {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再切换阅读模式");
      this.modeSelect.value = this.currentPresetId;
      return;
    }
    this.currentPresetId = id;
    this.plugin.settings.lastPresetId = id;
    this.plugin.saveSettings();
    this.messages[0] = this.buildSystemMessage();
    const preset = this.plugin.settings.promptPresets.find((p) => p.id === id);
    const name = id === "__default__" ? "默认" : (preset && preset.name) || id;
    new Notice(`已切换到「${name}」模式,后续回答会按新设定进行`);
  }

  applyModel(id: string): void {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再切换模型");
      this.modelSelect.value = this.currentModelId;
      return;
    }
    this.currentModelId = id;
    this.plugin.settings.lastModelId = id;
    this.plugin.saveSettings();
    const m = this.plugin.settings.models.find((x) => x.id === id);
    new Notice(`已切换到模型「${(m && m.name) || id}」`);
  }

  applyFontScale(scale: number): void {
    const clamped = Math.round(Math.min(1.6, Math.max(0.7, scale)) * 100) / 100;
    this.plugin.settings.fontScale = clamped;
    this.contentEl.style.setProperty("--pdf-chat-font-scale", String(clamped));
    if (this.zoomLabel) this.zoomLabel.setText(Math.round(clamped * 100) + "%");
    this.plugin.saveSettings();
  }

  refreshSummaryStatus(): void {
    if (!this.summaryStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    if (cached && cached.summary) {
      this.docSummaryEntry = cached;
      const date = new Date(cached.generatedAt);
      const truncatedNote = cached.truncated ? " · 原文过长,仅摘要了前面部分" : "";
      this.summaryStatusEl.setText(`(已缓存 · ${date.toLocaleString()}${truncatedNote})`);
    } else {
      this.docSummaryEntry = null;
      this.summaryStatusEl.setText("(尚未生成)");
    }
  }

  async ensureDocSummary(forceRefresh: boolean): Promise<void> {
    if (this.isGeneratingSummary || !this.pdfFile) return;

    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docSummaryEntry = cached;
      this.refreshSummaryStatus();
      return;
    }

    this.isGeneratingSummary = true;
    if (this.summaryRefreshBtn) {
      this.summaryRefreshBtn.setText("生成中…");
      this.summaryRefreshBtn.disabled = true;
    }
    if (this.summaryCheckbox) this.summaryCheckbox.disabled = true;
    const notice = new Notice("正在用快速模型提炼全文摘要,可能需要几十秒…", 0);

    try {
      this.docSummaryEntry = await this.services.papers.getOrCreateDocSummary(this.pdfFile, forceRefresh);
      this.refreshSummaryStatus();
      notice.hide();
      new Notice("全文摘要已生成/更新");
    } catch (err) {
      notice.hide();
      new Notice("生成摘要失败: " + errorMessage(err));
      if (this.summaryCheckbox) this.summaryCheckbox.checked = false;
      this.useDocSummary = false;
    } finally {
      this.isGeneratingSummary = false;
      if (this.summaryRefreshBtn) {
        this.summaryRefreshBtn.setText("生成/刷新摘要");
        this.summaryRefreshBtn.disabled = false;
      }
      if (this.summaryCheckbox) this.summaryCheckbox.disabled = false;
    }
  }

  refreshRagStatus(): void {
    if (!this.ragStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    if (cached && cached.chunks && cached.chunks.length) {
      this.docChunksEntry = cached;
      const threshold = this.plugin.settings.ragFullTextThreshold || DEFAULT_SETTINGS.ragFullTextThreshold;
      this.useFullTextMode = !!(cached.fullTextLength && cached.fullTextLength <= threshold);
      const date = new Date(cached.generatedAt);
      if (this.useFullTextMode) {
        this.ragStatusEl.setText(`(全文约${cached.fullTextLength}字,较短 · 直接读全文回答,更准 · ${date.toLocaleString()})`);
      } else {
        this.ragStatusEl.setText(`(已建索引 · ${cached.chunks.length} 块 · ${date.toLocaleString()})`);
      }
    } else {
      this.docChunksEntry = null;
      this.useFullTextMode = false;
      this.ragStatusEl.setText("(尚未建立索引)");
    }
  }

  async ensureDocChunks(forceRefresh: boolean): Promise<void> {
    if (this.isIndexingRag || !this.pdfFile) return;

    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docChunksEntry = cached;
      this.refreshRagStatus();
      return;
    }

    this.isIndexingRag = true;
    if (this.ragRefreshBtn) {
      this.ragRefreshBtn.setText("建立中…");
      this.ragRefreshBtn.disabled = true;
    }
    if (this.ragCheckbox) this.ragCheckbox.disabled = true;

    try {
      this.docChunksEntry = await this.services.papers.getOrCreateDocChunks(this.pdfFile, forceRefresh);
      this.refreshRagStatus();
    } catch (err) {
      new Notice("建立检索索引失败: " + errorMessage(err));
      if (this.ragCheckbox) this.ragCheckbox.checked = false;
      this.useRag = false;
    } finally {
      this.isIndexingRag = false;
      if (this.ragRefreshBtn) {
        this.ragRefreshBtn.setText("建立/刷新索引");
        this.ragRefreshBtn.disabled = false;
      }
      if (this.ragCheckbox) this.ragCheckbox.disabled = false;
    }
  }

  setupDragging(handleEl: HTMLElement): void {
    handleEl.addClass("pdf-chat-drag-handle");
    handleEl.addEventListener("mousedown", (evt: MouseEvent) => {
      if (evt.target instanceof Element && evt.target.closest("button, select, .pdf-chat-title-actions")) return;
      evt.preventDefault();

      const modalEl = this.modalEl;
      const doc = modalEl.ownerDocument;
      const rect = modalEl.getBoundingClientRect();
      modalEl.style.position = "fixed";
      modalEl.style.margin = "0";
      modalEl.style.left = rect.left + "px";
      modalEl.style.top = rect.top + "px";

      const startX = evt.clientX;
      const startY = evt.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;

      const onMouseMove = (moveEvt: MouseEvent) => {
        modalEl.style.left = startLeft + (moveEvt.clientX - startX) + "px";
        modalEl.style.top = startTop + (moveEvt.clientY - startY) + "px";
      };
      const onMouseUp = () => {
        doc.removeEventListener("mousemove", onMouseMove);
        doc.removeEventListener("mouseup", onMouseUp);
      };
      doc.addEventListener("mousemove", onMouseMove);
      doc.addEventListener("mouseup", onMouseUp);
    });
  }

  stopGenerating(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  setSendingState(sending: boolean): void {
    this.isSending = sending;
    this.sendBtn.setText(sending ? "停止" : "发送");
    this.sendBtn.toggleClass("is-stop", sending);
  }

  // 点「翻译」按钮触发:不读输入框,直接用固定的翻译指令当作这一轮的问题发出去。
  // 选中的原文片段已经在系统提示词里(见 buildSystemMessage),跳过 RAG/全文检索拼接——
  // 那是给"回答具体问题"用的,翻译只需要针对已经在上下文里的选中片段,不需要额外找相关内容。
  handleTranslate(): void {
    void this.services.actions.execute("translate", {
      settings: this.plugin.settings,
      submit: (options) => this.handleSubmit(options),
    });
  }

  async handleSubmit(options: SubmitOptions = {}): Promise<void> {
    const opts = options || {};
    const usingOverride = typeof opts.question === "string";
    const question = typeof opts.question === "string" ? opts.question.trim() : this.inputEl.value.trim();
    if (!question) return;
    if (this.isSending) {
      new Notice("上一个问题还在生成中,请稍候或点击停止");
      return;
    }

    this.addBubble("user", question);
    if (!usingOverride) this.inputEl.value = "";
    this.setSendingState(true);

    const loadingBubble = this.addBubble("assistant", "思考中…", { loading: true });

    let outgoingContent = question;
    if (opts.skipContextAugmentation) {
      // 跳过下面的 RAG/全文拼接逻辑,原样发送。
    } else if (this.useRag && this.useFullTextMode && this.pdfFile && !this.fullTextAttached) {
      // 全文足够短,直接把全文交给模型,不做"猜哪一块相关"的检索——实测发现关键词检索对
      // "列举类"问题(比如"论文对比了哪些基线算法")经常检索不全或检索错块,直接给全文更可靠。
      // 只在对话的第一轮附带一次:之后每轮 this.messages 都会带着这一轮的历史一起重新发送,
      // 不需要也不应该重复拼接,否则输入会随聊天轮数线性膨胀。
      loadingBubble.setText("正在读取全文…");
      try {
        if (!this.fullTextForQA) {
          this.fullTextForQA = await this.services.papers.extractFullText(this.pdfFile);
        }
        outgoingContent = "【论文全文】:\n" + this.fullTextForQA + "\n\n【我的问题】:\n" + question;
        this.fullTextAttached = true;
      } catch (err) {
        // 全文提取失败就退回原始问题,不阻塞正常提问
      }
      loadingBubble.setText("思考中…");
    } else if (
      !this.useFullTextMode &&
      this.useRag &&
      this.docChunksEntry &&
      this.docChunksEntry.chunks &&
      this.docChunksEntry.chunks.length
    ) {
      const retrievalQueries = [question];
      if (this.plugin.settings.ragQueryTranslate) {
        loadingBubble.setText("正在思考检索角度…");
        try {
          const variants = await this.services.papers.planRagQueries(question);
          if (variants && variants.length) retrievalQueries.push(...variants);
        } catch (err) {
          // 检索词规划失败就退回只用原始问题直接检索,不阻塞正常提问
        }
      }

      const topK = this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK;
      const expanded = this.services.papers.retrieveContext(
        this.docChunksEntry.chunks,
        retrievalQueries,
        topK
      );
      if (expanded.length) {
        const retrievedText = expanded.map((c) => `[第${c.page}页]\n${c.text}`).join("\n\n---\n\n");
        outgoingContent =
          "【从全文中按关键词检索到的可能相关片段(不一定完全准确,仅供参考)】:\n" +
          retrievedText +
          "\n\n【我的问题】:\n" +
          question;
      }
      loadingBubble.setText("思考中…");
    }

    this.messages.push({ role: "user", content: outgoingContent });
    this.abortController = new AbortController();
    let fullText = "";
    let firstChunkArrived = false;

    try {
      fullText = await this.services.llm.chat({
        messages: this.messages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          loadingBubble.setText(acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: this.abortController.signal,
        modelProfile: this.services.models.get(this.currentModelId),
      });

      loadingBubble.removeClass("is-loading");
      // 切到最终渲染状态后去掉 pre-wrap,避免和渲染出来的 HTML(公式/段落/代码块)标签间的
      // 空白文本节点叠加,出现多余换行或挤成一团的问题。
      loadingBubble.addClass("is-rendered");
      this.messages.push({ role: "assistant", content: fullText });
      await renderMarkdownInto(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranscriptTurn(question, fullText, "complete");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(err)) {
        loadingBubble.addClass("is-stopped");
        loadingBubble.setText((fullText || "") + "\n\n[已停止生成]");
        if (fullText) {
          this.messages.push({ role: "assistant", content: fullText });
          await this.recordTranscriptTurn(question, fullText, "stopped");
        } else {
          this.messages.pop();
        }
      } else {
        loadingBubble.addClass("is-error");
        loadingBubble.setText("请求失败: " + errorMessage(err));
        this.messages.pop();
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }

  addBubble(role: "user" | "assistant", text: string, opts: BubbleOptions = {}): HTMLDivElement {
    const bubble = this.historyEl.createDiv({ cls: `pdf-chat-bubble ${role}` });
    if (opts && opts.loading) bubble.addClass("is-loading");
    bubble.setText(text);
    if (!(opts && opts.skipScroll)) {
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    }
    return bubble;
  }

  onClose(): void {
    this.stopGenerating();
    // 只在这次会话确实产生过消息时才回写存储:避免“新开对话”模式下,用户什么都没问就
    // 直接关闭弹窗,却因为 this.transcript 一开始就是空数组而把上次保存的记录误清空。
    if (this.transcript.length) {
      void this.persistConversation();
    }
    this.contentEl.empty();
  }
}
