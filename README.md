# Obsidian PDF Chat

Version 0.9.0 turns the durable reader state introduced in 0.8.3 into a navigable research workflow. Stable messages can carry validated paper evidence, useful answers can be appended to Obsidian reading notes, discussions are managed through a searchable session library, and Codex threads that belong to another installation can be recovered through an explicit local fork instead of an unsafe silent fallback.

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
- Use evidence verification on stable assistant answers. Located citations such as `[P1, p.7]` can open PDF page 7 directly; unknown aliases, invalid pages, and citations from a rebound source remain visibly unverified.
- Save a useful question/answer turn to sanitized Obsidian reading notes, copy it, or expand its evidence list from the compact assistant footer. Notes use vault-relative links and never include hidden prompts, RAG wrappers, absolute paths, endpoints, or credentials.
- Open the session library from the More menu or `/resume` to search visible discussions, rename, tag, pin, archive, export, delete, or restore them. Missing-source sessions support explicit source rebinding without pretending that old page evidence was revalidated.
- Type `@` in the composer to search vault PDFs and attach up to three referenced papers to the current question. The candidate list supports ArrowUp/ArrowDown, Enter, Tab, and Escape.
- Type `/codex` to enter CODEX MODE. The current PDF is attached by default, referenced PDFs can be added with `@`, and each chip can be removed before the next turn.
- Use `/refs`, `/unref <name-or-number>`, or `/clearrefs` to remove PDFs referenced by the current discussion.
- Use the selected-context composer toggle or `/context on|off` to decide whether the currently selected passage is included in the next Codex prompt.
- Use `/model`, `/status`, `/help`, `/stop`, `/new`, `/resume`, `/tasks`, and `/exit` in the composer. `/resume` opens the dedicated session library; `/tasks` opens the searchable background-task picker.
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

Every installation receives a random local installation identity. When a synced session points to a native Codex thread created on another installation, PDF Chat keeps the parent transcript readable and offers two explicit choices: view history or create a local fork. The fork starts a fresh local thread, links back to its parent session, carries only a bounded visible handoff, and omits referenced PDFs that are not present in the current vault. Its first prompt states that it is a fork and never claims to have resumed the unavailable native thread.

Esc closes only the PDF Chat modal; a running Codex turn continues in the background and can be reattached with `Ctrl/Cmd + Q`, even when no text is selected in the PDF. `/stop` stops only the current turn and keeps the native thread usable. The Obsidian modal close button stops the running turn and marks that Codex session closed, but its transcript and native thread ID remain visible through `/resume`.

Before a Codex child process starts, PDF Chat stores a small pending-turn journal containing the plugin session ID, relative PDF paths, thread ID when available, timestamps, and progress state. It does not store selected text or absolute paths in that journal. After a restart, abandoned work is shown as interrupted through `/tasks`. Background completion notifications name the original discussion, and `/retry-save` safely writes an already-generated answer again without duplicating the visible turn.

## Evidence, notes, and session library

Evidence parsing is conservative. A citation becomes `located` only when its paper alias resolves to a currently attached vault PDF and the page number is valid. The evidence footer stays collapsed by default, and **Open PDF page** is available only for a located citation. Source rebinding preserves the historical answer but marks old evidence unverified because a path change does not prove page equivalence.

**Save answer** appends visible user/assistant content to `PDF Chat/Reading Notes/<paper>.md`; multi-paper turns go to `Synthesis.md`. The optional selected passage is excluded by default. Session export writes visible Markdown to `PDF Chat/Exports/` without mutating the session. All note and export writes are serialized per path so retrying a failed write cannot partially overwrite an existing note.

The **session library** separates organization from deletion. Archive removes a discussion from automatic continuation but preserves it for later reactivation. Deleting a session never deletes its PDFs, reading notes, or exports, and deletion/archiving is blocked while that exact Codex task is running. Rebinding a missing source changes only the session's primary PDF path and evidence verification state.

## Optional research capabilities

Version 0.9.0 defines a provider-neutral `ResearchCapabilityRegistry` for future related-paper discovery and presentation generation. The public release registers no adapters and has **no built-in provider**, so unavailable controls remain hidden. Adapters receive a credential-blind projection containing only selected vault-relative paper metadata, located evidence, and user-visible answers. Runtime validation rejects plugin settings, endpoints, keys, tokens, secrets, absolute paths, and paths outside the vault before an adapter can run.

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

Synchronizing the full Obsidian vault (including `.obsidian/plugins/pdf-chat/data.json` and `.obsidian/plugins/pdf-chat/reader-data/`) restores plugin settings, transcripts, paper caches, and plugin session metadata on another machine. Native Codex thread bodies remain in that machine's Codex home, so a transcript is still readable after sync; 0.9.0 detects the foreign installation and offers a bounded local fork rather than attempting a false `codex exec resume`. Downgrade warning: versions before 0.8.3 do not read layered `reader-data`; keep the migration backup or an external plugin-directory backup before downgrading.

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
