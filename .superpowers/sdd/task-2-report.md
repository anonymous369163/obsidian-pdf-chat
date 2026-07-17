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

## Review-fix addendum

Review-fix implementation commit: `9551737` (`fix: harden translation chunk failure handling`).

### Review RED evidence

1. Empty middle chunk at the service boundary
   - Command: `node --test --test-name-pattern="fails on an empty middle chunk" tests/translation.test.js`
   - Expected RED: 0/1 passed; `AssertionError: Missing expected rejection`.
   - Root cause: `combineTranslations` filtered the empty result, allowing the service to start the third chunk and return a misleading complete result.

2. Empty middle chunk through modal persistence
   - Command: `node --test --test-name-pattern="modal persists prior output as stopped" tests/translation.test.js`
   - Expected RED: 0/1 passed; the LLM was called 3 times instead of stopping after the second empty result.
   - Root cause: the service did not raise a failure, so the modal followed its complete path instead of persisting the first translation as `stopped`.

3. Explicit cancellation checkpoints
   - Command: `node --test --test-name-pattern="checks cancellation before calls" tests/translation.test.js`
   - Expected RED: 0/1 passed; `AssertionError: Missing expected rejection` for a pre-aborted signal.
   - Root cause: the service delegated cancellation entirely to the LLM transport and could neither stop a signal-ignoring transport nor prevent later chunks/completion.

4. Supplementary Unicode safety
   - Command: `node --test --test-name-pattern="keeps supplementary math characters" tests/translation.test.js`
   - Expected RED: 0/1 passed; actual chunks were `['ab\ud835', '\udefccd']` instead of `['ab', '𝛼c', 'd']`.
   - Root cause: hard splits used an unchecked UTF-16 offset between the high and low surrogates.

5. Translation error prompt leakage
   - Command: `node --test --test-name-pattern="modal sanitizes translation endpoint errors" tests/translation.test.js`
   - Expected RED: 0/1 passed; the assistant bubble displayed the raw endpoint payload containing `faithful academic translation` and `<source_text>Selected source</source_text>`.
   - Root cause: the translation catch branch passed `errorMessage(err)` directly to the visible bubble.

6. Required fallback-boundary coverage
   - Command: `node --test --test-name-pattern="prefers line, sentence, and whitespace" tests/translation.test.js`
   - Existing behavior GREEN: 1/1 passed before production changes, confirming line, sentence, and whitespace fallback precedence already matched the binding requirement.

### Review implementation

- An empty or whitespace-only chunk result now throws immediately with its chunk index. No later chunk starts. Any prior streamed/translated output remains in modal state and is persisted through the existing `stopped` path.
- The translation service now throws an `AbortError` before each model call, immediately after every awaited model call, and before returning completion. This covers already-aborted signals and LLM implementations that ignore the signal.
- Every computed split boundary is checked for a UTF-16 high/low surrogate pair. If necessary the boundary moves so supplementary mathematical characters remain intact in both chunks and `<source_text>` requests.
- Translation failures with no output now render only `翻译失败，请检查模型配置或稍后重试。`. Raw endpoint errors, system prompts, source wrappers, and source text are neither shown nor persisted. The normal chat error branch was not changed.
- Added focused line, sentence, and whitespace fallback tests with source reconstruction and per-chunk limit assertions.

### Review GREEN and final verification

Focused GREEN results:

- Empty service result plus modal stopped persistence: 2/2 passed.
- Pre/post-call cancellation: 1/1 passed.
- Surrogate-safe requests plus fallback-boundary coverage: 2/2 passed.
- Sanitized translation failure plus existing stopped/empty failure behavior: 2/2 passed.

Required final commands after all review fixes:

- `npm run typecheck` — exit 0.
- `npm run build` — exit 0.
- `npm test` — 35/35 tests passed; 0 failed, skipped, cancelled, or todo.
- `node --check main.js` — exit 0.
- `git diff --check` — exit 0 with no whitespace errors.
- `git diff --cached --check` before the review-fix commit — exit 0.

### Review self-check

- Confirmed empty chunk 2/3 rejects and chunk 3/3 is never requested.
- Confirmed the modal stores prior output as a visible `stopped` turn and does not persist the empty chunk or internal request.
- Confirmed pre-aborted signals make zero LLM calls and an LLM that aborts then resolves cannot start a later chunk or return complete.
- Confirmed no generated chunk ends in a high surrogate or begins in a low surrogate for the supplementary-math regression, and captured request chunks reconstruct the exact source.
- Confirmed raw translation error payloads do not appear in bubbles, runtime chat additions, or persisted transcripts; normal chat error behavior remains unchanged.
- Confirmed the review fix changed only `src/translation.ts`, the translation branch in `src/pdf-chat-modal.ts`, `tests/translation.test.js`, and generated `main.js`.

No new blockers or known review gaps remain. The existing Windows LF-to-CRLF conversion warnings remain non-failing; normal and cached diff checks report no whitespace errors.

## Re-review test-quality addendum

Focused test commit: `b75530f` (`test: strengthen translation boundary priority coverage`).

### Competing-boundary test design

- Line-priority source: `alpha\nbeta gamma`, limit `12`. Both the earlier line break and the later space after `beta` are within the limit; the required first chunk is `alpha\n`.
- Sentence-priority source: `Alpha one. Beta two`, limit `17`. Both the earlier sentence boundary and the later space after `Beta` are within the limit; the required first chunk is `Alpha one. `.
- Whitespace fallback remains a separate focused case using `alpha betaGamma`, proving whitespace is selected when no paragraph, line, or sentence boundary exists.

Splitting these into three tests ensures a line-priority failure cannot prevent the sentence-priority assertion from running.

### Mutation RED evidence

For test-efficacy verification only, the line and sentence branches were temporarily removed from `findPreferredBoundary`; no production mutation was retained.

- Command: `npm run build; node --test --test-name-pattern="earlier line boundary|earlier sentence boundary|uses whitespace before hard" tests/translation.test.js`
- Result under mutation: 1/3 passed and 2/3 failed.
- Line failure: actual first chunk `alpha\nbeta ` versus expected `alpha\n`, proving the test rejects a later whitespace fallback when a line boundary exists.
- Sentence failure: actual first chunk `Alpha one. Beta ` versus expected `Alpha one. `, proving the test rejects a later whitespace fallback when a sentence boundary exists.
- The whitespace-only case passed under mutation, confirming that the failures were specific to missing higher-priority branches rather than general splitter breakage.

The original line and sentence production branches were then restored byte-for-byte.

### Restored GREEN and verification

- Restored focused command: 3/3 passed.
- Final diff before commit: only `tests/translation.test.js`; `src/translation.ts` and generated `main.js` matched the prior commit.
- `npm test` — 37/37 passed; 0 failed, skipped, cancelled, or todo.
- `npm run typecheck` — exit 0.
- `npm run build` — exit 0.
- `node --check main.js` — exit 0.
- `git diff --check` — exit 0 with no whitespace errors.
- `git diff --cached --check` before the focused test commit — exit 0.

### Re-review self-check

- Confirmed each higher-priority test contains a lower-priority whitespace candidate later within the same limit.
- Confirmed exact first-chunk assertions distinguish priority selection from generic valid chunking.
- Confirmed each case reconstructs the original source and enforces the per-chunk limit.
- Confirmed mutation RED independently exercised both line and sentence priority assertions.
- Confirmed no production behavior, bundle output, installed plugin, or private data changed.

No new blockers or concerns.
