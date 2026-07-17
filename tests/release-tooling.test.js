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
  const source = [
    'const apiKey = "";',
    'const backupApiKey = "YOUR_API_KEY";',
    'const accessToken = "REPLACE_ME";',
    'const authorization = "Bearer YOUR_API_TOKEN";',
    'const exampleProviderKey = "sk-...";',
  ].join("\n");

  assert.deepEqual(scanText(source, "placeholder.js"), []);
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
