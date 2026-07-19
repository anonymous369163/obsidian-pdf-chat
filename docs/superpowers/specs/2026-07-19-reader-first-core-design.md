# PDF Chat Reader-First Core Product Design

**Status:** Approved design

**Target releases:** 0.8.2, 0.8.3, and 0.9.0

## Goal

Turn the verified 0.8.1 plugin into a durable literature-reading workspace. A researcher must be able to reorganize a vault, sustain long discussions, return to evidence, save research notes, manage accumulated sessions, and recover synced Codex work on another device without losing local privacy or exposing credentials in the public repository.

## Scope

This delivery includes:

- Vault-aware PDF rename, move, delete, and source-rebind behavior.
- Correct cross-PDF session activation persistence.
- Bounded API context with rolling session memory.
- Layered JSON persistence for sessions, Codex task journals, and paper caches.
- Cache quotas, corruption recovery, and extraction-quality warnings.
- Stable message identities, evidence records, PDF page navigation, and Obsidian research-note capture.
- A searchable session library with rename, pin, tags, archive, export, delete, and source rebinding.
- Explicit cross-device Codex recovery by forking a new local native thread.
- Provider-neutral extension interfaces for related-paper search and presentation generation.

Live online-paper providers and real PPT generation are not bundled in this delivery. Their UI remains hidden until an adapter is registered.

## Product Principles

1. Visible research history is durable; regenerable caches are disposable.
2. No action silently deletes a session, evidence record, or research note.
3. Context sent to a model is explicit, bounded, and distinguishable from the visible transcript.
4. Located evidence must identify a known PDF and valid page; uncertain citations remain visibly unverified.
5. Codex CLI uses its own authentication. Plugin API credentials never enter Codex prompts, research notes, public source, or release artifacts.
6. The workbench remains visually restrained. New actions live in message footers, contextual menus, or dedicated library modals instead of a larger permanent toolbar.
7. Migration is checkpointed and recoverable. Existing 0.8.1 data remains readable until the new stores validate successfully.

## Architecture

The plugin keeps the existing TypeScript, esbuild, Obsidian DOM API, and three-file release model. New responsibilities are introduced behind focused services:

```text
PDFChatPlugin
  ├─ SettingsStore                  data.json only
  ├─ ReaderDataStore
  │    ├─ SessionRepository         transcript, evidence, Codex task journal
  │    └─ PaperAssetRepository      summary, chunks, extraction metadata
  ├─ VaultLifecycleService          rename/delete/rebind reconciliation
  ├─ ContextComposer                bounded API request construction
  ├─ EvidenceService                citation parsing, validation, page opening
  ├─ ResearchNoteService            sanitized Markdown append/export
  ├─ CodexSessionManager            existing native thread lifecycle
  ├─ SessionLibraryModal            long-term session management
  └─ ResearchCapabilityRegistry     future search/PPT adapters
```

`PDFChatModal` remains the interaction coordinator but no longer owns persistence layout, API context compaction, evidence parsing, or note serialization.

## Layered Persistence

### File layout

The plugin stores local runtime data beneath its installed plugin directory:

```text
pdf-chat/
  data.json
  reader-data/
    meta.json
    sessions/
      index.json
      session-<id>.json
    papers/
      index.json
      paper-<hash>.json
    migrations/
      legacy-0.8.1.json
```

`data.json` retains settings, model profiles, API keys, prompt presets, UI preferences, the installation ID, and a `readerDataVersion` marker. It no longer carries session transcripts, Codex pending turns, summaries, or RAG chunks after migration succeeds.

Each repository has a serialized write queue. Entity files are written to a sibling temporary file, parsed back, validated, and atomically renamed over the destination. The index is updated only after the entity write succeeds. A failed write leaves the prior entity and index intact.

### Migration

On first 0.8.3 startup:

1. Load and normalize the legacy `data.json` without mutating it.
2. Write a migration snapshot containing only legacy conversations, sessions, summaries, chunks, and active-session mappings. It must not contain model profiles, endpoints, API keys, or prompt text.
3. Write every normalized session and paper asset to the new repositories.
4. Re-read and validate the new indexes and entity files.
5. Save `data.json` with `readerDataVersion: 1` and remove only the migrated large fields.
6. On the next successful startup, mark the migration snapshot as recoverable backup. The settings page exposes an explicit cleanup action; it is never silently deleted during migration.

If any step before step 5 fails, the plugin continues using legacy in-memory data for that run and reports a retryable migration error. It does not clear legacy fields.

### Storage limits

Sessions, evidence, and research notes have no automatic age-based deletion. Paper caches are regenerable and use least-recently-used eviction. Defaults are 100 cached papers and 100 MiB of serialized cache data. The settings page displays current usage and offers `Clear regenerable cache`; it never combines that action with session deletion.

