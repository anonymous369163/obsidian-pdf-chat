#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const RELEASE_FILES = ["main.js", "manifest.json", "styles.css"];

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readManifest(manifestPath, label) {
  if (!fs.existsSync(manifestPath)) throw new Error(`${label} manifest does not exist`);
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error(`${label} manifest is not valid JSON`);
  }
}

function ensureValidSource(sourceRoot) {
  for (const filename of RELEASE_FILES) {
    const sourcePath = path.join(sourceRoot, filename);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
      throw new Error(`release source is missing ${filename}`);
    }
  }
  const manifest = readManifest(path.join(sourceRoot, "manifest.json"), "release source");
  if (manifest.id !== "pdf-chat") throw new Error('expected release manifest id "pdf-chat"');
}

function ensureValidTarget(targetDir) {
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    throw new Error("target plugin directory does not exist");
  }
  const manifest = readManifest(path.join(targetDir, "manifest.json"), "target");
  if (manifest.id !== "pdf-chat") throw new Error('expected target manifest id "pdf-chat"');
}

function defaultBackupRoot() {
  const applicationData =
    process.env.LOCALAPPDATA ||
    process.env.XDG_DATA_HOME ||
    (process.platform === "darwin"
      ? path.join(os.homedir(), "Library", "Application Support")
      : path.join(os.homedir(), ".local", "share"));
  return path.join(applicationData, "pdf-chat", "backups");
}

function isInside(parentPath, candidatePath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function timestampFor(date) {
  return date.toISOString().replace(/[-:.]/g, "");
}

function nextBackupDirectory(backupRoot, now) {
  const base = path.join(backupRoot, `pdf-chat-${timestampFor(now)}`);
  let candidate = base;
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function deployRelease(options) {
  const sourceRoot = path.resolve(options.sourceRoot || path.resolve(__dirname, ".."));
  const targetDir = path.resolve(options.targetDir);
  const backupRoot = path.resolve(options.backupRoot || defaultBackupRoot());
  const now = options.now ? options.now() : new Date();

  ensureValidSource(sourceRoot);
  if (isInside(sourceRoot, targetDir)) {
    throw new Error("target directory must be outside the repository");
  }
  ensureValidTarget(targetDir);
  if (isInside(sourceRoot, backupRoot)) {
    throw new Error("backup directory must be outside the repository");
  }

  const dataPath = path.join(targetDir, "data.json");
  const dataHashBefore = fs.existsSync(dataPath) ? sha256File(dataPath) : null;
  const backupDir = nextBackupDirectory(backupRoot, now);
  fs.mkdirSync(backupRoot, { recursive: true });
  fs.cpSync(targetDir, backupDir, { errorOnExist: true, recursive: true });

  const files = [];
  for (const filename of RELEASE_FILES) {
    const sourcePath = path.join(sourceRoot, filename);
    const targetPath = path.join(targetDir, filename);
    fs.copyFileSync(sourcePath, targetPath);
    const sourceHash = sha256File(sourcePath);
    const targetHash = sha256File(targetPath);
    if (sourceHash !== targetHash) throw new Error(`hash verification failed for ${filename}`);
    files.push({ filename, sourceHash, targetHash, status: "verified" });
  }

  const dataHashAfter = fs.existsSync(dataPath) ? sha256File(dataPath) : null;
  if (dataHashBefore !== dataHashAfter) throw new Error("data.json changed during deployment");

  return {
    backupDir,
    dataStatus: dataHashBefore === null ? "absent" : "preserved",
    files,
  };
}

function parseTarget(argv, environment) {
  let targetDir = environment.PDF_CHAT_PLUGIN_DIR || "";
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--target") throw new Error(`unknown argument: ${argv[index]}`);
    if (!argv[index + 1]) throw new Error("--target requires a path");
    targetDir = argv[index + 1];
    index += 1;
  }
  if (!targetDir) throw new Error("provide --target <path> or PDF_CHAT_PLUGIN_DIR");
  return targetDir;
}

function runCli() {
  try {
    const targetDir = parseTarget(process.argv.slice(2), process.env);
    const result = deployRelease({ targetDir });
    console.log("Pre-deploy backup created.");
    for (const file of result.files) console.log(`${file.filename}: ${file.status}`);
    console.log(`data.json: ${result.dataStatus}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "local deployment failed");
    process.exitCode = 1;
  }
}

if (require.main === module) runCli();

module.exports = {
  RELEASE_FILES,
  defaultBackupRoot,
  deployRelease,
  isInside,
  parseTarget,
  sha256File,
};
