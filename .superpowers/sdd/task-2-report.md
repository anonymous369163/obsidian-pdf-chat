# Task 2 Report: Dedicated academic translation pipeline

## Result

Implemented the dedicated academic translation pipeline on `feat/pdf-chat-0.5.0`.
Implementation commit: `68df715` (`feat: add dedicated academic translation pipeline`).

## RED evidence

Each required behavior was exercised before its production implementation.

1. Settings migration
   - Command: `npm run build; node --test --test-name-pattern="migrates legacy translation settings" tests/translation.test.js`
   - Expected RED: 0/1 passed; `TypeError: migrateSettings is not a function`.
   - Proved the typed nested defaults and legacy migration/export did not yet exist.

2. Isolated request construction
   - Command: `npm run build; node --test --test-name-pattern="constructs an isolated translation request" tests/translation.test.js`
   - Expected RED: 0/1 passed; `TypeError: TranslationService is not a constructor`.
   - Proved the dedicated service and isolated `LlmRequest` path did not yet exist.

3. Paragraph-aware chunking
   - Command: `npm run build; node --test --test-name-pattern="splits long translation sources" tests/translation.test.js`
   - Expected RED: 0/1 passed; `TypeError: splitTranslationChunks is not a function`.
   - Proved the 8,000-character splitter did not yet exist.

4. Sequential output
   - Command: `npm run build; node --test --test-name-pattern="translates chunks sequentially" tests/translation.test.js`
   - Expected RED: 0/1 passed; only the first of three source chunks was called instead of all chunks in order.
   - Proved multi-chunk execution and cumulative ordered output were not implemented.

5. Registered task routing
   - Command: `npm run build; node --test --test-name-pattern="registered translation action" tests/translation.test.js`
   - Expected RED: 0/1 passed; `TypeError: createResearchActionRegistry is not a function`.
   - Proved the dedicated registered action path did not yet exist.

6. Stopped/failed persistence
   - Command: `npm run build; node --test --test-name-pattern="persists partial aborted translation" tests/translation.test.js`
   - Expected RED: 0/1 passed; `TypeError: stopped.modal.runTranslation is not a function`.
   - Proved the modal had no dedicated translation lifecycle or partial-output persistence path.

7. Settings UI
   - Command: `node --test --test-name-pattern="settings UI binds target language" tests/translation.test.js`
   - Expected RED: 0/1 passed; the settings source had no `settings.translation.targetLanguage` binding and still referenced `settings.translatePrompt`.

An integration regression subsequently reproduced a service-composition defect: object-spreading a class-backed `TranslationService` discarded its prototype `translate` method. The existing modal regression failed with no LLM messages. The service seam was changed to an explicit typed forwarding method, after which the focused modal regression passed 1/1.

## Implementation details

- Added `TranslationSettings` with defaults:
  - `targetLanguage: "zh-CN"`
  - `temperature: 0.1`
  - `maxTokens: 4000`
  - `chunkChars: 8000`
  - `additionalInstruction: ""`
- Preserved the exact 0.4.0 prompt as a migration-only constant. A customized legacy value is copied verbatim to `additionalInstruction`; missing, blank, or exact-default values normalize to blank. The flat field is deleted from normalized settings.
- Added `splitTranslationChunks`, preferring paragraph, line, sentence, and whitespace boundaries before a hard split while preserving source order/content and enforcing the limit.
- Added a typed `TranslationService` that performs awaited sequential calls and combines translated chunks with paragraph separation.
- Added per-request `temperatureOverride` alongside the existing max-token override and applied both in streaming and non-streaming transport bodies.
- Added `ResearchActionRegistry`/`createResearchActionRegistry`; the modal action now invokes `runTranslation`, not generic `handleSubmit` compatibility behavior.
- Added the exact visible label `翻译当前选区（N 字）`, a single streamed assistant bubble, transient multi-chunk progress, complete/stopped persistence, and empty-output failure suppression.
- Replaced the old translation prompt setting with target-language and additional-instruction controls. No modal layout or CSS was changed.

## Request and data-flow proof

Flow:

`翻译 button -> ResearchActionRegistry.execute("translate") -> PDFChatModal.runTranslation() -> TranslationService.translate() -> LlmOperations.chat(LlmRequest)`

For each chunk, `TranslationService` constructs exactly two messages:

1. A translation-only system message containing the target language, faithful academic translation rule, paragraph preservation, and formula/code/variable/citation/figure-table preservation.
2. One user message containing that chunk once inside `<source_text>...</source_text>`, plus the optional additional instruction.

The request explicitly carries the selected model profile, streaming enabled, translation temperature, translation max tokens, and the modal abort signal. It is constructed from neither normal chat messages nor the generic system prompt, preset, restored history, summary, RAG chunks, or full PDF text.

Only the friendly visible label and translated output are appended to normal runtime chat messages and the persisted transcript. Internal translation messages and wrappers never enter either visible history. Partial output on abort/failure is stored as `stopped`; an empty abort/failure stores no transcript turn.

## GREEN and full verification

Focused GREEN results:

- Migration: 1/1 passed.
- Isolated request plus chunking: 2/2 passed.
- Sequential execution: 1/1 passed.
- Registered action plus stopped/failed persistence: 2/2 passed.
- Settings UI: 1/1 passed.
- Complete one-bubble/progress cleanup path: 1/1 passed.
- Modal composition regression: 1/1 passed.

Required final commands:

- `npm run typecheck` — exit 0.
- `npm run build` — exit 0.
- `npm test` — 29/29 tests passed; 0 failed, skipped, cancelled, or todo.
- `node --check main.js` — exit 0.
- `git diff --check` — exit 0 with no whitespace errors.
- `git diff --cached --check` before the implementation commit — exit 0.

## Files changed

- Generated bundle: `main.js`
- Translation/settings/types: `src/translation.ts`, `src/types.ts`, `src/default-settings.ts`, `src/settings.ts`
- Request transport and composition: `src/llm-transport.ts`, `src/modal-services.ts`, `src/main.ts`
- Action/modal/UI: `src/actions.ts`, `src/pdf-chat-modal.ts`, `src/settings-tab.ts`
- Tests: `tests/translation.test.js`, `tests/conversation-persistence.test.js`

No CSS, README, manifest/version, package/CI/deploy, installed-plugin, or private-data files were changed.

## Self-review

- Confirmed no runtime `translatePrompt` references remain outside the migration module.
- Confirmed no `@ts-nocheck`, `@ts-ignore`, broad `any`, or compiler weakening was added.
- Confirmed request source insertion is isolated from chat/RAG/summary/full-text state and tested for one occurrence.
- Confirmed translation calls are awaited sequentially and no chunk exceeds the configured limit.
- Confirmed complete and stopped translations enter follow-up chat context only as visible label/output pairs.
- Confirmed empty failures leave runtime messages and persisted transcript unchanged.
- Confirmed all modified paths are within Task 2 scope.

## Concerns

No functional blockers or known requirement gaps. Git emitted the repository's existing LF-to-CRLF working-tree conversion warnings on Windows; both normal and cached diff checks reported no whitespace errors.
