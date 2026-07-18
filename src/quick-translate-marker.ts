import type { TFile } from "obsidian";

import { cleanSelectionText } from "./conversation";

export interface QuickTranslateOpenRequest {
  file: TFile;
  selectedText: string;
  startFresh: true;
  autoTranslateOnOpen: true;
}

export interface QuickTranslateMarkerDependencies {
  isEnabled(): boolean;
  getActivePdfFile(): TFile | null;
  isSelectionInsideActivePdf?(selection: Selection, doc: Document): boolean;
  openModal(request: QuickTranslateOpenRequest): void;
  setTimer?(callback: () => void, delay: number): unknown;
  clearTimer?(timer: unknown): void;
}

interface AttachedDocument {
  selectionChange: EventListener;
  mouseDown: EventListener;
  scroll: EventListener;
  keyDown: EventListener;
}

interface SelectionSnapshot {
  text: string;
  rect: DOMRect;
}

const MARKER_GAP = 8;
const SELECTION_DEBOUNCE_MS = 150;

function readSelection(doc: Document): { selection: Selection; snapshot: SelectionSnapshot } | null {
  const selection = doc.defaultView?.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const text = cleanSelectionText(selection.toString());
  if (!text) return null;
  const range = selection.getRangeAt(selection.rangeCount - 1);
  const rectangles = Array.from(range.getClientRects());
  const rect = rectangles.length
    ? rectangles[rectangles.length - 1]
    : range.getBoundingClientRect();
  if (!rect) return null;
  return { selection, snapshot: { text, rect } };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export class QuickTranslateMarker {
  private readonly attached = new Map<Document, AttachedDocument>();
  private markerEl: HTMLButtonElement | null = null;
  private markerDocument: Document | null = null;
  private pendingTimer: unknown = null;
  private readonly setTimer: (callback: () => void, delay: number) => unknown;
  private readonly clearTimer: (timer: unknown) => void;

  constructor(private readonly dependencies: QuickTranslateMarkerDependencies) {
    this.setTimer = dependencies.setTimer ?? ((callback, delay) => setTimeout(callback, delay));
    this.clearTimer =
      dependencies.clearTimer ?? ((timer) => clearTimeout(timer as ReturnType<typeof setTimeout>));
  }

  attach(doc: Document): void {
    if (!doc || this.attached.has(doc)) return;
    const selectionChange: EventListener = () => this.scheduleUpdate(doc);
    const mouseDown: EventListener = (event) => {
      const target = (event as MouseEvent).target;
      if (this.markerEl && target && this.markerEl.contains(target as Node)) return;
      this.hide();
    };
    const scroll: EventListener = () => this.hide();
    const keyDown: EventListener = (event) => {
      if ((event as KeyboardEvent).key === "Escape") this.hide();
    };
    doc.addEventListener("selectionchange", selectionChange);
    doc.addEventListener("mousedown", mouseDown, true);
    doc.addEventListener("scroll", scroll, true);
    doc.addEventListener("keydown", keyDown);
    this.attached.set(doc, { selectionChange, mouseDown, scroll, keyDown });
  }

  hide(): void {
    this.cancelPendingUpdate();
    if (this.markerEl) this.markerEl.hidden = true;
  }

  detach(doc: Document): void {
    const listeners = this.attached.get(doc);
    if (!listeners) return;
    doc.removeEventListener("selectionchange", listeners.selectionChange);
    doc.removeEventListener("mousedown", listeners.mouseDown, true);
    doc.removeEventListener("scroll", listeners.scroll, true);
    doc.removeEventListener("keydown", listeners.keyDown);
    this.attached.delete(doc);
    if (this.markerDocument === doc) {
      this.cancelPendingUpdate();
      this.markerEl?.remove();
      this.markerEl = null;
      this.markerDocument = null;
    }
  }

  destroy(): void {
    this.cancelPendingUpdate();
    for (const doc of Array.from(this.attached.keys())) this.detach(doc);
    this.markerEl?.remove();
    this.markerEl = null;
    this.markerDocument = null;
  }

  private scheduleUpdate(doc: Document): void {
    this.cancelPendingUpdate();
    this.pendingTimer = this.setTimer(() => {
      this.pendingTimer = null;
      this.updateFromSelection(doc);
    }, SELECTION_DEBOUNCE_MS);
  }

  private cancelPendingUpdate(): void {
    if (this.pendingTimer === null) return;
    this.clearTimer(this.pendingTimer);
    this.pendingTimer = null;
  }

  private updateFromSelection(doc: Document): void {
    if (!this.dependencies.isEnabled() || !this.dependencies.getActivePdfFile()) {
      this.hide();
      return;
    }
    const selectionState = readSelection(doc);
    if (
      !selectionState ||
      (this.dependencies.isSelectionInsideActivePdf &&
        !this.dependencies.isSelectionInsideActivePdf(selectionState.selection, doc))
    ) {
      this.hide();
      return;
    }
    const marker = this.ensureMarker(doc);
    marker.hidden = false;
    this.position(marker, doc, selectionState.snapshot.rect);
  }

  private ensureMarker(doc: Document): HTMLButtonElement {
    if (this.markerEl && this.markerDocument === doc) return this.markerEl;
    this.markerEl?.remove();
    const marker = doc.createElement("button");
    marker.type = "button";
    marker.className = "pdf-chat-quick-translate-marker";
    marker.textContent = "译";
    marker.setAttribute("aria-label", "翻译当前 PDF 选区");
    marker.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openCurrentSelection(doc);
    });
    doc.body.appendChild(marker);
    this.markerEl = marker;
    this.markerDocument = doc;
    return marker;
  }

  private openCurrentSelection(doc: Document): void {
    const selectionState = readSelection(doc);
    const file = this.dependencies.getActivePdfFile();
    if (
      !this.dependencies.isEnabled() ||
      !selectionState ||
      !file ||
      (this.dependencies.isSelectionInsideActivePdf &&
        !this.dependencies.isSelectionInsideActivePdf(selectionState.selection, doc))
    ) {
      this.hide();
      return;
    }
    this.hide();
    this.dependencies.openModal({
      file,
      selectedText: selectionState.snapshot.text,
      startFresh: true,
      autoTranslateOnOpen: true,
    });
  }

  private position(marker: HTMLButtonElement, doc: Document, selectionRect: DOMRect): void {
    const viewportWidth = doc.defaultView?.innerWidth ?? doc.documentElement.clientWidth;
    const viewportHeight = doc.defaultView?.innerHeight ?? doc.documentElement.clientHeight;
    const markerRect = marker.getBoundingClientRect();
    const width = markerRect.width || 32;
    const height = markerRect.height || 32;

    let left = selectionRect.right + MARKER_GAP;
    if (left + width + MARKER_GAP > viewportWidth) {
      left = selectionRect.left - width - MARKER_GAP;
    }
    let top = selectionRect.top - height - MARKER_GAP;
    if (top < MARKER_GAP) top = selectionRect.bottom + MARKER_GAP;

    marker.style.left = `${clamp(left, MARKER_GAP, viewportWidth - width - MARKER_GAP)}px`;
    marker.style.top = `${clamp(top, MARKER_GAP, viewportHeight - height - MARKER_GAP)}px`;
  }
}
