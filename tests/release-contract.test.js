const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

test("release metadata is exactly version 0.7.1 with Obsidian 1.4.0 compatibility", () => {
  const pkg = JSON.parse(read("package.json"));
  const manifest = JSON.parse(read("manifest.json"));
  const versions = JSON.parse(read("versions.json"));

  assert.equal(pkg.version, "0.7.1");
  assert.equal(manifest.version, "0.7.1");
  assert.equal(manifest.minAppVersion, "1.4.0");
  assert.equal(versions["0.7.1"], "1.4.0");
});

test("release verifier validates the 0.7.1 metadata contract", () => {
  const verifier = require(path.join(projectRoot, "scripts", "verify-release.js"));

  assert.equal(verifier.RELEASE_VERSION, "0.7.1");
  assert.deepEqual(verifier.verifyReleaseMetadata(projectRoot), {
    minAppVersion: "1.4.0",
    version: "0.7.1",
  });
});

test("package scripts provide secret scanning, comprehensive verification, and verify-first deployment", () => {
  const scripts = JSON.parse(read("package.json")).scripts;

  assert.equal(scripts.dev, "node esbuild.config.mjs");
  assert.equal(scripts.build, "node esbuild.config.mjs production");
  assert.equal(scripts.typecheck, "tsc --noEmit");
  assert.equal(scripts.test, "node --test");
  assert.equal(scripts["scan:secrets"], "node scripts/secret-scan.js");
  assert.equal(scripts["verify:release"], "node scripts/verify-release.js");
  assert.equal(scripts.verify, "node scripts/verify.js");
  assert.equal(scripts["deploy:local"], "npm run verify && node scripts/deploy-local.js");
});

test("CI verifies pushes and pull requests on a supported Node LTS without credentials", () => {
  const workflow = read(".github/workflows/verify.yml");

  assert.match(workflow, /push:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /node-version:\s*["']?22["']?/);
  assert.match(workflow, /fetch-depth:\s*0/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run verify/);
  assert.match(workflow, /VERIFY_BASE_SHA/);
  assert.match(workflow, /github\.event\.pull_request\.base\.sha/);
  assert.match(workflow, /github\.event\.before/);
  assert.doesNotMatch(workflow, /secrets\.|API_KEY|endpoint:|model:/i);
});

test("README documents the research workbench, installation, development, and privacy contracts", () => {
  const readme = read("README.md").toLowerCase();

  for (const phrase of [
    "research workbench",
    "selectable and copyable",
    "per-pdf",
    "one-click academic translation",
    "summary",
    "rag",
    "main.js",
    "manifest.json",
    "styles.css",
    "npm run dev",
    "npm run verify",
    "npm run deploy:local",
    "single source",
    "data.json",
    "local plaintext",
    "never commit or share",
    "rotate",
    "github secret scanning",
    "push protection",
    "quick-translate marker",
    "separate translation history",
    "translation model",
    "continue model",
  ]) {
    assert.ok(readme.includes(phrase), `README must include: ${phrase}`);
  }
  assert.doesNotMatch(readme, /online paper search|ppt generation/);
});

test("architecture docs define typed module boundaries and future external jobs", () => {
  const architecture = read("docs/architecture.md");

  for (const phrase of [
    "LlmRequest",
    "PaperContext",
    "ResearchAction",
    "extract once",
    "fan out",
    "external adapters",
    "jobs",
    "Python",
    "renderers",
    "Microsoft ResearchStudio",
    "https://github.com/microsoft/ResearchStudio",
  ]) {
    assert.ok(architecture.includes(phrase), `architecture docs must include: ${phrase}`);
  }
});

test("public default endpoint, API key, and model values remain empty", () => {
  const defaults = read("src/default-settings.ts");

  assert.match(defaults, /endpoint:\s*""/);
  assert.match(defaults, /apiKey:\s*""/);
  assert.match(defaults, /model:\s*""/);
});