## Vault Lifecycle

`VaultLifecycleService` subscribes to Obsidian `vault.on('rename')` and `vault.on('delete')`.

For a PDF rename or move, it updates:

- The session `conversationKey` for sessions whose primary source matches the old path.
- Active-session mappings.
- Referenced PDF paths in every affected session.
- Paper asset paths and indexes.
- Evidence source paths.

The migration is idempotent. If the destination already has sessions, both sets remain separate and the active session is selected by the newest `updatedAt`; no transcripts are merged automatically.

For PDF deletion, its regenerable paper cache is removed. Sessions and evidence remain, with `sourceStatus: "missing"`. They are viewable, searchable, exportable, and eligible for source rebinding.

Rebinding lets the user select an existing vault PDF. It updates the primary source and evidence paths only after confirmation. It does not rewrite historical answer text or claim that an old page citation was verified against the replacement; evidence becomes `unverified` until the user validates it again.

Cross-PDF resume persists session reactivation before opening the target file. Opening failure leaves the current modal intact and the session available in the library.

## Bounded Model Context

The visible transcript and the model request are separate data structures. Hidden full-text or RAG payloads never enter persisted messages.

`ContextComposer` builds API requests in this order:

1. Current system/preset prompt.
2. Current paper summary, selection, full-text, or RAG material selected for this turn.
3. The session rolling memory, if one exists.
4. The newest complete visible turns that fit the configured budget.
5. The current user question.

The default approximate input budget is 60,000 characters with at least the latest six visible turns retained. This heuristic avoids a tokenizer dependency and is configurable in advanced settings.

When older turns no longer fit, the configured summary model creates a rolling memory that records covered message IDs. The memory is stored in the session and replaced only after the new summary succeeds. If summarization fails or no API model is configured, the request uses the newest fitting turns and shows a non-blocking `Earlier turns were omitted from this request` notice. The full visible transcript remains unchanged.

Codex native sessions continue to use Codex thread memory. The plugin sends only the current question, explicitly attached PDF paths, and an optional current selection. It never resends the plugin transcript on normal native resume turns.

Selections above 20,000 characters are not silently truncated. Before sending, the user chooses `Send all once`, `Send first 20,000 characters`, or `Cancel and select a smaller passage`. The chosen override applies only to that turn.

## PDF Extraction Quality

The API summary/RAG path retains PDF.js extraction but records an `ExtractionQualityReport`:

- Total pages and extracted characters.
- Empty-page ratio.
- Replacement/control-character ratio.
- Extremely short-page ratio.
- Quality: `good`, `mixed`, or `poor`.

A poor report prevents automatic claims that full-text context is available. The context panel displays `Text extraction poor` and recommends direct Codex PDF reading or external OCR. This release detects and explains scanned/layout-heavy failures; it does not bundle an OCR engine.

## Messages and Evidence

Conversation messages migrate to version 3 fields:

```ts
interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "complete" | "stopped";
  createdAt: number;
  evidence?: ResearchEvidence[];
}

interface ResearchEvidence {
  id: string;
  paperPath: string;
  page?: number;
  claim?: string;
  quote?: string;
  verification: "located" | "unverified";
  savedNotePath?: string;
}
```

Legacy messages receive deterministic IDs based on session ID, original index, role, and content hash. Existing ordering and visible content do not change.

For normal API multi-paper/RAG requests, source blocks receive stable paper aliases and page numbers. The prompt requests citations such as `[P1, p.7]`. For Codex, the prompt requests Obsidian PDF links such as `[[papers/paper-a.pdf#page=7|paper-a.pdf · p.7]]` when evidence is available.

`EvidenceService` accepts citations only when they resolve to a PDF attached to that turn or already recorded in the session. A page is `located` only when it is a positive integer and does not exceed the known page count when page count is available. Other citation-like text remains part of the Markdown answer but is presented as unverified evidence if the user chooses to save it.

The assistant message footer shows a compact evidence count, `Save answer`, and `Copy`. Evidence details are collapsed by default. `Open page` uses Obsidian's PDF link navigation. Missing files produce a safe notice rather than opening an unrelated file.

## Research Notes

`ResearchNoteService` appends sanitized Markdown to a configurable folder, defaulting to `PDF Chat/Reading Notes/`.

- Single-paper turns append to one note per primary PDF.
- Multi-paper turns append to `Synthesis.md` unless the user selects another note.
- Each saved block includes the question, chosen answer text, verified PDF links, session ID, generation mode/model, and timestamp.
- The full selected passage is opt-in. By default the note stores the source PDF, character count, and a stable selection hash.
- Hidden prompts, RAG wrappers, full-text payloads, endpoints, API keys, bearer tokens, Codex absolute paths, and internal task journals are never serialized into notes.

