const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");

function makeTempDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-chat-release-"));
  t.after(() => fs.rmSync(directory, { force: true, recursive: true }));
  return directory;
}

function writeReleaseFiles(directory, marker) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "main.js"), `module.exports = ${JSON.stringify(marker)};\n`);
  fs.writeFileSync(
    path.join(directory, "manifest.json"),
    `${JSON.stringify({ id: "pdf-chat", version: "0.5.0" }, null, 2)}\n`
  );
  fs.writeFileSync(path.join(directory, "styles.css"), `/* ${marker} */\n`);
}

function createDirectoryLink(t, target, linkPath) {
  try {
    fs.symlinkSync(target, linkPath, process.platform === "win32" ? "junction" : "dir");
    return true;
  } catch (error) {
    if (error && ["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) {
      t.skip(`directory links are unavailable: ${error.code}`);
      return false;
    }
    throw error;
  }
}

function snapshotReleaseFiles(targetDir) {
  return new Map(
    ["main.js", "manifest.json", "styles.css"].map((filename) => [
      filename,
      fs.existsSync(path.join(targetDir, filename))
        ? fs.readFileSync(path.join(targetDir, filename))
        : null,
    ])
  );
}

function assertReleaseSnapshot(targetDir, snapshot) {
  for (const [filename, bytes] of snapshot) {
    const filePath = path.join(targetDir, filename);
    if (bytes === null) assert.equal(fs.existsSync(filePath), false, `${filename} must remain absent`);
    else assert.deepEqual(fs.readFileSync(filePath), bytes, `${filename} must be restored`);
  }
}

function captureError(operation) {
  try {
    operation();
  } catch (error) {
    return error;
  }
  assert.fail("expected operation to throw");
}

test("secret scanner detects API-key literals, bearer tokens, provider tokens, and private keys", () => {
  const { scanText } = require("../scripts/secret-scan");
  const apiKeyValue = `synthetic-${"a".repeat(24)}`;
  const bearerValue = `${["Bear", "er"].join("")} ${"b".repeat(32)}`;
  const providerValue = `${["s", "k"].join("")}-${"c".repeat(32)}`;
  const privateKeyHeader = ["-----BEGIN", " PRIVATE KEY-----"].join("");
  const source = [
    `const apiKey = ${JSON.stringify(apiKeyValue)};`,
    `const authorization = ${JSON.stringify(bearerValue)};`,
    `const provider = ${JSON.stringify(providerValue)};`,
    privateKeyHeader,
  ].join("\n");

  const ruleIds = new Set(scanText(source, "fixture.js").map((finding) => finding.ruleId));

  assert.deepEqual(
    ruleIds,
    new Set([
      "secret.api-key-literal",
      "secret.bearer-token",
      "secret.provider-token",
      "secret.private-key",
    ])
  );
});

test("secret scanner accepts empty values and explicit placeholders", () => {
  const { scanText } = require("../scripts/secret-scan");
  const providerPlaceholder = `${["s", "k"].join("")}-YOUR_API_KEY_PLACEHOLDER`;
  const source = [
    'const apiKey = "";',
    'const backupApiKey = "YOUR_API_KEY";',
    'const accessToken = "REPLACE_ME";',
    'const authorization = "Bearer YOUR_API_TOKEN";',
    `const exampleProviderKey = ${JSON.stringify(providerPlaceholder)};`,
  ].join("\n");

  assert.deepEqual(scanText(source, "placeholder.js"), []);
});

test("secret scanner never treats ellipsis, prefix, or suffix heuristics as placeholders", () => {
  const { scanText } = require("../scripts/secret-scan");
  const ellipsisValue = ["prefix", "...", "suffix"].join("");
  const heuristicValue = ["YOUR", "SECRET", "HERE"].join("_");
  const source = [
    `const apiKey = ${JSON.stringify(ellipsisValue)};`,
    `const backupApiKey = ${JSON.stringify(heuristicValue)};`,
  ].join("\n");

  assert.deepEqual(
    scanText(source, "not-placeholders.js").map((finding) => finding.ruleId),
    ["secret.api-key-literal", "secret.api-key-literal"]
  );
});

test("secret scanner detects a twelve-character non-placeholder Bearer credential", () => {
  const { scanText } = require("../scripts/secret-scan");
  const bearer = `${["Bear", "er"].join("")} ${"b".repeat(12)}`;

  assert.deepEqual(
    scanText(`const authorization = ${JSON.stringify(bearer)};`, "short-bearer.js").map(
      (finding) => finding.ruleId
    ),
    ["secret.bearer-token"]
  );
});

test("secret scanner rejects a semver-looking non-placeholder API-key value", () => {
  const { scanText } = require("../scripts/secret-scan");
  const value = ["1", "2", "3"].join(".");

  assert.deepEqual(
    scanText(`const apiKey = ${JSON.stringify(value)};`, "settings.js").map(
      (finding) => finding.ruleId
    ),
    ["secret.api-key-literal"]
  );
});

test("secret scanner detects literal fields containing key, token, secret, password, or credential", () => {
  const { scanText } = require("../scripts/secret-scan");
  const value = `synthetic-${"v".repeat(24)}`;
  const source = [
    `const clientSecret = ${JSON.stringify(value)};`,
    `${JSON.stringify("databasePassword")}: ${JSON.stringify(value)},`,
    `serviceCredential: ${JSON.stringify(value)},`,
    `signingKeyId: ${JSON.stringify(value)},`,
    `refreshTokenValue: ${JSON.stringify(value)},`,
  ].join("\n");

  assert.deepEqual(
    scanText(source, "broad-fields.js").map((finding) => finding.ruleId),
    Array(5).fill("secret.api-key-literal")
  );
});

test("secret scanner detects non-empty API keys under quoted object fields", () => {
  const { scanText } = require("../scripts/secret-scan");
  const value = `synthetic-${"q".repeat(24)}`;
  const source = `{ ${JSON.stringify("apiKey")}: ${JSON.stringify(value)} }`;

  assert.deepEqual(
    scanText(source, "settings.json").map((finding) => finding.ruleId),
    ["secret.api-key-literal"]
  );
});

test("secret scanner rejects forbidden tracked filename shapes", (t) => {
  const { scanFile } = require("../scripts/secret-scan");
  const directory = makeTempDirectory(t);
  const filenames = ["data.json", ".env.local", "server.key", "certificate.pem"];
  const findings = [];
  for (const filename of filenames) {
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, "");
    findings.push(...scanFile(filePath, directory));
  }

  assert.deepEqual(
    findings.map((finding) => [finding.file, finding.line, finding.ruleId]),
    filenames.map((filename) => [filename, 1, "forbidden.file"])
  );
});

