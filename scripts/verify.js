#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function commandResult(command, args, root, stdio = "pipe") {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: stdio === "pipe" ? "utf8" : undefined,
    env: process.env,
    stdio,
  });
  if (result.error) throw result.error;
  return result;
}

function runCommand(command, args, root, label) {
  const result = commandResult(command, args, root, "inherit");
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`);
}

function resolveNpmCli(environment, executable) {
  const candidates = [];
  if (environment.npm_execpath) candidates.push(environment.npm_execpath);
  const executableDirectory = path.dirname(executable);
  candidates.push(
    path.join(executableDirectory, "node_modules", "npm", "bin", "npm-cli.js"),
    path.resolve(executableDirectory, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
    path.resolve(executableDirectory, "..", "share", "nodejs", "npm", "bin", "npm-cli.js")
  );
  try {
    candidates.push(path.join(path.dirname(require.resolve("npm/package.json")), "bin", "npm-cli.js"));
  } catch {
    // npm is commonly installed beside Node instead of exposed as a resolvable package.
  }
  const npmCli = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!npmCli) throw new Error("unable to resolve npm-cli.js from the Node.js installation");
  return npmCli;
}

function npmInvocation(args, environment = process.env, executable = process.execPath) {
  const npmCli = resolveNpmCli(environment, executable);
  return { args: [npmCli, ...args], command: executable };
}

function gitValue(root, args) {
  const result = commandResult("git", args, root);
  return result.status === 0 ? result.stdout.trim() : "";
}

function commitExists(root, revision) {
  if (!revision) return false;
  return commandResult("git", ["cat-file", "-e", `${revision}^{commit}`], root).status === 0;
}

function mergeBase(root, revision) {
  return gitValue(root, ["merge-base", "HEAD", revision]);
}

function resolveVerifyBase(root, environment) {
  const supplied = (environment.VERIFY_BASE_SHA || "").trim();
  if (supplied && !/^0+$/.test(supplied) && commitExists(root, supplied)) {
    return mergeBase(root, supplied) || supplied;
  }

  const refs = [];
  if (environment.GITHUB_BASE_REF) refs.push(`origin/${environment.GITHUB_BASE_REF}`);
  refs.push("origin/main", "origin/master");
  for (const revision of refs) {
    if (!commitExists(root, revision)) continue;
    const base = mergeBase(root, revision);
    if (base) return base;
  }

  return gitValue(root, ["rev-parse", "--verify", "HEAD^"]);
}

function checkWhitespace(root, args, label) {
  const result = commandResult("git", ["diff", "--check", ...args], root);
  if (result.status === 0) return;
  const categories = new Map([
    ["trailing whitespace", "whitespace.trailing"],
    ["space before tab in indent", "whitespace.space-before-tab"],
    ["new blank line at EOF", "whitespace.blank-eof"],
  ]);
  const findings = [];
  for (const line of `${result.stdout || ""}${result.stderr || ""}`.split(/\r?\n/)) {
    const match = /^(.*):(\d+): (trailing whitespace|space before tab in indent|new blank line at EOF)\.?$/.exec(
      line
    );
    if (!match) continue;
    findings.push(`${match[1].replace(/\\/g, "/")}:${match[2]} [${categories.get(match[3])}]`);
  }
  if (findings.length === 0) findings.push("<repository>:0 [whitespace.unclassified]");
  throw new Error(
    `${label} whitespace check failed with ${findings.length} finding(s)\n${findings.join("\n")}`
  );
}

function verifyWhitespace(root, environment = process.env) {
  checkWhitespace(root, [], "working-tree");
  checkWhitespace(root, ["--cached"], "staged");
  const base = resolveVerifyBase(root, environment);
  if (base) checkWhitespace(root, [`${base}...HEAD`], "commit-range");
  return base;
}

function verifyBundleCurrent(root, build) {
  const bundlePath = path.join(root, "main.js");
  const existedBefore = fs.existsSync(bundlePath);
  const before = existedBefore ? fs.readFileSync(bundlePath) : null;
  const restore = () => {
    if (existedBefore) fs.writeFileSync(bundlePath, before);
    else fs.rmSync(bundlePath, { force: true });
  };
  try {
    build();
  } catch (error) {
    restore();
    throw error;
  }
  const existsAfter = fs.existsSync(bundlePath);
  const changed = existedBefore
    ? !existsAfter || !fs.readFileSync(bundlePath).equals(before)
    : existsAfter;
  if (changed) {
    restore();
    throw new Error("main.js was stale before the production build; run npm run build and commit it");
  }
}

function runVerification(root = process.cwd(), environment = process.env) {
  const runNpm = (args, label) => {
    const invocation = npmInvocation(args, environment);
    runCommand(invocation.command, invocation.args, root, label);
  };
  verifyWhitespace(root, environment);
  runNpm(["run", "typecheck"], "strict typecheck");
  verifyBundleCurrent(root, () => runNpm(["run", "build"], "production build"));
  runNpm(["test"], "full tests");
  runNpm(["run", "scan:secrets"], "secret scan");
  runNpm(["run", "verify:release"], "release metadata verification");
  runCommand(process.execPath, ["--check", "main.js"], root, "bundle syntax check");
  console.log("Verification passed.");
}

function runCli() {
  try {
    runVerification();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "verification failed");
    process.exitCode = 1;
  }
}

if (require.main === module) runCli();

module.exports = {
  npmInvocation,
  resolveVerifyBase,
  runVerification,
  verifyBundleCurrent,
  verifyWhitespace,
};
