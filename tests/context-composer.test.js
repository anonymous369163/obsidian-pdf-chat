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

function makeTranscript(turnCount) {
  const messages = [];
  for (let index = 0; index < turnCount; index += 1) {
    messages.push(
      { role: "user", content: `question-${index} ${"q".repeat(100)}` },
      { role: "assistant", content: `answer-${index} ${"a".repeat(140)}` }
    );
  }
  return messages;
}

function totalChars(messages) {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}

test("context composer keeps the current question and newest complete turns within budget", () => {
  const { composeBoundedContext } = loadBundle();
  assert.equal(typeof composeBoundedContext, "function");
  const transcript = makeTranscript(60);
  const result = composeBoundedContext({
    system: `system ${"s".repeat(180)}`,
    transcript,
    currentUser: "current question",
    currentContext: `paper evidence ${"e".repeat(300)}`,
    memory: "older discussion memory",
    maxInputChars: 4000,
    minRecentTurns: 6,
  });

  assert.equal(result.messages.at(-1).content, `paper evidence ${"e".repeat(300)}\n\ncurrent question`);
  assert.ok(result.omittedMessageCount > 0);
  assert.ok(totalChars(result.messages) <= 4000);
  for (let index = 54; index < 60; index += 1) {
    assert.ok(result.messages.some((message) => message.content.startsWith(`question-${index} `)));
    assert.ok(result.messages.some((message) => message.content.startsWith(`answer-${index} `)));
  }
});

test("context composer uses memory before recent turns without exceeding the hard limit", () => {
  const { composeBoundedContext } = loadBundle();
  const result = composeBoundedContext({
    system: "system",
    transcript: makeTranscript(20),
    currentUser: "question",
    currentContext: "evidence",
    memory: `remembered ${"m".repeat(300)}`,
    maxInputChars: 2500,
    minRecentTurns: 4,
  });

  assert.equal(result.messages[1].role, "system");
  assert.match(result.messages[1].content, /较早对话摘要/);
  assert.ok(totalChars(result.messages) <= 2500);
});

test("mandatory current input is truncated deterministically when it alone exceeds the budget", () => {
  const { composeBoundedContext } = loadBundle();
  const result = composeBoundedContext({
    system: "system",
    transcript: [],
    currentUser: `question ${"q".repeat(500)}`,
    currentContext: `context ${"c".repeat(500)}`,
    maxInputChars: 300,
    minRecentTurns: 6,
  });

  assert.ok(totalChars(result.messages) <= 300);
  assert.match(result.messages.at(-1).content, /question/);
  assert.equal(result.currentInputTruncated, true);
});
