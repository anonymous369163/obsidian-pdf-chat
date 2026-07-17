const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");

function makeTempDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-chat-verify-"));
  t.after(() => fs.rmSync(directory, { force: true, recursive: true }));
  return directory;
}

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function initializeRepository(t) {
  const root = makeTempDirectory(t);
  git(root, "init");
  git(root, "config", "user.name", "Verification Test");
  git(root, "config", "user.email", "verification@example.invalid");
  git(root, "config", "core.autocrlf", "false");
  fs.writeFileSync(path.join(root, "sample.txt"), "clean\n");
  git(root, "add", "sample.txt");
  git(root, "commit", "-m", "base");
  return { baseSha: git(root, "rev-parse", "HEAD"), root };
}

function captureError(operation) {
  try {
    operation();
  } catch (error) {
    return error;
  }
  assert.fail("expected operation to throw");
}

test("bundle verification fails when a production build changes the checked-in main.js", (t) => {
  const { verifyBundleCurrent } = require("../scripts/verify");
  const root = makeTempDirectory(t);
  const bundlePath = path.join(root, "main.js");
  const staleBundle = Buffer.from("stale bundle\n");
  fs.writeFileSync(bundlePath, staleBundle);

  assert.throws(
    () => verifyBundleCurrent(root, () => fs.writeFileSync(bundlePath, "current bundle\n")),
    /main.js was stale before the production build/
  );
  assert.deepEqual(fs.readFileSync(bundlePath), staleBundle);
});

test("npm verification commands run through the npm CLI entry point", (t) => {
  const { npmInvocation } = require("../scripts/verify");
  const root = makeTempDirectory(t);
  const npmCli = path.join(root, "npm-cli.js");
  fs.writeFileSync(npmCli, "");

  assert.deepEqual(npmInvocation(["run", "build"], { npm_execpath: npmCli }), {
    args: [npmCli, "run", "build"],
    command: process.execPath,
  });
});

test("direct verification resolves npm-cli.js without npm-provided environment variables", (t) => {
  const { npmInvocation } = require("../scripts/verify");
  const root = makeTempDirectory(t);
  const executable = path.join(root, process.platform === "win32" ? "node.exe" : "node");
  const npmCli = path.join(root, "node_modules", "npm", "bin", "npm-cli.js");
  fs.mkdirSync(path.dirname(npmCli), { recursive: true });
  fs.writeFileSync(executable, "");
  fs.writeFileSync(npmCli, "");

  assert.deepEqual(npmInvocation(["run", "build"], {}, executable), {
    args: [npmCli, "run", "build"],
    command: executable,
  });
});

test("bundle verification restores main.js when a failing build deletes it", (t) => {
  const { verifyBundleCurrent } = require("../scripts/verify");
  const root = makeTempDirectory(t);
  const bundlePath = path.join(root, "main.js");
  const originalBytes = Buffer.from("original bundle\n");
  fs.writeFileSync(bundlePath, originalBytes);

  assert.throws(
    () =>
      verifyBundleCurrent(root, () => {
        fs.rmSync(bundlePath);
        throw new Error("injected build failure after deletion");
      }),
    /injected build failure after deletion/
  );
  assert.deepEqual(fs.readFileSync(bundlePath), originalBytes);
});

test("bundle verification removes a newly-created main.js when a failing build started without one", (t) => {
  const { verifyBundleCurrent } = require("../scripts/verify");
  const root = makeTempDirectory(t);
  const bundlePath = path.join(root, "main.js");
  let buildRan = false;

  assert.throws(
    () =>
      verifyBundleCurrent(root, () => {
        buildRan = true;
        fs.writeFileSync(bundlePath, "new partial bundle\n");
        throw new Error("injected build failure from absent state");
      }),
    /injected build failure from absent state/
  );
  assert.equal(buildRan, true);
  assert.equal(fs.existsSync(bundlePath), false);
});

test("whitespace verification rejects working-tree whitespace errors", (t) => {
  const { verifyWhitespace } = require("../scripts/verify");
  const { baseSha, root } = initializeRepository(t);
  fs.writeFileSync(path.join(root, "sample.txt"), "working trailing spaces   \n");

  assert.throws(
    () => verifyWhitespace(root, { VERIFY_BASE_SHA: baseSha }),
    /working-tree whitespace check failed/
  );
});

test("whitespace verification exceptions redact source lines", (t) => {
  const { verifyWhitespace } = require("../scripts/verify");
  const { baseSha, root } = initializeRepository(t);
  const syntheticCredential = `${["syn", "thetic"].join("")}-${"x".repeat(32)}`;
  fs.writeFileSync(path.join(root, "sample.txt"), `apiKey=${syntheticCredential}   \n`);

  const error = captureError(() => verifyWhitespace(root, { VERIFY_BASE_SHA: baseSha }));

  assert.equal(error.message.includes(syntheticCredential), false);
  assert.match(error.message, /sample\.txt:1 \[whitespace\.trailing\]/);
  assert.match(error.message, /1 finding/);
});

test("direct verifier CLI output redacts whitespace source lines", (t) => {
  const { baseSha, root } = initializeRepository(t);
  const syntheticCredential = `${["syn", "thetic"].join("")}-${"y".repeat(32)}`;
  fs.writeFileSync(path.join(root, "sample.txt"), `apiKey=${syntheticCredential}   \n`);

  const result = spawnSync(process.execPath, [path.join(projectRoot, "scripts", "verify.js")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, VERIFY_BASE_SHA: baseSha },
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;

  assert.notEqual(result.status, 0);
  assert.equal(output.includes(syntheticCredential), false);
  assert.match(output, /sample\.txt:1 \[whitespace\.trailing\]/);
});

test("whitespace verification rejects staged whitespace errors", (t) => {
  const { verifyWhitespace } = require("../scripts/verify");
  const { baseSha, root } = initializeRepository(t);
  fs.writeFileSync(path.join(root, "sample.txt"), "staged trailing spaces   \n");
  git(root, "add", "sample.txt");

  assert.throws(
    () => verifyWhitespace(root, { VERIFY_BASE_SHA: baseSha }),
    /staged whitespace check failed/
  );
});

test("whitespace verification rejects a committed whitespace error in the verify range", (t) => {
  const { verifyWhitespace } = require("../scripts/verify");
  const { baseSha, root } = initializeRepository(t);
  fs.writeFileSync(path.join(root, "sample.txt"), "committed trailing spaces   \n");
  git(root, "add", "sample.txt");
  git(root, "commit", "-m", "introduce whitespace error");

  assert.throws(
    () => verifyWhitespace(root, { VERIFY_BASE_SHA: baseSha }),
    /commit-range whitespace check failed/
  );
});

test("whitespace verification falls back to the parent range when no base SHA is supplied", (t) => {
  const { verifyWhitespace } = require("../scripts/verify");
  const { root } = initializeRepository(t);
  fs.writeFileSync(path.join(root, "sample.txt"), "fallback trailing spaces   \n");
  git(root, "add", "sample.txt");
  git(root, "commit", "-m", "introduce fallback whitespace error");

  assert.throws(() => verifyWhitespace(root, {}), /commit-range whitespace check failed/);
});
