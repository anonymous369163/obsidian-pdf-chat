# Obsidian PDF Chat

Version 0.8.3 adds layered storage for long-term reading. Small private settings remain in `data.json`, while resumable discussions and regenerable paper assets use atomic per-entity JSON under `reader-data/`. A checkpointed migration validates every entity before shrinking legacy settings and keeps a sanitized migration backup for explicit recovery.

PDF Chat turns an Obsidian PDF view into a compact research workbench. Select paper text, open the workbench, and ask questions without leaving the document. User and assistant messages are selectable and copyable, and the most recent conversation is restored per-PDF.

## Research workflow

- Chat about the current selection with streaming responses and follow-up questions.
- Run dedicated one-click academic translation from the quick-translate marker or a translation modal.
- Use the PDF-only quick-translate marker beside a non-empty selection to open a fresh modal and translate immediately.
- Generate or reuse a paper summary for compact global context.
- Read shorter papers in full or use local BM25 RAG for long-paper retrieval.
- Keep long normal-API discussions responsive with bounded context: recent complete turns stay verbatim, older visible discussion is compressed into local rolling memory, and hidden PDF/RAG payloads never enter the saved transcript.
- Continue the same discussion after a PDF rename. Deleting a PDF removes only regenerable summary/RAG caches while retaining its transcript as a missing-source session.
- Choose what to do with an oversized selection: send it once in full, send only the configured prefix, or cancel without starting an API/Codex request.
- Use extraction quality status to spot empty, scanned, or corrupted PDF text. Poor extraction disables automatic full-text mode and recommends Codex direct-PDF reading or OCR while leaving manual RAG available.
- Keep large libraries responsive with a cache quota (100 papers / 100 MiB by default). LRU cleanup removes only regenerable summaries and RAG indexes, protects the active paper, and never evicts sessions or answers.
- Type `@` in the composer to search vault PDFs and attach up to three referenced papers to the current question. The candidate list supports ArrowUp/ArrowDown, Enter, Tab, and Escape.
- Type `/codex` to enter CODEX MODE. The current PDF is attached by default, referenced PDFs can be added with `@`, and each chip can be removed before the next turn.
- Use `/refs`, `/unref <name-or-number>`, or `/clearrefs` to remove PDFs referenced by the current discussion.
- Use the selected-context composer toggle or `/context on|off` to decide whether the currently selected passage is included in the next Codex prompt.
- Use `/model`, `/status`, `/help`, `/stop`, `/new`, `/resume`, `/tasks`, and `/exit` in the composer. `/resume` and `/tasks` open searchable Obsidian pickers.
- `ArrowUp`/`ArrowDown` restores recent prompts like a terminal while preserving the unfinished draft and respecting multiline caret position.
- Use `/doctor` for a free local Codex command/version check. `/doctor real` asks for confirmation before making two real model calls that verify a fresh native thread and `resume`.
- Switch model profiles and research prompts from the workbench.
- Choose an independent translation model and continue model. Empty choices automatically prefer DeepSeek and GLM profiles, respectively, before falling back to the active model.
- Stop an in-progress response, clear the current conversation, and resize or move the modal.

The plugin registers commands for a fresh conversation and for continuing the saved conversation. Their default shortcuts are `Ctrl/Cmd + Alt + Q` and `Ctrl/Cmd + Q`, respectively. Translation is available to immediate follow-up questions in the open modal, while separate translation history prevents it from replacing the academic chat restored by the continue command.

## Multi-PDF and Codex deep analysis

Open PDF Chat from a PDF, type `@` in the composer, and choose other PDFs in the same vault. The first version supports the current PDF plus up to three referenced PDFs.

There are two reading paths:

- **Normal API chat** uses the plugin's configured chat model and API key. When referenced PDFs are present, it prepares summaries and local BM25 evidence snippets as shared reading context; it does not force a comparison unless your question asks for one.
- **CODEX MODE** is entered with `/codex`. The plugin shows a persistent `CODEX MODE / model / effort / thread` badge. The first turn runs `codex exec` from the current PDF's folder and stores the native Codex thread ID. Later turns in the same session run `codex exec resume <threadId>` so Codex keeps the conversation context.

Only the explicit `/codex` command switches into CODEX MODE. Words such as “深度分析” in a normal question do not silently change models or start Codex CLI.

Codex defaults to `gpt-5.5` with `model_reasoning_effort="medium"` and `model_verbosity="medium"` for a faster first pass. Use `/model gpt-5.5 high` or `/model gpt-5.6-sol xhigh` when a task needs deeper reasoning and you can tolerate longer runtime.

Deep xhigh runs can be slow. The default Codex timeout is 30 minutes, and older local settings that still contain the previous 10-minute default are migrated automatically. While Codex is running, the modal shows elapsed time, the requested model, the native thread status, and sanitized CLI progress events from `codex exec --json`; hidden model reasoning is not displayed.

