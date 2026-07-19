import { Modal, type App } from "obsidian";

export type SelectionChoice = "all" | "prefix" | "cancel";

export type SelectionDecision =
  | { kind: "all"; text: string; oversized: boolean }
  | { kind: "prefix"; text: string; oversized: true }
  | { kind: "cancel"; text: ""; oversized: true };

export type SelectionDecisionProvider = (request: {
  textLength: number;
  limit: number;
}) => Promise<SelectionChoice>;

export async function resolveSelectionForTurn(
  text: string,
  limit: number,
  requestDecision: SelectionDecisionProvider
): Promise<SelectionDecision> {
  const normalizedText = typeof text === "string" ? text : "";
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20_000;
  if (normalizedText.length <= normalizedLimit) {
    return { kind: "all", text: normalizedText, oversized: false };
  }
  const choice = await requestDecision({ textLength: normalizedText.length, limit: normalizedLimit });
  if (choice === "all") return { kind: "all", text: normalizedText, oversized: true };
  if (choice === "prefix") {
    return { kind: "prefix", text: normalizedText.slice(0, normalizedLimit), oversized: true };
  }
  return { kind: "cancel", text: "", oversized: true };
}

export class SelectionLimitModal extends Modal {
  private settled = false;

  constructor(
    app: App,
    private readonly textLength: number,
    private readonly limit: number,
    private readonly resolveChoice: (choice: SelectionChoice) => void
  ) {
    super(app);
  }

  private finish(choice: SelectionChoice): void {
    if (this.settled) return;
    this.settled = true;
    this.resolveChoice(choice);
    this.close();
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("pdf-chat-selection-limit-modal");
    this.contentEl.createEl("h2", { text: "选区内容较长" });
    this.contentEl.createEl("p", {
      text: `当前选区 ${this.textLength} 字，超过单轮建议上限 ${this.limit} 字。请选择本轮如何发送。`,
    });
    const actions = this.contentEl.createDiv({ cls: "pdf-chat-selection-limit-actions" });
    const sendAll = actions.createEl("button", { text: "本次发送全部" });
    sendAll.setAttr("aria-label", "本次发送全部选区内容");
    sendAll.addEventListener("click", () => this.finish("all"));
    const sendPrefix = actions.createEl("button", { text: `只发送前 ${this.limit} 字` });
    sendPrefix.setAttr("aria-label", `只发送选区前 ${this.limit} 字`);
    sendPrefix.addEventListener("click", () => this.finish("prefix"));
    const cancel = actions.createEl("button", { text: "取消并重新选择" });
    cancel.setAttr("aria-label", "取消本轮发送并重新选择内容");
    cancel.addEventListener("click", () => this.finish("cancel"));
    sendPrefix.focus();
  }

  onClose(): void {
    if (!this.settled) {
      this.settled = true;
      this.resolveChoice("cancel");
    }
    this.contentEl.empty();
  }
}

export function requestSelectionLimitDecision(
  app: App,
  textLength: number,
  limit: number
): Promise<SelectionChoice> {
  return new Promise((resolve) => {
    new SelectionLimitModal(app, textLength, limit, resolve).open();
  });
}
