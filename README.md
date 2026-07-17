# Obsidian PDF Chat

Version 0.7.0 reconciles the typed research workbench with the quick-translation and model-routing behavior introduced in the live 0.6 release.

PDF Chat turns an Obsidian PDF view into a compact research workbench. Select paper text, open the workbench, and ask questions without leaving the document. User and assistant messages are selectable and copyable, and the most recent conversation is restored per-PDF.

## Research workflow

- Chat about the current selection with streaming responses and follow-up questions.
- Run dedicated one-click academic translation on the selected passage.
- Use the PDF-only quick-translate marker beside a non-empty selection to open a fresh modal and translate immediately.
- Generate or reuse a paper summary for compact global context.
- Read shorter papers in full or use local BM25 RAG for long-paper retrieval.
- Switch model profiles and research prompts from the workbench.
- Choose an independent translation model and continue model. Empty choices automatically prefer DeepSeek and GLM profiles, respectively, before falling back to the active model.
- Stop an in-progress response, clear the current conversation, and resize or move the modal.

The plugin registers commands for a fresh conversation and for continuing the saved conversation. Their default shortcuts are `Ctrl/Cmd + Alt + Q` and `Ctrl/Cmd + Q`, respectively. Translation is available to immediate follow-up questions in the open modal, while separate translation history prevents it from replacing the academic chat restored by the continue command.

## Manual installation

Copy exactly these three release files into `<vault>/.obsidian/plugins/pdf-chat/`:

- `main.js`
- `manifest.json`
- `styles.css`

Restart Obsidian or reload community plugins, then enable **PDF Chat**. Do not distribute `data.json` with those files.

## Model configuration and local data

Configure your own API keys, endpoints, and model profiles in **Settings → PDF Chat**. Public endpoint, API-key, and model defaults are empty; the project does not ship a credential or private provider configuration.

Obsidian stores API keys, endpoints, model profiles, summaries, retrieval caches, chat history, and separate translation history as local plaintext in the ignored `data.json` file. Never commit or share it. If a former locally hardcoded `main.js` was shared outside a trusted machine, rotate those provider keys before using them again.

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
