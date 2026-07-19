#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const PLACEHOLDERS = new Set([
  "CHANGEME",
  "EXAMPLE",
  "PLACEHOLDER",
  "REPLACE_ME",
  "SK-...",
  "SK-YOUR_API_KEY_PLACEHOLDER",
  "YOUR_API_KEY",
  "YOUR_API_TOKEN",
]);

function normalizeFilePath(filePath, root) {
  const displayPath = root && path.isAbsolute(filePath) ? path.relative(root, filePath) : filePath;
  return displayPath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isPlaceholder(value) {
  let normalized = value.trim().toUpperCase();
  if (normalized.startsWith("<") && normalized.endsWith(">")) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized === "" || PLACEHOLDERS.has(normalized);
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let position = 0; position < index; position += 1) {
    if (text.charCodeAt(position) === 10) line += 1;
  }
  return line;
}

const DEPENDENCY_FIELDS = new Set([
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]);

function isSemverDependency(value) {
  return /^[~^]?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value.trim());
}

function isExplicitCredentialField(fieldName) {
  const words = fieldName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .split(/[-_$]+/)
    .filter(Boolean);
  if (words.some((word) => ["key", "token", "secret", "password", "credential"].includes(word))) {
    return true;
  }
  const compact = fieldName.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return [
    /^(?:api|access|auth|client|private|public|signing)key(?:id|value)?$/,
    /^(?:api|auth|client|service)secret(?:id|value)?$/,
    /^(?:api|auth|access|refresh|session|service|client)token(?:id|value)?$/,
    /^(?:db|database|service|user|admin)password(?:hash|value)?$/,
    /^(?:api|auth|client|service|cloud)credential(?:id|value)?$/,
  ].some((credentialShape) => credentialShape.test(compact));
}

function packageLockDependencyVersions(text, file) {
  const versions = new Set();
  if (path.basename(file).toLowerCase() !== "package-lock.json") return versions;
  try {
    JSON.parse(text);
  } catch {
    return versions;
  }

  let cursor = 0;

  function skipWhitespace() {
    while (/\s/.test(text[cursor] || "")) cursor += 1;
  }

  function readString() {
    const start = cursor;
    cursor += 1;
    while (cursor < text.length) {
      if (text[cursor] === "\\") cursor += 2;
      else if (text[cursor] === '"') {
        cursor += 1;
        break;
      } else cursor += 1;
    }
    return { contentStart: start + 1, value: JSON.parse(text.slice(start, cursor)) };
  }

  function parseValue(jsonPath, property) {
    skipWhitespace();
    if (text[cursor] === "{") {
      parseObject(jsonPath);
      return;
    }
    if (text[cursor] === "[") {
      parseArray(jsonPath);
      return;
    }
    if (text[cursor] === '"') {
      const value = readString().value;
      if (
        property &&
        jsonPath.length === 4 &&
        jsonPath[0] === "packages" &&
        DEPENDENCY_FIELDS.has(jsonPath[2]) &&
        isSemverDependency(value)
      ) {
        versions.add(`${property.contentStart}\0${jsonPath[3]}\0${value.trim()}`);
      }
      return;
    }
    while (cursor < text.length && !/[\s,}\]]/.test(text[cursor])) cursor += 1;
  }

  function parseObject(jsonPath) {
    cursor += 1;
    skipWhitespace();
    while (cursor < text.length && text[cursor] !== "}") {
      const property = readString();
      skipWhitespace();
      cursor += 1;
      parseValue([...jsonPath, property.value], property);
      skipWhitespace();
      if (text[cursor] === ",") {
        cursor += 1;
        skipWhitespace();
      }
    }
    cursor += 1;
  }

  function parseArray(jsonPath) {
    cursor += 1;
    skipWhitespace();
    let index = 0;
    while (cursor < text.length && text[cursor] !== "]") {
      parseValue([...jsonPath, String(index)], null);
      index += 1;
      skipWhitespace();
      if (text[cursor] === ",") {
        cursor += 1;
        skipWhitespace();
      }
    }
    cursor += 1;
  }

  parseValue([], null);
  return versions;
}

