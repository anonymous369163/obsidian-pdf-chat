const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

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

test("whitespace verification rejects working-tree whitespace errors", (t) => {
  const { verifyWhitespace } = require("../scripts/verify");
  const { baseSha, root } = initializeRepository(t);
  fs.writeFileSync(path.join(root, "sample.txt"), "working trailing spaces   \n");

  assert.throws(
    () => verifyWhitespace(root, { VERIFY_BASE_SHA: baseSha }),
    /working-tree whitespace check failed/
  );
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
