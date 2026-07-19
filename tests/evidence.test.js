const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadBundle(notices = []) {
  const source = fs.readFileSync(path.join(projectRoot, "main.js"), "utf8");
  class Plugin {}
  class Modal {}
  class PluginSettingTab {}
  class Notice {
    constructor(message) {
      notices.push(message);
    }
  }
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
        return {
          Plugin,
          Modal,
          PluginSettingTab,
          Notice,
          Setting,
          MarkdownRenderer: {},
          requestUrl: async () => ({}),
        };
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    setTimeout,
    window: {},
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(source, sandbox, { filename: "main.js" });
  return sandbox.module.exports;
}

const sources = [
  { alias: "P1", paperPath: "papers/renamed-a.pdf", pageCount: 12 },
  { alias: "P2", paperPath: "references/b.pdf", pageCount: 4 },
];

test("paper aliases resolve to the current vault path with a valid PDF page", () => {
  const { parseResearchEvidence } = loadBundle();
  const evidence = parseResearchEvidence(
    "The method converges under the stated assumptions [P1, p.7].",
    sources,
  );

  assert.equal(evidence.length, 1);
  assert.deepEqual(
    {
      paperPath: evidence[0].paperPath,
      page: evidence[0].page,
      sourceAlias: evidence[0].sourceAlias,
      verification: evidence[0].verification,
      claim: evidence[0].claim,
    },
    {
      paperPath: "papers/renamed-a.pdf",
      page: 7,
      sourceAlias: "P1",
      verification: "located",
      claim: "The method converges under the stated assumptions.",
    },
  );
  assert.ok(evidence[0].id);
});

test("Obsidian PDF page links are parsed without rewriting the visible Markdown", () => {
  const { parseResearchEvidence } = loadBundle();
  const markdown = "See [[references/b.pdf#page=3|B, page 3]] for the ablation.";
  const evidence = parseResearchEvidence(markdown, sources);

  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].paperPath, "references/b.pdf");
  assert.equal(evidence[0].page, 3);
  assert.equal(evidence[0].sourceAlias, "P2");
  assert.equal(evidence[0].verification, "located");
  assert.equal(markdown, "See [[references/b.pdf#page=3|B, page 3]] for the ablation.");
});

test("unknown aliases and invalid pages remain visible but unverified", () => {
  const { parseResearchEvidence } = loadBundle();
  const evidence = parseResearchEvidence(
    "Unknown [P9, p.999]. Zero [P1, p.0]. Negative [P2, p.-2]. Beyond [P2, p.5].",
    sources,
  );

  assert.equal(evidence.length, 4);
  assert.ok(evidence.every((item) => item.verification === "unverified"));
  assert.equal(evidence[0].paperPath, undefined);
  assert.equal(evidence[1].paperPath, "papers/renamed-a.pdf");
  assert.equal(evidence[3].paperPath, "references/b.pdf");
});

test("missing Obsidian paths are unverified and duplicate citations are collapsed", () => {
  const { parseResearchEvidence } = loadBundle();
  const evidence = parseResearchEvidence(
    "The result is significant [P1, p.7] [P1, p.7].\nMissing [[old/a.pdf#page=2|old page]].",
    sources,
  );

  assert.equal(evidence.length, 2);
  assert.equal(evidence[0].verification, "located");
  assert.equal(evidence[1].verification, "unverified");
  assert.equal(evidence[1].paperPath, "old/a.pdf");
});

test("ordinary bracket text and unrelated links are ignored", () => {
  const { parseResearchEvidence } = loadBundle();
  assert.equal(
    parseResearchEvidence("Use [Adam, beta=0.9] and [[notes/method.md|method notes]].", sources).length,
    0,
  );
});

test("located evidence opens the exact PDF page and refuses unverified evidence", async () => {
  const notices = [];
  const { openPdfEvidence } = loadBundle(notices);
  const opened = [];
  const file = { path: "papers/renamed-a.pdf", extension: "pdf" };
  const app = {
    vault: {
      getAbstractFileByPath(candidate) {
        return candidate === file.path ? file : null;
      },
    },
    workspace: {
      async openLinkText(link, sourcePath, newLeaf) {
        opened.push({ link, sourcePath, newLeaf });
      },
    },
  };

  assert.equal(
    await openPdfEvidence(app, {
      id: "ev-1",
      claim: "claim",
      paperPath: file.path,
      page: 7,
      sourceAlias: "P1",
      verification: "located",
      raw: "[P1, p.7]",
    }),
    true,
  );
  assert.deepEqual(opened, [
    { link: "papers/renamed-a.pdf#page=7", sourcePath: "", newLeaf: false },
  ]);

  assert.equal(
    await openPdfEvidence(app, {
      id: "ev-2",
      claim: "claim",
      sourceAlias: "P9",
      verification: "unverified",
      raw: "[P9, p.3]",
    }),
    false,
  );
  assert.match(notices.at(-1), /无法定位|未验证/);
});
