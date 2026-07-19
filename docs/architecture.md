# Architecture

PDF Chat is a dependency-light Obsidian plugin organized around typed service boundaries. The production build bundles TypeScript into the root `main.js`; Obsidian remains an external runtime dependency.

## Subsystems

- `src/main.ts` owns plugin lifecycle, commands, settings persistence, and service composition.
- `src/pdf-chat-modal.ts`, `src/modal-ui.ts`, and `src/modal-services.ts` own the research-workbench presentation and coordinate actions without embedding transport or extraction logic.
- `src/llm-transport.ts` accepts a typed `LlmRequest` and isolates the OpenAI-compatible HTTP and streaming protocol.
- `src/paper-context.ts` creates typed `PaperContext` values, extracts PDF text, caches summaries/chunks, and performs local retrieval.
- `src/extraction-quality.ts` classifies empty, short, replacement-heavy, and readable page extraction before the UI claims full-text availability.
- `src/context-composer.ts` creates a bounded API request from visible transcript, rolling session memory, and per-turn hidden paper evidence.
- `src/selection-limit-modal.ts` owns the one-turn oversized-selection decision and never persists its full-send override.
- `src/vault-lifecycle.ts` reconciles PDF rename/delete events without discarding retained discussions.
- `src/codex-cli.ts` owns native Codex CLI argument construction, JSONL parsing, direct PDF path prompts, and scoped child-process termination.
- `src/codex-session-manager.ts` owns background Codex turns, native thread IDs, pending-turn journals, throttled progress persistence, global/UI subscriptions, and session-safe result persistence.
- `src/multi-paper.ts` owns vault PDF search, ordinary API multi-paper context, and the advanced one-shot `debug-full` compatibility path.
- `src/actions.ts` registers typed `ResearchAction` implementations, while `src/translation.ts` owns the dedicated academic-translation pipeline.
- `src/evidence.ts` parses conservative paper citations and opens only validated vault PDF pages; `src/research-notes.ts` builds sanitized reading notes and serializes vault writes.
- `src/session-library.ts` and `src/session-library-modal.ts` own discussion search, organization, export, source rebinding, deletion guards, and explicit Codex fork recovery.
- `src/research-capabilities.ts` defines the provider-neutral, credential-blind `ResearchCapabilityRegistry` contract for optional external research services.
- `src/json-store.ts` provides validated atomic replace and backup recovery on Obsidian's adapter.
- `src/session-repository.ts` and `src/paper-asset-repository.ts` store independent session and paper entities plus small indexes.
- `src/reader-data-migration.ts` checkpoints the legacy migration; `src/reader-data-store.ts` hydrates compatibility maps, synchronizes changed entities, enforces cache quota, and produces small settings snapshots.
- `src/conversation.ts`, `src/settings.ts`, and `src/default-settings.ts` own normalized runtime state, settings migration, and safe empty defaults.

## Context flow

The paper service should extract once, cache by document identity and modification time, then fan out the same context to summary, full-text, and RAG consumers. `PaperContext` carries the active file, selection, and conversation identity. UI actions produce typed requests; `LlmRequest` carries messages, the selected model profile, cancellation, streaming callbacks, and bounded overrides. A `ResearchAction` invokes a focused service operation instead of reaching into modal internals.

This separation keeps extraction, retrieval, model transport, conversations, and UI independently testable. Local `data.json` and `reader-data/` are persistence, not release artifacts.

## Layered reader storage

`data.json` remains the local plaintext settings authority for API credentials, endpoints, model profiles, prompt history, active-session routing, and cache limits. Large reader state lives beside it under `reader-data/`: session transcripts use one validated JSON entity per discussion, while summaries and RAG chunks use one regenerable paper entity per vault-relative PDF path. Index files contain only lookup metadata.

