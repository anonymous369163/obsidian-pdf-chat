const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadBundle() {
  const source = fs.readFileSync(path.join(projectRoot, "main.js"), "utf8");
  class Plugin {}
  class Modal {}
  class PluginSettingTab {}
  class Notice {}
  class Setting {}
  const sandbox = {
    AbortController,
    TextDecoder,
    URL,
    clearTimeout,
    console,
    module: { exports: {} },
    require(request) {
      if (request === "obsidian") {
        return { Plugin, Modal, PluginSettingTab, Notice, Setting, MarkdownRenderer: {}, requestUrl: async () => ({}) };
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    window: {},
  };
  sandbox.exports = sandbox.module.exports;
  sandbox.fetch = async () => {
    throw new Error("Unexpected fetch in unit test");
  };
  vm.runInNewContext(source, sandbox, { filename: "main.js" });
  return sandbox.module.exports;
}

test("short selections pass unchanged without opening a decision modal", async () => {
  const { resolveSelectionForTurn } = loadBundle();
  assert.equal(typeof resolveSelectionForTurn, "function");
  let decisions = 0;
  const result = await resolveSelectionForTurn("short", 10, async () => {
    decisions += 1;
    return "cancel";
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { kind: "all", text: "short", oversized: false });
  assert.equal(decisions, 0);
});

test("oversized selections honor all, exact-prefix, and cancel decisions", async () => {
  const { resolveSelectionForTurn } = loadBundle();
  const text = "0123456789";
  const all = await resolveSelectionForTurn(text, 4, async () => "all");
  const prefix = await resolveSelectionForTurn(text, 4, async () => "prefix");
  const cancel = await resolveSelectionForTurn(text, 4, async () => "cancel");

  assert.deepEqual(JSON.parse(JSON.stringify(all)), { kind: "all", text, oversized: true });
  assert.deepEqual(JSON.parse(JSON.stringify(prefix)), { kind: "prefix", text: "0123", oversized: true });
  assert.deepEqual(JSON.parse(JSON.stringify(cancel)), { kind: "cancel", text: "", oversized: true });
});

test("invalid selection limits are repaired before applying the decision", async () => {
  const { resolveSelectionForTurn } = loadBundle();
  let decisions = 0;
  const result = await resolveSelectionForTurn("text", 0, async () => {
    decisions += 1;
    return "prefix";
  });
  assert.equal(result.kind, "all");
  assert.equal(decisions, 0);
});