function isPackageLockDependencyVersion(dependencyVersions, fieldIndex, fieldName, value) {
  return (
    !isExplicitCredentialField(fieldName) &&
    dependencyVersions.has(`${fieldIndex}\0${fieldName}\0${value.trim()}`)
  );
}

function scanText(text, filePath) {
  const file = normalizeFilePath(filePath);
  const dependencyVersions = packageLockDependencyVersions(text, file);
  const findings = [];
  const seen = new Set();

  function addFinding(index, ruleId) {
    const line = lineNumberAt(text, index);
    const key = `${file}:${line}:${ruleId}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ file, line, ruleId });
  }

  const literalPattern =
    /(?:^|[^\w$-])(?:["'`]\s*)?([A-Za-z_$][A-Za-z0-9_$-]*(?:key|token|secret|password|credential)[A-Za-z0-9_$-]*)(?:\s*["'`])?\s*[:=]\s*(["'`])([^"'`\r\n]*)\2/gim;
  for (const match of text.matchAll(literalPattern)) {
    const fieldIndex = match.index + match[0].indexOf(match[1]);
    if (
      !isPlaceholder(match[3]) &&
      !isPackageLockDependencyVersion(dependencyVersions, fieldIndex, match[1], match[3])
    ) {
      addFinding(fieldIndex, "secret.api-key-literal");
    }
  }

  const bearerPattern =
    /\bBearer[ \t]+([A-Za-z0-9._~+/=-]{12,})(?=$|[\s"'`,;)\]}])/gim;
  for (const match of text.matchAll(bearerPattern)) {
    if (!isPlaceholder(match[1])) addFinding(match.index, "secret.bearer-token");
  }

  const providerPattern =
    /\b(?:sk-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,})\b/gi;
  for (const match of text.matchAll(providerPattern)) {
    if (!isPlaceholder(match[0])) addFinding(match.index, "secret.provider-token");
  }

  const privateKeyPattern = /-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----/g;
  for (const match of text.matchAll(privateKeyPattern)) {
    addFinding(match.index, "secret.private-key");
  }

  return findings;
}

function isForbiddenFilename(filePath) {
  const basename = path.basename(filePath).toLowerCase();
  const segments = path
    .normalize(filePath)
    .split(path.sep)
    .map((segment) => segment.toLowerCase());
  return (
    basename === "data.json" ||
    (segments.includes("reader-data") && basename.endsWith(".json")) ||
    basename === ".env" ||
    basename.startsWith(".env.") ||
    basename.endsWith(".key") ||
    basename.endsWith(".pem")
  );
}

function scanFile(filePath, root = process.cwd()) {
  const normalized = normalizeFilePath(filePath, root);
  const findings = [];
  if (isForbiddenFilename(filePath)) {
    findings.push({ file: normalized, line: 1, ruleId: "forbidden.file" });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return findings;
  const text = fs.readFileSync(filePath, "utf8");
  return findings.concat(scanText(text, normalized));
}

function getDefaultScanFiles(root) {
  const trackedOutput = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  });
  const relativePaths = trackedOutput.split("\0").filter(Boolean);
  if (fs.existsSync(path.join(root, "main.js"))) relativePaths.push("main.js");
  return Array.from(new Set(relativePaths)).map((relativePath) => path.resolve(root, relativePath));
}

function scanRepository(root = process.cwd()) {
  return getDefaultScanFiles(root).flatMap((filePath) => scanFile(filePath, root));
}

function formatFinding(finding) {
  return `${finding.file}:${finding.line} [${finding.ruleId}]`;
}

function runCli() {
  const root = process.cwd();
  const findings = scanRepository(root);
  if (findings.length > 0) {
    for (const finding of findings) console.error(formatFinding(finding));
    console.error(`Secret scan failed with ${findings.length} finding(s).`);
    process.exitCode = 1;
    return;
  }
  console.log("Secret scan passed.");
}

if (require.main === module) runCli();

module.exports = {
  formatFinding,
  getDefaultScanFiles,
  isForbiddenFilename,
  isPlaceholder,
  normalizeFilePath,
  scanFile,
  scanRepository,
  scanText,
};
