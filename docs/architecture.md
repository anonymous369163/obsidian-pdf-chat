# Architecture

PDF Chat is a dependency-light Obsidian plugin organized around typed service boundaries. The production build bundles TypeScript into the root `main.js`; Obsidian remains an external runtime dependency.

## Subsystems

- `src/main.ts` owns plugin lifecycle, commands, settings persistence, and service composition.
- `src/pdf-chat-modal.ts`, `src/modal-ui.ts`, and `src/modal-services.ts` own the research-workbench presentation and coordinate actions without embedding transport or extraction logic.
- `src/llm-transport.ts` accepts a typed `LlmRequest` and isolates the OpenAI-compatible HTTP and streaming protocol.
- `src/paper-context.ts` creates typed `PaperContext` values, extracts PDF text, caches summaries/chunks, and performs local retrieval.
- `src/multi-paper.ts` owns vault PDF search, Codex analysis package creation, safe Codex CLI argument construction, process execution, and structured output parsing.
- `src/actions.ts` registers typed `ResearchAction` implementations, while `src/translation.ts` owns the dedicated academic-translation pipeline.
- `src/conversation.ts`, `src/settings.ts`, and `src/default-settings.ts` own local persistence, migration, and safe empty defaults.

## Context flow

The paper service should extract once, cache by document identity and modification time, then fan out the same context to summary, full-text, and RAG consumers. `PaperContext` carries the active file, selection, and conversation identity. UI actions produce typed requests; `LlmRequest` carries messages, the selected model profile, cancellation, streaming callbacks, and bounded overrides. A `ResearchAction` invokes a focused service operation instead of reaching into modal internals.

This separation keeps extraction, retrieval, model transport, conversations, and UI independently testable. Local `data.json` is persistence, not a release artifact.

## Multi-paper analysis boundary

The first multi-paper layer is intentionally two-tiered:

- Ordinary comparison stays inside the plugin and uses the configured OpenAI-compatible chat model. It passes summaries and retrieved chunks for the current PDF plus referenced PDFs.
- Codex deep analysis is an explicit external job. The plugin writes a temporary package containing `manifest.json`, `question.md`, `output.schema.json`, and per-paper assets (`summary.md`, `full_text.md`, `chunks.json`, page files, and metadata), then runs `codex exec` in read-only ephemeral mode with `--cd` pointing at that package.

Codex must not receive plugin runtime data such as `data.json`, API keys, endpoints, private model profiles, or the vault/plugin source tree. Referenced PDFs update only their summary/chunk caches; their conversation histories remain isolated from the current PDF's analysis result.

## Future integrations

Related-paper discovery and PPT generation should be implemented through explicit external adapters and asynchronous jobs. They should exchange typed inputs and outputs with `ResearchAction` implementations. Do not bundle Python environments, browser automation, presentation renderers, or provider-specific job engines into the Obsidian plugin bundle.

The workbench direction is inspired by [Microsoft ResearchStudio](https://github.com/microsoft/ResearchStudio). PDF Chat credits that product-level design inspiration but does not copy its implementation.
