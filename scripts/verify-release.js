#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const RELEASE_VERSION = "0.5.0";
const MIN_APP_VERSION = "1.4.0";

function readJson(root, filename) {
  return JSON.parse(fs.readFileSync(path.join(root, filename), "utf8"));
}

function verifyReleaseMetadata(root = process.cwd()) {
  const pkg = readJson(root, "package.json");
  const manifest = readJson(root, "manifest.json");
  const versions = readJson(root, "versions.json");
  const failures = [];
  if (pkg.version !== RELEASE_VERSION) failures.push("package.json version must be 0.5.0");
  if (manifest.version !== RELEASE_VERSION) failures.push("manifest.json version must be 0.5.0");
  if (manifest.id !== "pdf-chat") failures.push("manifest.json id must be pdf-chat");
  if (manifest.minAppVersion !== MIN_APP_VERSION) {
    failures.push("manifest.json minAppVersion must be 1.4.0");
  }
  if (versions[RELEASE_VERSION] !== MIN_APP_VERSION) {
    failures.push("versions.json must map 0.5.0 to 1.4.0");
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
  return { minAppVersion: MIN_APP_VERSION, version: RELEASE_VERSION };
}

function runCli() {
  try {
    verifyReleaseMetadata();
    console.log("Release metadata verified: 0.5.0 / Obsidian 1.4.0.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "release metadata verification failed");
    process.exitCode = 1;
  }
}

if (require.main === module) runCli();

module.exports = { MIN_APP_VERSION, RELEASE_VERSION, verifyReleaseMetadata };
