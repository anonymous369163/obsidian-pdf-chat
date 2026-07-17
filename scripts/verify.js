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

function npmInvocation(args, environment = process.env) {
  if (environment.npm_execpath) {
    return {
      args: [environment.npm_execpath, ...args],
      command: environment.npm_node_execpath || process.execPath,
    };
  }
  return {
    args,
    command: process.platform === "win32" ? "npm.cmd" : "npm",
  };
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
  const details = `${result.stdout || ""}${result.stderr || ""}`.trim();
  throw new Error(`${label} whitespace check failed${details ? `\n${details}` : ""}`);
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
  const before = fs.readFileSync(bundlePath);
  try {
    build();
  } catch (error) {
    if (fs.existsSync(bundlePath) && !fs.readFileSync(bundlePath).equals(before)) {
      fs.writeFileSync(bundlePath, before);
    }
    throw error;
  }
  const after = fs.readFileSync(bundlePath);
  if (!after.equals(before)) {
    fs.writeFileSync(bundlePath, before);
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
