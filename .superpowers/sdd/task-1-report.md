# Task 1 Report: TypeScript/esbuild migration and modular architecture

## RED evidence

- Command: `node --test tests\build-contract.test.js`
- Expected failure: 0 passed, 1 failed. The assertion reported `expected package.json to define the build contract`, proving the TypeScript/esbuild source and build contract did not yet exist.
- Parity regression command: `node --test --test-name-pattern="translate compatibility action" tests\conversation-persistence.test.js`
- Expected failure: the empty saved translation prompt submitted `null` instead of falling back to the historical default instruction.
- Transport regression command: `node --test --test-name-pattern="non-streaming transport" tests\conversation-persistence.test.js`
- Expected failure: invalid response JSON leaked `Error: invalid JSON` instead of preserving the endpoint's `gateway down` error text.

## Implementation summary and module map

The plugin now follows the official Obsidian TypeScript/esbuild release shape: `src/main.ts` is bundled to one root CommonJS `main.js`, with `obsidian` external. Runtime/release files remain `main.js`, `manifest.json`, and `styles.css`; the manifest remains at version 0.4.0.

- `src/main.ts`: plugin lifecycle, commands/hotkeys, compatibility wrappers, and dependency assembly.
- `src/types.ts`: typed `LlmRequest`, `PaperContext`, `ResearchAction`, message, model, conversation, and PDF context contracts.
- `src/default-settings.ts`: unchanged public defaults, including empty endpoint/API key/model credentials.
- `src/settings.ts`: default merge, legacy credential migration, conversation migration, and serialized save queue.
- `src/conversation.ts`: selection normalization/hash, persisted-history normalization, conversation keys, and `ConversationStore`.
- `src/llm-transport.ts`: OpenAI-compatible non-streaming transport, SSE stream parsing, abort handling, and endpoint error normalization.
- `src/paper-context.ts`: active PDF selection, pdf.js extraction, summary/cache service, RAG chunk/cache service, query planning, BM25 retrieval, and neighbor expansion.
- `src/actions.ts`: typed action registry extension seam and current translate compatibility action.
- `src/modal-services.ts`: production/compatibility service adapters injected into the modal.
- `src/pdf-chat-modal.ts`: chat UI and orchestration only; it calls injected conversation, paper, LLM, model, and action services.
- `src/settings-tab.ts`: settings UI with the existing fields and behavior.
- `esbuild.config.mjs`, `tsconfig.json`, `package.json`, `package-lock.json`: reproducible development, build, typecheck, and test tooling.
- `tests/build-contract.test.js`: build/module contract test.
- `tests/conversation-persistence.test.js`: all 15 existing assertions now load the built bundle's legitimate exports; two parity regressions were added.

## GREEN and full verification

- `npm run build`: passed; emitted root CommonJS `main.js` with `obsidian` external.
- `npm run typecheck`: passed with 0 TypeScript errors.
- `npm test`: passed 18/18 tests, 0 failures.
- `node --check main.js`: passed with no syntax errors.
- `git diff --check`: passed; only Git's existing Windows LF-to-CRLF notices were printed.

## Files changed

- Modified: `main.js`, `tests/conversation-persistence.test.js`.
- Added: `esbuild.config.mjs`, `package.json`, `package-lock.json`, `tsconfig.json`, `tests/build-contract.test.js`.
- Added source modules: `src/actions.ts`, `src/conversation.ts`, `src/default-settings.ts`, `src/llm-transport.ts`, `src/main.ts`, `src/modal-services.ts`, `src/paper-context.ts`, `src/pdf-chat-modal.ts`, `src/settings.ts`, `src/settings-tab.ts`, `src/types.ts`.
- Added report: `.superpowers/sdd/task-1-report.md`.

## Self-review findings and concerns

- Confirmed no release metadata, README, stylesheet, layout semantics, or installed/private plugin data changed.
- Confirmed default public endpoint, API key, and model credential fields remain empty.
- Confirmed `PDFChatModal` contains no HTTP parsing, persisted-history normalization, PDF extraction, or BM25 algorithm; these are reached only through injected service contracts.
- Confirmed old plugin methods remain as compatibility facades so existing tests and external call sites retain their behavior.
- The large behavior-preserving UI modules retain `// @ts-nocheck` while the new contracts, stores, transport, actions, and paper services are typechecked. This is a deliberate migration boundary, not a runtime concern, but future work can type the Obsidian DOM-extension-heavy UI internals incrementally.
- No blocking concerns found.

## Commit SHA

Implementation commit: `ed43ddec99521fd2b32944bd2f32d8050d40cb43` (`refactor: migrate PDF Chat to TypeScript modules`).

## Review-fix addendum

### Additional RED evidence

- Command: `node --test --test-name-pattern="without file-wide suppression" tests\build-contract.test.js`
- Expected failure: 0 passed, 1 failed; the contract listed all five suppressed files: `default-settings.ts`, `main.ts`, `modal-services.ts`, `pdf-chat-modal.ts`, and `settings-tab.ts`.
- Command: `node --test --test-name-pattern="complete LlmRequest contract" tests\conversation-persistence.test.js`
- Expected failure: 0 passed, 1 failed; the compatibility service sent four positional legacy arguments instead of preserving the complete `LlmRequest`, dropping `stream` and `maxTokensOverride`.
- Command: `node --test --test-name-pattern="sole model shows a Notice" tests\conversation-persistence.test.js`
- Expected failure: 0 passed, 1 failed with `ReferenceError: Notice is not defined` when the sole model's delete handler ran.

### Fixes

- Removed every `@ts-nocheck` directive under `src/` without weakening `tsconfig.json`.
- Added explicit settings, cache, plugin, modal, injected service, Obsidian DOM element, PDF.js, request, and response types. No broad `any` remains under `src/`.
- Typed `createPDFChatModalServices` and preserved the complete `LlmRequest` through both the direct transport and legacy plugin facade paths, including `stream` and `maxTokensOverride`.
- Imported `Notice` in `settings-tab.ts`, so trying to delete the only model displays the existing notice and retains that model.
- Strengthened built-bundle tests to execute the injected LLM seam on both adapter paths and to exercise the real settings-tab delete handler, in addition to the source suppression contract.

### Additional GREEN and full verification

- Focused suppression contract: 1/1 passed.
- Focused LLM request forwarding and sole-model deletion regressions: 2/2 passed.
- `npm run typecheck`: passed with 0 errors and no file-wide suppressions.
- `npm run build`: passed.
- `npm test`: passed 21/21 tests, 0 failures.
- `node --check main.js`: passed.
- `git diff --check`: passed; only Git's Windows LF-to-CRLF notices were printed.

### Review self-check

- The earlier UI `@ts-nocheck` concern is resolved, not deferred.
- `rg -n "@ts-nocheck|\\bany\\b" src` returns no matches.
- Existing runtime behavior assertions remain intact; the only behavior correction is the missing sole-model deletion notice import.
- Release metadata, public default credentials, README, styles, installed plugin data, and private data were not changed.
- No remaining concerns found.

Review-fix commit: `d786e13c113799497f29d2708d7c78a780f095cc` (`fix: enforce typed PDF Chat service seams`).
