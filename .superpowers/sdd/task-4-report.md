# Task 4 Report: Secret-safe release tooling and 0.5.0

## RED evidence

All contract tests were written and run before the corresponding scripts, documentation, workflow, or metadata changes.

- `node --test --test-name-pattern="secret scanner detects" tests/release-tooling.test.js` exited 1: 0 passed, 1 failed because `scripts/secret-scan.js` did not exist.
- `node --test --test-name-pattern="local deployment preserves" tests/release-tooling.test.js` exited 1: 0 passed, 1 failed because `scripts/deploy-local.js` did not exist.
- `node --test tests/release-contract.test.js` exited 1: 1 passed, 5 failed. Failures proved the old 0.4.0 metadata/scripts, missing workflow, missing architecture document, and missing README contracts.
- Self-review RED: quoted object API-key fields produced no finding; the new focused test failed until quoted fields were supported.
- Self-review RED: an in-repository deploy target was accepted; the new focused test failed until such targets were rejected before writes.
- Release-artifact RED: the root bundle lacked a 0.5.0 banner; the build contract failed until esbuild derived the banner from `package.json`.

## Scanner rules and redaction proof

`scripts/secret-scan.js` is dependency-free and exports reusable scan/format functions plus a CLI. Its default inputs are `git ls-files` and the generated root `main.js`.

- `forbidden.file`: rejects tracked `data.json`, `.env` variants, `.key`, and `.pem` paths.
- `secret.api-key-literal`: rejects non-empty API-key/token/secret string literals, including quoted object fields.
- `secret.bearer-token`: rejects real-looking Bearer credentials.
- `secret.provider-token`: rejects common provider shapes, including the `sk-` family.
- `secret.private-key`: rejects private-key block headers.
- Empty values and explicit placeholders such as `YOUR_API_KEY` and `REPLACE_ME` are accepted.

Synthetic tests construct credential-shaped values at runtime; no real credential appears in fixtures or output. The diagnostic test asserts the exact format `normalized/path:line [rule-id]` and proves that neither the matched value nor source text is emitted. After staging every new artifact, `npm run scan:secrets` passed, so the default tracked/build scan covered the new scripts, tests, workflow, and docs.

## Deployment safety proof

`scripts/deploy-local.js` accepts `--target <path>` or `PDF_CHAT_PLUGIN_DIR`. It validates an existing target manifest with ID exactly `pdf-chat` before mutation, refuses in-repository targets, creates a timestamped backup under local application data by default, copies only `main.js`, `manifest.json`, and `styles.css`, and verifies each source/target SHA-256 pair.

The temp-directory sentinel passed with all three release hashes equal. It also proved byte-for-byte and SHA-256 preservation of synthetic `data.json`, preservation of an unrelated target file, exclusion of an unrelated source file, and creation of a backup outside the source repository. Separate sentinels proved that a wrong plugin ID and an in-repository target are rejected before target or backup writes. CLI output is limited to backup status and filenames/status; it does not print private contents or hashes.

No real installed plugin, private settings, deployment target, GitHub setting, or remote branch was accessed or mutated.

## CI, release, and documentation

- `.github/workflows/verify.yml` runs on push and pull requests with Node 22 LTS, `npm ci`, and `npm run verify`; it contains no credentials or private model configuration.
- `package.json`, `manifest.json`, `package-lock.json`, and `versions.json` are synchronized to 0.5.0; `minAppVersion` remains 1.4.0.
- `npm run verify` covers strict typecheck, production build, full tests, secret scan, JSON/release consistency, `node --check main.js`, and diff whitespace. `deploy:local` runs verification first.
- The rebuilt `main.js` contains a package-derived 0.5.0 banner and no runtime behavior change.
- README covers the research workbench, selectable/copyable text, per-PDF restoration, one-click academic translation, summary/RAG, commands, three-file installation, development, single-source deployment, plaintext `data.json` risks, provider-key rotation, GitHub Secret Scanning/Push Protection, and explicit non-claims for online paper search and PPT generation. Although condensed, it retains every user-facing item required by the brief.
- `docs/architecture.md` documents subsystem boundaries, typed `LlmRequest`/`PaperContext`/`ResearchAction`, extract-once/fan-out reuse, external adapters/jobs for future related-paper/PPT work, and Microsoft ResearchStudio design inspiration without implementation copying.

## GREEN evidence

- Focused tooling suite: 9 passed, 0 failed.
- Focused release/documentation suite: 6 passed, 0 failed.
- Fresh `npm run verify`: exit 0; 57 tests passed, 0 failed, 0 skipped. Strict typecheck, production build, staged secret scan, metadata verification, bundle syntax, and whitespace checks also passed.

## Changed files

- `.github/workflows/verify.yml`
- `.superpowers/sdd/task-4-report.md`
- `README.md`
- `docs/architecture.md`
- `esbuild.config.mjs`
- `main.js`
- `manifest.json`
- `package-lock.json`
- `package.json`
- `scripts/deploy-local.js`
- `scripts/secret-scan.js`
- `scripts/verify-release.js`
- `tests/build-contract.test.js`
- `tests/conversation-persistence.test.js`
- `tests/release-contract.test.js`
- `tests/release-tooling.test.js`
- `tests/translation.test.js`
- `versions.json`

## Self-review and concerns

- Requirements were checked line by line against the binding brief.
- No `src/` runtime behavior changed; only build/release tooling, generated metadata banner, tests, CI, and docs changed.
- Public endpoint/API-key/model defaults remain empty. Existing dummy non-empty API-key test values were replaced by explicit placeholders.
- No dependency was added, TypeScript settings were not weakened, and no suppression or broad `any` was introduced.
- Staged and unstaged whitespace checks passed. The scanner passed after all implementation files were staged.
- Concern: local deployment was tested only against isolated temporary directories, intentionally; the real installed plugin was not inspected or deployed.

## SHAs

- Base Git commit: `d37496a7802555a6127e12467bba02a347530751`
- `main.js` SHA-256: `5ee855ed1cddfb991a06d04b4f5149fd0e52d0ee99568a9f12b9eefcd3c2cfd6`
- `manifest.json` SHA-256: `0a1ba667b8a46247c91b41dfe60e10f4843165b12329f3c4a80d9d2f2e7093c4`
- `styles.css` SHA-256: `5a4d638e9806df1b7695257d4dc47e54044bac80035afca37ab3c35aac6af53c`
