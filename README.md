# Obsidian PDF Chat

Version 0.7.1 refines the research workbench visual hierarchy and adds a lightweight Codex-like paper terminal inside Obsidian.

PDF Chat turns an Obsidian PDF view into a compact research workbench. Select paper text, open the workbench, and ask questions without leaving the document. User and assistant messages are selectable and copyable, and the most recent conversation is restored per-PDF.

## Research workflow

- Chat about the current selection with streaming responses and follow-up questions.
- Run dedicated one-click academic translation from the quick-translate marker or a translation modal.
- Use the PDF-only quick-translate marker beside a non-empty selection to open a fresh modal and translate immediately.
- Generate or reuse a paper summary for compact global context.
- Read shorter papers in full or use local BM25 RAG for long-paper retrieval.
- Type `@` in the composer to search vault PDFs and attach up to three referenced papers to the current question.
- Type `/codex` to enter CODEX MODE, then ask questions that make Codex CLI read the current paper and any `@` referenced PDFs from a temporary analysis package.
- Use `/model`, `/status`, `/help`, `/new`, `/resume`, and `/exit` in the composer; `ArrowUp`/`ArrowDown` restores recent prompts like a terminal.
- Switch model profiles and research prompts from the workbench.
- Choose an independent translation model and continue model. Empty choices automatically prefer DeepSeek and GLM profiles, respectively, before falling back to the active model.
- Stop an in-progress response, clear the current conversation, and resize or move the modal.

The plugin registers commands for a fresh conversation and for continuing the saved conversation. Their default shortcuts are `Ctrl/Cmd + Alt + Q` and `Ctrl/Cmd + Q`, respectively. Translation is available to immediate follow-up questions in the open modal, while separate translation history prevents it from replacing the academic chat restored by the continue command.

## Multi-PDF and Codex deep analysis

Open PDF Chat from a PDF, type `@` in the composer, and choose other PDFs in the same vault. The first version supports the current PDF plus up to three referenced PDFs.

There are two reading paths:

- **Normal API chat** uses the plugin's configured chat model and API key. When referenced PDFs are present, it prepares summaries and local BM25 evidence snippets as shared reading context; it does not force a comparison unless your question asks for one.
- **CODEX MODE** is entered with `/codex`. The plugin shows a persistent `CODEX MODE · model · effort` badge, creates a one-time temporary folder like `pdf-chat-analysis-*` with `manifest.json`, `question.md`, `output.schema.json`, and per-paper assets under `papers/`, then runs `codex exec --sandbox read-only --ephemeral --cd <analysis-dir> --output-schema output.schema.json --output-last-message codex-output.json ...`.

Codex defaults to `gpt-5.6-sol` with `model_reasoning_effort="xhigh"` and `model_verbosity="high"`. If your account or model access does not support that effort level, use `/model gpt-5.6-sol high` or the settings page to downgrade.

The Codex package contains paper text and the user question only. It does not copy plugin source, `.env`, `data.json`, API keys, model endpoints, or local model profiles. Unless **Keep Codex temporary analysis package** is enabled for debugging, the temporary folder is removed after the task. If Codex is not installed or cannot start, the modal clearly marks the assistant response as a PDF Chat API fallback.

## Manual installation

Copy exactly these three release files into `<vault>/.obsidian/plugins/pdf-chat/`:

- `main.js`
- `manifest.json`
- `styles.css`

Restart Obsidian or reload community plugins, then enable **PDF Chat**. Do not distribute `data.json` with those files.

## Model configuration and local data

Configure your own API keys, endpoints, and model profiles in **Settings → PDF Chat**. Public endpoint, API-key, and model defaults are empty; the project does not ship a credential or private provider configuration.

Obsidian stores API keys, endpoints, model profiles, summaries, retrieval caches, prompt history, resumable chat sessions, and separate translation history as local plaintext in the ignored `data.json` file. Never commit or share it. If a former locally hardcoded `main.js` was shared outside a trusted machine, rotate those provider keys before using them again.

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

The repository root is the single source for local deployment. The deploy command validates the target manifest, creates an external backup, copies only the three release files, verifies their SHA-256 hashes, and confirms that an existing target `data.json` did not change. You can provide the target with `PDF_CHAT_PLUGIN_DIR` instead of `--target`.

See [Architecture](docs/architecture.md) for module boundaries and extension guidance.

## License

MIT