test("secret diagnostics contain only normalized path, line, and rule ID", () => {
  const { formatFinding, scanText } = require("../scripts/secret-scan");
  const value = `synthetic-${"z".repeat(24)}`;
  const source = `const apiKey = ${JSON.stringify(value)};`;
  const findings = scanText(source, "nested\\example.js");

  assert.equal(findings.length, 1);
  assert.equal(formatFinding(findings[0]), "nested/example.js:1 [secret.api-key-literal]");
  assert.doesNotMatch(formatFinding(findings[0]), new RegExp(value));
  assert.doesNotMatch(formatFinding(findings[0]), /const|apiKey|synthetic/);
});

test("current tracked files and root bundle pass the secret scan", () => {
  const { scanRepository } = require("../scripts/secret-scan");

  assert.deepEqual(scanRepository(projectRoot), []);
});

test("local deployment preserves private data and verifies all release hashes", (t) => {
  const { deployRelease, sha256File } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  fs.writeFileSync(path.join(sourceRoot, "not-a-release-file.txt"), "do not deploy\n");
  const privateBytes = Buffer.from(JSON.stringify({ conversation: "local-only" }));
  fs.writeFileSync(path.join(targetDir, "data.json"), privateBytes);
  fs.writeFileSync(path.join(targetDir, "unrelated.txt"), "keep me\n");
  const privateHashBefore = sha256File(path.join(targetDir, "data.json"));

  const result = deployRelease({
    sourceRoot,
    targetDir,
    backupRoot,
    now: () => new Date("2026-07-17T12:34:56.000Z"),
  });

  assert.equal(path.relative(sourceRoot, result.backupDir).startsWith(".."), true);
  assert.match(path.basename(result.backupDir), /^pdf-chat-20260717T123456000Z/);
  assert.equal(result.files.length, 3);
  for (const verification of result.files) {
    assert.equal(verification.sourceHash, verification.targetHash);
    assert.equal(verification.status, "verified");
  }
  assert.deepEqual(
    result.files.map((verification) => verification.filename).sort(),
    ["main.js", "manifest.json", "styles.css"]
  );
  assert.equal(sha256File(path.join(targetDir, "data.json")), privateHashBefore);
  assert.deepEqual(fs.readFileSync(path.join(targetDir, "data.json")), privateBytes);
  assert.equal(fs.readFileSync(path.join(targetDir, "unrelated.txt"), "utf8"), "keep me\n");
  assert.equal(fs.existsSync(path.join(targetDir, "not-a-release-file.txt")), false);
  assert.deepEqual(fs.readFileSync(path.join(result.backupDir, "data.json")), privateBytes);
});

