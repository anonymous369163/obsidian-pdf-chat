# Architecture

PDF Chat is a dependency-light Obsidian plugin organized around typed service boundaries. The production build bundles TypeScript into the root `main.js`; Obsidian remains an external runtime dependency.

## Subsystems

- `src/main.ts` owns plugin lifecycle, commands, settings persistence, and service composition.
- `src/pdf-chat-modal.ts`, `src/modal-ui.ts`, and `src/modal-services.ts` own the research-workbench presentation and coordinate actions without embedding transport or extraction logic.
- `src/llm-transport.ts` accepts a typed `LlmRequest` and isolates the OpenAI-compatible HTTP and streaming protocol.
- `src/paper-context.ts` creates typed `PaperContext` values, extracts PDF text, caches summaries/chunks, and performs local retrieval.
- `src/codex-cli.ts` owns native Codex CLI argument construction, JSONL parsing, direct PDF path prompts, and scoped child-process termination.
- `src/codex-session-manager.ts` owns background Codex turns, native thread IDs, UI subscriptions, and session-safe result persistence.
- `src/multi-paper.ts` owns vault PDF search, ordinary API multi-paper context, and the advanced one-shot `debug-full` compatibility path.
- `src/actions.ts` registers typed `ResearchAction` implementations, while `src/translation.ts` owns the dedicated academic-translation pipeline.
- `src/conversation.ts`, `src/settings.ts`, and `src/default-settings.ts` own local persistence, migration, and safe empty defaults.

## Context flow

The paper service should extract once, cache by document identity and modification time, then fan out the same context to summary, full-text, and RAG consumers. `PaperContext` carries the active file, selection, and conversation identity. UI actions produce typed requests; `LlmRequest` carries messages, the selected model profile, cancellation, streaming callbacks, and bounded overrides. A `ResearchAction` invokes a focused service operation instead of reaching into modal internals.

This separation keeps extraction, retrieval, model transport, conversations, and UI independently testable. Local `data.json` is persistence, not a release artifact.

## Native Codex session boundary

The default Codex path is deliberately small:

- The first turn runs persistent `codex exec` in the current PDF's parent folder and records `thread.started.thread_id`.
- Later turns run `codex exec resume <threadId>` so Codex retains its native conversation context without an idle background process.
- Each turn sends only the user's question, explicitly attached PDF paths, and the selected passage when enabled. A greeting does not require PDF reading.
- `CodexSessionManager` outlives individual modals. Esc removes only the UI subscriber; X aborts the current turn and marks the plugin session closed. Completed background results are appended by session ID, never by whichever modal happens to be open.
- Normal API chat may still use summaries and local retrieval for referenced PDFs, but `@PDF` means “attach this paper,” not “force a comparison.”

Absolute paths exist only in the in-memory Codex prompt. `data.json` stores the native thread ID, model choice, relative PDF paths, and visible transcript; it never stores absolute PDF paths or selected text. Codex must not receive plugin runtime data such as `data.json`, API keys, endpoints, or private model profiles. The old extracted-text package remains available only through the explicit advanced `debug-full` path.

## Future integrations

Related-paper discovery and PPT generation should be implemented through explicit external adapters and asynchronous jobs. They should exchange typed inputs and outputs with `ResearchAction` implementations. Do not bundle Python environments, browser automation, presentation renderers, or provider-specific job engines into the Obsidian plugin bundle.

The workbench direction is inspired by [Microsoft ResearchStudio](https://github.com/microsoft/ResearchStudio). PDF Chat credits that product-level design inspiration but does not copy its implementation.
