# Task 3 report: Research-workbench modal and grouped settings UI

## RED evidence

Focused command sequence before production edits:

1. `npm run build` — exit 0.
2. `node --test tests/workbench-ui.test.js` — expected exit 1, 4 tests, 0 pass, 4 fail.

The failures were requirement-specific:

- modal children were the old title/model/mode/context/input rows instead of the four ordered workbench regions;
- restored history had no `aria-live` state;
- settings produced no visible ordered section containers;
- CSS lacked the modal-scoped workbench custom properties and related responsive/readability contract.

The failing assertions exercised `PDFChatModal.onOpen()` and `PDFChatSettingTab.display()` through Obsidian-compatible DOM/control stubs. The CSS test supplemented those behavior tests with source-level style contracts.

## Component and region map

- `src/modal-ui.ts`
  - `buildWorkbenchHeader`: title, active PDF filename/fallback, model and reading-mode selectors, font controls, clear action.
  - `buildContextPanel`: collapsed-by-default context toggle, character count, summary/context chips, source text, tool body, semantic research-action slot.
  - `buildMessageRegion` and `buildEmptyState`: dominant live-region history and non-persisted guidance.
  - `buildComposer` and `resizeComposerTextarea`: sticky composer, auto-growing textarea, translation/send controls, integrated keyboard hint.
- `src/pdf-chat-modal.ts`
  - retains stateful chat, translation, history, summary, RAG/full-text, drag, font and request behavior;
  - delegates DOM construction to typed builders and small context/action helpers.
- `src/actions.ts` / `src/types.ts`
  - add optional typed `composer`/`context` action-slot metadata;
  - current translation action remains composer-owned;
  - registered context actions can render in the semantic slot without modal restructuring.
- `src/settings-ui.ts` / `src/settings-tab.ts`
  - build visible semantic sections in exact order: 模型, 聊天, 翻译, 论文上下文, 高级;
  - section render methods retain all existing settings fields and callbacks.
- `styles.css`
  - implements the research-workbench layout, readability, selection, focus, cursor, responsive and theme-derived color contracts.

## Accessibility and responsive proof

- Context toggle is a labeled button with synchronized `aria-expanded` and collapsed body state; the focused DOM test clicks it and verifies both states.
- Model/mode controls use labels plus useful titles/ARIA labels. Font, clear, refresh, checkbox, textarea, translate and send/stop controls are named and tooled.
- History uses `role="log"`, `aria-relevant="additions"`, and `aria-live="off"` during restored-history rendering before returning to `polite`.
- Sending state disables translation and changes the one send control into the labeled stop control; the DOM test verifies restoration afterward.
- Empty guidance is a separate status element, is removed on the first bubble or restored history, and never enters `messages`/`transcript`.
- User/PDF Chat attribution is rendered from `data-speaker` through CSS, leaving persisted content unchanged.
- `:focus-visible` outlines, pointer/text cursors, explicit selection rules and horizontal scrolling for pre/table/MathJax content are present.
- Modal retains resize, 420px minimum width and viewport maxima. Container-width and viewport-height queries wrap/compact controls without taking the scrollable chat region out of the flex layout.
- Composer input auto-grows on input and is resized after normal submission reset.

## Preserved-behavior checks

The full regression suite covers and passes:

- conversation keying, history restore/save/clear and stopped-output persistence;
- isolated translation requests, chunking, cancellation, streaming progress and sanitized errors;
- standard streaming/non-streaming chat transport and full request forwarding;
- summary/RAG/full-text message behavior and context privacy;
- model deletion guard, settings persistence, commands and hotkeys;
- Markdown/stopped/error/loading rendering contracts and selectable text.

No README, manifest/version, CI/deploy/security script, installed plugin, translation defaults or private data was changed.

## GREEN and full verification

- Focused GREEN: `node --test tests/workbench-ui.test.js` — 4/4 pass.
- `npm run typecheck` — exit 0.
- `npm run build` — exit 0.
- `npm test` — 41/41 pass, 0 fail.
- `node --check main.js` — exit 0.
- `git diff --check` — exit 0; Git emitted only LF-to-CRLF working-copy notices.

A legacy single-model deletion test initially exposed that its deliberately minimal settings stub returned a bare object from `createEl`. The failure was reproduced alone, traced to the new section helper boundary, fixed with one compatibility fallback, and the focused legacy test plus the full suite then passed.

## Files changed

- `.superpowers/sdd/task-3-report.md`
- `main.js`
- `src/actions.ts`
- `src/modal-ui.ts`
- `src/pdf-chat-modal.ts`
- `src/settings-tab.ts`
- `src/settings-ui.ts`
- `src/types.ts`
- `styles.css`
- `tests/workbench-ui.test.js`

## Self-review

- Rechecked every binding requirement against the final diff and focused tests.
- Kept action-slot metadata optional to avoid breaking existing registered actions.
- Confirmed the current translation action does not appear in the context extension slot and no related-paper/PPT placeholders exist.
- Confirmed all settings fields/callbacks remain represented after grouping.
- Confirmed strict TypeScript contains no suppression directives or broad `any` additions.
- Confirmed the branch is the requested linked worktree and no push/deploy occurred.

## Concerns

- This worktree has no `.codegraph/` index and CodeGraph MCP tools were not exposed, so review used narrowly scoped repository reads as the fallback.
- Automated DOM stubs and CSS contracts cover the requested structure/interactions; no manual Obsidian host visual pass was performed in this task environment.
- Git reports repository line-ending conversion notices on Windows; `git diff --check` still exits 0.

## Commit SHA

Verified implementation commit: `a0ecdb9c470fdc32ffc8a84f0586978e58f1e9ee`.

The report itself is committed separately so it can record the immutable implementation SHA without a circular self-reference.