Note writes are queued per note path. A failed note append leaves the chat and evidence record intact and exposes a retry action.

## Session Library

`/resume` and the workbench More menu open `SessionLibraryModal`. It supports:

- Full-text search across title, primary PDF path, referenced PDF paths, and tags.
- Filters for current/all papers, Codex/API mode, archived state, and updated date.
- Rename, pin/unpin, tag editing, archive/reactivate, Markdown export, delete, and source rebind.
- Clear visual treatment for running tasks, missing sources, closed Codex threads, and cross-device threads.

Pinned sessions sort first, then by `updatedAt`. Archived sessions are excluded from Ctrl+Q automatic continuation. Deleting requires confirmation, refuses while a Codex turn is running, and removes only the session entity/index entry. It never deletes PDFs or research notes.

Markdown export includes visible transcript, evidence links, session metadata, and parent/fork relationships. It excludes hidden contexts and private model configuration.

## Cross-Device Codex Recovery

Each plugin installation generates a random UUID `installationId`. It is not derived from a machine name, username, or path. A Codex session stores the originating installation ID beside its native thread ID.

When a synced session originates elsewhere, or exact native resume reports a missing thread, the transcript remains viewable. The UI offers `View history` and `Create local fork`; it never silently creates a replacement thread.

Creating a local fork:

1. Creates a new plugin session with `parentSessionId` and a new local Codex lifecycle.
2. Preserves the parent session unchanged.
3. Builds a bounded, visible handoff from the rolling session memory plus the newest turns.
4. Lists the currently available attached PDFs and omits missing files.
5. Shows the handoff size and attachments before the first local turn is sent.
6. Starts a fresh native Codex thread and records the current installation ID.

The fork title is prefixed with `Fork:` until the user renames it. Parent and child remain navigable from the session library.

## Extension Boundaries

The core exposes provider-neutral interfaces:

```ts
interface RelatedPaperSearchAdapter {
  id: string;
  isAvailable(): Promise<boolean>;
  search(request: RelatedPaperSearchRequest): Promise<RelatedPaperResult[]>;
}

interface PresentationGeneratorAdapter {
  id: string;
  isAvailable(): Promise<boolean>;
  generate(request: PresentationRequest): Promise<PresentationArtifact>;
}
```

Adapters receive only user-selected paper references, evidence records, and visible answer text. They cannot access `PDFChatSettings`, model credentials, raw `data.json`, or unrelated vault contents. No search or presentation controls appear when no adapter is available.

## Error Handling and Privacy

- Migration, entity, index, and note errors are reported independently and remain retryable.
- Corrupt JSON falls back to the last validated sibling backup; it never becomes an empty store without a visible warning.
- Error messages and logs redact authorization headers, API keys, bearer tokens, endpoints containing credentials, full hidden prompts, and absolute filesystem paths.
- Codex PDF paths remain in-memory only. Whenever possible the prompt uses paths relative to the Codex working directory to avoid disclosing local directory structure.
- Removing an attached PDF affects future prompts only. The UI explains that an existing Codex thread may remember previously read content and recommends `/new` for a clean knowledge boundary.
- `reader-data` and all local JSON files are excluded from Git and release staging. Secret scanning rejects accidental tracked copies.

## Release and Verification Strategy

### 0.8.2 — Reliability

- Vault rename/delete reconciliation.
- Correct cross-PDF resume persistence.
- Bounded API context and selection-size decisions.
- Extraction-quality reports and warnings.

### 0.8.3 — Storage

- Layered repositories and checkpointed migration.
- Atomic entity writes, corruption fallback, usage reporting, and cache quotas.

### 0.9.0 — Reader workflow

- Evidence cards and PDF page navigation.
- Research-note capture and Markdown export.
- Full session library.
- Cross-device Codex forks.
- Provider-neutral search and presentation adapter contracts.

Automated tests cover legacy migration, interrupted migration, atomic replacement, corrupt-file recovery, rename collisions, delete/rebind behavior, 100-plus-turn context budgeting, summary failure, extraction quality, citation validation, note sanitization, every session action, missing/running session constraints, local Codex forks, adapter capability hiding, accessibility, secret scanning, and release contents.

Manual acceptance covers light/dark themes, narrow workbench layout, real PDF page navigation, scanned and two-column PDFs, Obsidian restart, vault rename/delete, Obsidian Sync between two installations, real Codex native resume/fork, and local deployment with existing `data.json` preserved.

Every release must pass TypeScript checking, production build, all Node tests, secret scan, release metadata validation, whitespace checks, and deployment SHA-256 verification. Public release artifacts remain exactly `main.js`, `manifest.json`, and `styles.css`.
