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
  assert.equal(pkg.scripts.test, "node --test");

  for (const relativePath of [
    "src/main.ts",
    "src/types.ts",
    "src/settings.ts",
    "src/conversation.ts",
    "src/llm-transport.ts",
    "src/paper-context.ts",
    "src/actions.ts",
    "src/model-routing.ts",
    "src/pdf-chat-modal.ts",
    "src/quick-translate-marker.ts",
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
  assert.match(bundle, /^\/\/ PDF Chat 0\.7\.0$/m);
  assert.match(bundle, /require\(["']obsidian["']\)/);
  assert.doesNotMatch(bundle, /require\(["']typescript["']\)/);
});

test("every TypeScript source participates in typechecking without file-wide suppression", () => {
  const srcDir = path.join(projectRoot, "src");
  const suppressed = fs
    .readdirSync(srcDir)
    .filter((name) => name.endsWith(".ts"))
    .filter((name) => fs.readFileSync(path.join(srcDir, name), "utf8").includes("@ts-nocheck"));

  assert.deepEqual(suppressed, []);
});

test("the npm and CI TypeScript configuration enables full strict mode", () => {
  const tsconfig = JSON.parse(fs.readFileSync(path.join(projectRoot, "tsconfig.json"), "utf8"));

  assert.equal(tsconfig.compilerOptions.strict, true);
});
