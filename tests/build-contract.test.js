const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");

test("TypeScript sources build the Obsidian-compatible root bundle through explicit module boundaries", () => {
  const packagePath = path.join(projectRoot, "package.json");
  assert.ok(fs.existsSync(packagePath), "expected package.json to define the build contract");

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  assert.equal(pkg.scripts.dev, "node esbuild.config.mjs");
  assert.equal(pkg.scripts.build, "node esbuild.config.mjs production");
  assert.equal(pkg.scripts.typecheck, "tsc --noEmit");
  assert.equal(pkg.scripts.test, "npm run build && node --test");

  for (const relativePath of [
    "src/main.ts",
    "src/types.ts",
    "src/settings.ts",
    "src/conversation.ts",
    "src/llm-transport.ts",
    "src/paper-context.ts",
    "src/actions.ts",
    "src/pdf-chat-modal.ts",
    "src/settings-tab.ts",
  ]) {
    assert.ok(fs.existsSync(path.join(projectRoot, relativePath)), `expected ${relativePath}`);
  }

  const buildConfig = fs.readFileSync(path.join(projectRoot, "esbuild.config.mjs"), "utf8");
  assert.match(buildConfig, /entryPoints:\s*\[?['"]src\/main\.ts['"]\]?/);
  assert.match(buildConfig, /outfile:\s*['"]main\.js['"]/);
  assert.match(buildConfig, /external:\s*\[?['"]obsidian['"]\]?/);
  assert.match(buildConfig, /format:\s*['"]cjs['"]/);

  const bundle = fs.readFileSync(path.join(projectRoot, "main.js"), "utf8");
  assert.match(bundle, /require\(["']obsidian["']\)/);
  assert.doesNotMatch(bundle, /require\(["']typescript["']\)/);
});
