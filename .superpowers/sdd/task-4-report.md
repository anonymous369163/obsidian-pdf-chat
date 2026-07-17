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
- `secret.bearer-token`: rejects real-looking authorization-header values.
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

## Review-fix follow-up

### Additional RED evidence

- `node --test tests/release-tooling.test.js` initially exited 1 with 8 passed and 14 failed. The failures reproduced permissive placeholders, missed 12-character Bearer detection, missed credential-bearing field names, lexical-only containment, linked/non-regular destinations, absent staging, and absent rollback.
- `node --test tests/verify-tooling.test.js` initially exited 1 with 0 passed and 5 failed because the cross-platform verifier module did not exist. These tests cover stale-bundle rejection plus working-tree, staged, explicit-base commit-range, and fallback commit-range whitespace errors.
- `node --test tests/release-contract.test.js` initially exited 1 with 4 passed and 2 failed because `package.json` still used the recursive shell chain and CI did not fetch history or pass a base SHA.
- The first full verifier run reproduced a Windows-only `spawnSync` `EINVAL` error for direct command-shim execution. A focused test failed until npm was invoked through its JavaScript CLI entry point under Node.
- Self-review RED tests proved that semver-looking text in a real API-key field must not be exempted and that an initial private-data hash failure must retain and surface the pre-deploy backup.

### Canonical containment and preflight

Deployment now resolves the repository and target with `realpath`, and resolves a not-yet-created backup root through its deepest existing real parent. It rejects a linked/junction target root, canonical targets inside the repository even when the lexical path is outside, canonical backup parents inside the repository, non-regular or linked manifests/release destinations, and non-regular or linked `data.json` before backup or target writes.

The Windows test run used directory junctions for linked-root, linked-parent, and linked-destination cases. All link tests ran and passed; none were skipped.

### Exact scanner rules

Placeholder handling now normalizes and compares only against an exact allowlist. Ellipsis substrings and prefix/suffix heuristics no longer suppress findings. Exact allowlisted provider-shaped and Bearer placeholder forms remain accepted, while non-placeholder Bearer values of 12 characters are detected. Literal field scanning covers quoted and unquoted names containing key, token, secret, password, or credential. Package-lock dependency version syntax is narrowly distinguished from credential fields without exempting semver-looking values in an actual API-key field. Redacted diagnostics remain path, line, and rule ID only, and the staged repository/build scan passes.

### Failure-atomic deployment

After complete preflight, deployment creates the external backup, computes the initial private-data hash, copies all three source artifacts into an external staging directory, and verifies every staged SHA-256 before the first target mutation. Target copies are then verified individually.

Any staging copy/hash, target copy/hash, initial/post private-data hash, or later deployment failure triggers restoration of all three release paths from the backup; paths absent before deployment are removed. The thrown error and CLI error include the retained backup path. Deterministic injected failures prove no mixed target after staging, target-copy, target-hash, and post-data failures, while synthetic `data.json` bytes remain unchanged.

### Cross-platform verification and CI

`npm run verify` now executes `scripts/verify.js`, which uses direct child processes rather than a recursive shell chain. It checks working and staged whitespace, resolves `VERIFY_BASE_SHA` through merge-base with remote/default-parent fallbacks for the committed range, runs strict typecheck, builds once while proving the pre-build `main.js` bytes were already current, then runs the full tests, secret scan, release consistency, and bundle syntax check. A stale build restores the original bundle and fails with an actionable message.

CI fetches full history and passes the pull-request base SHA or push-before SHA. This makes stale bundles and committed whitespace errors fail in CI instead of being repaired or missed during verification.

### Additional GREEN evidence

- Focused release/security tooling: 24 passed, 0 failed, 0 skipped.
- Focused verifier tooling: 6 passed, 0 failed, 0 skipped.
- Focused release/CI contracts: 6 passed, 0 failed, 0 skipped.
- Staged `npm run scan:secrets`: exit 0.
- Fresh staged `npm run verify`: exit 0; 78 tests passed, 0 failed, 0 skipped. Typecheck, pre-build bundle freshness, production build, scanner, release metadata, syntax, and working/staged/commit-range whitespace checks all passed.

### Review-fix files and self-review

- Modified: `.github/workflows/verify.yml`, `package.json`, `scripts/deploy-local.js`, `scripts/secret-scan.js`, `tests/release-contract.test.js`, and `tests/release-tooling.test.js`.
- Added: `scripts/verify.js` and `tests/verify-tooling.test.js`.
- Appended: `.superpowers/sdd/task-4-report.md`.
- No `src/` runtime behavior, dependencies, compiler settings, model defaults, or release metadata changed.
- No real plugin, private data, remote branch, deployment target, or GitHub setting was accessed or mutated.

