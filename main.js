const {
  Plugin,
  Modal,
  Notice,
  PluginSettingTab,
  Setting,
  requestUrl,
  MarkdownRenderer,
} = require("obsidian");

const DEFAULT_SETTINGS = {
  models: [
    {
      id: "openai-compatible",
      name: "OpenAI-compatible API",
      endpoint: "",
      apiKey: "",
      model: "",
    },
  ],
  activeModelId: "openai-compatible",
  temperature: 0.7,
  maxTokens: 1200,
  stream: true,
  // 弹窗里聊天内容(上下文预览/对话气泡/输入框)的字体缩放比例,可在弹窗标题栏用 A-/A+ 调整,会记住上次的值。
  fontScale: 1,
  // 记住上一次对话用的模型/阅读模式,下次打开弹窗直接沿用,不用每次重新选。
  lastModelId: "",
  lastPresetId: "",
  systemPrompt:
    "你是我的阅读助手。请结合下面提供的原文片段回答我的问题。\n" +
    "1. 优先基于原文片段回答,不要脱离它另起炉灶。\n" +
    "2. 如果问题在原文片段中找不到依据,请明确说明,不要编造。\n" +
    "3. 直接输出回答内容,不要复述规则,不要加“根据原文...”这类套话开头。\n" +
    "4. 后续追问要结合之前的对话上下文,保持连贯。",
  // 全文摘要(浓缩上下文)相关设置:先用一个快速/便宜的模型把整篇 PDF 浓缩成摘要,
  // 缓存下来,回答局部选段问题时可以选择性地附带这份摘要作为背景,
  // 而不是把全文原样塞进上下文导致跑题或超长。
  summaryModelId: "openai-compatible",
  // 打开 PDF 划词弹窗时,如果已经缓存过摘要就自动附带、没缓存就自动生成一次,
  // 不需要每次手动勾选/点击,配合下面的按文件+mtime 缓存,同一篇论文只会真正调用一次摘要模型。
  autoDocSummary: true,
  summaryMaxChars: 100000,
  // 摘要输出单独限制 token 数,避免和主聊天的 maxTokens 共用同一个上限导致摘要写得又长又碎。
  summaryMaxTokens: 700,
  summaryPrompt:
    "你是一个学术论文提炼助手。下面会给你一篇论文的全文(可能因篇幅过长被截断)。\n" +
    "请提炼一份*极简*的背景摘要卡片,只用来给我之后针对论文里某一小段提问时提供背景参考,不是完整摘要,我不会通篇读它。\n" +
    "硬性要求(务必遵守):\n" +
    "1. 总字数不超过400字,宁可少写也不要多写,这是硬上限,不要因为原文长就写更多。\n" +
    "2. 只保留:研究主题与核心贡献(1-2句)、总体结构(每节一句话带过,不展开细节)、3-5个关键术语的极简释义、核心方法/论证逻辑(2-3句)。\n" +
    "3. 不逐段复述、不举例、不引用原文长句、不写背景知识科普段落。\n" +
    "4. 直接输出内容,不要“好的,以下是摘要”之类的开场白或结尾总结。用中文,专业术语保留英文原词。",
  // key 是文件的 vault 相对路径,value 形如 { mtime, summary, generatedAt, fullLength, truncated }
  docSummaries: {},
  // RAG 检索(关键词/BM25,不依赖任何 embedding 模型):把全文按页切块,提问时按关键词相关性
  // 检索出最相关的几块塞进上下文,跟"全文摘要"是互补关系——摘要给全局背景,这个给具体细节定位。
  autoRag: true,
  ragChunkSize: 700,
  ragChunkOverlap: 100,
  ragTopK: 4,
  // 实测发现:BM25 关键词检索对"列举类"问题(比如"论文对比了哪些基线算法")天然不擅长——
  // 真正答案段落里全是专有名词而不是"对比/baseline"这类通用词,反而会被论文里其他大量提到
  // "对比/baseline"的段落(相关工作、附录补充实验等)挤到检索排名前面,漏掉真正该看的那一块。
  // 而大部分单篇论文全文并不长,直接把全文原样交给模型远比"猜哪一块"更准。所以全文长度在这个
  // 阈值以内时,直接读全文回答,只有超过阈值(全文塞不下)时才退回关键词检索。
  ragFullTextThreshold: 180000,
  // BM25 是纯字符匹配,中文问题和英文论文原文之间没有共同字符/词,直接检索基本会全部落空。
  // 开启后,提问时会先让一个快模型"思考"这个问题该从哪几个角度/说法去检索,输出多组中英双语检索词
  // (不只是逐字翻译),再拿每一组分别去检索、把结果融合排序,比单一检索词能覆盖更多角度、找得更全。
  ragQueryTranslate: true,
  ragQueryPrompt:
    "你是论文检索策略助手,任务是把我的问题拆解成多组“检索关键词”,用于在论文全文里做关键词检索。你不负责回答问题本身。\n" +
    "论文原文可能是英文,也可能是中文,你并不确定,所以每一组关键词都要中英文兼顾。\n" +
    "在心里(不要输出过程)按这个思路思考:\n" +
    "1. 这个问题真正想知道的是什么?按论文的常见结构,答案大概率会出现在方法/数据/实验设置/结果/局限/相关工作里的哪一部分?\n" +
    "2. 论文作者描述这个概念时,可能会用哪些不同的说法(同义词、更学术化的表达、常见缩写、对应的公式符号或变量名)?\n" +
    "3. 如果这个问题包含多个子问题或多个概念,能不能拆成几个更具体、更容易分别命中原文的检索角度?\n" +
    "输出恰好3行,每行是一组独立的检索关键词/短语(同一行内多个关键词用逗号分隔),3行要代表3个不同角度或不同说法的检索尝试," +
    "不要3行都是同一个意思的重复表达。\n" +
    "直接输出这3行,不要编号、不要解释、不要输出问题本身、不要输出这3行以外的任何文字。",
  // key 是文件的 vault 相对路径,value 形如 { mtime, chunks: [{page, text}], generatedAt }
  docChunks: {},
  // 每篇 PDF(或精确匹配的非 PDF 选区)只保存一份最近对话。这里只存用户实际看到的问答,
  // 不保存 system prompt、全文或 RAG 检索片段,避免 data.json 被隐藏上下文快速撑大。
  conversationHistories: {},
  promptPresets: [
    {
      id: "paper-map",
      name: "论文速读地图",
      prompt:
        "你是一位专业的学术论文速读助手。论文不是故事,不要从头读到尾——先给出全局地图,再决定哪些部分值得深读。\n" +
        "回答时优先给出:分节速览(2-3句话/节)、核心因果链(A→B→C)、值不值得深读的优先级判断(高/中/低)。用中文,专业术语保留英文原词。",
    },
    {
      id: "methods-decoder",
      name: "方法论解码",
      prompt:
        "你是一位擅长把复杂研究方法翻译成大白话的助手,同时是挑剔的方法论审查者。\n" +
        "回答时说明:研究设计是什么(类比讲解)、关键要素(样本/变量/分析方法)、这个设计强在哪、弱在哪(每条说明会导致结论在什么情况下不成立)。用中文,专业术语保留英文原词。",
    },
    {
      id: "limitations",
      name: "局限与假设",
      prompt:
        "你是一位严谨的论文评审者。每篇论文都有局限——有些作者自己承认,有些藏在设计里没说。\n" +
        "回答时区分:作者明说的局限 vs 没说但暗含的假设(每条说明假设不成立会怎样影响结论),并给出结论可信度的整体判断。用中文,专业术语保留英文原词。",
    },
    {
      id: "reproducibility",
      name: "复现性检查",
      prompt:
        "你是一位专注于可复现性的审查者,参考 FAIR 原则的思路,但会按论文所属领域自行判断合理标准。\n" +
        "回答时按:数据可获得性、代码与环境、流程步骤、参数透明度四个维度评估,最后给出低/中/高复现性评级和最缺的三样东西。用中文,专业术语保留英文原词。",
    },
    {
      id: "math",
      name: "数学符号讲解",
      prompt:
        "你是一位擅长把公式和符号翻译成大白话的助手,假设我具备基础的该领域知识,但记不清具体符号约定。\n" +
        "回答时逐个符号讲解含义、说明公式在算什么、为什么这个公式对论点关键,如果可能给一个极简数值例子帮助建立直觉。用中文,符号本身保留原样。",
    },
    {
      id: "critic",
      name: "批判性审读",
      prompt:
        "你是一位逻辑审查者和辩证分析者。你的任务不是同意论文,而是提供有价值的阻力——帮我把理解推进到能挑出毛病。\n" +
        "回答时可以包含:被忽略的替代路径、逻辑漏洞(谬误/语义跳跃)、最有力的反方论证(Steel Man)、作者略过的关键问题(房间里的大象)。用中文,专业术语保留英文原词,不要重复原文内容。",
    },
    {
      id: "scaffold",
      name: "概念脚手架",
      prompt:
        "你是一位认知阅读教练。你的任务不是替我总结文字,而是帮我搭建理解它所需要的脚手架——补上作者默认我已经知道、但我实际上不知道的部分。假设我在这个领域背景知识为零,除非明显不是这样。\n" +
        "回答时可以包含:背景知识速览、术语表、暗含推理(线索/空白/置信度)、容易读错的地方、用零术语的情境模型讲解。用中文,专业术语保留英文原词。",
    },
    {
      id: "quiz",
      name: "自测五问",
      prompt:
        "你是一位课程设计师和苏格拉底式引导者。你的任务不是替我解释论文,而是提炼出能检验我是否真正理解核心原理的高层次问题——用来考我,不是用来讲给我听。\n" +
        "被要求出题时,提炼恰好5个高层次问题(避免是非题,优先用如何/为什么/如果...会怎样),最后加一个必须串联所有主题才能回答的综合问题。其余时候正常回答我的问题。用中文。",
    },
  ],
};

