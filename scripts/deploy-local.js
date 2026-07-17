#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const RELEASE_FILES = ["main.js", "manifest.json", "styles.css"];

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function lstatIfExists(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function realpath(filePath) {
  return fs.realpathSync.native ? fs.realpathSync.native(filePath) : fs.realpathSync(filePath);
}

function canonicalizePotentialPath(filePath) {
  const suffix = [];
  let existingPath = path.resolve(filePath);
  let stats = lstatIfExists(existingPath);
  while (!stats) {
    const parent = path.dirname(existingPath);
    if (parent === existingPath) throw new Error(`no existing parent for ${filePath}`);
    suffix.unshift(path.basename(existingPath));
    existingPath = parent;
    stats = lstatIfExists(existingPath);
  }
  const canonicalParent = realpath(existingPath);
  const canonicalStats = fs.statSync(canonicalParent);
  if (suffix.length > 0 && !canonicalStats.isDirectory()) {
    throw new Error("backup parent must be a directory");
  }
  return path.join(canonicalParent, ...suffix);
}

function assertRegularUnlinked(filePath, label, allowMissing = false) {
  const stats = lstatIfExists(filePath);
  if (!stats) {
    if (allowMissing) return false;
    throw new Error(`${label} must be a regular single-link file`);
  }
  if (stats.isSymbolicLink() || !stats.isFile() || stats.nlink !== 1) {
    throw new Error(`${label} must be a regular single-link file`);
  }
  return true;
}

function readManifest(manifestPath, label) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error(`${label} manifest is not valid JSON`);
  }
}

function canonicalSourceRoot(sourceRoot) {
  const absolute = path.resolve(sourceRoot);
  const stats = fs.statSync(absolute);
  if (!stats.isDirectory()) throw new Error("release source must be a directory");
  const canonical = realpath(absolute);
  for (const filename of RELEASE_FILES) {
    assertRegularUnlinked(path.join(canonical, filename), `release source ${filename}`);
  }
  const manifest = readManifest(path.join(canonical, "manifest.json"), "release source");
  if (manifest.id !== "pdf-chat") throw new Error('expected release manifest id "pdf-chat"');
  return canonical;
}

function canonicalTargetRoot(targetDir) {
  const absolute = path.resolve(targetDir);
  const stats = lstatIfExists(absolute);
  if (!stats || stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error("target directory must be a real directory, not a link");
  }
  return realpath(absolute);
}