Migration follows write → read-back validation → settings checkpoint → complete-meta ordering. The sanitized migration backup contains reader state only, never model profiles, endpoints, prompts, or credentials. Atomic writes rotate a validated primary to `.bak`; failure before the final settings checkpoint leaves legacy maps available. Cache quota eviction is deterministic LRU, protects the active PDF, and applies only to regenerable paper entities. Sessions and evidence are never quota-evicted.

Normal API context is assembled per turn rather than accumulated in model history. The persisted transcript and `PDFChatModal.messages` contain only visible user/assistant content. Current full text, BM25 evidence, and referenced-paper material are hidden request payloads; `composeBoundedContext` reserves the current question, keeps recent complete turns, and uses a low-temperature summary-model call only when older visible turns must be omitted. The resulting request has a hard character budget, while the transcript remains lossless and exportable.

PDF extraction quality is stored beside summary and chunk cache entries. Poor extraction never activates automatic full-text mode. Users can still refresh/query available chunks, ask Codex to read the original PDF directly, or apply external OCR. Vault rename reconciliation updates session keys, references, active mappings, and caches; delete reconciliation removes only regenerable caches and marks retained sessions as missing-source records.

## Native Codex session boundary

The default Codex path is deliberately small:

- The first turn runs persistent `codex exec` in the current PDF's parent folder and records `thread.started.thread_id`.
- Later turns run `codex exec resume <threadId>` so Codex retains its native conversation context without an idle background process.
- Each turn sends only the user's question, explicitly attached PDF paths, and the selected passage when enabled. A greeting does not require PDF reading.
- `CodexSessionManager` outlives individual modals. Esc removes only the UI subscriber; X aborts the current turn and marks the plugin session closed. Completed background results are appended by exact session ID, never by whichever modal happens to be open. A persisted pending-turn journal lets startup migration mark abandoned work as interrupted without storing selected text or absolute paths.
- Normal API chat may still use summaries and local retrieval for referenced PDFs, but `@PDF` means “attach this paper,” not “force a comparison.”
- Each installation has a random persisted identity. A session with a native thread owned by another installation cannot be resumed silently. The session library offers history-only viewing or an explicit local fork with a fresh native thread, a parent-session link, available relative PDF paths, rolling memory, and the newest visible turns that fit the handoff budget.

Absolute paths exist only in the in-memory Codex prompt. `data.json` stores the native thread ID, model choice, relative PDF paths, and visible transcript; it never stores absolute PDF paths or selected text. Codex must not receive plugin runtime data such as `data.json`, API keys, endpoints, or private model profiles. The old extracted-text package remains available only through the explicit advanced `debug-full` path.

## Evidence and research artifacts

Evidence is message metadata, not a claim of truth. `src/evidence.ts` assigns `located` only when an alias resolves to a selected PDF and a positive page is within any known page bound. Unknown, stale, or rebound citations remain `unverified`. Opening a source uses an Obsidian PDF page subpath and refuses missing files.

Research notes and session exports are projections of visible content. They can contain vault-relative PDF links and validated evidence, but not system prompts, automatic full text, RAG wrappers, absolute paths, model endpoints, or credentials. Per-path write queues preserve the previous note if an append fails. Source rebinding retains historical prose while invalidating old evidence locations.

## Future integrations

Related-paper discovery and PPT generation should be implemented through explicit external adapters and asynchronous jobs. `ResearchCapabilityRegistry` starts empty, so no unavailable UI is rendered. Its credential-blind request projection accepts only selected vault-relative papers, located evidence, and visible answers; it rejects settings, credentials, endpoints, absolute paths, and traversal before provider code runs. Adapters then exchange typed inputs and outputs with `ResearchAction` implementations. Do not bundle Python environments, browser automation, presentation renderers, or provider-specific job engines into the Obsidian plugin bundle.

The workbench direction is inspired by [Microsoft ResearchStudio](https://github.com/microsoft/ResearchStudio). PDF Chat credits that product-level design inspiration but does not copy its implementation.