function cleanSelectionText(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stableConversationHash(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeConversationMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const normalized = [];
  for (const message of messages) {
    if (!message || (message.role !== "user" && message.role !== "assistant")) continue;
    if (typeof message.content !== "string" || !message.content.trim()) continue;
    normalized.push({
      role: message.role,
      content: message.content,
      status: message.role === "assistant" && message.status === "stopped" ? "stopped" : "complete",
    });
  }
  return normalized;
}

function normalizeConversationHistories(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const normalized = {};
  for (const [key, entry] of Object.entries(saved)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const messages = normalizeConversationMessages(entry.messages);
    if (!messages.length) continue;
    normalized[key] = {
      version: 1,
      updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
      messages,
    };
  }
  return normalized;
}

/**
 * 找到当前激活的 PDF 视图对应的文件(如果当前焦点/活动叶子不是 PDF 视图则返回 null)。
 */
function getActivePdfFile(app) {
  const leaf = app.workspace.activeLeaf;
  const view = leaf && leaf.view;
  if (view && typeof view.getViewType === "function" && view.getViewType() === "pdf" && view.file) {
    return view.file;
  }
  return null;
}

/**
 * 用 Obsidian 内置的 pdf.js(通过全局 window.pdfjsLib 暴露)逐页提取 PDF 文本,
 * 返回 [{ page, text }, ...],保留页码信息(全文摘要和 RAG 分块都基于这个函数)。
 */
async function extractPdfPages(app, file) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib || !pdfjsLib.getDocument) {
    throw new Error("当前 Obsidian 版本没有暴露 pdfjsLib,无法提取全文");
  }
  const buffer = await app.vault.readBinary(file);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => it.str).join(" ");
    pages.push({ page: i, text: pageText });
  }
  return pages;
}

async function extractPdfFullText(app, file) {
  const pages = await extractPdfPages(app, file);
  return pages.map((p) => `[第${p.page}页]\n${p.text}`).join("\n\n").trim();
}

/**
 * 把逐页文本切成带页码的小块,用于 RAG 检索。单页文本超过 chunkSize 时按滑动窗口切开(带 overlap),
 * 不跨页合并,这样每块都能准确标出"第几页"。
 */
function chunkPdfPages(pages, chunkSize, overlap) {
  const chunks = [];
  for (const p of pages) {
    const text = (p.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (text.length <= chunkSize) {
      chunks.push({ page: p.page, text });
      continue;
    }
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push({ page: p.page, text: text.slice(start, end) });
      if (end >= text.length) break;
      start = end - overlap;
    }
  }
  // 记录每块在整篇文档里的顺序位置,供 expandWithNeighbors 按位置找相邻块用
  // (固定大小滑窗切块经常会把一句话/一段列表刚好切在中间,单独查到某一块并不代表
  // 拿到了完整的那句话,所以检索到的块还需要能找回它的邻居)。
  chunks.forEach((c, i) => (c.idx = i));
  return chunks;
}

/**
 * 检索到的块很可能刚好卡在一句话/一个列表中间(切块是固定大小滑窗,不理解语义边界)。
 * 把每个命中块的前一块、后一块也带上,能大幅降低"该出现的内容被切到邻居块里、
 * 但邻居块本身检索分数不够高排不进 topK"导致的漏读,代价只是多带一点上下文文字。
 */
function expandWithNeighbors(allChunks, retrieved) {
  if (!retrieved || !retrieved.length) return retrieved;
  const wanted = new Set();
  retrieved.forEach((c) => {
    if (typeof c.idx !== "number") return;
    wanted.add(c.idx - 1);
    wanted.add(c.idx);
    wanted.add(c.idx + 1);
  });
  return allChunks.filter((c) => wanted.has(c.idx)).sort((a, b) => a.idx - b.idx);
}

/**
 * 极简的中英混合分词:英文/数字按单词切,中文没有空格分词,退化成单字 + 双字 bigram,
 * 不依赖任何分词库,足够给 BM25 打分用。
 */
function tokenizeForBM25(text) {
  const lower = (text || "").toLowerCase();
  const tokens = [];
  const wordRe = /[a-z0-9]+/g;
  let m;
  while ((m = wordRe.exec(lower))) {
    tokens.push(m[0]);
  }
  const cjk = lower.match(/[\u4e00-\u9fff]/g) || [];
  for (let i = 0; i < cjk.length; i++) {
    tokens.push(cjk[i]);
    if (i + 1 < cjk.length) tokens.push(cjk[i] + cjk[i + 1]);
  }
  return tokens;
}

/**
 * 对一组文本块按 BM25 相关性给 query 打分,返回分数从高到低排序、且分数 > 0 的前 topK 个块。
 * 每次调用都会重新分词计算(块数量通常就几十个,现算完全够快,不需要额外持久化倒排索引)。
 */
function bm25Retrieve(chunks, query, topK) {
  if (!chunks || !chunks.length) return [];
  const docsTokens = chunks.map((c) => tokenizeForBM25(c.text));
  const df = new Map();
  docsTokens.forEach((tokens) => {
    new Set(tokens).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
  });
  const N = docsTokens.length;
  const avgLen = docsTokens.reduce((s, d) => s + d.length, 0) / (N || 1) || 1;
  const k1 = 1.5;
  const b = 0.75;
  const queryTokens = Array.from(new Set(tokenizeForBM25(query)));

  const scored = chunks.map((chunk, idx) => {
    const docTokens = docsTokens[idx];
    const docLen = docTokens.length || 1;
    const tf = new Map();
    docTokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

    let score = 0;
    for (const qt of queryTokens) {
      const f = tf.get(qt) || 0;
      if (!f) continue;
      const n = df.get(qt) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const denom = f + k1 * (1 - b + (b * docLen) / avgLen);
      score += idf * ((f * (k1 + 1)) / denom);
    }
    return { chunk, score };
  });

  scored.sort((a, b2) => b2.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, topK)
    .map((s) => s.chunk);
}

/**
 * 对多个检索词变体分别做一次 BM25 检索,再按“每个变体里的排名”做简单的融合排序
 * (reciprocal rank fusion:排名越靠前权重越高,同一块在多个变体里都排前面就会被加权累加),
 * 取融合后最靠前的 topK 个块。比只用单一检索词能覆盖更多角度、找得更全,也能避免某一个
 * 检索词变体质量不佳时(比如翻译得不准)拖累整体结果。
 */