test("local deployment rejects a wrong plugin ID before writing anything", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  fs.writeFileSync(
    path.join(targetDir, "manifest.json"),
    `${JSON.stringify({ id: "different-plugin", version: "9.9.9" }, null, 2)}\n`
  );
  const before = new Map(
    fs.readdirSync(targetDir).map((filename) => [filename, fs.readFileSync(path.join(targetDir, filename))])
  );

  assert.throws(
    () => deployRelease({ sourceRoot, targetDir, backupRoot }),
    /expected target manifest id "pdf-chat"/
  );
  assert.equal(fs.existsSync(backupRoot), false);
  assert.deepEqual(fs.readdirSync(targetDir).sort(), [...before.keys()].sort());
  for (const [filename, bytes] of before) {
    assert.deepEqual(fs.readFileSync(path.join(targetDir, filename)), bytes);
  }
});

test("local deployment refuses a target inside the repository before writing anything", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(sourceRoot, "nested-target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  const targetBefore = fs.readFileSync(path.join(targetDir, "main.js"));

  assert.throws(
    () => deployRelease({ sourceRoot, targetDir, backupRoot }),
    /target directory must be outside the repository/
  );
  assert.deepEqual(fs.readFileSync(path.join(targetDir, "main.js")), targetBefore);
  assert.equal(fs.existsSync(backupRoot), false);
});

test("local deployment rejects a linked target root before writing anything", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const realTarget = path.join(root, "real-target");
  const linkedTarget = path.join(root, "linked-target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(realTarget, "old-release");
  if (!createDirectoryLink(t, realTarget, linkedTarget)) return;
  const before = snapshotReleaseFiles(realTarget);

  assert.throws(
    () => deployRelease({ sourceRoot, targetDir: linkedTarget, backupRoot }),
    /target directory must be a real directory, not a link/
  );
  assertReleaseSnapshot(realTarget, before);
  assert.equal(fs.existsSync(backupRoot), false);
});

test("local deployment rejects an outside lexical target that resolves inside the repository", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const internalTarget = path.join(sourceRoot, "internal-target");
  const linkedParent = path.join(root, "linked-repository");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(internalTarget, "old-release");
  if (!createDirectoryLink(t, sourceRoot, linkedParent)) return;
  const before = snapshotReleaseFiles(internalTarget);

  assert.throws(
    () => deployRelease({ sourceRoot, targetDir: path.join(linkedParent, "internal-target"), backupRoot }),
    /target directory must be outside the repository/
  );
  assertReleaseSnapshot(internalTarget, before);
  assert.equal(fs.existsSync(backupRoot), false);
});

test("local deployment rejects a backup parent that resolves inside the repository", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const linkedParent = path.join(root, "linked-repository");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  fs.mkdirSync(path.join(sourceRoot, "internal-backups"));
  if (!createDirectoryLink(t, sourceRoot, linkedParent)) return;
  const before = snapshotReleaseFiles(targetDir);

  assert.throws(
    () =>
      deployRelease({
        sourceRoot,
        targetDir,
        backupRoot: path.join(linkedParent, "internal-backups"),
      }),
    /backup directory must be outside the repository/
  );
  assertReleaseSnapshot(targetDir, before);
  assert.deepEqual(fs.readdirSync(path.join(sourceRoot, "internal-backups")), []);
});

test("local deployment rejects a non-regular target manifest before writing anything", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  fs.rmSync(path.join(targetDir, "manifest.json"));
  fs.mkdirSync(path.join(targetDir, "manifest.json"));

  assert.throws(
    () => deployRelease({ sourceRoot, targetDir, backupRoot }),
    /target manifest must be a regular file and not a link/
  );
  assert.equal(fs.existsSync(backupRoot), false);
});

test("local deployment rejects a linked release destination before writing anything", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const externalDirectory = path.join(root, "external-directory");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  fs.mkdirSync(externalDirectory);
  fs.rmSync(path.join(targetDir, "main.js"));
  if (!createDirectoryLink(t, externalDirectory, path.join(targetDir, "main.js"))) return;

  assert.throws(
    () => deployRelease({ sourceRoot, targetDir, backupRoot }),
    /target main.js must be a regular file and not a link/
  );
  assert.equal(fs.existsSync(backupRoot), false);
  assert.deepEqual(fs.readdirSync(externalDirectory), []);
});

test("local deployment rejects non-regular private data before writing anything", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  fs.mkdirSync(path.join(targetDir, "data.json"));
  const before = snapshotReleaseFiles(targetDir);

  assert.throws(
    () => deployRelease({ sourceRoot, targetDir, backupRoot }),
    /target data.json must be a regular file and not a link/
  );
  assertReleaseSnapshot(targetDir, before);
  assert.equal(fs.existsSync(backupRoot), false);
});