Codex output defaults to **Markdown**. JSON schema output remains available in advanced settings for compatibility and debugging, but normal `/codex` answers are rendered and saved as the Markdown that Codex writes. When future features need structured fields for tables, slides, or evidence assets, the plugin can extract that structure on demand with the configured API model instead of constraining Codex's main answer.

The default Codex input mode is **direct PDF path**. The prompt contains only the user question, the current selected-context text when enabled, and the absolute paths of the attached PDFs for this turn:

- current PDF path, unless its chip was removed;
- up to three referenced PDF paths selected with `@`;
- selected passage text only when the selected-context toggle is enabled.

The prompt explicitly tells Codex to read PDFs only when the question needs paper evidence, so a simple greeting should not trigger PDF reading. By default, the plugin does not generate or pass a manifest file, question file, output schema, extracted full text, per-page Markdown, summaries, RAG chunks, briefs, extraction reports, or a package-local skill file to Codex. Advanced settings keep JSON schema and `debug-full` modes for troubleshooting, but native direct-PDF Markdown is the normal path.

Codex runs from the current PDF's local folder with a read-only sandbox. The plugin does not copy plugin source, `.env`, `data.json`, API keys, model endpoints, or local model profiles into Codex prompts. If Codex is not installed, cannot start, or its native thread exists only on another device, the modal reports that failure explicitly and does not silently replace the answer with an API model.

Esc closes only the PDF Chat modal; a running Codex turn continues in the background and can be reattached with `Ctrl/Cmd + Q`, even when no text is selected in the PDF. `/stop` stops only the current turn and keeps the native thread usable. The Obsidian modal close button stops the running turn and marks that Codex session closed, but its transcript and native thread ID remain visible through `/resume`.

Before a Codex child process starts, PDF Chat stores a small pending-turn journal containing the plugin session ID, relative PDF paths, thread ID when available, timestamps, and progress state. It does not store selected text or absolute paths in that journal. After a restart, abandoned work is shown as interrupted through `/tasks`. Background completion notifications name the original discussion, and `/retry-save` safely writes an already-generated answer again without duplicating the visible turn.

## Manual installation

Copy exactly these three release files into `<vault>/.obsidian/plugins/pdf-chat/`:

- `main.js`
- `manifest.json`
- `styles.css`

Restart Obsidian or reload community plugins, then enable **PDF Chat**. Do not distribute `data.json` or the local `reader-data/` directory with those files.

## Model configuration and local data

Configure your own API keys, endpoints, and model profiles in **Settings → PDF Chat**. Public endpoint, API-key, and model defaults are empty; the project does not ship a credential or private provider configuration.

Obsidian stores API keys, endpoints, model profiles, prompt history, and small routing settings as local plaintext in the ignored `data.json` file. Layered storage keeps resumable chat/Codex sessions in `reader-data/sessions/` and regenerable summaries/RAG indexes in `reader-data/papers/`; these JSON files are also local plaintext. Never commit or share `data.json` or `reader-data/`. If a former locally hardcoded `main.js` was shared outside a trusted machine, rotate those provider keys before using them again.

The first 0.8.3 start writes a sanitized migration backup at `reader-data/migration/legacy-reader-data.json`, then validates the new entities before removing large legacy maps from `data.json`. A failed migration falls back to the untouched legacy data for that run. Settings show cache usage, cache quota, an action that clears only regenerable paper assets, and a separate action for deleting the migration backup.

Synchronizing the full Obsidian vault (including `.obsidian/plugins/pdf-chat/data.json` and `.obsidian/plugins/pdf-chat/reader-data/`) restores plugin settings, transcripts, paper caches, and plugin session metadata on another machine. Native Codex thread bodies remain in that machine's Codex home, so a transcript is still readable after sync but `codex exec resume` may require a new thread. Downgrade warning: versions before 0.8.3 do not read layered `reader-data`; keep the migration backup or an external plugin-directory backup before downgrading.

For public forks and release branches, enable [GitHub Secret Scanning and Push Protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning) as an additional safeguard.

## Development

Install dependencies with `npm ci`. The supported commands are:

- `npm run dev` — watch and rebuild the root bundle.
- `npm run build` — create the production `main.js` bundle.
- `npm run typecheck` — run strict TypeScript checking.
- `npm test` — run the full Node test suite.
- `npm run scan:secrets` — scan tracked files and the root bundle with redacted diagnostics.
- `npm run verify` — typecheck, build, test, scan, validate release metadata and JavaScript syntax, and check diff whitespace.
- `npm run deploy:local -- --target <path>` — verify first, then deploy to an existing `pdf-chat` plugin directory.

The repository root is the single source for local deployment. The deploy command validates the target manifest, creates an external backup, copies only the three release files, verifies their SHA-256 hashes, and confirms byte-for-byte that existing `data.json` and `reader-data/` stayed unchanged. You can provide the target with `PDF_CHAT_PLUGIN_DIR` instead of `--target`.

See [Architecture](docs/architecture.md) for module boundaries and extension guidance.

## License

MIT