function bm25RetrieveMulti(chunks, queries, topK) {
  const uniqueQueries = Array.from(new Set((queries || []).filter(Boolean)));
  if (!uniqueQueries.length) return [];

  const keyOf = (chunk) => chunk.page + "::" + chunk.text.slice(0, 60);
  const fused = new Map(); // key -> { chunk, score }

  for (const q of uniqueQueries) {
    const ranked = bm25Retrieve(chunks, q, Math.max(topK * 2, 8));
    ranked.forEach((chunk, rank) => {
      const key = keyOf(chunk);
      const weight = 1 / (rank + 1);
      const entry = fused.get(key) || { chunk, score: 0 };
      entry.score += weight;
      fused.set(key, entry);
    });
  }

  return Array.from(fused.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((e) => e.chunk);
}

async function renderMarkdownInto(app, component, el, text) {
  el.empty();
  // 加上 Obsidian 阅读视图用的样式类,公式(MathJax)、代码块、列表等才会套用主题自带的排版样式。
  el.addClass("markdown-rendered");
  try {
    if (MarkdownRenderer.render) {
      await MarkdownRenderer.render(app, text, el, "", component);
      return;
    }
    if (MarkdownRenderer.renderMarkdown) {
      await MarkdownRenderer.renderMarkdown(text, el, "", component);
      return;
    }
  } catch (e) {
    // fall through to plain text below
  }
  el.setText(text);
}

class PDFChatModal extends Modal {
  constructor(app, plugin, contextText, pdfFile) {
    super(app);
    this.plugin = plugin;
    this.contextText = contextText;
    this.pdfFile = pdfFile || null;

    const lastPresetId = this.plugin.settings.lastPresetId;
    this.currentPresetId =
      lastPresetId &&
      (lastPresetId === "__default__" || this.plugin.settings.promptPresets.find((p) => p.id === lastPresetId))
        ? lastPresetId
        : "__default__";

    const lastModelId = this.plugin.settings.lastModelId;
    this.currentModelId =
      lastModelId && this.plugin.settings.models.find((m) => m.id === lastModelId)
        ? lastModelId
        : this.plugin.settings.activeModelId;

    this.useDocSummary = false;
    this.docSummaryEntry = null;
    this.isGeneratingSummary = false;
    this.useRag = false;
    this.docChunksEntry = null;
    this.isIndexingRag = false;
    this.useFullTextMode = false;
    this.fullTextForQA = null;
    // 全文只需要在对话历史里出现一次:聊天接口是无状态的,每轮都会把 this.messages 整个重新发送,
    // 已经进过历史的第一轮全文会随着后续每轮继续被带上,不需要再重复拼接一份,否则每多聊一轮,
    // 实际发给模型的内容就多一份完整全文,输入越滚越大、越聊越慢、越聊越贵。
    this.fullTextAttached = false;
    this.conversationKey = this.plugin.getConversationKey(this.pdfFile, this.contextText);
    this.transcript = this.plugin.getConversation(this.conversationKey);
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content })),
    ];
  }

  buildSystemMessage() {
    const preset =
      this.currentPresetId === "__default__"
        ? null
        : this.plugin.settings.promptPresets.find((p) => p.id === this.currentPresetId);
    const promptText = (preset && preset.prompt) || this.plugin.settings.systemPrompt;

    let content = promptText;
    if (this.useDocSummary && this.docSummaryEntry && this.docSummaryEntry.summary) {
      content +=
        "\n\n【全文背景摘要】(由快速模型浓缩整篇 PDF 得到,仅供理解背景,不是我当前问题的具体内容):\n" +
        this.docSummaryEntry.summary;
    }
    content += `\n\n【我当前选中并想讨论的原文片段】:\n${this.contextText}`;
    return { role: "system", content };
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("pdf-chat-modal");

    const titleRow = contentEl.createDiv({ cls: "pdf-chat-title-row" });
    titleRow.createEl("h3", { text: "PDF Chat" });

    const titleActions = titleRow.createDiv({ cls: "pdf-chat-title-actions" });

    const zoomGroup = titleActions.createDiv({ cls: "pdf-chat-zoom-group" });
    this.zoomOutBtn = zoomGroup.createEl("button", { text: "A−", cls: "pdf-chat-zoom-btn" });
    this.zoomLabel = zoomGroup.createEl("span", { text: "100%", cls: "pdf-chat-zoom-label" });
    this.zoomInBtn = zoomGroup.createEl("button", { text: "A+", cls: "pdf-chat-zoom-btn" });
    this.zoomOutBtn.setAttr("title", "缩小内容字体");
    this.zoomInBtn.setAttr("title", "放大内容字体");
    this.zoomLabel.setAttr("title", "点击重置为 100%");

    const resetBtn = titleActions.createEl("button", {
      text: "清空对话",
      cls: "pdf-chat-reset-btn",
    });
    resetBtn.addEventListener("click", () => this.resetConversation());
    this.setupDragging(titleRow);

    this.zoomOutBtn.addEventListener("click", () =>
      this.applyFontScale((this.plugin.settings.fontScale || 1) - 0.1)
    );
    this.zoomInBtn.addEventListener("click", () =>
      this.applyFontScale((this.plugin.settings.fontScale || 1) + 0.1)
    );
    this.zoomLabel.addEventListener("click", () => this.applyFontScale(1));
    this.applyFontScale(this.plugin.settings.fontScale || 1);

    const modelRow = contentEl.createDiv({ cls: "pdf-chat-model-row" });
    modelRow.createEl("span", { text: "模型：", cls: "pdf-chat-select-label" });
    this.modelSelect = modelRow.createEl("select", { cls: "dropdown pdf-chat-select" });
    for (const m of this.plugin.settings.models) {
      this.modelSelect.createEl("option", { text: m.name, value: m.id });
    }
    this.modelSelect.value = this.currentModelId;
    this.modelSelect.addEventListener("change", () => this.applyModel(this.modelSelect.value));

    const modeRow = contentEl.createDiv({ cls: "pdf-chat-mode-row" });
    modeRow.createEl("span", { text: "阅读模式：", cls: "pdf-chat-select-label" });
    this.modeSelect = modeRow.createEl("select", { cls: "dropdown pdf-chat-select" });
    this.modeSelect.createEl("option", { text: "默认(设置里的系统提示词)", value: "__default__" });
    for (const preset of this.plugin.settings.promptPresets) {
      this.modeSelect.createEl("option", { text: preset.name, value: preset.id });
    }
    this.modeSelect.value = this.currentPresetId;
    this.modeSelect.addEventListener("change", () => this.applyPreset(this.modeSelect.value));

    const ctxWrapper = contentEl.createDiv({ cls: "pdf-chat-context-wrapper" });
    const toggle = ctxWrapper.createEl("p", {
      cls: "pdf-chat-context-toggle",
      text: `📄 已捕获选中内容(${this.contextText.length} 字) · 点击展开/收起`,
    });
    const ctxText = ctxWrapper.createDiv({
      cls: "pdf-chat-context-text is-collapsed",
      text: this.contextText,
    });
    toggle.addEventListener("click", () => {
      ctxText.toggleClass("is-collapsed", !ctxText.hasClass("is-collapsed"));
    });

    if (this.pdfFile) {
      const summaryRow = contentEl.createDiv({ cls: "pdf-chat-summary-row" });
      this.summaryCheckbox = summaryRow.createEl("input", {
        type: "checkbox",
        attr: { id: "pdf-chat-summary-toggle" },
      });
      summaryRow.createEl("label", {
        text: "附带全文摘要作为背景",
        attr: { for: "pdf-chat-summary-toggle" },
      });
      this.summaryStatusEl = summaryRow.createEl("span", { cls: "pdf-chat-summary-status" });
      this.summaryRefreshBtn = summaryRow.createEl("button", {
        text: "生成/刷新摘要",
        cls: "pdf-chat-summary-btn",
      });

      this.refreshSummaryStatus();

      this.summaryCheckbox.addEventListener("change", async () => {
        if (this.summaryCheckbox.checked) {
          await this.ensureDocSummary(false);
          this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
          this.summaryCheckbox.checked = this.useDocSummary;
        } else {
          this.useDocSummary = false;
        }
        this.messages[0] = this.buildSystemMessage();
      });
      this.summaryRefreshBtn.addEventListener("click", async () => {
        await this.ensureDocSummary(true);
        if (this.summaryCheckbox.checked) {
          this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        }
        this.messages[0] = this.buildSystemMessage();
      });

      // 自动模式:已缓存过的直接秒用,没缓存过的自动生成一次,不需要每次手动勾选/点击。
      // 缓存以文件路径+修改时间为 key,同一篇论文之后打开弹窗基本是瞬间命中缓存。
      if (this.plugin.settings.autoDocSummary) {
        this.summaryCheckbox.checked = true;
        this.useDocSummary = true;
        this.ensureDocSummary(false).then(() => {
          this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
          if (this.summaryCheckbox) this.summaryCheckbox.checked = this.useDocSummary;
          this.messages[0] = this.buildSystemMessage();
        });
      }

      const ragRow = contentEl.createDiv({ cls: "pdf-chat-summary-row" });
      this.ragCheckbox = ragRow.createEl("input", {
        type: "checkbox",
        attr: { id: "pdf-chat-rag-toggle" },
      });
      ragRow.createEl("label", {
        text: "全文/检索相关片段",
        attr: { for: "pdf-chat-rag-toggle" },
      });
      this.ragStatusEl = ragRow.createEl("span", { cls: "pdf-chat-summary-status" });
      this.ragRefreshBtn = ragRow.createEl("button", {
        text: "建立/刷新索引",
        cls: "pdf-chat-summary-btn",
      });

      this.refreshRagStatus();

      this.ragCheckbox.addEventListener("change", async () => {
        if (this.ragCheckbox.checked) {
          await this.ensureDocChunks(false);
          this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length);
          this.ragCheckbox.checked = this.useRag;
        } else {
          this.useRag = false;
        }
      });
      this.ragRefreshBtn.addEventListener("click", async () => {
        await this.ensureDocChunks(true);
        if (this.ragCheckbox.checked) {
          this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length);
        }
      });

      // 建索引是纯本地文本切块,不调用模型,很快,可以放心自动做。
      if (this.plugin.settings.autoRag) {
        this.ragCheckbox.checked = true;
        this.useRag = true;
        this.ensureDocChunks(false).then(() => {
          this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length);
          if (this.ragCheckbox) this.ragCheckbox.checked = this.useRag;
        });
      }
    }

    this.historyEl = contentEl.createDiv({ cls: "pdf-chat-history" });

    const inputRow = contentEl.createDiv({ cls: "pdf-chat-input-row" });
    this.inputEl = inputRow.createEl("textarea", {
      cls: "pdf-chat-input",
      attr: { placeholder: "针对上面选中的内容提问,按 Enter 提交,Shift+Enter 换行…" },
    });
    this.sendBtn = inputRow.createEl("button", { text: "发送", cls: "mod-cta" });

    const submit = () => this.handleSubmit();
    this.sendBtn.addEventListener("click", () => {
      if (this.isSending) {
        this.stopGenerating();
      } else {
        submit();
      }
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    });

    contentEl.createEl("p", {
      cls: "pdf-chat-hint",
      text: "多轮追问会带着完整对话历史一起发送给模型,答案会实时流式显示。",
    });

    if (this.transcript.length) {
      this.restoreConversationHistory().catch((err) => {
        new Notice("恢复上次对话显示失败: " + (err && err.message ? err.message : String(err)));
      });
    }
    this.inputEl.focus();
  }

  async restoreConversationHistory() {
    const renderJobs = [];
    for (const message of this.transcript) {
      if (message.role === "user") {
        this.addBubble("user", message.content, { skipScroll: true });
        continue;
      }
      const bubble = this.addBubble("assistant", message.content, { skipScroll: true });
      bubble.addClass("is-rendered");
      renderJobs.push(
        renderMarkdownInto(this.app, this.plugin, bubble, message.content).then(() => {
          if (message.status === "stopped") {
            bubble.addClass("is-stopped");
            bubble.createEl("p", { cls: "pdf-chat-stopped-label", text: "[已停止生成]" });
          }
        })
      );
    }
    await Promise.all(renderJobs);
    this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
    const scope = this.pdfFile ? "本 PDF" : "当前选区";
    new Notice(`已恢复${scope}上次对话(${this.transcript.length} 条消息)`);
  }

  async persistConversation() {
    try {
      await this.plugin.saveConversation(this.conversationKey, this.transcript);
      return true;
    } catch (err) {
      new Notice("保存对话失败: " + (err && err.message ? err.message : String(err)));
      return false;
    }
  }

  async recordTranscriptTurn(question, answer, status) {
    if (typeof answer !== "string" || !answer.trim()) return false;
    this.transcript.push(
      { role: "user", content: question, status: "complete" },
      { role: "assistant", content: answer, status: status === "stopped" ? "stopped" : "complete" }
    );
    await this.persistConversation();
    return true;
  }

  async resetConversation() {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再清空");
      return;
    }
    this.transcript = [];
    this.messages = [this.buildSystemMessage()];
    this.fullTextAttached = false;
    this.historyEl.empty();
    try {
      await this.plugin.clearConversation(this.conversationKey);
      new Notice("对话已清空,原文上下文保留");
    } catch (err) {
      new Notice("界面已清空,但删除已保存对话失败: " + (err && err.message ? err.message : String(err)));
    }
  }

  applyPreset(id) {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再切换阅读模式");
      this.modeSelect.value = this.currentPresetId;
      return;
    }
    this.currentPresetId = id;
    this.plugin.settings.lastPresetId = id;
    this.plugin.saveSettings();
    this.messages[0] = this.buildSystemMessage();
    const preset = this.plugin.settings.promptPresets.find((p) => p.id === id);
    const name = id === "__default__" ? "默认" : (preset && preset.name) || id;
    new Notice(`已切换到「${name}」模式,后续回答会按新设定进行`);
  }

  applyModel(id) {
    if (this.isSending) {
      new Notice("正在生成中,请先停止或等待完成后再切换模型");
      this.modelSelect.value = this.currentModelId;
      return;
    }
    this.currentModelId = id;
    this.plugin.settings.lastModelId = id;
    this.plugin.saveSettings();
    const m = this.plugin.settings.models.find((x) => x.id === id);
    new Notice(`已切换到模型「${(m && m.name) || id}」`);
  }

  applyFontScale(scale) {
    const clamped = Math.round(Math.min(1.6, Math.max(0.7, scale)) * 100) / 100;
    this.plugin.settings.fontScale = clamped;
    this.contentEl.style.setProperty("--pdf-chat-font-scale", clamped);
    if (this.zoomLabel) this.zoomLabel.setText(Math.round(clamped * 100) + "%");
    this.plugin.saveSettings();
  }

  refreshSummaryStatus() {
    if (!this.summaryStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    if (cached && cached.summary) {
      this.docSummaryEntry = cached;
      const date = new Date(cached.generatedAt);
      const truncatedNote = cached.truncated ? " · 原文过长,仅摘要了前面部分" : "";
      this.summaryStatusEl.setText(`(已缓存 · ${date.toLocaleString()}${truncatedNote})`);
    } else {
      this.docSummaryEntry = null;
      this.summaryStatusEl.setText("(尚未生成)");
    }
  }

  async ensureDocSummary(forceRefresh) {
    if (this.isGeneratingSummary || !this.pdfFile) return;

    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docSummaryEntry = cached;
      this.refreshSummaryStatus();
      return;
    }

    this.isGeneratingSummary = true;
    if (this.summaryRefreshBtn) {
      this.summaryRefreshBtn.setText("生成中…");
      this.summaryRefreshBtn.disabled = true;
    }
    if (this.summaryCheckbox) this.summaryCheckbox.disabled = true;
    const notice = new Notice("正在用快速模型提炼全文摘要,可能需要几十秒…", 0);

    try {
      this.docSummaryEntry = await this.plugin.getOrCreateDocSummary(this.pdfFile, forceRefresh);
      this.refreshSummaryStatus();
      notice.hide();
      new Notice("全文摘要已生成/更新");
    } catch (err) {
      notice.hide();
      new Notice("生成摘要失败: " + (err && err.message ? err.message : String(err)));
      if (this.summaryCheckbox) this.summaryCheckbox.checked = false;
      this.useDocSummary = false;
    } finally {
      this.isGeneratingSummary = false;
      if (this.summaryRefreshBtn) {
        this.summaryRefreshBtn.setText("生成/刷新摘要");
        this.summaryRefreshBtn.disabled = false;
      }
      if (this.summaryCheckbox) this.summaryCheckbox.disabled = false;
    }
  }

  refreshRagStatus() {
    if (!this.ragStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    if (cached && cached.chunks && cached.chunks.length) {
      this.docChunksEntry = cached;
      const threshold = this.plugin.settings.ragFullTextThreshold || DEFAULT_SETTINGS.ragFullTextThreshold;
      this.useFullTextMode = !!(cached.fullTextLength && cached.fullTextLength <= threshold);
      const date = new Date(cached.generatedAt);
      if (this.useFullTextMode) {
        this.ragStatusEl.setText(`(全文约${cached.fullTextLength}字,较短 · 直接读全文回答,更准 · ${date.toLocaleString()})`);
      } else {
        this.ragStatusEl.setText(`(已建索引 · ${cached.chunks.length} 块 · ${date.toLocaleString()})`);
      }
    } else {
      this.docChunksEntry = null;
      this.useFullTextMode = false;
      this.ragStatusEl.setText("(尚未建立索引)");
    }
  }

  async ensureDocChunks(forceRefresh) {
    if (this.isIndexingRag || !this.pdfFile) return;

    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docChunksEntry = cached;
      this.refreshRagStatus();
      return;
    }

    this.isIndexingRag = true;
    if (this.ragRefreshBtn) {
      this.ragRefreshBtn.setText("建立中…");
      this.ragRefreshBtn.disabled = true;
    }
    if (this.ragCheckbox) this.ragCheckbox.disabled = true;

    try {
      this.docChunksEntry = await this.plugin.getOrCreateDocChunks(this.pdfFile, forceRefresh);
      this.refreshRagStatus();
    } catch (err) {
      new Notice("建立检索索引失败: " + (err && err.message ? err.message : String(err)));
      if (this.ragCheckbox) this.ragCheckbox.checked = false;
      this.useRag = false;
    } finally {
      this.isIndexingRag = false;
      if (this.ragRefreshBtn) {
        this.ragRefreshBtn.setText("建立/刷新索引");
        this.ragRefreshBtn.disabled = false;
      }
      if (this.ragCheckbox) this.ragCheckbox.disabled = false;
    }
  }

  setupDragging(handleEl) {
    handleEl.addClass("pdf-chat-drag-handle");
    handleEl.addEventListener("mousedown", (evt) => {
      if (evt.target.closest && evt.target.closest("button, select, .pdf-chat-title-actions")) return;
      evt.preventDefault();

      const modalEl = this.modalEl;
      const doc = modalEl.ownerDocument;
      const rect = modalEl.getBoundingClientRect();
      modalEl.style.position = "fixed";
      modalEl.style.margin = "0";
      modalEl.style.left = rect.left + "px";
      modalEl.style.top = rect.top + "px";

      const startX = evt.clientX;
      const startY = evt.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;

      const onMouseMove = (moveEvt) => {
        modalEl.style.left = startLeft + (moveEvt.clientX - startX) + "px";
        modalEl.style.top = startTop + (moveEvt.clientY - startY) + "px";
      };
      const onMouseUp = () => {
        doc.removeEventListener("mousemove", onMouseMove);
        doc.removeEventListener("mouseup", onMouseUp);
      };
      doc.addEventListener("mousemove", onMouseMove);
      doc.addEventListener("mouseup", onMouseUp);
    });
  }

  stopGenerating() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  setSendingState(sending) {
    this.isSending = sending;
    this.sendBtn.setText(sending ? "停止" : "发送");
    this.sendBtn.toggleClass("is-stop", sending);
  }

  async handleSubmit() {
    const question = this.inputEl.value.trim();
    if (!question) return;
    if (this.isSending) {
      new Notice("上一个问题还在生成中,请稍候或点击停止");
      return;
    }

    this.addBubble("user", question);
    this.inputEl.value = "";
    this.setSendingState(true);

    const loadingBubble = this.addBubble("assistant", "思考中…", { loading: true });

    let outgoingContent = question;
    if (this.useRag && this.useFullTextMode && this.pdfFile && !this.fullTextAttached) {
      // 全文足够短,直接把全文交给模型,不做"猜哪一块相关"的检索——实测发现关键词检索对
      // "列举类"问题(比如"论文对比了哪些基线算法")经常检索不全或检索错块,直接给全文更可靠。
      // 只在对话的第一轮附带一次:之后每轮 this.messages 都会带着这一轮的历史一起重新发送,
      // 不需要也不应该重复拼接,否则输入会随聊天轮数线性膨胀。
      loadingBubble.setText("正在读取全文…");
      try {
        if (!this.fullTextForQA) {
          this.fullTextForQA = await extractPdfFullText(this.app, this.pdfFile);
        }
        outgoingContent = "【论文全文】:\n" + this.fullTextForQA + "\n\n【我的问题】:\n" + question;
        this.fullTextAttached = true;
      } catch (err) {
        // 全文提取失败就退回原始问题,不阻塞正常提问
      }
      loadingBubble.setText("思考中…");
    } else if (
      !this.useFullTextMode &&
      this.useRag &&
      this.docChunksEntry &&
      this.docChunksEntry.chunks &&
      this.docChunksEntry.chunks.length
    ) {
      const retrievalQueries = [question];
      if (this.plugin.settings.ragQueryTranslate) {
        loadingBubble.setText("正在思考检索角度…");
        try {
          const variants = await this.plugin.planRagQueries(question);
          if (variants && variants.length) retrievalQueries.push(...variants);
        } catch (err) {
          // 检索词规划失败就退回只用原始问题直接检索,不阻塞正常提问
        }
      }

      const topK = this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK;
      const retrieved = bm25RetrieveMulti(this.docChunksEntry.chunks, retrievalQueries, topK);
      const expanded = expandWithNeighbors(this.docChunksEntry.chunks, retrieved);
      if (expanded.length) {
        const retrievedText = expanded.map((c) => `[第${c.page}页]\n${c.text}`).join("\n\n---\n\n");
        outgoingContent =
          "【从全文中按关键词检索到的可能相关片段(不一定完全准确,仅供参考)】:\n" +
          retrievedText +
          "\n\n【我的问题】:\n" +
          question;
      }
      loadingBubble.setText("思考中…");
    }

    this.messages.push({ role: "user", content: outgoingContent });
    this.abortController = new AbortController();
    let fullText = "";
    let firstChunkArrived = false;

    try {
      fullText = await this.plugin.chat(
        this.messages,
        (piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          loadingBubble.setText(acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        this.abortController.signal,
        this.plugin.getModelProfile(this.currentModelId)
      );

      loadingBubble.removeClass("is-loading");
      // 切到最终渲染状态后去掉 pre-wrap,避免和渲染出来的 HTML(公式/段落/代码块)标签间的
      // 空白文本节点叠加,出现多余换行或挤成一团的问题。
      loadingBubble.addClass("is-rendered");
      this.messages.push({ role: "assistant", content: fullText });
      await renderMarkdownInto(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranscriptTurn(question, fullText, "complete");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (err && err.name === "AbortError") {
        loadingBubble.addClass("is-stopped");
        loadingBubble.setText((fullText || "") + "\n\n[已停止生成]");
        if (fullText) {
          this.messages.push({ role: "assistant", content: fullText });
          await this.recordTranscriptTurn(question, fullText, "stopped");
        } else {
          this.messages.pop();
        }
      } else {
        loadingBubble.addClass("is-error");
        loadingBubble.setText("请求失败: " + (err && err.message ? err.message : String(err)));
        this.messages.pop();
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }

  addBubble(role, text, opts) {
    const bubble = this.historyEl.createDiv({ cls: `pdf-chat-bubble ${role}` });
    if (opts && opts.loading) bubble.addClass("is-loading");
    bubble.setText(text);
    if (!(opts && opts.skipScroll)) {
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    }
    return bubble;
  }

  onClose() {
    this.stopGenerating();
    void this.persistConversation();
    this.contentEl.empty();
  }
}

class PDFChatSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PDF Chat 设置" });

    containerEl.createEl("h3", { text: "模型列表" });
    containerEl.createEl("p", {
      text:
        "可以添加多套模型配置(不同的 endpoint / API Key / 模型名),弹窗里的“模型”下拉框会列出这里全部条目。" +
        "标了“默认”的那一条是新建对话时默认使用的模型。",
      cls: "setting-item-description",
    });

    this.plugin.settings.models.forEach((m, idx) => {
      const isActive = m.id === this.plugin.settings.activeModelId;
      const header = new Setting(containerEl).setName(`模型 ${idx + 1}${isActive ? " · 默认" : ""}`);
      header.addText((text) =>
        text
          .setPlaceholder("名称")
          .setValue(m.name)
          .onChange(async (value) => {
            m.name = value;
            await this.plugin.saveSettings();
          })
      );
      if (!isActive) {
        header.addExtraButton((btn) =>
          btn
            .setIcon("star")
            .setTooltip("设为默认")
            .onClick(async () => {
              this.plugin.settings.activeModelId = m.id;
              await this.plugin.saveSettings();
              this.display();
            })
        );
      }
      header.addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("删除这个模型")
          .onClick(async () => {
            if (this.plugin.settings.models.length <= 1) {
              new Notice("至少要保留一个模型配置");
              return;
            }
            this.plugin.settings.models.splice(idx, 1);
            if (this.plugin.settings.activeModelId === m.id) {
              this.plugin.settings.activeModelId = this.plugin.settings.models[0].id;
            }
            await this.plugin.saveSettings();
            this.display();
          })
      );

      new Setting(containerEl).setName("Endpoint").addText((text) =>
        text
          .setPlaceholder("OpenAI 兼容的 chat/completions 接口地址")
          .setValue(m.endpoint)
          .onChange(async (value) => {
            m.endpoint = value.trim();
            await this.plugin.saveSettings();
          })
      );

      new Setting(containerEl).setName("API Key").addText((text) => {
        text.inputEl.type = "password";
        text
          .setValue(m.apiKey)
          .onChange(async (value) => {
            m.apiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

      new Setting(containerEl).setName("模型名(model 字段)").addText((text) =>
        text
          .setValue(m.model)
          .onChange(async (value) => {
            m.model = value.trim();
            await this.plugin.saveSettings();
          })
      );

      containerEl.createEl("hr");
    });

    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("+ 添加模型")
        .setCta()
        .onClick(async () => {
          this.plugin.settings.models.push({
            id: "model-" + Date.now(),
            name: "新模型",
            endpoint: "",
            apiKey: "",
            model: "",
          });
          await this.plugin.saveSettings();
          this.display();
        })
    );

    new Setting(containerEl)
      .setName("流式输出")
      .setDesc("开启后答案会一边生成一边显示;关闭则等生成完再一次性显示")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.stream).onChange(async (value) => {
          this.plugin.settings.stream = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Temperature")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.temperature)).onChange(async (value) => {
          const n = parseFloat(value);
          this.plugin.settings.temperature = Number.isFinite(n) ? n : DEFAULT_SETTINGS.temperature;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Max Tokens")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.maxTokens)).onChange(async (value) => {
          const n = parseInt(value, 10);
          this.plugin.settings.maxTokens = Number.isFinite(n) ? n : DEFAULT_SETTINGS.maxTokens;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("系统提示词")
      .setDesc("会自动附加选中的原文片段在其后")
      .addTextArea((text) => {
        text.inputEl.rows = 6;
        text.setValue(this.plugin.settings.systemPrompt).onChange(async (value) => {
          this.plugin.settings.systemPrompt = value;
          await this.plugin.saveSettings();
        });
      });

    containerEl.createEl("p", {
      text:
        "默认快捷键: Ctrl+Alt+Q (可在 设置→快捷键→搜索 “PDF Chat” 里自行修改)。" +
        "使用方法: 在 PDF 或任意笔记里选中一段文字,按快捷键即可弹窗提问,弹窗内可连续追问,支持流式回答、停止生成、拖动标题栏移动位置、拖拽右下角调整大小。",
      cls: "setting-item-description",
    });

    containerEl.createEl("h3", { text: "全文摘要(浓缩上下文)" });
    containerEl.createEl("p", {
      text:
        "在 PDF 里划词唤起弹窗后,可以勾选“附带全文摘要作为背景”:会先用下面选的模型把当前 PDF 全文浓缩成一份摘要" +
        "(按文件路径+修改时间缓存,文件不变就不用重新生成),再连同你选中的那段原文一起发给主模型回答问题," +
        "既有全局背景,又不会因为直接把整篇论文塞进上下文而让回答跑题或超长。仅对 PDF 视图里的划词生效。",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("打开 PDF 划词弹窗时自动附带全文摘要")
      .setDesc(
        "开启后不需要每次手动勾选/点击:已缓存过摘要的论文直接自动附带,没缓存过的会自动生成一次" +
          "(按文件+修改时间缓存,同一篇论文之后基本秒开)。关闭则改回手动勾选“附带全文摘要作为背景”。"
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoDocSummary).onChange(async (value) => {
          this.plugin.settings.autoDocSummary = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("摘要生成用的模型")
      .setDesc("建议选一个速度快、成本低的模型,专门用来浓缩全文(和聊天主模型可以不同)")
      .addDropdown((dropdown) => {
        this.plugin.settings.models.forEach((m) => dropdown.addOption(m.id, m.name));
        dropdown.setValue(this.plugin.settings.summaryModelId || this.plugin.settings.activeModelId);
        dropdown.onChange(async (value) => {
          this.plugin.settings.summaryModelId = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("全文截断字符数上限")
      .setDesc("超过这个长度的全文会先截断再送去生成摘要,避免超出模型上下文窗口(这个是输入侧限制,不影响输出摘要的长短)")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.summaryMaxChars)).onChange(async (value) => {
          const n = parseInt(value, 10);
          this.plugin.settings.summaryMaxChars = Number.isFinite(n) ? n : DEFAULT_SETTINGS.summaryMaxChars;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("摘要最大输出 token 数")
      .setDesc("单独限制摘要本身的输出长度,不和下面聊天的 Max Tokens 共用,避免摘要写得又长又碎")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.summaryMaxTokens)).onChange(async (value) => {
          const n = parseInt(value, 10);
          this.plugin.settings.summaryMaxTokens = Number.isFinite(n) ? n : DEFAULT_SETTINGS.summaryMaxTokens;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName("摘要生成提示词").addTextArea((text) => {
      text.inputEl.rows = 5;
      text.inputEl.style.width = "100%";
      text.setValue(this.plugin.settings.summaryPrompt).onChange(async (value) => {
        this.plugin.settings.summaryPrompt = value;
        await this.plugin.saveSettings();
      });
    });

    new Setting(containerEl)
      .setName("清空已缓存的全文摘要")
      .setDesc(`当前已缓存 ${Object.keys(this.plugin.settings.docSummaries || {}).length} 篇文档的摘要`)
      .addButton((btn) =>
        btn.setButtonText("清空缓存").onClick(async () => {
          this.plugin.settings.docSummaries = {};
          await this.plugin.saveSettings();
          this.display();
        })
      );

    containerEl.createEl("h3", { text: "RAG 检索(关键词/BM25,无需 embedding 模型)" });
    containerEl.createEl("p", {
      text:
        "跟上面的“全文摘要”是互补关系:摘要给一份全局背景,这里则是针对你当前问的具体问题," +
        "在全文里定位相关内容塞进上下文,更适合“论文里具体某个数字/术语/方法是什么”这类细节问题。" +
        "纯本地计算,不需要任何 embedding 模型或额外接口。仅对 PDF 视图里的划词生效。",
      cls: "setting-item-description",
    });
    containerEl.createEl("p", {
      text:
        "实测发现关键词(BM25)检索对“列举类”问题(比如“论文对比了哪些基线算法”)经常检索不准——" +
        "真正答案段落里全是专有名词,反而会被论文里其他大量提到相同通用词(相关工作、附录补充实验等)的段落挤掉。" +
        "而大部分单篇论文全文本身不长,直接读全文远比“猜哪一块”更可靠。所以下面设了一个字数阈值:" +
        "全文长度在阈值以内时直接把全文交给模型回答;只有超过阈值(全文塞不下)才退回关键词检索。",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("全文直读的字数阈值")
      .setDesc("全文字符数不超过这个值时,直接把全文交给模型回答(更准);超过时才退回下面的关键词检索")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.ragFullTextThreshold)).onChange(async (value) => {
          const n = parseInt(value, 10);
          this.plugin.settings.ragFullTextThreshold = Number.isFinite(n) ? n : DEFAULT_SETTINGS.ragFullTextThreshold;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("打开 PDF 划词弹窗时自动建立检索索引")
      .setDesc("开启后不需要手动勾选/点击“建立索引”,纯本地计算,几乎不耗时间")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoRag).onChange(async (value) => {
          this.plugin.settings.autoRag = value;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("p", {
      text: "以下几项只在全文超过上面阈值、退回关键词检索时才会用到:",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("提问前先让快模型思考检索角度")
      .setDesc(
        "BM25 是纯字符匹配,中文问题和英文论文原文之间没有共同字符,直接检索基本会落空。开启后每次提问会先用" +
          "“摘要生成用的模型”思考这个问题该从哪几个角度/说法去检索(不只是逐字翻译),生成 3 组中英双语检索词," +
          "分别检索后再融合排序,取最终最相关的几块——比单一检索词覆盖更全,代价是每次提问多一次模型调用(通常一两秒)。"
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.ragQueryTranslate).onChange(async (value) => {
          this.plugin.settings.ragQueryTranslate = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName("检索角度规划提示词").addTextArea((text) => {
      text.inputEl.rows = 5;
      text.inputEl.style.width = "100%";
      text.setValue(this.plugin.settings.ragQueryPrompt).onChange(async (value) => {
        this.plugin.settings.ragQueryPrompt = value;
        await this.plugin.saveSettings();
      });
    });

    new Setting(containerEl)
      .setName("每次检索返回的片段数(Top K)")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.ragTopK)).onChange(async (value) => {
          const n = parseInt(value, 10);
          this.plugin.settings.ragTopK = Number.isFinite(n) ? n : DEFAULT_SETTINGS.ragTopK;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("单块最大字符数")
      .setDesc("全文按页切块,超过这个长度的页会在页内再切开(带一点重叠),不会跨页合并")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.ragChunkSize)).onChange(async (value) => {
          const n = parseInt(value, 10);
          this.plugin.settings.ragChunkSize = Number.isFinite(n) ? n : DEFAULT_SETTINGS.ragChunkSize;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("切块重叠字符数")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.ragChunkOverlap)).onChange(async (value) => {
          const n = parseInt(value, 10);
          this.plugin.settings.ragChunkOverlap = Number.isFinite(n) ? n : DEFAULT_SETTINGS.ragChunkOverlap;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("清空已缓存的检索索引")
      .setDesc(`当前已为 ${Object.keys(this.plugin.settings.docChunks || {}).length} 篇文档建立过索引`)
      .addButton((btn) =>
        btn.setButtonText("清空缓存").onClick(async () => {
          this.plugin.settings.docChunks = {};
          await this.plugin.saveSettings();
          this.display();
        })
      );

    containerEl.createEl("h3", { text: "阅读模式预设" });
    containerEl.createEl("p", {
      text: "弹窗里的“阅读模式”下拉框会列出下面这些预设,切换后会替换当前对话的系统提示词(原文片段依然会自动附加在后面)。",
      cls: "setting-item-description",
    });

    this.plugin.settings.promptPresets.forEach((preset, idx) => {
      const nameSetting = new Setting(containerEl).setName(`预设 ${idx + 1}`);
      nameSetting.addText((text) =>
        text
          .setPlaceholder("名称")
          .setValue(preset.name)
          .onChange(async (value) => {
            preset.name = value;
            await this.plugin.saveSettings();
          })
      );
      nameSetting.addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("删除这个预设")
          .onClick(async () => {
            this.plugin.settings.promptPresets.splice(idx, 1);
            await this.plugin.saveSettings();
            this.display();
          })
      );

      new Setting(containerEl).addTextArea((text) => {
        text.inputEl.rows = 4;
        text.inputEl.style.width = "100%";
        text
          .setPlaceholder("这套模式的系统提示词/指令")
          .setValue(preset.prompt)
          .onChange(async (value) => {
            preset.prompt = value;
            await this.plugin.saveSettings();
          });
      });
    });

    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("+ 添加预设")
        .setCta()
        .onClick(async () => {
          this.plugin.settings.promptPresets.push({
            id: "preset-" + Date.now(),
            name: "新预设",
            prompt: "",
          });
          await this.plugin.saveSettings();
          this.display();
        })
    );
  }
}

module.exports = class PDFChatPlugin extends Plugin {
  async onload() {
    this._saveQueue = Promise.resolve();
    await this.loadSettings();
    this.addSettingTab(new PDFChatSettingTab(this.app, this));

    this.addCommand({
      id: "ask-about-selection",
      name: "针对选中内容提问 (PDF Chat)",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "Q" }],
      callback: () => {
        const win = activeWindow || window;
        const sel = win.getSelection ? win.getSelection() : null;
        const raw = sel ? sel.toString() : "";
        const text = cleanSelectionText(raw || "");

        if (!text) {
          new Notice("没有检测到选中的文字,请先划选一段内容再按快捷键");
          return;
        }

        const pdfFile = getActivePdfFile(this.app);
        new PDFChatModal(this.app, this, text, pdfFile).open();
      },
    });
  }

  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    // 数组字段要显式深拷贝,否则在没有存档时会直接引用 DEFAULT_SETTINGS 里的数组,
    // 后续在设置里增删会连带改到默认值上。
    this.settings.models =
      saved && Array.isArray(saved.models) && saved.models.length
        ? saved.models.map((m) => ({ ...m }))
        : DEFAULT_SETTINGS.models.map((m) => ({ ...m }));
    this.settings.promptPresets =
      saved && Array.isArray(saved.promptPresets) && saved.promptPresets.length
        ? saved.promptPresets.map((p) => ({ ...p }))
        : DEFAULT_SETTINGS.promptPresets.map((p) => ({ ...p }));
    this.settings.docSummaries =
      saved && saved.docSummaries && typeof saved.docSummaries === "object"
        ? { ...saved.docSummaries }
        : {};
    this.settings.docChunks =
      saved && saved.docChunks && typeof saved.docChunks === "object" ? { ...saved.docChunks } : {};
    this.settings.conversationHistories = normalizeConversationHistories(
      saved && saved.conversationHistories
    );
    let needsSave = false;

    // 迁移旧版本(单一 endpoint/apiKey/model 字段)到模型列表
    if (saved && (saved.endpoint || saved.apiKey || saved.model) && !(saved.models && saved.models.length)) {
      const migrated = {
        id: "migrated-" + Date.now(),
        name: "迁移自旧设置",
        endpoint: saved.endpoint || DEFAULT_SETTINGS.models[0].endpoint,
        apiKey: saved.apiKey || DEFAULT_SETTINGS.models[0].apiKey,
        model: saved.model || DEFAULT_SETTINGS.models[0].model,
      };
      this.settings.models = [migrated, ...DEFAULT_SETTINGS.models.map((m) => ({ ...m }))];
      this.settings.activeModelId = migrated.id;
      needsSave = true;
    }

    if (!this.settings.models || !this.settings.models.length) {
      this.settings.models = DEFAULT_SETTINGS.models.map((m) => ({ ...m }));
      needsSave = true;
    }
    if (!this.settings.models.find((m) => m.id === this.settings.activeModelId)) {
      this.settings.activeModelId = this.settings.models[0].id;
      needsSave = true;
    }

    if (this.settings.endpoint !== undefined || this.settings.apiKey !== undefined || this.settings.model !== undefined) {
      delete this.settings.endpoint;
      delete this.settings.apiKey;
      delete this.settings.model;
      needsSave = true;
    }

    if (needsSave) await this.saveSettings();
  }

  async saveSettings() {
    const previousSave = this._saveQueue || Promise.resolve();
    const nextSave = previousSave.catch(() => {}).then(() => this.saveData(this.settings));
    this._saveQueue = nextSave;
    return nextSave;
  }

  getConversationKey(pdfFile, contextText) {
    if (pdfFile && typeof pdfFile.path === "string" && pdfFile.path) {
      return `pdf:${pdfFile.path}`;
    }
    const normalizedSelection = cleanSelectionText(contextText || "");
    return `selection:${stableConversationHash(normalizedSelection)}`;
  }

  getConversation(key) {
    const histories = this.settings.conversationHistories || {};
    const entry = histories[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }

  async saveConversation(key, messages) {
    if (!this.settings.conversationHistories || typeof this.settings.conversationHistories !== "object") {
      this.settings.conversationHistories = {};
    }
    const normalizedMessages = normalizeConversationMessages(messages);
    if (!normalizedMessages.length) {
      delete this.settings.conversationHistories[key];
    } else {
      this.settings.conversationHistories[key] = {
        version: 1,
        updatedAt: Date.now(),
        messages: normalizedMessages,
      };
    }
    await this.saveSettings();
  }

  async clearConversation(key) {
    if (this.settings.conversationHistories && this.settings.conversationHistories[key]) {
      delete this.settings.conversationHistories[key];
    }
    await this.saveSettings();
  }

  getModelProfile(id) {
    return this.settings.models.find((m) => m.id === id) || this.settings.models[0];
  }

  /**
   * 提取 PDF 全文,用(通常更快/更便宜的)摘要模型浓缩成一份背景摘要。
   * 不写缓存,纯粹生成,调用方(getOrCreateDocSummary)负责缓存。
   */
  async generateDocSummary(file) {
    const fullText = await extractPdfFullText(this.app, file);
    const maxChars = this.settings.summaryMaxChars || DEFAULT_SETTINGS.summaryMaxChars;
    let textForSummary = fullText;
    let truncated = false;
    if (textForSummary.length > maxChars) {
      textForSummary = textForSummary.slice(0, maxChars);
      truncated = true;
    }

    const profile =
      this.getModelProfile(this.settings.summaryModelId) || this.getModelProfile(this.settings.activeModelId);
    const systemPrompt =
      this.settings.summaryPrompt + (truncated ? "\n\n(注意:原文过长,以下只是截断后的前面部分)" : "");
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: textForSummary || "(未能提取到文本内容)" },
    ];

    const summaryMaxTokens = this.settings.summaryMaxTokens || DEFAULT_SETTINGS.summaryMaxTokens;
    const summary = await this.chatOnce(messages, undefined, profile, summaryMaxTokens);
    return { summary, fullLength: fullText.length, truncated };
  }

  /**
   * 按文件路径 + mtime 缓存摘要;文件没变就直接复用,forceRefresh 时强制重新生成。
   */
  async getOrCreateDocSummary(file, forceRefresh) {
    const mtime = file.stat && file.stat.mtime;
    const cached = this.settings.docSummaries[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) {
      return cached;
    }

    const { summary, fullLength, truncated } = await this.generateDocSummary(file);
    const entry = { mtime, summary, generatedAt: Date.now(), fullLength, truncated };
    this.settings.docSummaries[file.path] = entry;
    await this.saveSettings();
    return entry;
  }

  /**
   * 提取 PDF 全文并按页切块,用于 RAG 关键词检索。纯本地计算,不调用任何模型,速度很快。
   */
  async generateDocChunks(file) {
    const pages = await extractPdfPages(this.app, file);
    const chunkSize = this.settings.ragChunkSize || DEFAULT_SETTINGS.ragChunkSize;
    const overlap = this.settings.ragChunkOverlap || DEFAULT_SETTINGS.ragChunkOverlap;
    const chunks = chunkPdfPages(pages, chunkSize, overlap);
    const fullTextLength = pages.reduce((s, p) => s + (p.text ? p.text.length : 0), 0);
    return { chunks, fullTextLength };
  }

  /**
   * 用快模型"思考"这个问题该从哪几个角度/说法去检索,返回多组中英双语检索词变体(不是单纯翻译)。
   * 解决两个问题:1) 中文问、英文论文导致 BM25 纯字符匹配天然检索不到;2) 单一检索词覆盖面太窄,
   * 容易漏掉论文里用不同措辞表达同一件事的段落。
   * 失败时返回空数组,调用方应该 fallback 到只用原始问题直接检索,不阻塞正常提问流程。
   */
  async planRagQueries(question) {
    const profile =
      this.getModelProfile(this.settings.summaryModelId) || this.getModelProfile(this.settings.activeModelId);
    const messages = [
      { role: "system", content: this.settings.ragQueryPrompt },
      { role: "user", content: question },
    ];
    const raw = await this.chatOnce(messages, undefined, profile, 300);
    return (raw || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\s\-*•\d.、)]+/, "").trim())
      .filter(Boolean);
  }

  /**
   * 按文件路径 + mtime 缓存分块结果;文件没变就直接复用,forceRefresh 时强制重新切块。
   */
  async getOrCreateDocChunks(file, forceRefresh) {
    const mtime = file.stat && file.stat.mtime;
    const cached = this.settings.docChunks[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) {
      // 旧版本缓存下来的块可能还没有 idx 字段(用于检索后找相邻块),补上即可,顺序就是数组顺序
      if (cached.chunks && cached.chunks.length && typeof cached.chunks[0].idx !== "number") {
        cached.chunks.forEach((c, i) => (c.idx = i));
      }
      return cached;
    }

    const { chunks, fullTextLength } = await this.generateDocChunks(file);
    const entry = { mtime, chunks, fullTextLength, generatedAt: Date.now() };
    this.settings.docChunks[file.path] = entry;
    await this.saveSettings();
    return entry;
  }

  /**
   * Sends the full conversation (messages array) to the LLM.
   * onChunk(piece, accumulatedText) is called for every streamed piece when streaming is enabled.
   * Returns the full response text. Throws on error (including AbortError when aborted).
   */
  async chat(messages, onChunk, signal, modelProfile) {
    const profile = modelProfile || this.getModelProfile(this.settings.activeModelId);
    if (this.settings.stream) {
      return this.chatStream(messages, onChunk, signal, profile);
    }
    const text = await this.chatOnce(messages, signal, profile);
    if (onChunk) onChunk(text, text);
    return text;
  }

  async chatOnce(messages, signal, profile, maxTokensOverride) {
    const body = {
      model: profile.model,
      temperature: this.settings.temperature,
      max_tokens: maxTokensOverride || this.settings.maxTokens,
      stream: false,
      messages,
    };

    const res = await requestUrl({
      url: profile.endpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify(body),
      throw: false,
    });

    if (signal && signal.aborted) {
      const abortErr = new Error("Aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    }

    let data;
    try {
      data = res.json;
    } catch (e) {
      data = null;
    }

    if (res.status >= 300) {
      const msg = (data && data.error && data.error.message) || res.text || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const choice = data && data.choices && data.choices[0];
    const content = choice && (choice.message ? choice.message.content : choice.text);
    if (!content) {
      throw new Error("模型没有返回内容,原始响应: " + JSON.stringify(data));
    }
    return content.trim();
  }

  async chatStream(messages, onChunk, signal, profile) {
    const body = {
      model: profile.model,
      temperature: this.settings.temperature,
      max_tokens: this.settings.maxTokens,
      stream: true,
      messages,
    };

    const resp = await fetch(profile.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!resp.ok) {
      let errText = "";
      try {
        errText = await resp.text();
      } catch (e) {
        // ignore
      }
      let msg = errText || `HTTP ${resp.status}`;
      try {
        const j = JSON.parse(errText);
        msg = (j.error && j.error.message) || msg;
      } catch (e) {
        // not json, keep raw text
      }
      throw new Error(msg);
    }

    if (!resp.body || !resp.body.getReader) {
      const data = await resp.json();
      const content =
        (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
        "";
      if (onChunk) onChunk(content, content);
      return content;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(":")) continue;

        const payload = line.replace(/^data:\s*/i, "").trim();
        if (!payload || payload === "[DONE]") continue;

        let parsed;
        try {
          parsed = JSON.parse(payload);
        } catch (e) {
          continue;
        }

        if (parsed && parsed.error) {
          throw new Error(parsed.error.message || JSON.stringify(parsed.error));
        }

        const choices = parsed && parsed.choices;
        if (!choices || !choices.length) continue;

        const delta = choices[0].delta || choices[0].message || {};
        const piece =
          delta.content || delta.reasoning_content || (typeof delta.text === "string" ? delta.text : "");

        if (piece) {
          full += piece;
          if (onChunk) onChunk(piece, full);
        }
      }
    }

    return full;
  }
};