test("local deployment stages and hashes every release file before target mutation", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  const before = snapshotReleaseFiles(targetDir);
  let injected = false;

  const error = captureError(() =>
    deployRelease({
      sourceRoot,
      targetDir,
      backupRoot,
      fileOps: {
        copyFile(source, destination) {
          const destinationIsTarget = path.dirname(path.resolve(destination)) === path.resolve(targetDir);
          if (!injected && path.basename(source) === "styles.css" && !destinationIsTarget) {
            injected = true;
            throw new Error("injected staging failure");
          }
          fs.copyFileSync(source, destination);
        },
      },
    })
  );

  assert.match(error.message, /injected staging failure/);
  assert.match(error.message, /backup:/i);
  assert.ok(fs.existsSync(error.backupDir));
  assertReleaseSnapshot(targetDir, before);
});

test("local deployment rolls back every release file after a target copy failure", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  const privateBytes = Buffer.from(JSON.stringify({ conversation: "unchanged" }));
  fs.writeFileSync(path.join(targetDir, "data.json"), privateBytes);
  const before = snapshotReleaseFiles(targetDir);
  let injected = false;

  const error = captureError(() =>
    deployRelease({
      sourceRoot,
      targetDir,
      backupRoot,
      fileOps: {
        copyFile(source, destination) {
          if (!injected && path.resolve(destination) === path.resolve(targetDir, "styles.css")) {
            injected = true;
            throw new Error("injected target copy failure");
          }
          fs.copyFileSync(source, destination);
        },
      },
    })
  );

  assert.match(error.message, /injected target copy failure/);
  assert.match(error.message, /backup:/i);
  assert.ok(fs.existsSync(error.backupDir));
  assertReleaseSnapshot(targetDir, before);
  assert.deepEqual(fs.readFileSync(path.join(targetDir, "data.json")), privateBytes);
});

test("local deployment rolls back every release file after target hash verification fails", (t) => {
  const { deployRelease, sha256File } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  const before = snapshotReleaseFiles(targetDir);

  const error = captureError(() =>
    deployRelease({
      sourceRoot,
      targetDir,
      backupRoot,
      fileOps: {
        hashFile(filePath) {
          if (path.resolve(filePath) === path.resolve(targetDir, "styles.css")) return "0".repeat(64);
          return sha256File(filePath);
        },
      },
    })
  );

  assert.match(error.message, /hash verification failed for styles.css/);
  assert.match(error.message, /backup:/i);
  assertReleaseSnapshot(targetDir, before);
});

test("local deployment rolls back release files after post-deploy data verification fails", (t) => {
  const { deployRelease, sha256File } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  const dataPath = path.join(targetDir, "data.json");
  const privateBytes = Buffer.from(JSON.stringify({ conversation: "unchanged" }));
  fs.writeFileSync(dataPath, privateBytes);
  const before = snapshotReleaseFiles(targetDir);
  let dataHashCalls = 0;

  const error = captureError(() =>
    deployRelease({
      sourceRoot,
      targetDir,
      backupRoot,
      fileOps: {
        hashFile(filePath) {
          if (path.resolve(filePath) === path.resolve(dataPath)) {
            dataHashCalls += 1;
            if (dataHashCalls === 2) return "f".repeat(64);
          }
          return sha256File(filePath);
        },
      },
    })
  );

  assert.match(error.message, /data.json changed during deployment/);
  assert.match(error.message, /backup:/i);
  assertReleaseSnapshot(targetDir, before);
  assert.deepEqual(fs.readFileSync(dataPath), privateBytes);
});

test("local deployment retains a backup when the initial private-data hash fails", (t) => {
  const { deployRelease } = require("../scripts/deploy-local");
  const root = makeTempDirectory(t);
  const sourceRoot = path.join(root, "source");
  const targetDir = path.join(root, "target");
  const backupRoot = path.join(root, "backups");
  writeReleaseFiles(sourceRoot, "new-release");
  writeReleaseFiles(targetDir, "old-release");
  const dataPath = path.join(targetDir, "data.json");
  const privateBytes = Buffer.from(JSON.stringify({ conversation: "unchanged" }));
  fs.writeFileSync(dataPath, privateBytes);
  const before = snapshotReleaseFiles(targetDir);

  const error = captureError(() =>
    deployRelease({
      sourceRoot,
      targetDir,
      backupRoot,
      fileOps: {
        hashFile(filePath) {
          if (path.resolve(filePath) === path.resolve(dataPath)) {
            throw new Error("injected initial data hash failure");
          }
          return "unused";
        },
      },
    })
  );

  assert.match(error.message, /injected initial data hash failure/);
  assert.match(error.message, /backup:/i);
  assert.ok(fs.existsSync(error.backupDir));
  assertReleaseSnapshot(targetDir, before);
  assert.deepEqual(fs.readFileSync(dataPath), privateBytes);
});