function preflightTarget(targetDir) {
  for (const filename of RELEASE_FILES) {
    assertRegularUnlinked(
      path.join(targetDir, filename),
      filename === "manifest.json" ? "target manifest" : `target ${filename}`,
      filename !== "manifest.json"
    );
  }
  const manifest = readManifest(path.join(targetDir, "manifest.json"), "target");
  if (manifest.id !== "pdf-chat") throw new Error('expected target manifest id "pdf-chat"');
  assertRegularUnlinked(path.join(targetDir, "data.json"), "target data.json", true);
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

function createFileOps(overrides = {}) {
  return {
    copyFile: overrides.copyFile || ((source, destination) => fs.copyFileSync(source, destination)),
    copyTree:
      overrides.copyTree ||
      ((source, destination) => fs.cpSync(source, destination, { errorOnExist: true, recursive: true })),
    hashFile: overrides.hashFile || sha256File,
    removeFile: overrides.removeFile || ((filePath) => fs.rmSync(filePath, { force: true })),
    removeTree:
      overrides.removeTree ||
      ((directory) => fs.rmSync(directory, { force: true, recursive: true })),
  };
}

function validateReleaseSnapshot(directory, label) {
  for (const filename of RELEASE_FILES) {
    assertRegularUnlinked(
      path.join(directory, filename),
      `${label} ${filename}`,
      filename !== "manifest.json"
    );
  }
  assertRegularUnlinked(path.join(directory, "data.json"), `${label} data.json`, true);
}

function rollbackReleaseFiles(targetDir, backupDir, fileOps) {
  const failures = [];
  for (const filename of RELEASE_FILES) {
    const backupPath = path.join(backupDir, filename);
    const targetPath = path.join(targetDir, filename);
    try {
      const backupExists = assertRegularUnlinked(
        backupPath,
        `rollback backup ${filename}`,
        true
      );
      assertRegularUnlinked(targetPath, `rollback target ${filename}`, true);
      if (backupExists) {
        fileOps.copyFile(backupPath, targetPath);
        assertRegularUnlinked(targetPath, `restored target ${filename}`);
      } else {
        fileOps.removeFile(targetPath);
      }
    } catch (error) {
      failures.push(`${filename}: ${error instanceof Error ? error.message : "rollback failed"}`);
    }
  }
  return failures;
}

function deploymentFailure(error, backupDir, rollbackFailures) {
  const reason = error instanceof Error ? error.message : "local deployment failed";
  const rollbackStatus =
    rollbackFailures.length === 0
      ? "release files restored"
      : `rollback errors: ${rollbackFailures.join("; ")}`;
  const wrapped = new Error(`${reason}; ${rollbackStatus}; backup: ${backupDir}`);
  wrapped.backupDir = backupDir;
  wrapped.cause = error;
  return wrapped;
}

function deployRelease(options) {
  const sourceRoot = canonicalSourceRoot(options.sourceRoot || path.resolve(__dirname, ".."));
  const targetDir = canonicalTargetRoot(options.targetDir);
  if (isInside(sourceRoot, targetDir)) {
    throw new Error("target directory must be outside the repository");
  }
  preflightTarget(targetDir);

  const requestedBackupRoot = options.backupRoot || defaultBackupRoot();
  const backupRoot = canonicalizePotentialPath(requestedBackupRoot);
  if (isInside(sourceRoot, backupRoot)) {
    throw new Error("backup directory must be outside the repository");
  }
  if (isInside(targetDir, backupRoot)) {
    throw new Error("backup directory must be outside the target plugin directory");
  }

  const fileOps = createFileOps(options.fileOps);
  const dataPath = path.join(targetDir, "data.json");
  const now = options.now ? options.now() : new Date();
  const backupDir = nextBackupDirectory(backupRoot, now);
  fs.mkdirSync(backupRoot, { recursive: true });
  try {
    fileOps.copyTree(targetDir, backupDir);
    validateReleaseSnapshot(backupDir, "backup");
  } catch (error) {
    throw deploymentFailure(error, backupDir, []);
  }

  let stageDir = null;
  let result = null;
  let primaryError = null;
  try {
    const dataHashBefore = fs.existsSync(dataPath) ? fileOps.hashFile(dataPath) : null;
    stageDir = fs.mkdtempSync(path.join(backupRoot, ".pdf-chat-stage-"));
    const stagedFiles = [];
    for (const filename of RELEASE_FILES) {
      const sourcePath = path.join(sourceRoot, filename);
      const stagePath = path.join(stageDir, filename);
      fileOps.copyFile(sourcePath, stagePath);
      assertRegularUnlinked(stagePath, `staged ${filename}`);
      const sourceHash = fileOps.hashFile(sourcePath);
      const stagedHash = fileOps.hashFile(stagePath);
      if (sourceHash !== stagedHash) throw new Error(`staging hash verification failed for ${filename}`);
      stagedFiles.push({ filename, sourceHash, stagePath });
    }

    const files = [];
    for (const staged of stagedFiles) {
      const targetPath = path.join(targetDir, staged.filename);
      fileOps.copyFile(staged.stagePath, targetPath);
      assertRegularUnlinked(targetPath, `deployed target ${staged.filename}`);
      const targetHash = fileOps.hashFile(targetPath);
      if (staged.sourceHash !== targetHash) {
        throw new Error(`hash verification failed for ${staged.filename}`);
      }
      files.push({
        filename: staged.filename,
        sourceHash: staged.sourceHash,
        targetHash,
        status: "verified",
      });
    }

    const dataHashAfter = fs.existsSync(dataPath) ? fileOps.hashFile(dataPath) : null;
    if (dataHashBefore !== dataHashAfter) throw new Error("data.json changed during deployment");

    result = {
      backupDir,
      dataStatus: dataHashBefore === null ? "absent" : "preserved",
      files,
    };
  } catch (error) {
    primaryError = error;
  }

  let cleanupError = null;
  if (stageDir) {
    try {
      fileOps.removeTree(stageDir);
    } catch (error) {
      cleanupError = error;
    }
  }

  if (!primaryError && !cleanupError) return result;

  let failure = primaryError || cleanupError;
  if (primaryError && cleanupError) {
    const primaryReason = primaryError instanceof Error ? primaryError.message : "local deployment failed";
    const cleanupReason = cleanupError instanceof Error ? cleanupError.message : "staging cleanup failed";
    failure = new Error(`${primaryReason}; staging cleanup also failed: ${cleanupReason}`);
    failure.cause = primaryError;
  }
  const rollbackFailures = rollbackReleaseFiles(targetDir, backupDir, fileOps);
  throw deploymentFailure(failure, backupDir, rollbackFailures);
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
  canonicalizePotentialPath,
  defaultBackupRoot,
  deployRelease,
  isInside,
  parseTarget,
  sha256File,
};