### Review-fix SHAs

- Base Git commit: `b6efa4b0f6f7301cb533675df3ad228c50d20162`
- `main.js` SHA-256 (unchanged/current): `5ee855ed1cddfb991a06d04b4f5149fd0e52d0ee99568a9f12b9eefcd3c2cfd6`
- `scripts/deploy-local.js` SHA-256: `375bebade6878dd611786fc53c0898e8ace16b9588404028e00e62a0bafb0cc5`
- `scripts/secret-scan.js` SHA-256: `4bd5f46006572f3dafef0bfd3af0d507ae9017bf17fc32755b92506389137c1f`
- `scripts/verify.js` SHA-256: `58edc16eb418e1b866af196e79eb44da9883c4f280083f37fd1015d2f8c8d025`

## Second review-fix follow-up

### Second-round RED evidence

- `node --test tests/release-tooling.test.js tests/verify-tooling.test.js` initially exited 1 with 30 passed and 13 failed. The failures reproduced the package-lock credential-field exemption, trailing-hyphen authorization miss, source/target/private-data/staging hardlinks, ignored staging-cleanup failures, direct-verifier `npm.cmd` fallback, missing bundle restoration, and raw whitespace source lines in exception/CLI output.
- A later self-review test, `node --test --test-name-pattern "introduced while copying" tests/release-tooling.test.js`, exited 1 because a hardlink introduced during the target copy was accepted. It passed only after every copied target artifact was revalidated as a single-link regular file.
- Synthetic credential-shaped values are assembled only at runtime. Redaction assertions compare booleans before checking diagnostic structure, so neither a successful run nor a failing assertion prints the constructed value.

### Hardlink and rollback safety

Every trusted release path now requires `lstat().isFile()` and exactly one filesystem link. This covers the source release files, all three target destinations, optional private `data.json`, staged files, backup snapshot files, target files after copying, and both backup and target paths immediately before rollback. Rollback also validates each restored destination after copying.

The Windows test run created real NTFS hardlinks with `fs.linkSync`. Tests prove that pre-existing hardlinks for `main.js`, `manifest.json`, `styles.css`, and `data.json` are rejected before writes and that the external inode bytes remain unchanged. Separate injected tests cover hardlinks introduced in staging, target copy, backup creation, and rollback substitution. All hardlink tests ran; none were skipped.

Staging cleanup now participates in deployment success. A cleanup-only failure triggers full release rollback, retains and reports the backup path, and leaves synthetic private-data bytes unchanged. When both deployment and cleanup fail, the original deployment error remains primary and the cleanup failure is appended; deterministic tests prove the complete target snapshot is restored.

### Scanner and verifier hardening

Package-lock semver exemptions are now tied to the exact JSON source position under `packages[*]` dependency maps. Credential-like names are never exempted, and a duplicate name/value outside that structure is still reported. Authorization values of 12 or more legal characters are detected even when the final character is `-`.

Whitespace verification converts `git diff --check` output into redacted `file:line [category]` entries plus a count; raw source lines are never placed in thrown errors or CLI output. Direct verification resolves `npm-cli.js` from the Node installation and always launches it with `process.execPath`, without a Windows command-shim fallback. Bundle freshness verification restores prior `main.js` bytes after deletion/failure and removes partial artifacts when the bundle was initially absent.

### Second-round GREEN evidence

- Focused release/security and verifier tooling: 48 passed, 0 failed, 0 skipped.
- Direct Windows `node scripts/verify.js` with `npm_execpath` and `npm_node_execpath` removed: exit 0; the full 96-test verification completed through the resolved JavaScript npm CLI.
- Fresh staged `npm run verify`: exit 0; 96 tests passed, 0 failed, 0 skipped. Strict typecheck, production bundle freshness/build, secret scan, release metadata verification, bundle syntax, and working/staged/commit-range whitespace checks all passed.
- No real plugin, private settings, credentials, deployment target, remote branch, or GitHub setting was accessed or mutated.

### Second-round SHAs

- Base Git commit: `877471e7eacf06969975007994f922a9008462aa`
- `scripts/deploy-local.js` SHA-256: `c4ff38797b36048b77f4133e7a3da5310e152d9eb3f5142ec4539a57a7f49f88`
- `scripts/secret-scan.js` SHA-256: `17b8fc7564e2cf3eb24befb4183cb9ea6e616fb6011d1899a56d18422a48143c`
- `scripts/verify.js` SHA-256: `b9f30d092f48ff470149bfa860ed91ea2d31402e22cd09fd2b9fa919b45dfbf7`
