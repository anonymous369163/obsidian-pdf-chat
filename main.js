// PDF Chat 0.7.1
var global = globalThis;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  ActionRegistry: () => ResearchActionRegistry,
  ConversationStore: () => ConversationStore,
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  LEGACY_0_4_0_TRANSLATE_PROMPT: () => LEGACY_0_4_0_TRANSLATE_PROMPT,
  OpenAICompatibleTransport: () => OpenAICompatibleTransport,
  PDFChatModal: () => PDFChatModal,
  PaperContextService: () => PaperContextService,
  QuickTranslateMarker: () => QuickTranslateMarker,
  ResearchActionRegistry: () => ResearchActionRegistry,
  TranslationService: () => TranslationService,
  bm25Retrieve: () => bm25Retrieve,
  bm25RetrieveMulti: () => bm25RetrieveMulti,
  buildCodexDeepAnalysisPrompt: () => buildCodexDeepAnalysisPrompt,
  buildCodexExecArgs: () => buildCodexExecArgs,
  buildTranslationMessages: () => buildTranslationMessages,
  chunkPdfPages: () => chunkPdfPages,
  cleanSelectionText: () => cleanSelectionText,
  codexAnalysisOutputSchema: () => codexAnalysisOutputSchema,
  createCodexAnalysisTempDir: () => createCodexAnalysisTempDir,
  createCompatibilityActionRegistry: () => createCompatibilityActionRegistry,
  createPDFChatModalServices: () => createPDFChatModalServices,
  createResearchActionRegistry: () => createResearchActionRegistry,
  default: () => PDFChatPlugin,
  expandWithNeighbors: () => expandWithNeighbors,
  extractPdfFullText: () => extractPdfFullText,
  extractPdfPages: () => extractPdfPages,
  getConversationKey: () => getConversationKey,
  migrateSettings: () => migrateSettings,
  normalizeConversationHistories: () => normalizeConversationHistories,
  normalizeConversationMessages: () => normalizeConversationMessages,
  normalizeRagChunkSettings: () => normalizeRagChunkSettings,
  parseCodexAnalysisOutput: () => parseCodexAnalysisOutput,
  removeCodexAnalysisTempDir: () => removeCodexAnalysisTempDir,
  renderCodexAnalysisMarkdown: () => renderCodexAnalysisMarkdown,
  resolveContinueModelId: () => resolveContinueModelId,
  resolveTranslateModelId: () => resolveTranslateModelId,
  runCodexExec: () => runCodexExec,
  searchPdfFiles: () => searchPdfFiles,
  splitTranslationChunks: () => splitTranslationChunks,
  stableConversationHash: () => stableConversationHash,
  tokenizeForBM25: () => tokenizeForBM25,
  writeCodexAnalysisPackage: () => writeCodexAnalysisPackage
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/actions.ts
var ResearchActionRegistry = class {
  constructor() {
    __publicField(this, "actions", /* @__PURE__ */ new Map());
  }
  register(action) {
    this.actions.set(action.id, action);
    return this;
  }
  get(id) {
    return this.actions.get(id);
  }
  list() {
    return Array.from(this.actions.values());
  }
  async execute(id, context) {
    const action = this.get(id);
    if (!action) throw new Error(`Unknown research action: ${id}`);
    await action.execute(context);
  }
};
function listResearchActionsForSlot(actions, slot) {
  return actions.list ? actions.list().filter((action) => action.slot === slot) : [];
}
function createCompatibilityActionRegistry(defaultTranslatePrompt) {
  void defaultTranslatePrompt;
  return createResearchActionRegistry();
}
function createResearchActionRegistry() {
  return new ResearchActionRegistry().register({
    id: "translate",
    name: "Translate selection",
    slot: "composer",
    async execute({ translate }) {
      await translate();
    }
  });
}

// src/conversation.ts
function cleanSelectionText(raw) {
  return raw.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function stableConversationHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function normalizeConversationMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const normalized = [];
  for (const candidate of messages) {
    if (!candidate || typeof candidate !== "object") continue;
    const message = candidate;
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (typeof message.content !== "string" || !message.content.trim()) continue;
    normalized.push({
      role: message.role,
      content: message.content,
      status: message.role === "assistant" && message.status === "stopped" ? "stopped" : "complete"
    });
  }
  return normalized;
}
function normalizeConversationHistories(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const normalized = {};
  for (const [key, candidate] of Object.entries(saved)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const entry = candidate;
    const messages = normalizeConversationMessages(entry.messages);
    if (!messages.length) continue;
    normalized[key] = {
      version: 1,
      updatedAt: typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0,
      messages
    };
  }
  return normalized;
}
function getConversationKey(pdfFile, contextText, kind = "chat") {
  const chatKey = pdfFile && typeof pdfFile.path === "string" && pdfFile.path ? `pdf:${pdfFile.path}` : `selection:${stableConversationHash(cleanSelectionText(contextText || ""))}`;
  return kind === "translate" ? `translate:${chatKey}` : chatKey;
}
var ConversationStore = class {
  constructor(getSettings, persistSettings, now = Date.now) {
    this.getSettings = getSettings;
    this.persistSettings = persistSettings;
    this.now = now;
  }
  get(key) {
    const entry = (this.getSettings().conversationHistories || {})[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }
  async save(key, messages) {
    const settings = this.getSettings();
    if (!settings.conversationHistories || typeof settings.conversationHistories !== "object") {
      settings.conversationHistories = {};
    }
    const normalizedMessages = normalizeConversationMessages(messages);
    if (!normalizedMessages.length) {
      delete settings.conversationHistories[key];
    } else {
      settings.conversationHistories[key] = {
        version: 1,
        updatedAt: this.now(),
        messages: normalizedMessages
      };
    }
    await this.persistSettings();
  }
  async clear(key) {
    const histories = this.getSettings().conversationHistories;
    if (histories && histories[key]) delete histories[key];
    await this.persistSettings();
  }
};

// src/llm-transport.ts
var import_obsidian = require("obsidian");
function getDefaultFetchRequest() {
  const fetchRequest = typeof globalThis !== "undefined" ? globalThis.fetch : void 0;
  if (typeof fetchRequest !== "function") {
    return (() => Promise.reject(new Error("fetch is not available in this environment")));
  }
  return fetchRequest.bind(globalThis);
}
function asCompletionPayload(value) {
  return value && typeof value === "object" ? value : null;
}
var OpenAICompatibleTransport = class {
  constructor(getSettings, getModelProfile, request = import_obsidian.requestUrl, fetchRequest = getDefaultFetchRequest()) {
    this.getSettings = getSettings;
    this.getModelProfile = getModelProfile;
    this.request = request;
    this.fetchRequest = fetchRequest;
  }
  async chat(request) {
    var _a, _b;
    const settings = this.getSettings();
    const profile = request.modelProfile || this.getModelProfile(settings.activeModelId);
    const shouldStream = (_a = request.stream) != null ? _a : settings.stream;
    if (shouldStream) {
      return this.chatStream(
        request.messages,
        request.onChunk,
        request.signal,
        profile,
        request.maxTokensOverride,
        request.temperatureOverride
      );
    }
    const text = await this.chatOnce(
      request.messages,
      request.signal,
      profile,
      request.maxTokensOverride,
      request.temperatureOverride
    );
    (_b = request.onChunk) == null ? void 0 : _b.call(request, text, text);
    return text;
  }
  async chatOnce(messages, signal, profile, maxTokensOverride, temperatureOverride) {
    const settings = this.getSettings();
    const body = {
      model: profile.model,
      temperature: temperatureOverride != null ? temperatureOverride : settings.temperature,
      max_tokens: maxTokensOverride != null ? maxTokensOverride : settings.maxTokens,
      stream: false,
      messages
    };
    const response = await this.request({
      url: profile.endpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`
      },
      body: JSON.stringify(body),
      throw: false
    });
    if (signal == null ? void 0 : signal.aborted) {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      throw abortError;
    }
    let data = null;
    try {
      data = asCompletionPayload(response.json);
    } catch (e) {
      data = null;
    }
    if (response.status >= 300) {
      const message = data && data.error && data.error.message || response.text || `HTTP ${response.status}`;
      throw new Error(message);
    }
    const choice = data && data.choices && data.choices[0];
    const content = choice && (choice.message ? choice.message.content : choice.text);
    if (!content) throw new Error("\u6A21\u578B\u6CA1\u6709\u8FD4\u56DE\u5185\u5BB9,\u539F\u59CB\u54CD\u5E94: " + JSON.stringify(data));
    return String(content).trim();
  }
  async chatStream(messages, onChunk, signal, profile, maxTokensOverride, temperatureOverride) {
    var _a, _b, _c, _d;
    const settings = this.getSettings();
    const response = await this.fetchRequest(profile.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`
      },
      body: JSON.stringify({
        model: profile.model,
        temperature: temperatureOverride != null ? temperatureOverride : settings.temperature,
        max_tokens: maxTokensOverride != null ? maxTokensOverride : settings.maxTokens,
        stream: true,
        messages
      }),
      signal
    });
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
      }
      let message = errorText || `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.error && parsed.error.message || message;
      } catch (e) {
      }
      throw new Error(message);
    }
    if (!((_a = response.body) == null ? void 0 : _a.getReader)) {
      const data = asCompletionPayload(await response.json());
      const content = ((_d = (_c = (_b = data == null ? void 0 : data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) || "";
      onChunk == null ? void 0 : onChunk(content, content);
      return content;
    }
    const reader = response.body.getReader();
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
          parsed = asCompletionPayload(JSON.parse(payload));
        } catch (e) {
          continue;
        }
        if (parsed == null ? void 0 : parsed.error) throw new Error(parsed.error.message || JSON.stringify(parsed.error));
        const choices = parsed == null ? void 0 : parsed.choices;
        if (!(choices == null ? void 0 : choices.length)) continue;
        const delta = choices[0].delta || choices[0].message || {};
        const piece = delta.content || delta.reasoning_content || (typeof delta.text === "string" ? delta.text : "");
        if (piece) {
          full += piece;
          onChunk == null ? void 0 : onChunk(piece, full);
        }
      }
    }
    return full;
  }
};

// src/model-routing.ts
function validConfiguredId(models, configuredId) {
  if (!configuredId) return null;
  return models.some((model) => model.id === configuredId) ? configuredId : null;
}
function keywordModelId(models, keyword) {
  var _a;
  const normalizedKeyword = keyword.toLocaleLowerCase();
  const match = models.find(
    (model) => [model.id, model.model, model.name].some(
      (value) => String(value != null ? value : "").toLocaleLowerCase().includes(normalizedKeyword)
    )
  );
  return (_a = match == null ? void 0 : match.id) != null ? _a : null;
}
function activeOrFirstId(settings) {
  var _a, _b, _c;
  return (_c = (_b = validConfiguredId(settings.models, settings.activeModelId)) != null ? _b : (_a = settings.models[0]) == null ? void 0 : _a.id) != null ? _c : "";
}
function resolveTranslateModelId(settings) {
  var _a, _b;
  return (_b = (_a = validConfiguredId(settings.models, settings.translateModelId)) != null ? _a : keywordModelId(settings.models, "deepseek")) != null ? _b : activeOrFirstId(settings);
}
function resolveContinueModelId(settings) {
  var _a, _b;
  return (_b = (_a = validConfiguredId(settings.models, settings.continueModelId)) != null ? _a : keywordModelId(settings.models, "glm")) != null ? _b : activeOrFirstId(settings);
}

// src/default-settings.ts
var LEGACY_0_4_0_TRANSLATE_PROMPT = "\u8BF7\u628A\u3010\u6211\u5F53\u524D\u9009\u4E2D\u5E76\u60F3\u8BA8\u8BBA\u7684\u539F\u6587\u7247\u6BB5\u3011\u5B8C\u6574\u7FFB\u8BD1\u6210\u4E2D\u6587\u3002\n1. \u9010\u6BB5\u5BF9\u5E94\u539F\u6587\u5206\u6BB5,\u4E0D\u8981\u5408\u5E76\u6216\u7701\u7565\u6BB5\u843D\u3002\n2. \u4E13\u4E1A\u672F\u8BED\u53EF\u4FDD\u7559\u82F1\u6587\u539F\u8BCD(\u62EC\u53F7\u6807\u6CE8\u5373\u53EF),\u516C\u5F0F\u3001\u4EE3\u7801\u3001\u53D8\u91CF\u540D\u3001\u56FE\u8868\u7F16\u53F7\u7B49\u4FDD\u6301\u539F\u6837\u4E0D\u7FFB\u8BD1\u3002\n3. \u53EA\u8F93\u51FA\u7FFB\u8BD1\u7ED3\u679C,\u4E0D\u8981\u8F93\u51FA\u539F\u6587\u3001\u4E0D\u8981\u590D\u8FF0\u8981\u6C42\u3001\u4E0D\u8981\u52A0\u989D\u5916\u89E3\u91CA\u6216\u603B\u7ED3\u3002";
var DEFAULT_SETTINGS = {
  models: [
    {
      id: "openai-compatible",
      name: "OpenAI-compatible API",
      endpoint: "",
      apiKey: "",
      model: ""
    }
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
  quickTranslateMarkerEnabled: true,
  translateModelId: "",
  continueModelId: "",
  systemPrompt: "\u4F60\u662F\u6211\u7684\u9605\u8BFB\u52A9\u624B\u3002\u8BF7\u7ED3\u5408\u4E0B\u9762\u63D0\u4F9B\u7684\u539F\u6587\u7247\u6BB5\u56DE\u7B54\u6211\u7684\u95EE\u9898\u3002\n1. \u4F18\u5148\u57FA\u4E8E\u539F\u6587\u7247\u6BB5\u56DE\u7B54,\u4E0D\u8981\u8131\u79BB\u5B83\u53E6\u8D77\u7089\u7076\u3002\n2. \u5982\u679C\u95EE\u9898\u5728\u539F\u6587\u7247\u6BB5\u4E2D\u627E\u4E0D\u5230\u4F9D\u636E,\u8BF7\u660E\u786E\u8BF4\u660E,\u4E0D\u8981\u7F16\u9020\u3002\n3. \u76F4\u63A5\u8F93\u51FA\u56DE\u7B54\u5185\u5BB9,\u4E0D\u8981\u590D\u8FF0\u89C4\u5219,\u4E0D\u8981\u52A0\u201C\u6839\u636E\u539F\u6587...\u201D\u8FD9\u7C7B\u5957\u8BDD\u5F00\u5934\u3002\n4. \u540E\u7EED\u8FFD\u95EE\u8981\u7ED3\u5408\u4E4B\u524D\u7684\u5BF9\u8BDD\u4E0A\u4E0B\u6587,\u4FDD\u6301\u8FDE\u8D2F\u3002",
  translation: {
    targetLanguage: "zh-CN",
    temperature: 0.1,
    maxTokens: 4e3,
    chunkChars: 8e3,
    additionalInstruction: ""
  },
  codexDeepAnalysis: {
    enabled: false,
    command: "codex",
    profile: "",
    model: "",
    timeoutMs: 6e5,
    keepTempFiles: false
  },
  // 全文摘要(浓缩上下文)相关设置:先用一个快速/便宜的模型把整篇 PDF 浓缩成摘要,
  // 缓存下来,回答局部选段问题时可以选择性地附带这份摘要作为背景,
  // 而不是把全文原样塞进上下文导致跑题或超长。
  summaryModelId: "openai-compatible",
  // 打开 PDF 划词弹窗时,如果已经缓存过摘要就自动附带、没缓存就自动生成一次,
  // 不需要每次手动勾选/点击,配合下面的按文件+mtime 缓存,同一篇论文只会真正调用一次摘要模型。
  autoDocSummary: true,
  summaryMaxChars: 1e5,
  // 摘要输出单独限制 token 数,避免和主聊天的 maxTokens 共用同一个上限导致摘要写得又长又碎。
  summaryMaxTokens: 700,
  summaryPrompt: "\u4F60\u662F\u4E00\u4E2A\u5B66\u672F\u8BBA\u6587\u63D0\u70BC\u52A9\u624B\u3002\u4E0B\u9762\u4F1A\u7ED9\u4F60\u4E00\u7BC7\u8BBA\u6587\u7684\u5168\u6587(\u53EF\u80FD\u56E0\u7BC7\u5E45\u8FC7\u957F\u88AB\u622A\u65AD)\u3002\n\u8BF7\u63D0\u70BC\u4E00\u4EFD*\u6781\u7B80*\u7684\u80CC\u666F\u6458\u8981\u5361\u7247,\u53EA\u7528\u6765\u7ED9\u6211\u4E4B\u540E\u9488\u5BF9\u8BBA\u6587\u91CC\u67D0\u4E00\u5C0F\u6BB5\u63D0\u95EE\u65F6\u63D0\u4F9B\u80CC\u666F\u53C2\u8003,\u4E0D\u662F\u5B8C\u6574\u6458\u8981,\u6211\u4E0D\u4F1A\u901A\u7BC7\u8BFB\u5B83\u3002\n\u786C\u6027\u8981\u6C42(\u52A1\u5FC5\u9075\u5B88):\n1. \u603B\u5B57\u6570\u4E0D\u8D85\u8FC7400\u5B57,\u5B81\u53EF\u5C11\u5199\u4E5F\u4E0D\u8981\u591A\u5199,\u8FD9\u662F\u786C\u4E0A\u9650,\u4E0D\u8981\u56E0\u4E3A\u539F\u6587\u957F\u5C31\u5199\u66F4\u591A\u3002\n2. \u53EA\u4FDD\u7559:\u7814\u7A76\u4E3B\u9898\u4E0E\u6838\u5FC3\u8D21\u732E(1-2\u53E5)\u3001\u603B\u4F53\u7ED3\u6784(\u6BCF\u8282\u4E00\u53E5\u8BDD\u5E26\u8FC7,\u4E0D\u5C55\u5F00\u7EC6\u8282)\u30013-5\u4E2A\u5173\u952E\u672F\u8BED\u7684\u6781\u7B80\u91CA\u4E49\u3001\u6838\u5FC3\u65B9\u6CD5/\u8BBA\u8BC1\u903B\u8F91(2-3\u53E5)\u3002\n3. \u4E0D\u9010\u6BB5\u590D\u8FF0\u3001\u4E0D\u4E3E\u4F8B\u3001\u4E0D\u5F15\u7528\u539F\u6587\u957F\u53E5\u3001\u4E0D\u5199\u80CC\u666F\u77E5\u8BC6\u79D1\u666E\u6BB5\u843D\u3002\n4. \u76F4\u63A5\u8F93\u51FA\u5185\u5BB9,\u4E0D\u8981\u201C\u597D\u7684,\u4EE5\u4E0B\u662F\u6458\u8981\u201D\u4E4B\u7C7B\u7684\u5F00\u573A\u767D\u6216\u7ED3\u5C3E\u603B\u7ED3\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002",
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
  ragFullTextThreshold: 18e4,
  // BM25 是纯字符匹配,中文问题和英文论文原文之间没有共同字符/词,直接检索基本会全部落空。
  // 开启后,提问时会先让一个快模型"思考"这个问题该从哪几个角度/说法去检索,输出多组中英双语检索词
  // (不只是逐字翻译),再拿每一组分别去检索、把结果融合排序,比单一检索词能覆盖更多角度、找得更全。
  ragQueryTranslate: true,
  ragQueryPrompt: "\u4F60\u662F\u8BBA\u6587\u68C0\u7D22\u7B56\u7565\u52A9\u624B,\u4EFB\u52A1\u662F\u628A\u6211\u7684\u95EE\u9898\u62C6\u89E3\u6210\u591A\u7EC4\u201C\u68C0\u7D22\u5173\u952E\u8BCD\u201D,\u7528\u4E8E\u5728\u8BBA\u6587\u5168\u6587\u91CC\u505A\u5173\u952E\u8BCD\u68C0\u7D22\u3002\u4F60\u4E0D\u8D1F\u8D23\u56DE\u7B54\u95EE\u9898\u672C\u8EAB\u3002\n\u8BBA\u6587\u539F\u6587\u53EF\u80FD\u662F\u82F1\u6587,\u4E5F\u53EF\u80FD\u662F\u4E2D\u6587,\u4F60\u5E76\u4E0D\u786E\u5B9A,\u6240\u4EE5\u6BCF\u4E00\u7EC4\u5173\u952E\u8BCD\u90FD\u8981\u4E2D\u82F1\u6587\u517C\u987E\u3002\n\u5728\u5FC3\u91CC(\u4E0D\u8981\u8F93\u51FA\u8FC7\u7A0B)\u6309\u8FD9\u4E2A\u601D\u8DEF\u601D\u8003:\n1. \u8FD9\u4E2A\u95EE\u9898\u771F\u6B63\u60F3\u77E5\u9053\u7684\u662F\u4EC0\u4E48?\u6309\u8BBA\u6587\u7684\u5E38\u89C1\u7ED3\u6784,\u7B54\u6848\u5927\u6982\u7387\u4F1A\u51FA\u73B0\u5728\u65B9\u6CD5/\u6570\u636E/\u5B9E\u9A8C\u8BBE\u7F6E/\u7ED3\u679C/\u5C40\u9650/\u76F8\u5173\u5DE5\u4F5C\u91CC\u7684\u54EA\u4E00\u90E8\u5206?\n2. \u8BBA\u6587\u4F5C\u8005\u63CF\u8FF0\u8FD9\u4E2A\u6982\u5FF5\u65F6,\u53EF\u80FD\u4F1A\u7528\u54EA\u4E9B\u4E0D\u540C\u7684\u8BF4\u6CD5(\u540C\u4E49\u8BCD\u3001\u66F4\u5B66\u672F\u5316\u7684\u8868\u8FBE\u3001\u5E38\u89C1\u7F29\u5199\u3001\u5BF9\u5E94\u7684\u516C\u5F0F\u7B26\u53F7\u6216\u53D8\u91CF\u540D)?\n3. \u5982\u679C\u8FD9\u4E2A\u95EE\u9898\u5305\u542B\u591A\u4E2A\u5B50\u95EE\u9898\u6216\u591A\u4E2A\u6982\u5FF5,\u80FD\u4E0D\u80FD\u62C6\u6210\u51E0\u4E2A\u66F4\u5177\u4F53\u3001\u66F4\u5BB9\u6613\u5206\u522B\u547D\u4E2D\u539F\u6587\u7684\u68C0\u7D22\u89D2\u5EA6?\n\u8F93\u51FA\u6070\u597D3\u884C,\u6BCF\u884C\u662F\u4E00\u7EC4\u72EC\u7ACB\u7684\u68C0\u7D22\u5173\u952E\u8BCD/\u77ED\u8BED(\u540C\u4E00\u884C\u5185\u591A\u4E2A\u5173\u952E\u8BCD\u7528\u9017\u53F7\u5206\u9694),3\u884C\u8981\u4EE3\u88683\u4E2A\u4E0D\u540C\u89D2\u5EA6\u6216\u4E0D\u540C\u8BF4\u6CD5\u7684\u68C0\u7D22\u5C1D\u8BD5,\u4E0D\u89813\u884C\u90FD\u662F\u540C\u4E00\u4E2A\u610F\u601D\u7684\u91CD\u590D\u8868\u8FBE\u3002\n\u76F4\u63A5\u8F93\u51FA\u8FD93\u884C,\u4E0D\u8981\u7F16\u53F7\u3001\u4E0D\u8981\u89E3\u91CA\u3001\u4E0D\u8981\u8F93\u51FA\u95EE\u9898\u672C\u8EAB\u3001\u4E0D\u8981\u8F93\u51FA\u8FD93\u884C\u4EE5\u5916\u7684\u4EFB\u4F55\u6587\u5B57\u3002",
  // key 是文件的 vault 相对路径,value 形如 { mtime, chunks: [{page, text}], generatedAt }
  docChunks: {},
  // 每篇 PDF(或精确匹配的非 PDF 选区)只保存一份最近对话。这里只存用户实际看到的问答,
  // 不保存 system prompt、全文或 RAG 检索片段,避免 data.json 被隐藏上下文快速撑大。
  conversationHistories: {},
  promptPresets: [
    {
      id: "paper-map",
      name: "\u8BBA\u6587\u901F\u8BFB\u5730\u56FE",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u5B66\u672F\u8BBA\u6587\u901F\u8BFB\u52A9\u624B\u3002\u8BBA\u6587\u4E0D\u662F\u6545\u4E8B,\u4E0D\u8981\u4ECE\u5934\u8BFB\u5230\u5C3E\u2014\u2014\u5148\u7ED9\u51FA\u5168\u5C40\u5730\u56FE,\u518D\u51B3\u5B9A\u54EA\u4E9B\u90E8\u5206\u503C\u5F97\u6DF1\u8BFB\u3002\n\u56DE\u7B54\u65F6\u4F18\u5148\u7ED9\u51FA:\u5206\u8282\u901F\u89C8(2-3\u53E5\u8BDD/\u8282)\u3001\u6838\u5FC3\u56E0\u679C\u94FE(A\u2192B\u2192C)\u3001\u503C\u4E0D\u503C\u5F97\u6DF1\u8BFB\u7684\u4F18\u5148\u7EA7\u5224\u65AD(\u9AD8/\u4E2D/\u4F4E)\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "methods-decoder",
      name: "\u65B9\u6CD5\u8BBA\u89E3\u7801",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u628A\u590D\u6742\u7814\u7A76\u65B9\u6CD5\u7FFB\u8BD1\u6210\u5927\u767D\u8BDD\u7684\u52A9\u624B,\u540C\u65F6\u662F\u6311\u5254\u7684\u65B9\u6CD5\u8BBA\u5BA1\u67E5\u8005\u3002\n\u56DE\u7B54\u65F6\u8BF4\u660E:\u7814\u7A76\u8BBE\u8BA1\u662F\u4EC0\u4E48(\u7C7B\u6BD4\u8BB2\u89E3)\u3001\u5173\u952E\u8981\u7D20(\u6837\u672C/\u53D8\u91CF/\u5206\u6790\u65B9\u6CD5)\u3001\u8FD9\u4E2A\u8BBE\u8BA1\u5F3A\u5728\u54EA\u3001\u5F31\u5728\u54EA(\u6BCF\u6761\u8BF4\u660E\u4F1A\u5BFC\u81F4\u7ED3\u8BBA\u5728\u4EC0\u4E48\u60C5\u51B5\u4E0B\u4E0D\u6210\u7ACB)\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "limitations",
      name: "\u5C40\u9650\u4E0E\u5047\u8BBE",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u4E25\u8C28\u7684\u8BBA\u6587\u8BC4\u5BA1\u8005\u3002\u6BCF\u7BC7\u8BBA\u6587\u90FD\u6709\u5C40\u9650\u2014\u2014\u6709\u4E9B\u4F5C\u8005\u81EA\u5DF1\u627F\u8BA4,\u6709\u4E9B\u85CF\u5728\u8BBE\u8BA1\u91CC\u6CA1\u8BF4\u3002\n\u56DE\u7B54\u65F6\u533A\u5206:\u4F5C\u8005\u660E\u8BF4\u7684\u5C40\u9650 vs \u6CA1\u8BF4\u4F46\u6697\u542B\u7684\u5047\u8BBE(\u6BCF\u6761\u8BF4\u660E\u5047\u8BBE\u4E0D\u6210\u7ACB\u4F1A\u600E\u6837\u5F71\u54CD\u7ED3\u8BBA),\u5E76\u7ED9\u51FA\u7ED3\u8BBA\u53EF\u4FE1\u5EA6\u7684\u6574\u4F53\u5224\u65AD\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "reproducibility",
      name: "\u590D\u73B0\u6027\u68C0\u67E5",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u4E13\u6CE8\u4E8E\u53EF\u590D\u73B0\u6027\u7684\u5BA1\u67E5\u8005,\u53C2\u8003 FAIR \u539F\u5219\u7684\u601D\u8DEF,\u4F46\u4F1A\u6309\u8BBA\u6587\u6240\u5C5E\u9886\u57DF\u81EA\u884C\u5224\u65AD\u5408\u7406\u6807\u51C6\u3002\n\u56DE\u7B54\u65F6\u6309:\u6570\u636E\u53EF\u83B7\u5F97\u6027\u3001\u4EE3\u7801\u4E0E\u73AF\u5883\u3001\u6D41\u7A0B\u6B65\u9AA4\u3001\u53C2\u6570\u900F\u660E\u5EA6\u56DB\u4E2A\u7EF4\u5EA6\u8BC4\u4F30,\u6700\u540E\u7ED9\u51FA\u4F4E/\u4E2D/\u9AD8\u590D\u73B0\u6027\u8BC4\u7EA7\u548C\u6700\u7F3A\u7684\u4E09\u6837\u4E1C\u897F\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "math",
      name: "\u6570\u5B66\u7B26\u53F7\u8BB2\u89E3",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u628A\u516C\u5F0F\u548C\u7B26\u53F7\u7FFB\u8BD1\u6210\u5927\u767D\u8BDD\u7684\u52A9\u624B,\u5047\u8BBE\u6211\u5177\u5907\u57FA\u7840\u7684\u8BE5\u9886\u57DF\u77E5\u8BC6,\u4F46\u8BB0\u4E0D\u6E05\u5177\u4F53\u7B26\u53F7\u7EA6\u5B9A\u3002\n\u56DE\u7B54\u65F6\u9010\u4E2A\u7B26\u53F7\u8BB2\u89E3\u542B\u4E49\u3001\u8BF4\u660E\u516C\u5F0F\u5728\u7B97\u4EC0\u4E48\u3001\u4E3A\u4EC0\u4E48\u8FD9\u4E2A\u516C\u5F0F\u5BF9\u8BBA\u70B9\u5173\u952E,\u5982\u679C\u53EF\u80FD\u7ED9\u4E00\u4E2A\u6781\u7B80\u6570\u503C\u4F8B\u5B50\u5E2E\u52A9\u5EFA\u7ACB\u76F4\u89C9\u3002\u7528\u4E2D\u6587,\u7B26\u53F7\u672C\u8EAB\u4FDD\u7559\u539F\u6837\u3002"
    },
    {
      id: "critic",
      name: "\u6279\u5224\u6027\u5BA1\u8BFB",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u903B\u8F91\u5BA1\u67E5\u8005\u548C\u8FA9\u8BC1\u5206\u6790\u8005\u3002\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u540C\u610F\u8BBA\u6587,\u800C\u662F\u63D0\u4F9B\u6709\u4EF7\u503C\u7684\u963B\u529B\u2014\u2014\u5E2E\u6211\u628A\u7406\u89E3\u63A8\u8FDB\u5230\u80FD\u6311\u51FA\u6BDB\u75C5\u3002\n\u56DE\u7B54\u65F6\u53EF\u4EE5\u5305\u542B:\u88AB\u5FFD\u7565\u7684\u66FF\u4EE3\u8DEF\u5F84\u3001\u903B\u8F91\u6F0F\u6D1E(\u8C2C\u8BEF/\u8BED\u4E49\u8DF3\u8DC3)\u3001\u6700\u6709\u529B\u7684\u53CD\u65B9\u8BBA\u8BC1(Steel Man)\u3001\u4F5C\u8005\u7565\u8FC7\u7684\u5173\u952E\u95EE\u9898(\u623F\u95F4\u91CC\u7684\u5927\u8C61)\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD,\u4E0D\u8981\u91CD\u590D\u539F\u6587\u5185\u5BB9\u3002"
    },
    {
      id: "scaffold",
      name: "\u6982\u5FF5\u811A\u624B\u67B6",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u8BA4\u77E5\u9605\u8BFB\u6559\u7EC3\u3002\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u66FF\u6211\u603B\u7ED3\u6587\u5B57,\u800C\u662F\u5E2E\u6211\u642D\u5EFA\u7406\u89E3\u5B83\u6240\u9700\u8981\u7684\u811A\u624B\u67B6\u2014\u2014\u8865\u4E0A\u4F5C\u8005\u9ED8\u8BA4\u6211\u5DF2\u7ECF\u77E5\u9053\u3001\u4F46\u6211\u5B9E\u9645\u4E0A\u4E0D\u77E5\u9053\u7684\u90E8\u5206\u3002\u5047\u8BBE\u6211\u5728\u8FD9\u4E2A\u9886\u57DF\u80CC\u666F\u77E5\u8BC6\u4E3A\u96F6,\u9664\u975E\u660E\u663E\u4E0D\u662F\u8FD9\u6837\u3002\n\u56DE\u7B54\u65F6\u53EF\u4EE5\u5305\u542B:\u80CC\u666F\u77E5\u8BC6\u901F\u89C8\u3001\u672F\u8BED\u8868\u3001\u6697\u542B\u63A8\u7406(\u7EBF\u7D22/\u7A7A\u767D/\u7F6E\u4FE1\u5EA6)\u3001\u5BB9\u6613\u8BFB\u9519\u7684\u5730\u65B9\u3001\u7528\u96F6\u672F\u8BED\u7684\u60C5\u5883\u6A21\u578B\u8BB2\u89E3\u3002\u7528\u4E2D\u6587,\u4E13\u4E1A\u672F\u8BED\u4FDD\u7559\u82F1\u6587\u539F\u8BCD\u3002"
    },
    {
      id: "quiz",
      name: "\u81EA\u6D4B\u4E94\u95EE",
      prompt: "\u4F60\u662F\u4E00\u4F4D\u8BFE\u7A0B\u8BBE\u8BA1\u5E08\u548C\u82CF\u683C\u62C9\u5E95\u5F0F\u5F15\u5BFC\u8005\u3002\u4F60\u7684\u4EFB\u52A1\u4E0D\u662F\u66FF\u6211\u89E3\u91CA\u8BBA\u6587,\u800C\u662F\u63D0\u70BC\u51FA\u80FD\u68C0\u9A8C\u6211\u662F\u5426\u771F\u6B63\u7406\u89E3\u6838\u5FC3\u539F\u7406\u7684\u9AD8\u5C42\u6B21\u95EE\u9898\u2014\u2014\u7528\u6765\u8003\u6211,\u4E0D\u662F\u7528\u6765\u8BB2\u7ED9\u6211\u542C\u3002\n\u88AB\u8981\u6C42\u51FA\u9898\u65F6,\u63D0\u70BC\u6070\u597D5\u4E2A\u9AD8\u5C42\u6B21\u95EE\u9898(\u907F\u514D\u662F\u975E\u9898,\u4F18\u5148\u7528\u5982\u4F55/\u4E3A\u4EC0\u4E48/\u5982\u679C...\u4F1A\u600E\u6837),\u6700\u540E\u52A0\u4E00\u4E2A\u5FC5\u987B\u4E32\u8054\u6240\u6709\u4E3B\u9898\u624D\u80FD\u56DE\u7B54\u7684\u7EFC\u5408\u95EE\u9898\u3002\u5176\u4F59\u65F6\u5019\u6B63\u5E38\u56DE\u7B54\u6211\u7684\u95EE\u9898\u3002\u7528\u4E2D\u6587\u3002"
    }
  ]
};

// src/paper-context.ts
function getActivePdfFile(app) {
  const leaf = app.workspace.activeLeaf;
  const view = leaf && leaf.view;
  if (view && typeof view.getViewType === "function" && view.getViewType() === "pdf" && "file" in view) {
    return view.file || null;
  }
  return null;
}
async function extractPdfPages(app, file) {
  const pdfjsLib = window.pdfjsLib;
  if (!(pdfjsLib == null ? void 0 : pdfjsLib.getDocument)) {
    throw new Error("\u5F53\u524D Obsidian \u7248\u672C\u6CA1\u6709\u66B4\u9732 pdfjsLib,\u65E0\u6CD5\u63D0\u53D6\u5168\u6587");
  }
  const buffer = await app.vault.readBinary(file);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str || "").join(" ");
    pages.push({ page: pageNumber, text: pageText });
  }
  return pages;
}
async function extractPdfFullText(app, file) {
  const pages = await extractPdfPages(app, file);
  return pages.map((page) => `[\u7B2C${page.page}\u9875]
${page.text}`).join("\n\n").trim();
}
function chunkPdfPages(pages, chunkSize, overlap) {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError("chunkSize must be a positive integer");
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError("overlap must be an integer between 0 and chunkSize - 1");
  }
  const chunks = [];
  for (const page of pages) {
    const text = (page.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (text.length <= chunkSize) {
      chunks.push({ page: page.page, text });
      continue;
    }
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push({ page: page.page, text: text.slice(start, end) });
      if (end >= text.length) break;
      const nextStart = end - overlap;
      if (nextStart <= start) throw new RangeError("chunk settings must advance the cursor");
      start = nextStart;
    }
  }
  chunks.forEach((chunk, index) => chunk.idx = index);
  return chunks;
}
function expandWithNeighbors(allChunks, retrieved) {
  if (!(retrieved == null ? void 0 : retrieved.length)) return retrieved;
  const wanted = /* @__PURE__ */ new Set();
  retrieved.forEach((chunk) => {
    if (typeof chunk.idx !== "number") return;
    wanted.add(chunk.idx - 1);
    wanted.add(chunk.idx);
    wanted.add(chunk.idx + 1);
  });
  return allChunks.filter((chunk) => typeof chunk.idx === "number" && wanted.has(chunk.idx)).sort((left, right) => (left.idx || 0) - (right.idx || 0));
}
function tokenizeForBM25(text) {
  const lower = (text || "").toLowerCase();
  const tokens = [];
  const wordPattern = /[a-z0-9]+/g;
  let match;
  while (match = wordPattern.exec(lower)) tokens.push(match[0]);
  const cjk = lower.match(/[\u4e00-\u9fff]/g) || [];
  for (let index = 0; index < cjk.length; index++) {
    tokens.push(cjk[index]);
    if (index + 1 < cjk.length) tokens.push(cjk[index] + cjk[index + 1]);
  }
  return tokens;
}
function bm25Retrieve(chunks, query, topK) {
  if (!(chunks == null ? void 0 : chunks.length)) return [];
  const documentTokens = chunks.map((chunk) => tokenizeForBM25(chunk.text));
  const documentFrequency = /* @__PURE__ */ new Map();
  documentTokens.forEach((tokens) => {
    new Set(tokens).forEach(
      (token) => documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1)
    );
  });
  const documentCount = documentTokens.length;
  const averageLength = documentTokens.reduce((total, tokens) => total + tokens.length, 0) / (documentCount || 1) || 1;
  const k1 = 1.5;
  const b = 0.75;
  const queryTokens = Array.from(new Set(tokenizeForBM25(query)));
  const scored = chunks.map((chunk, index) => {
    const tokens = documentTokens[index];
    const documentLength = tokens.length || 1;
    const termFrequency = /* @__PURE__ */ new Map();
    tokens.forEach((token) => termFrequency.set(token, (termFrequency.get(token) || 0) + 1));
    let score = 0;
    for (const queryToken of queryTokens) {
      const frequency = termFrequency.get(queryToken) || 0;
      if (!frequency) continue;
      const containingDocuments = documentFrequency.get(queryToken) || 0;
      const inverseFrequency = Math.log(
        1 + (documentCount - containingDocuments + 0.5) / (containingDocuments + 0.5)
      );
      const denominator = frequency + k1 * (1 - b + b * documentLength / averageLength);
      score += inverseFrequency * (frequency * (k1 + 1) / denominator);
    }
    return { chunk, score };
  });
  return scored.sort((left, right) => right.score - left.score).filter((entry) => entry.score > 0).slice(0, topK).map((entry) => entry.chunk);
}
function bm25RetrieveMulti(chunks, queries, topK) {
  const uniqueQueries = Array.from(new Set((queries || []).filter(Boolean)));
  if (!uniqueQueries.length) return [];
  const keyOf = (chunk) => chunk.page + "::" + chunk.text.slice(0, 60);
  const fused = /* @__PURE__ */ new Map();
  for (const query of uniqueQueries) {
    const ranked = bm25Retrieve(chunks, query, Math.max(topK * 2, 8));
    ranked.forEach((chunk, rank) => {
      const key = keyOf(chunk);
      const entry = fused.get(key) || { chunk, score: 0 };
      entry.score += 1 / (rank + 1);
      fused.set(key, entry);
    });
  }
  return Array.from(fused.values()).sort((left, right) => right.score - left.score).slice(0, topK).map((entry) => entry.chunk);
}
var PaperContextService = class {
  constructor(app, getSettings, persistSettings, transport, getModelProfile) {
    this.app = app;
    this.getSettings = getSettings;
    this.persistSettings = persistSettings;
    this.transport = transport;
    this.getModelProfile = getModelProfile;
  }
  createContext(file, selectedText, conversationKey) {
    return { app: this.app, file, selectedText, conversationKey };
  }
  extractPages(file) {
    return extractPdfPages(this.app, file);
  }
  extractFullText(file) {
    return extractPdfFullText(this.app, file);
  }
  async generateDocSummary(file) {
    const settings = this.getSettings();
    const fullText = await this.extractFullText(file);
    let textForSummary = fullText;
    let truncated = false;
    const maxChars = settings.summaryMaxChars || DEFAULT_SETTINGS.summaryMaxChars;
    if (textForSummary.length > maxChars) {
      textForSummary = textForSummary.slice(0, maxChars);
      truncated = true;
    }
    const profile = this.getModelProfile(settings.summaryModelId) || this.getModelProfile(settings.activeModelId);
    const systemPrompt = settings.summaryPrompt + (truncated ? "\n\n(\u6CE8\u610F:\u539F\u6587\u8FC7\u957F,\u4EE5\u4E0B\u53EA\u662F\u622A\u65AD\u540E\u7684\u524D\u9762\u90E8\u5206)" : "");
    const summary = await this.transport.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textForSummary || "(\u672A\u80FD\u63D0\u53D6\u5230\u6587\u672C\u5185\u5BB9)" }
      ],
      modelProfile: profile,
      maxTokensOverride: settings.summaryMaxTokens || DEFAULT_SETTINGS.summaryMaxTokens,
      stream: false
    });
    return { summary, fullLength: fullText.length, truncated };
  }
  async getOrCreateDocSummary(file, forceRefresh) {
    const settings = this.getSettings();
    const mtime = file.stat && file.stat.mtime;
    const cached = settings.docSummaries[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) return cached;
    const { summary, fullLength, truncated } = await this.generateDocSummary(file);
    const entry = { mtime, summary, generatedAt: Date.now(), fullLength, truncated };
    settings.docSummaries[file.path] = entry;
    await this.persistSettings();
    return entry;
  }
  async generateDocChunks(file) {
    const settings = this.getSettings();
    const pages = await extractPdfPages(this.app, file);
    const chunks = chunkPdfPages(
      pages,
      settings.ragChunkSize,
      settings.ragChunkOverlap
    );
    const fullTextLength = pages.reduce((total, page) => total + (page.text ? page.text.length : 0), 0);
    return { chunks, fullTextLength };
  }
  async planRagQueries(question) {
    const settings = this.getSettings();
    const profile = this.getModelProfile(settings.summaryModelId) || this.getModelProfile(settings.activeModelId);
    const raw = await this.transport.chat({
      messages: [
        { role: "system", content: settings.ragQueryPrompt },
        { role: "user", content: question }
      ],
      modelProfile: profile,
      maxTokensOverride: 300,
      stream: false
    });
    return (raw || "").split(/\r?\n/).map((line) => line.replace(/^[\s\-*•\d.、)]+/, "").trim()).filter(Boolean);
  }
  async getOrCreateDocChunks(file, forceRefresh) {
    var _a;
    const settings = this.getSettings();
    const mtime = file.stat && file.stat.mtime;
    const cached = settings.docChunks[file.path];
    if (!forceRefresh && cached && cached.mtime === mtime) {
      if (((_a = cached.chunks) == null ? void 0 : _a.length) && typeof cached.chunks[0].idx !== "number") {
        cached.chunks.forEach((chunk, index) => chunk.idx = index);
      }
      return cached;
    }
    const { chunks, fullTextLength } = await this.generateDocChunks(file);
    const entry = { mtime, chunks, fullTextLength, generatedAt: Date.now() };
    settings.docChunks[file.path] = entry;
    await this.persistSettings();
    return entry;
  }
  retrieveContext(chunks, queries, topK) {
    return expandWithNeighbors(chunks, bm25RetrieveMulti(chunks, queries, topK));
  }
};

// src/translation.ts
var FAILED_CHUNK_PREFIX = "[\u7FFB\u8BD1\u5931\u8D25\uFF0C\u4FDD\u7559\u539F\u6587]";
var GENERIC_TRANSLATION_FAILURE = "Translation failed for every chunk.";
function isWhitespace(value) {
  return /^\s$/u.test(value);
}
function sentenceBoundary(points, start, hardEnd) {
  const punctuation = /* @__PURE__ */ new Set([".", "!", "?", "\u3002", "\uFF01", "\uFF1F"]);
  const closers = /* @__PURE__ */ new Set(['"', "'", "\u201D", "\u2019", "\uFF09", "]"]);
  let boundary = -1;
  for (let index = start; index < hardEnd; index += 1) {
    if (!punctuation.has(points[index])) continue;
    let after = index + 1;
    while (after < hardEnd && closers.has(points[after])) after += 1;
    if (after >= hardEnd || !isWhitespace(points[after])) continue;
    while (after < hardEnd && isWhitespace(points[after])) after += 1;
    boundary = after;
  }
  return boundary;
}
function preferredBoundary(points, start, hardEnd) {
  for (let index = hardEnd - 2; index >= start; index -= 1) {
    if (points[index] === "\n" && points[index + 1] === "\n") return index + 2;
  }
  for (let index = hardEnd - 1; index >= start; index -= 1) {
    if (points[index] === "\n") return index + 1;
  }
  const sentence = sentenceBoundary(points, start, hardEnd);
  if (sentence > start) return sentence;
  for (let index = hardEnd - 1; index >= start; index -= 1) {
    if (isWhitespace(points[index])) return index + 1;
  }
  return hardEnd;
}
function splitTranslationChunks(source, limit) {
  if (!source) return [];
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError("Translation chunk limit must be a positive integer");
  }
  const points = Array.from(source);
  if (points.length <= limit) return [source];
  const chunks = [];
  let start = 0;
  while (start < points.length) {
    const hardEnd = Math.min(start + limit, points.length);
    const end = hardEnd === points.length ? hardEnd : preferredBoundary(points, start, hardEnd);
    chunks.push(points.slice(start, end).join(""));
    start = end;
  }
  return chunks;
}
function buildTranslationMessages(source, settings) {
  const system = `You are an expert academic translator. Produce a faithful academic translation into ${settings.targetLanguage}. Preserve paragraph boundaries and paragraph order. Preserve formulas, code, variables, citations, and figure and table numbers exactly. Output only the translated text.`;
  const additional = settings.additionalInstruction ? `Additional instruction:
${settings.additionalInstruction}

` : "";
  return [
    { role: "system", content: system },
    {
      role: "user",
      content: `${additional}<source_text>
${source}
</source_text>`
    }
  ];
}
function combineTranslations(translations) {
  return translations.filter((translation) => translation.trim().length > 0).join("\n\n");
}
function stoppedResult(chunks, completed, failedChunkIndexes) {
  return {
    text: combineTranslations(completed),
    chunkCount: chunks.length,
    stoppedEarly: true,
    failedChunkIndexes: [...failedChunkIndexes]
  };
}
function emitProgress(request, chunkIndex, chunkCount, chunkText, completed) {
  var _a;
  const progress = {
    chunkIndex: chunkIndex + 1,
    chunkCount,
    chunkText,
    combinedText: combineTranslations(completed)
  };
  (_a = request.onChunk) == null ? void 0 : _a.call(request, progress);
}
var TranslationService = class {
  constructor(llm) {
    this.llm = llm;
  }
  async translate(request) {
    var _a, _b, _c, _d, _e;
    const chunks = splitTranslationChunks(request.source, request.settings.chunkChars);
    if (!chunks.length) {
      return {
        text: "",
        chunkCount: 0,
        stoppedEarly: false,
        failedChunkIndexes: []
      };
    }
    const completed = [];
    const failedChunkIndexes = [];
    const requestOnce = async (chunk) => {
      return this.llm.chat({
        messages: buildTranslationMessages(chunk, request.settings),
        modelProfile: request.modelProfile,
        signal: request.signal,
        stream: true,
        temperatureOverride: request.settings.temperature,
        maxTokensOverride: request.settings.maxTokens
      });
    };
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      if ((_a = request.signal) == null ? void 0 : _a.aborted) {
        return stoppedResult(chunks, completed, failedChunkIndexes);
      }
      const chunk = chunks[chunkIndex];
      let translated = "";
      let failed = false;
      try {
        translated = (await requestOnce(chunk)).trim();
        if ((_b = request.signal) == null ? void 0 : _b.aborted) {
          return stoppedResult(chunks, completed, failedChunkIndexes);
        }
        if (!translated) {
          if ((_c = request.signal) == null ? void 0 : _c.aborted) {
            return stoppedResult(chunks, completed, failedChunkIndexes);
          }
          translated = (await requestOnce(chunk)).trim();
          if ((_d = request.signal) == null ? void 0 : _d.aborted) {
            return stoppedResult(chunks, completed, failedChunkIndexes);
          }
          failed = !translated;
        }
      } catch (e) {
        if ((_e = request.signal) == null ? void 0 : _e.aborted) {
          return stoppedResult(chunks, completed, failedChunkIndexes);
        }
        failed = true;
      }
      const output = failed ? `${FAILED_CHUNK_PREFIX}
${chunk}` : translated;
      if (failed) failedChunkIndexes.push(chunkIndex);
      completed.push(output);
      emitProgress(request, chunkIndex, chunks.length, output, completed);
    }
    if (failedChunkIndexes.length === chunks.length) {
      throw new Error(GENERIC_TRANSLATION_FAILURE);
    }
    return {
      text: combineTranslations(completed),
      chunkCount: chunks.length,
      stoppedEarly: false,
      failedChunkIndexes
    };
  }
};

// src/modal-services.ts
function createPDFChatModalServices(plugin, overrides = {}) {
  const llm = {
    chat: (request) => {
      if (plugin.llmTransport) return plugin.llmTransport.chat(request);
      return plugin.chat(
        request.messages,
        request.onChunk,
        request.signal,
        request.modelProfile,
        {
          stream: request.stream,
          maxTokensOverride: request.maxTokensOverride,
          temperatureOverride: request.temperatureOverride
        }
      );
    }
  };
  const compatibility = {
    conversations: {
      getKey: (file, selectedText, kind) => plugin.getConversationKey(file, selectedText, kind),
      get: (key) => plugin.getConversation(key),
      save: (key, messages) => plugin.saveConversation(key, messages),
      clear: (key) => plugin.clearConversation(key)
    },
    papers: {
      getOrCreateDocSummary: (file, forceRefresh) => plugin.getOrCreateDocSummary(file, forceRefresh),
      getOrCreateDocChunks: (file, forceRefresh) => plugin.getOrCreateDocChunks(file, forceRefresh),
      extractPages: (file) => plugin.paperContextService ? plugin.paperContextService.extractPages(file) : extractPdfPages(plugin.app || {}, file),
      extractFullText: (file) => plugin.paperContextService ? plugin.paperContextService.extractFullText(file) : extractPdfFullText(plugin.app || {}, file),
      planRagQueries: (question) => plugin.planRagQueries(question),
      retrieveContext: (chunks, queries, topK) => expandWithNeighbors(chunks, bm25RetrieveMulti(chunks, queries, topK))
    },
    llm,
    models: {
      get: (id) => plugin.getModelProfile(id),
      resolveTranslateId: () => plugin.resolveTranslateModelId(),
      resolveContinueId: () => plugin.resolveContinueModelId()
    },
    actions: plugin.actionRegistry || createResearchActionRegistry(),
    translations: plugin.translationService || new TranslationService(llm)
  };
  return {
    ...compatibility,
    ...overrides,
    conversations: { ...compatibility.conversations, ...overrides.conversations || {} },
    papers: { ...compatibility.papers, ...overrides.papers || {} },
    llm: { ...compatibility.llm, ...overrides.llm || {} },
    models: { ...compatibility.models, ...overrides.models || {} },
    actions: overrides.actions || compatibility.actions,
    translations: {
      translate: (request) => {
        var _a;
        return ((_a = overrides.translations) == null ? void 0 : _a.translate) ? overrides.translations.translate(request) : compatibility.translations.translate(request);
      }
    }
  };
}

// src/pdf-chat-modal.ts
var import_obsidian3 = require("obsidian");

// src/multi-paper.ts
var import_obsidian2 = require("obsidian");
function loadNodeModule(name) {
  const nodeRequire = typeof require === "function" ? require : null;
  if (!nodeRequire) throw new Error("Node.js APIs are not available in this Obsidian environment");
  return nodeRequire(name);
}
function isPdfFile(file) {
  const extension = String(file.extension || "").toLowerCase();
  if (extension) return extension === "pdf";
  return /\.pdf$/i.test(file.path || file.name || "");
}
function searchPdfFiles(app, query, options = {}) {
  var _a;
  const files = ((_a = app == null ? void 0 : app.vault) == null ? void 0 : _a.getFiles) ? app.vault.getFiles() : [];
  const normalizedQuery = (query || "").trim();
  const matcher = normalizedQuery && typeof import_obsidian2.prepareFuzzySearch === "function" ? (0, import_obsidian2.prepareFuzzySearch)(normalizedQuery) : null;
  const fallbackQuery = normalizedQuery.toLowerCase();
  const candidates = files.filter(isPdfFile).filter((file) => {
    var _a2;
    return !((_a2 = options.excludePaths) == null ? void 0 : _a2.has(file.path));
  }).map((file) => {
    var _a2;
    const target = `${file.name || ""} ${file.path || ""}`;
    const match = matcher ? matcher(target) : fallbackQuery ? target.toLowerCase().includes(fallbackQuery) ? { score: fallbackQuery.length, matches: [] } : null : { score: 1, matches: [] };
    if (!match) return null;
    return {
      path: file.path,
      name: file.name || file.path.split(/[\\/]/).pop() || file.path,
      score: typeof match.score === "number" ? match.score : normalizedQuery.length || 1,
      cached: Boolean((_a2 = options.cachedPaths) == null ? void 0 : _a2.has(file.path))
    };
  }).filter((candidate) => Boolean(candidate)).sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));
  return candidates.slice(0, options.limit || 8);
}
function safePaperId(input, fallback) {
  const base = (input || fallback || "paper").replace(/\\/g, "/").split("/").pop().replace(/\.pdf$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || fallback || "paper";
}
function writeJson(fs, file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}
function pageFileName(page) {
  return `page-${String(page).padStart(3, "0")}.md`;
}
function createCodexAnalysisTempDir(taskId) {
  const fs = loadNodeModule("node:fs");
  const os = loadNodeModule("node:os");
  const path = loadNodeModule("node:path");
  return fs.mkdtempSync(path.join(os.tmpdir(), `pdf-chat-analysis-${taskId}-`));
}
function removeCodexAnalysisTempDir(analysisDir) {
  if (!analysisDir) return;
  const fs = loadNodeModule("node:fs");
  fs.rmSync(analysisDir, { recursive: true, force: true });
}
function codexAnalysisOutputSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["taskType", "question", "papers", "comparison", "synthesis", "limitations"],
    properties: {
      taskType: { const: "multi-paper-analysis" },
      question: { type: "string" },
      papers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "name", "role", "oneSentenceTakeaway", "coreMethod", "keyEvidence"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            role: { enum: ["current", "referenced"] },
            oneSentenceTakeaway: { type: "string" },
            coreMethod: { type: "string" },
            keyEvidence: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["claim", "source"],
                properties: {
                  claim: { type: "string" },
                  source: { type: "string" },
                  page: { type: "number" }
                }
              }
            }
          }
        }
      },
      comparison: {
        type: "object",
        additionalProperties: false,
        required: ["similarities", "differences", "complementaryOpportunities", "conflictsOrRisks"],
        properties: {
          similarities: { type: "array", items: { type: "string" } },
          differences: { type: "array", items: { type: "string" } },
          complementaryOpportunities: { type: "array", items: { type: "string" } },
          conflictsOrRisks: { type: "array", items: { type: "string" } }
        }
      },
      synthesis: {
        type: "object",
        additionalProperties: false,
        required: ["shortAnswer", "detailedAnalysisMarkdown", "suggestedNextQuestions"],
        properties: {
          shortAnswer: { type: "string" },
          detailedAnalysisMarkdown: { type: "string" },
          suggestedNextQuestions: { type: "array", items: { type: "string" } }
        }
      },
      limitations: { type: "array", items: { type: "string" } }
    }
  };
}
async function writeCodexAnalysisPackage(request) {
  const fs = loadNodeModule("node:fs");
  const path = loadNodeModule("node:path");
  const analysisDir = request.baseDir;
  fs.mkdirSync(path.join(analysisDir, "papers"), { recursive: true });
  const manifestPapers = [];
  for (const [index, paper] of request.papers.entries()) {
    const id = safePaperId(paper.id || paper.vaultPath || paper.name, `paper-${index + 1}`);
    const paperDir = path.join(analysisDir, "papers", id);
    const pagesDir = path.join(paperDir, "pages");
    fs.mkdirSync(pagesDir, { recursive: true });
    const metadataPath = path.join("papers", id, "metadata.json");
    const summaryPath = path.join("papers", id, "summary.md");
    const fullTextPath = path.join("papers", id, "full_text.md");
    const chunksPath = path.join("papers", id, "chunks.json");
    const relativePagesDir = path.join("papers", id, "pages").replace(/\\/g, "/");
    writeJson(fs, path.join(analysisDir, metadataPath), {
      id,
      name: paper.name,
      role: paper.role,
      vaultPath: paper.vaultPath,
      mtime: paper.mtime,
      pageCount: paper.pages.length,
      fullTextLength: paper.pages.reduce((total, page) => total + (page.text || "").length, 0),
      chunkCount: paper.chunks.length
    });
    fs.writeFileSync(path.join(analysisDir, summaryPath), paper.summary || "(no summary)", "utf8");
    fs.writeFileSync(
      path.join(analysisDir, fullTextPath),
      paper.pages.map((page) => `[Page ${page.page}]
${page.text}`).join("\n\n"),
      "utf8"
    );
    writeJson(fs, path.join(analysisDir, chunksPath), paper.chunks);
    for (const page of paper.pages) {
      fs.writeFileSync(path.join(pagesDir, pageFileName(page.page)), page.text || "", "utf8");
    }
    manifestPapers.push({
      id,
      role: paper.role,
      name: paper.name,
      vaultPath: paper.vaultPath,
      metadataPath: metadataPath.replace(/\\/g, "/"),
      summaryPath: summaryPath.replace(/\\/g, "/"),
      fullTextPath: fullTextPath.replace(/\\/g, "/"),
      chunksPath: chunksPath.replace(/\\/g, "/"),
      pagesDir: relativePagesDir
    });
  }
  const manifest = {
    version: 1,
    taskId: request.taskId,
    createdAt: request.createdAt,
    question: request.question,
    papers: manifestPapers
  };
  const manifestPath = path.join(analysisDir, "manifest.json");
  const questionPath = path.join(analysisDir, "question.md");
  const outputSchemaPath = path.join(analysisDir, "output.schema.json");
  writeJson(fs, manifestPath, manifest);
  fs.writeFileSync(questionPath, request.question, "utf8");
  writeJson(fs, outputSchemaPath, codexAnalysisOutputSchema());
  return { analysisDir, manifestPath, questionPath, outputSchemaPath };
}
function buildCodexDeepAnalysisPrompt() {
  return [
    "You are a careful research assistant performing multi-paper analysis.",
    "Read manifest.json and question.md first.",
    "For each paper: read summary.md, then full_text.md, and use pages/ or chunks.json for evidence.",
    "Extract each paper's research problem, core method, assumptions, experiments, conclusions, and limitations.",
    "Then compare similarities, differences, complementary opportunities, and conflicts or risks.",
    "Every important claim must cite the paper name and page or chunk/source location when available.",
    "Return only JSON that matches output.schema.json. Do not include markdown fences."
  ].join("\n");
}
function buildCodexExecArgs(request) {
  const args = [
    "exec",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--ephemeral",
    "--cd",
    request.analysisDir,
    "--output-schema",
    "output.schema.json",
    "--output-last-message",
    "codex-output.json"
  ];
  if (request.profile) args.push("--profile", request.profile);
  if (request.model) args.push("--model", request.model);
  args.push(request.prompt);
  return { command: request.command || "codex", args };
}
function argValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : null;
}
function redactProcessText(text) {
  return (text || "").replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [REDACTED]").replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[REDACTED]").slice(0, 1200);
}
function runCodexExec(execArgs, options) {
  const path = loadNodeModule("node:path");
  const fs = loadNodeModule("node:fs");
  const childProcess = options.spawn ? { spawn: options.spawn } : loadNodeModule("node:child_process");
  const analysisDir = argValue(execArgs.args, "--cd");
  if (!analysisDir) throw new Error("Codex command is missing --cd analysis directory");
  const outputFileName = options.outputFileName || "codex-output.json";
  const outputPath = path.join(analysisDir, outputFileName);
  return new Promise((resolve, reject) => {
    var _a, _b;
    let settled = false;
    let stderr = "";
    const timeoutMs = Math.max(1, options.timeoutMs || 6e5);
    const child = childProcess.spawn(execArgs.command, execArgs.args, {
      cwd: analysisDir,
      windowsHide: true,
      shell: false
    });
    let timer;
    const onAbort = () => {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        void error;
      }
      const abortError = new Error("Codex analysis aborted");
      abortError.name = "AbortError";
      finish(() => reject(abortError));
    };
    const finish = (callback) => {
      var _a2;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      (_a2 = options.signal) == null ? void 0 : _a2.removeEventListener("abort", onAbort);
      callback();
    };
    (_a = options.signal) == null ? void 0 : _a.addEventListener("abort", onAbort);
    timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        void error;
      }
      finish(() => reject(new Error(`Codex analysis timed out after ${timeoutMs}ms`)));
    }, timeoutMs);
    (_b = child.stderr) == null ? void 0 : _b.on("data", (chunk) => {
      stderr += String(chunk || "");
    });
    child.on("error", (error) => {
      finish(() => reject(new Error("Codex CLI failed to start: " + error.message)));
    });
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          const detail = redactProcessText(stderr);
          reject(new Error(`Codex CLI exited with code ${code}${detail ? `: ${detail}` : ""}`));
          return;
        }
        if (!fs.existsSync(outputPath)) {
          reject(new Error("Codex CLI finished but did not write codex-output.json"));
          return;
        }
        resolve(fs.readFileSync(outputPath, "utf8"));
      });
    });
  });
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function parseCodexAnalysisOutput(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid Codex analysis output: JSON parse failed");
  }
  const value = parsed;
  if (!value || typeof value !== "object" || value.taskType !== "multi-paper-analysis" || typeof value.question !== "string" || !Array.isArray(value.papers) || !value.comparison || !value.synthesis || typeof value.synthesis.shortAnswer !== "string" || typeof value.synthesis.detailedAnalysisMarkdown !== "string" || !isStringArray(value.synthesis.suggestedNextQuestions) || !isStringArray(value.limitations)) {
    throw new Error("Invalid Codex analysis output: missing required fields");
  }
  return value;
}
function listBlock(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- \u6682\u65E0";
}
function renderCodexAnalysisMarkdown(output) {
  const nextQuestions = output.synthesis.suggestedNextQuestions.length ? `

### \u53EF\u4EE5\u7EE7\u7EED\u8FFD\u95EE
${listBlock(output.synthesis.suggestedNextQuestions)}` : "";
  const limitations = output.limitations.length ? `

### \u5C40\u9650
${listBlock(output.limitations)}` : "";
  return [
    `### \u7B80\u77ED\u7ED3\u8BBA
${output.synthesis.shortAnswer}`,
    output.synthesis.detailedAnalysisMarkdown,
    `### \u76F8\u4F3C\u70B9
${listBlock(output.comparison.similarities)}`,
    `### \u4E0D\u540C\u70B9
${listBlock(output.comparison.differences)}`,
    `### \u7ED3\u5408\u673A\u4F1A
${listBlock(output.comparison.complementaryOpportunities)}`,
    `### \u98CE\u9669\u4E0E\u51B2\u7A81
${listBlock(output.comparison.conflictsOrRisks)}`
  ].join("\n\n") + nextQuestions + limitations;
}

// src/modal-ui.ts
var controlId = 0;
function nextControlId(prefix) {
  controlId += 1;
  return `pdf-chat-${prefix}-${controlId}`;
}
function setElementLabel(element, label) {
  const compatibleElement = element;
  if (typeof compatibleElement.setAttr === "function") {
    compatibleElement.setAttr("aria-label", label);
  } else if (typeof compatibleElement.setAttribute === "function") {
    compatibleElement.setAttribute("aria-label", label);
  }
}
var labelControl = setElementLabel;
function buildWorkbenchHeader(parent, options) {
  const root = parent.createEl("header", { cls: "pdf-chat-workbench-header" });
  const identity = root.createDiv({ cls: "pdf-chat-identity" });
  identity.createEl("h2", { text: "PDF Chat" });
  identity.createEl("span", {
    text: options.filename,
    cls: "pdf-chat-document-name"
  });
  const primaryControls = root.createDiv({ cls: "pdf-chat-header-primary-controls pdf-chat-interactive" });
  const secondaryControls = root.createDiv({ cls: "pdf-chat-header-secondary-controls pdf-chat-interactive" });
  const modelGroup = primaryControls.createDiv({ cls: "pdf-chat-control-group" });
  const modelId = nextControlId("model");
  modelGroup.createEl("label", { text: "\u6A21\u578B", attr: { for: modelId } });
  const modelSelect = modelGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modelId, "aria-label": "\u9009\u62E9\u804A\u5929\u6A21\u578B" }
  });
  for (const model of options.models) {
    modelSelect.createEl("option", { text: model.name, value: model.id });
  }
  modelSelect.value = options.currentModelId;
  const modeGroup = primaryControls.createDiv({ cls: "pdf-chat-control-group" });
  const modeId = nextControlId("mode");
  modeGroup.createEl("label", { text: "\u9605\u8BFB\u6A21\u5F0F", attr: { for: modeId } });
  const modeSelect = modeGroup.createEl("select", {
    cls: "dropdown pdf-chat-select",
    attr: { id: modeId, "aria-label": "\u9009\u62E9\u9605\u8BFB\u6A21\u5F0F" }
  });
  modeSelect.createEl("option", { text: "\u9ED8\u8BA4", value: "__default__" });
  for (const preset of options.presets) {
    modeSelect.createEl("option", { text: preset.name, value: preset.id });
  }
  modeSelect.value = options.currentPresetId;
  const zoomGroup = secondaryControls.createDiv({
    cls: "pdf-chat-zoom-group",
    attr: { role: "group", "aria-label": "\u5B57\u4F53\u5927\u5C0F" }
  });
  const zoomOutButton = zoomGroup.createEl("button", {
    text: "A\u2212",
    cls: "pdf-chat-zoom-btn",
    attr: { type: "button" }
  });
  const zoomResetButton = zoomGroup.createEl("button", {
    text: "100%",
    cls: "pdf-chat-zoom-label",
    attr: { type: "button" }
  });
  const zoomInButton = zoomGroup.createEl("button", {
    text: "A+",
    cls: "pdf-chat-zoom-btn",
    attr: { type: "button" }
  });
  setElementLabel(zoomOutButton, "\u7F29\u5C0F\u5185\u5BB9\u5B57\u4F53");
  setElementLabel(zoomResetButton, "\u91CD\u7F6E\u5185\u5BB9\u5B57\u4F53\u4E3A 100%");
  setElementLabel(zoomInButton, "\u653E\u5927\u5185\u5BB9\u5B57\u4F53");
  const moreWrapper = secondaryControls.createDiv({ cls: "pdf-chat-more-wrapper" });
  const moreButton = moreWrapper.createEl("button", {
    text: "\u22EF",
    cls: "pdf-chat-more-button",
    attr: {
      type: "button",
      "aria-haspopup": "menu",
      "aria-expanded": "false"
    }
  });
  setElementLabel(moreButton, "\u66F4\u591A\u64CD\u4F5C");
  const moreMenu = moreWrapper.createDiv({
    cls: "pdf-chat-more-menu is-hidden",
    attr: { role: "menu" }
  });
  const clearButton = moreMenu.createEl("button", {
    text: "\u6E05\u7A7A\u5BF9\u8BDD",
    cls: "pdf-chat-menu-item pdf-chat-reset-btn",
    attr: { type: "button" }
  });
  clearButton.setAttr("role", "menuitem");
  setElementLabel(clearButton, "\u6E05\u7A7A\u5F53\u524D\u5BF9\u8BDD");
  let removeTransientListeners = null;
  const closeMenu = () => {
    moreButton.setAttr("aria-expanded", "false");
    moreMenu.addClass("is-hidden");
    removeTransientListeners == null ? void 0 : removeTransientListeners();
    removeTransientListeners = null;
  };
  const openMenu = () => {
    moreButton.setAttr("aria-expanded", "true");
    moreMenu.removeClass("is-hidden");
    const ownerDocument = root.ownerDocument;
    const onDocumentClick = (event) => {
      const target = event.target;
      if (target && moreWrapper.contains(target)) return;
      closeMenu();
    };
    const onDocumentKeydown = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    ownerDocument.addEventListener("click", onDocumentClick);
    ownerDocument.addEventListener("keydown", onDocumentKeydown);
    removeTransientListeners = () => {
      ownerDocument.removeEventListener("click", onDocumentClick);
      ownerDocument.removeEventListener("keydown", onDocumentKeydown);
    };
  };
  moreButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (moreButton.getAttribute("aria-expanded") === "true") closeMenu();
    else openMenu();
  });
  clearButton.addEventListener("click", closeMenu);
  return {
    root,
    primaryControls,
    secondaryControls,
    modelSelect,
    modeSelect,
    zoomOutButton,
    zoomResetButton,
    zoomInButton,
    moreButton,
    moreMenu,
    clearButton
  };
}
function buildContextPanel(parent, options) {
  const bodyId = nextControlId("context");
  const root = parent.createEl("section", {
    cls: "pdf-chat-context-panel",
    attr: { "aria-label": "\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177" }
  });
  const toggle = root.createEl("button", {
    cls: "pdf-chat-context-toggle",
    attr: {
      type: "button",
      "aria-expanded": "false",
      "aria-controls": bodyId,
      "aria-label": "\u5C55\u5F00\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177"
    }
  });
  toggle.createEl("span", { text: "\u8BBA\u6587\u4E0A\u4E0B\u6587", cls: "pdf-chat-context-title" });
  toggle.createEl("span", {
    text: `${options.selectionText.length} \u5B57`,
    cls: "pdf-chat-status-chip pdf-chat-status-chip-count pdf-chat-selection-count is-neutral"
  });
  const summaryStatus = toggle.createEl("span", {
    text: options.hasPdf ? "\u6458\u8981\u68C0\u67E5\u4E2D" : "\u4EC5\u9009\u533A",
    cls: "pdf-chat-status-chip pdf-chat-status-chip-summary pdf-chat-summary-status is-pending"
  });
  const ragStatus = toggle.createEl("span", {
    text: options.hasPdf ? "\u4E0A\u4E0B\u6587\u68C0\u67E5\u4E2D" : "\u9009\u533A\u4E0A\u4E0B\u6587",
    cls: "pdf-chat-status-chip pdf-chat-status-chip-context pdf-chat-rag-status is-pending"
  });
  toggle.createEl("span", { text: "\u2304", cls: "pdf-chat-context-chevron", attr: { "aria-hidden": "true" } });
  const body = root.createDiv({
    cls: "pdf-chat-context-body is-collapsed",
    attr: { id: bodyId }
  });
  body.createEl("h3", { text: "\u9009\u533A\u539F\u6587", cls: "pdf-chat-context-heading" });
  body.createDiv({ cls: "pdf-chat-context-text", text: options.selectionText });
  const tools = body.createDiv({ cls: "pdf-chat-context-tools" });
  const researchActions = body.createDiv({
    cls: "pdf-chat-research-actions",
    attr: {
      role: "group",
      "aria-label": "\u8BBA\u6587\u7814\u7A76\u6269\u5C55\u64CD\u4F5C",
      "data-research-action-slot": "context"
    }
  });
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttr("aria-expanded", String(expanded));
    toggle.setAttr("aria-label", expanded ? "\u6536\u8D77\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177" : "\u5C55\u5F00\u8BBA\u6587\u4E0A\u4E0B\u6587\u5DE5\u5177");
    body.toggleClass("is-collapsed", !expanded);
    root.toggleClass("is-expanded", expanded);
  });
  return { root, toggle, body, tools, summaryStatus, ragStatus, researchActions };
}
function buildMessageRegion(parent, restoringHistory) {
  return parent.createEl("main", {
    cls: "pdf-chat-history",
    attr: {
      role: "log",
      "aria-label": "PDF Chat \u5BF9\u8BDD\u8BB0\u5F55",
      "aria-live": restoringHistory ? "off" : "polite",
      "aria-relevant": "additions",
      "aria-atomic": "false"
    }
  });
}
function buildEmptyState(history) {
  return history.createDiv({
    cls: "pdf-chat-empty-state",
    text: "\u9009\u533A\u5DF2\u5C31\u7EEA\u3002\u4F60\u53EF\u4EE5\u76F4\u63A5\u63D0\u95EE\uFF0C\u6216\u70B9\u51FB\u201C\u7FFB\u8BD1\u9009\u533A\u201D\u3002",
    attr: { role: "status" }
  });
}
function resizeComposerTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}
function buildComposer(parent) {
  const root = parent.createEl("footer", {
    cls: "pdf-chat-composer",
    attr: { "aria-label": "\u63D0\u95EE\u7F16\u8F91\u5668" }
  });
  const card = root.createDiv({ cls: "pdf-chat-composer-card" });
  const inputRow = card.createDiv({ cls: "pdf-chat-input-row" });
  const input = inputRow.createEl("textarea", {
    cls: "pdf-chat-input",
    attr: {
      rows: "1",
      placeholder: "\u9488\u5BF9\u5F53\u524D\u9009\u533A\u63D0\u95EE\u2026",
      "aria-label": "\u9488\u5BF9\u5F53\u524D\u9009\u533A\u63D0\u95EE"
    }
  });
  const footer = card.createDiv({ cls: "pdf-chat-composer-footer" });
  const status = footer.createDiv({
    text: "\u5F53\u524D\u9009\u533A\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528",
    cls: "pdf-chat-composer-status"
  });
  const actions = footer.createDiv({ cls: "pdf-chat-composer-actions" });
  const hint = actions.createDiv({
    cls: "pdf-chat-hint",
    text: "Enter \u53D1\u9001 \xB7 Shift+Enter \u6362\u884C"
  });
  const translateButton = actions.createEl("button", {
    text: "\u7FFB\u8BD1\u9009\u533A",
    cls: "pdf-chat-translate-btn",
    attr: { type: "button" }
  });
  setElementLabel(translateButton, "\u7FFB\u8BD1\u5F53\u524D\u9009\u533A");
  const sendButton = actions.createEl("button", {
    text: "\u2191",
    cls: "mod-cta pdf-chat-send-btn",
    attr: { type: "button" }
  });
  setElementLabel(sendButton, "\u53D1\u9001\u95EE\u9898");
  input.addEventListener("input", () => resizeComposerTextarea(input));
  return { root, card, status, input, actions, translateButton, sendButton, hint };
}
function buildFollowupSuggestions(parent, suggestions) {
  var _a;
  const root = parent.createDiv({
    cls: "pdf-chat-followup-suggestions",
    attr: { role: "group", "aria-label": "\u5FEB\u6377\u8FFD\u95EE" }
  });
  const compatibleRoot = root;
  for (const suggestion of suggestions) {
    let button;
    if (typeof compatibleRoot.createEl === "function") {
      button = compatibleRoot.createEl("button", {
        text: suggestion,
        cls: "pdf-chat-followup-chip",
        attr: { type: "button" }
      });
    } else if (((_a = root.ownerDocument) == null ? void 0 : _a.createElement) && typeof root.appendChild === "function") {
      button = root.ownerDocument.createElement("button");
      button.textContent = suggestion;
      button.className = "pdf-chat-followup-chip";
      button.setAttribute("type", "button");
      root.appendChild(button);
    } else {
      continue;
    }
    setElementLabel(button, suggestion);
  }
  return root;
}
function formatTranslationUserDisplay(content) {
  const match = /^翻译当前选区（(.+?)）$/.exec(content.trim());
  if (!match) return null;
  return { title: "\u7FFB\u8BD1\u5F53\u524D\u9009\u533A", meta: match[1] };
}
function formatAssistantDisplayMarkdown(raw) {
  if (!raw || raw.includes("\n\n")) return raw;
  if (/```|`[^`]+`|\|.+\||^\s*[-*+]\s+/m.test(raw)) return raw;
  if (/\$\$|\\\[|\\\(|<table|<pre|<code/i.test(raw)) return raw;
  if (raw.length < 40) return raw;
  const split = raw.replace(/(。)(?=(?:提示生成|模型改进|实验结果|方法|贡献|局限|相关工作|结论|首先|其次|最后|此外|因此))/g, "$1\n\n").replace(/([.!?])\s+(?=(?:Prompt|Model|Experiment|Result|Method|Contribution|Limitation)\b)/g, "$1\n\n");
  return split === raw ? raw : split;
}

// src/pdf-chat-modal.ts
function errorMessage(error) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
function isAbortError(error) {
  return !!error && typeof error === "object" && "name" in error && error.name === "AbortError";
}
function isCodexUnavailableError(error) {
  const message = errorMessage(error);
  return /failed to start|not available|ENOENT|not recognized|cannot find/i.test(message);
}
async function renderMarkdownInto(app, component, el, text) {
  el.empty();
  el.addClass("markdown-rendered");
  try {
    if (import_obsidian3.MarkdownRenderer.render) {
      await import_obsidian3.MarkdownRenderer.render(app, text, el, "", component);
      return;
    }
    if (import_obsidian3.MarkdownRenderer.renderMarkdown) {
      await import_obsidian3.MarkdownRenderer.renderMarkdown(text, el, "", component);
      return;
    }
  } catch (e) {
  }
  el.setText(text);
}
function getBubbleContentEl(bubble) {
  return bubble.pdfChatContentEl || bubble;
}
function setBubbleText(bubble, text) {
  getBubbleContentEl(bubble).setText(text);
}
function createBubbleDiv(parent, options) {
  const compatibleParent = parent;
  if (typeof compatibleParent.createDiv === "function") return compatibleParent.createDiv(options);
  if (typeof compatibleParent.createEl === "function") return compatibleParent.createEl("div", options);
  const child = parent.ownerDocument.createElement("div");
  if (options.cls) child.className = options.cls;
  if (options.text !== void 0) child.textContent = options.text;
  parent.appendChild(child);
  return child;
}
function canCreateBubbleChildren(parent) {
  var _a;
  const compatibleParent = parent;
  return typeof compatibleParent.createDiv === "function" || typeof compatibleParent.createEl === "function" || typeof ((_a = parent.ownerDocument) == null ? void 0 : _a.createElement) === "function";
}
async function renderMarkdownIntoBubble(app, component, bubble, text) {
  await renderMarkdownInto(app, component, getBubbleContentEl(bubble), formatAssistantDisplayMarkdown(text));
}
var PDFChatModal = class extends import_obsidian3.Modal {
  constructor(app, plugin, contextText, pdfFile, startFresh, services, autoTranslateOnOpen) {
    super(app);
    __publicField(this, "plugin");
    __publicField(this, "services");
    __publicField(this, "paperContext");
    __publicField(this, "contextText");
    __publicField(this, "pdfFile");
    __publicField(this, "startFresh");
    __publicField(this, "autoTranslateOnOpen");
    __publicField(this, "conversationKey");
    __publicField(this, "translateConversationKey");
    __publicField(this, "hadExistingHistory");
    __publicField(this, "currentPresetId");
    __publicField(this, "currentModelId");
    __publicField(this, "useDocSummary", false);
    __publicField(this, "docSummaryEntry", null);
    __publicField(this, "isGeneratingSummary", false);
    __publicField(this, "useRag", false);
    __publicField(this, "docChunksEntry", null);
    __publicField(this, "isIndexingRag", false);
    __publicField(this, "useFullTextMode", false);
    __publicField(this, "fullTextForQA", null);
    __publicField(this, "fullTextAttached", false);
    __publicField(this, "transcript");
    __publicField(this, "translateTranscript", []);
    __publicField(this, "messages");
    __publicField(this, "activeComposerKind", "chat");
    __publicField(this, "isSending", false);
    __publicField(this, "abortController", null);
    __publicField(this, "zoomOutBtn");
    __publicField(this, "zoomLabel");
    __publicField(this, "zoomInBtn");
    __publicField(this, "modelSelect");
    __publicField(this, "modeSelect");
    __publicField(this, "summaryCheckbox");
    __publicField(this, "summaryStatusEl");
    __publicField(this, "summaryRefreshBtn");
    __publicField(this, "ragCheckbox");
    __publicField(this, "ragStatusEl");
    __publicField(this, "ragRefreshBtn");
    __publicField(this, "referencedPdfFiles", []);
    __publicField(this, "pdfReferenceChipsEl");
    __publicField(this, "pdfSearchInputEl");
    __publicField(this, "pdfSearchResultsEl");
    __publicField(this, "ordinaryCompareBtn");
    __publicField(this, "codexDeepAnalyzeBtn");
    __publicField(this, "multiPaperStatusEl");
    __publicField(this, "historyEl");
    __publicField(this, "emptyStateEl");
    __publicField(this, "suggestionsEl");
    __publicField(this, "composerStatusEl");
    __publicField(this, "inputEl");
    __publicField(this, "translateBtn");
    __publicField(this, "sendBtn");
    this.plugin = plugin;
    this.services = services || createPDFChatModalServices(plugin);
    const paperContext = typeof contextText === "string" ? {
      app,
      file: pdfFile || null,
      selectedText: contextText,
      conversationKey: this.services.conversations.getKey(pdfFile || null, contextText)
    } : contextText;
    this.paperContext = paperContext;
    this.contextText = paperContext.selectedText;
    this.pdfFile = paperContext.file || null;
    this.startFresh = !!startFresh;
    this.autoTranslateOnOpen = !!autoTranslateOnOpen;
    const lastPresetId = this.plugin.settings.lastPresetId;
    this.currentPresetId = lastPresetId && (lastPresetId === "__default__" || this.plugin.settings.promptPresets.find((p) => p.id === lastPresetId)) ? lastPresetId : "__default__";
    if (this.startFresh) {
      const lastModelId = this.plugin.settings.lastModelId;
      this.currentModelId = lastModelId && this.plugin.settings.models.find((m) => m.id === lastModelId) ? lastModelId : this.plugin.settings.activeModelId;
    } else {
      this.currentModelId = this.services.models.resolveContinueId();
    }
    this.conversationKey = paperContext.conversationKey;
    this.translateConversationKey = this.services.conversations.getKey(
      this.pdfFile,
      this.contextText,
      "translate"
    );
    const existingTranscript = this.services.conversations.get(this.conversationKey);
    this.hadExistingHistory = existingTranscript.length > 0;
    this.transcript = this.startFresh ? [] : existingTranscript;
    this.messages = [
      this.buildSystemMessage(),
      ...this.transcript.map((message) => ({ role: message.role, content: message.content }))
    ];
  }
  buildSystemMessage() {
    const preset = this.currentPresetId === "__default__" ? null : this.plugin.settings.promptPresets.find((p) => p.id === this.currentPresetId);
    const promptText = preset && preset.prompt || this.plugin.settings.systemPrompt;
    let content = promptText;
    if (this.useDocSummary && this.docSummaryEntry && this.docSummaryEntry.summary) {
      content += "\n\n\u3010\u5168\u6587\u80CC\u666F\u6458\u8981\u3011(\u7531\u5FEB\u901F\u6A21\u578B\u6D53\u7F29\u6574\u7BC7 PDF \u5F97\u5230,\u4EC5\u4F9B\u7406\u89E3\u80CC\u666F,\u4E0D\u662F\u6211\u5F53\u524D\u95EE\u9898\u7684\u5177\u4F53\u5185\u5BB9):\n" + this.docSummaryEntry.summary;
    }
    content += `

\u3010\u6211\u5F53\u524D\u9009\u4E2D\u5E76\u60F3\u8BA8\u8BBA\u7684\u539F\u6587\u7247\u6BB5\u3011:
${this.contextText}`;
    return { role: "system", content };
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("pdf-chat-modal");
    const header = buildWorkbenchHeader(contentEl, {
      filename: this.getDocumentName(),
      models: this.plugin.settings.models,
      currentModelId: this.currentModelId,
      presets: this.plugin.settings.promptPresets,
      currentPresetId: this.currentPresetId
    });
    this.modelSelect = header.modelSelect;
    this.modeSelect = header.modeSelect;
    this.zoomOutBtn = header.zoomOutButton;
    this.zoomLabel = header.zoomResetButton;
    this.zoomInBtn = header.zoomInButton;
    this.setupDragging(header.root);
    header.clearButton.addEventListener("click", () => void this.resetConversation());
    this.modelSelect.addEventListener("change", () => this.applyModel(this.modelSelect.value));
    this.modeSelect.addEventListener("change", () => this.applyPreset(this.modeSelect.value));
    this.zoomOutBtn.addEventListener(
      "click",
      () => this.applyFontScale((this.plugin.settings.fontScale || 1) - 0.1)
    );
    this.zoomInBtn.addEventListener(
      "click",
      () => this.applyFontScale((this.plugin.settings.fontScale || 1) + 0.1)
    );
    this.zoomLabel.addEventListener("click", () => this.applyFontScale(1));
    this.applyFontScale(this.plugin.settings.fontScale || 1);
    const contextPanel = buildContextPanel(contentEl, {
      selectionText: this.contextText,
      hasPdf: !!this.pdfFile
    });
    this.summaryStatusEl = contextPanel.summaryStatus;
    this.ragStatusEl = contextPanel.ragStatus;
    if (this.pdfFile) this.buildPaperContextControls(contextPanel.tools);
    this.renderResearchActions(contextPanel.researchActions);
    const restoringHistory = this.transcript.length > 0;
    this.historyEl = buildMessageRegion(contentEl, restoringHistory);
    if (!restoringHistory) this.showEmptyState();
    const composer = buildComposer(contentEl);
    this.composerStatusEl = composer.status;
    this.inputEl = composer.input;
    this.translateBtn = composer.translateButton;
    this.sendBtn = composer.sendButton;
    this.updateComposerContextStatus();
    const submit = () => this.handleSubmit();
    this.sendBtn.addEventListener("click", () => {
      if (this.isSending) {
        this.stopGenerating();
      } else {
        submit();
      }
    });
    this.translateBtn.addEventListener("click", () => {
      if (!this.isSending) this.handleTranslate();
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    });
    this.inputEl.addEventListener("input", () => this.hideFollowupSuggestions());
    if (restoringHistory) {
      this.restoreConversationHistory().catch((err) => {
        this.setHistoryLiveMode("polite");
        new import_obsidian3.Notice("\u6062\u590D\u4E0A\u6B21\u5BF9\u8BDD\u663E\u793A\u5931\u8D25: " + errorMessage(err));
      });
    } else if (this.startFresh && this.hadExistingHistory) {
      new import_obsidian3.Notice("\u5DF2\u5F00\u59CB\u65B0\u5BF9\u8BDD(\u53D1\u51FA\u7B2C\u4E00\u6761\u6D88\u606F\u540E\u4F1A\u66FF\u6362\u6389\u4E0A\u6B21\u4FDD\u5B58\u7684\u8BB0\u5F55)");
    }
    if (this.autoTranslateOnOpen) this.handleTranslate();
    else this.inputEl.focus();
  }
  getDocumentName() {
    if (!this.pdfFile) return "\u9009\u533A\u5BF9\u8BDD";
    return this.pdfFile.name || this.pdfFile.path.split(/[\\/]/).pop() || "\u9009\u533A\u5BF9\u8BDD";
  }
  buildPaperContextControls(container) {
    const summaryRow = container.createDiv({ cls: "pdf-chat-summary-row" });
    const summaryLabel = summaryRow.createEl("label", { cls: "pdf-chat-check-label" });
    const summaryCheckbox = this.summaryCheckbox = summaryLabel.createEl("input", { type: "checkbox" });
    summaryLabel.createEl("span", { text: "\u9644\u5E26\u5168\u6587\u6458\u8981\u4F5C\u4E3A\u80CC\u666F" });
    labelControl(summaryCheckbox, "\u9644\u5E26\u5168\u6587\u6458\u8981\u4F5C\u4E3A\u80CC\u666F");
    const summaryRefreshBtn = this.summaryRefreshBtn = summaryRow.createEl("button", {
      text: "\u751F\u6210/\u5237\u65B0\u6458\u8981",
      cls: "pdf-chat-summary-btn",
      attr: { type: "button" }
    });
    labelControl(summaryRefreshBtn, "\u751F\u6210\u6216\u5237\u65B0\u5168\u6587\u6458\u8981");
    this.refreshSummaryStatus();
    summaryCheckbox.addEventListener("change", async () => {
      if (summaryCheckbox.checked) {
        await this.ensureDocSummary(false);
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        summaryCheckbox.checked = this.useDocSummary;
      } else {
        this.useDocSummary = false;
      }
      this.messages[0] = this.buildSystemMessage();
      this.updateComposerContextStatus();
    });
    summaryRefreshBtn.addEventListener("click", async () => {
      await this.ensureDocSummary(true);
      if (summaryCheckbox.checked) {
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
      }
      this.messages[0] = this.buildSystemMessage();
      this.updateComposerContextStatus();
    });
    if (this.plugin.settings.autoDocSummary) {
      summaryCheckbox.checked = true;
      this.useDocSummary = true;
      void this.ensureDocSummary(false).then(() => {
        this.useDocSummary = !!(this.docSummaryEntry && this.docSummaryEntry.summary);
        summaryCheckbox.checked = this.useDocSummary;
        this.messages[0] = this.buildSystemMessage();
        this.updateComposerContextStatus();
      });
    }
    const ragRow = container.createDiv({ cls: "pdf-chat-summary-row" });
    const ragLabel = ragRow.createEl("label", { cls: "pdf-chat-check-label" });
    const ragCheckbox = this.ragCheckbox = ragLabel.createEl("input", { type: "checkbox" });
    ragLabel.createEl("span", { text: "\u5168\u6587\u76F4\u8BFB / RAG \u68C0\u7D22" });
    labelControl(ragCheckbox, "\u542F\u7528\u5168\u6587\u76F4\u8BFB\u6216 RAG \u68C0\u7D22");
    const ragRefreshBtn = this.ragRefreshBtn = ragRow.createEl("button", {
      text: "\u5EFA\u7ACB/\u5237\u65B0\u7D22\u5F15",
      cls: "pdf-chat-summary-btn",
      attr: { type: "button" }
    });
    labelControl(ragRefreshBtn, "\u5EFA\u7ACB\u6216\u5237\u65B0\u5168\u6587\u68C0\u7D22\u7D22\u5F15");
    this.refreshRagStatus();
    ragCheckbox.addEventListener("change", async () => {
      if (ragCheckbox.checked) {
        await this.ensureDocChunks(false);
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
        ragCheckbox.checked = this.useRag;
      } else {
        this.useRag = false;
      }
      this.updateComposerContextStatus();
    });
    ragRefreshBtn.addEventListener("click", async () => {
      await this.ensureDocChunks(true);
      if (ragCheckbox.checked) {
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
      }
      this.updateComposerContextStatus();
    });
    if (this.plugin.settings.autoRag) {
      ragCheckbox.checked = true;
      this.useRag = true;
      void this.ensureDocChunks(false).then(() => {
        this.useRag = !!(this.docChunksEntry && this.docChunksEntry.chunks.length);
        ragCheckbox.checked = this.useRag;
        this.updateComposerContextStatus();
      });
    }
    this.buildMultiPaperControls(container);
  }
  buildMultiPaperControls(container) {
    const section = container.createDiv({ cls: "pdf-chat-multi-paper" });
    section.createEl("h4", { text: "\u591A\u8BBA\u6587\u5BF9\u6BD4", cls: "pdf-chat-context-heading" });
    section.createDiv({
      text: "\u5F15\u7528 vault \u5185\u5176\u4ED6 PDF \u540E\uFF0C\u53EF\u7528\u666E\u901A API \u5FEB\u901F\u5BF9\u6BD4\uFF0C\u6216\u624B\u52A8\u89E6\u53D1 Codex \u6DF1\u5EA6\u9605\u8BFB\u3002",
      cls: "pdf-chat-context-help"
    });
    const searchRow = section.createDiv({ cls: "pdf-chat-pdf-search-row" });
    this.pdfSearchInputEl = searchRow.createEl("input", {
      cls: "pdf-chat-pdf-search-input",
      attr: {
        type: "text",
        placeholder: "@ \u641C\u7D22 PDF \u6587\u4EF6\u540D\u6216\u8DEF\u5F84",
        "aria-label": "@ \u641C\u7D22 vault \u5185 PDF"
      }
    });
    this.pdfSearchResultsEl = section.createDiv({ cls: "pdf-chat-pdf-search-results" });
    this.pdfReferenceChipsEl = section.createDiv({
      cls: "pdf-chat-pdf-reference-chips",
      attr: { "aria-label": "\u5DF2\u5F15\u7528 PDF" }
    });
    const actions = section.createDiv({ cls: "pdf-chat-multi-paper-actions" });
    this.ordinaryCompareBtn = actions.createEl("button", {
      text: "\u666E\u901A\u5BF9\u6BD4",
      cls: "pdf-chat-research-action-btn pdf-chat-ordinary-compare-btn",
      attr: { type: "button" }
    });
    labelControl(this.ordinaryCompareBtn, "\u4F7F\u7528\u5F53\u524D\u6A21\u578B\u5FEB\u901F\u5BF9\u6BD4\u5DF2\u5F15\u7528\u8BBA\u6587");
    this.codexDeepAnalyzeBtn = actions.createEl("button", {
      text: "Codex \u6DF1\u5EA6\u5206\u6790",
      cls: "pdf-chat-research-action-btn pdf-chat-codex-analysis-btn",
      attr: { type: "button" }
    });
    labelControl(this.codexDeepAnalyzeBtn, "\u4F7F\u7528 Codex CLI \u6DF1\u5EA6\u5206\u6790\u5F53\u524D\u8BBA\u6587\u548C\u5DF2\u5F15\u7528\u8BBA\u6587");
    this.multiPaperStatusEl = section.createDiv({
      text: this.plugin.settings.codexDeepAnalysis.enabled ? "Codex CLI \u5DF2\u542F\u7528\uFF0C\u5206\u6790\u65F6\u53EA\u4F1A\u8BFB\u53D6\u4E34\u65F6\u8BBA\u6587\u5305\u3002" : "Codex \u6DF1\u5EA6\u5206\u6790\u9700\u8981\u5148\u5728\u8BBE\u7F6E\u4E2D\u542F\u7528\u3002",
      cls: "pdf-chat-multi-paper-status"
    });
    this.pdfSearchInputEl.addEventListener("input", () => {
      var _a;
      this.renderPdfSearchResults(((_a = this.pdfSearchInputEl) == null ? void 0 : _a.value) || "");
    });
    this.pdfSearchInputEl.addEventListener("focus", () => {
      var _a;
      this.renderPdfSearchResults(((_a = this.pdfSearchInputEl) == null ? void 0 : _a.value) || "");
    });
    this.ordinaryCompareBtn.addEventListener("click", () => {
      void this.runOrdinaryMultiPaperCompare();
    });
    this.codexDeepAnalyzeBtn.addEventListener("click", () => {
      void this.runCodexDeepAnalysis();
    });
    this.updateReferencedPdfChips();
  }
  isPdfLikeFile(file) {
    const candidate = file;
    if (!candidate) return false;
    if (String(candidate.extension || "").toLowerCase() === "pdf") return true;
    return /\.pdf$/i.test(candidate.path || candidate.name || "");
  }
  findPdfFileByPath(path) {
    var _a;
    const vault = (_a = this.app) == null ? void 0 : _a.vault;
    const direct = (vault == null ? void 0 : vault.getAbstractFileByPath) ? vault.getAbstractFileByPath(path) : null;
    if (this.isPdfLikeFile(direct)) return direct;
    const files = (vault == null ? void 0 : vault.getFiles) ? vault.getFiles() : [];
    return files.find((file) => file.path === path && this.isPdfLikeFile(file)) || null;
  }
  addReferencedPdf(file) {
    if (!file || !this.isPdfLikeFile(file)) return;
    if (this.pdfFile && file.path === this.pdfFile.path) {
      new import_obsidian3.Notice("\u5F53\u524D PDF \u5DF2\u81EA\u52A8\u4F5C\u4E3A\u5BF9\u6BD4\u4E3B\u4F53\uFF0C\u65E0\u9700\u91CD\u590D\u5F15\u7528\u3002");
      return;
    }
    if (this.referencedPdfFiles.find((existing) => existing.path === file.path)) return;
    if (this.referencedPdfFiles.length >= 3) {
      new import_obsidian3.Notice("\u7B2C\u4E00\u7248\u6700\u591A\u989D\u5916\u5F15\u7528 3 \u7BC7 PDF\u3002");
      return;
    }
    this.referencedPdfFiles.push(file);
    this.updateReferencedPdfChips();
    if (this.pdfSearchInputEl) this.pdfSearchInputEl.value = "";
    this.renderPdfSearchResults("");
  }
  removeReferencedPdf(path) {
    var _a;
    this.referencedPdfFiles = this.referencedPdfFiles.filter((file) => file.path !== path);
    this.updateReferencedPdfChips();
    this.renderPdfSearchResults(((_a = this.pdfSearchInputEl) == null ? void 0 : _a.value) || "");
  }
  updateReferencedPdfChips() {
    if (!this.pdfReferenceChipsEl) return;
    this.pdfReferenceChipsEl.empty();
    if (!this.referencedPdfFiles.length) {
      this.pdfReferenceChipsEl.createDiv({
        text: "\u5C1A\u672A\u5F15\u7528\u5176\u4ED6 PDF",
        cls: "pdf-chat-reference-empty"
      });
      return;
    }
    for (const file of this.referencedPdfFiles) {
      const chip = this.pdfReferenceChipsEl.createDiv({ cls: "pdf-chat-reference-chip" });
      chip.createEl("span", { text: file.name || file.path });
      const remove = chip.createEl("button", {
        text: "\xD7",
        cls: "pdf-chat-reference-remove",
        attr: { type: "button" }
      });
      labelControl(remove, `\u79FB\u9664 ${file.name || file.path}`);
      remove.addEventListener("click", () => this.removeReferencedPdf(file.path));
    }
  }
  renderPdfSearchResults(query) {
    if (!this.pdfSearchResultsEl) return;
    this.pdfSearchResultsEl.empty();
    const trimmed = (query || "").replace(/^@/, "").trim();
    if (!trimmed) return;
    const excludePaths = new Set(this.referencedPdfFiles.map((file) => file.path));
    if (this.pdfFile) excludePaths.add(this.pdfFile.path);
    const cachedPaths = /* @__PURE__ */ new Set([
      ...Object.keys(this.plugin.settings.docSummaries || {}),
      ...Object.keys(this.plugin.settings.docChunks || {})
    ]);
    const results = searchPdfFiles(this.app, trimmed, { limit: 6, excludePaths, cachedPaths });
    if (!results.length) {
      this.pdfSearchResultsEl.createDiv({ text: "\u672A\u627E\u5230\u5339\u914D\u7684 PDF", cls: "pdf-chat-search-empty" });
      return;
    }
    for (const candidate of results) {
      const button = this.pdfSearchResultsEl.createEl("button", {
        cls: "pdf-chat-pdf-search-result",
        attr: { type: "button" }
      });
      button.createEl("span", { text: candidate.name, cls: "pdf-chat-pdf-search-name" });
      button.createEl("span", {
        text: `${candidate.path}${candidate.cached ? " \xB7 \u5DF2\u6709\u7F13\u5B58" : ""}`,
        cls: "pdf-chat-pdf-search-path"
      });
      labelControl(button, `\u5F15\u7528 ${candidate.name}`);
      button.addEventListener("click", () => {
        const file = this.findPdfFileByPath(candidate.path);
        if (file) this.addReferencedPdf(file);
      });
    }
  }
  renderResearchActions(container) {
    for (const action of listResearchActionsForSlot(this.services.actions, "context")) {
      const button = container.createEl("button", {
        text: action.name,
        cls: "pdf-chat-research-action-btn",
        attr: { type: "button" }
      });
      labelControl(button, action.name);
      button.addEventListener("click", () => {
        void this.services.actions.execute(action.id, { translate: () => this.runTranslation() }).catch((error) => new import_obsidian3.Notice("\u7814\u7A76\u64CD\u4F5C\u5931\u8D25: " + errorMessage(error)));
      });
    }
  }
  showEmptyState() {
    if (this.emptyStateEl) return;
    const history = this.historyEl;
    if (typeof history.createDiv !== "function") return;
    this.emptyStateEl = buildEmptyState(history);
  }
  removeEmptyState() {
    var _a;
    (_a = this.emptyStateEl) == null ? void 0 : _a.remove();
    this.emptyStateEl = void 0;
  }
  setHistoryLiveMode(value) {
    const history = this.historyEl;
    if (typeof history.setAttr === "function") history.setAttr("aria-live", value);
    else if (typeof history.setAttribute === "function") history.setAttribute("aria-live", value);
  }
  setChipState(element, state) {
    if (!element) return;
    element.removeClass("is-neutral", "is-success", "is-accent", "is-pending");
    element.addClass(`is-${state}`);
  }
  updateComposerContextStatus() {
    if (!this.composerStatusEl) return;
    if (!this.pdfFile) {
      this.composerStatusEl.setText("\u9009\u533A\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528");
      return;
    }
    if (this.useRag && this.useFullTextMode) {
      this.composerStatusEl.setText("\u5168\u6587\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528");
    } else if (this.useRag) {
      this.composerStatusEl.setText("RAG \u68C0\u7D22\u5DF2\u542F\u7528");
    } else if (this.useDocSummary) {
      this.composerStatusEl.setText("\u6458\u8981\u80CC\u666F\u5DF2\u542F\u7528");
    } else {
      this.composerStatusEl.setText("\u5F53\u524D\u9009\u533A\u4E0A\u4E0B\u6587\u5DF2\u542F\u7528");
    }
  }
  followupSuggestions() {
    return [
      "\u4E3E\u4E00\u4E2A\u4F8B\u5B50",
      "\u8BF7\u8FDB\u4E00\u6B65\u901A\u4FD7\u6613\u61C2\u5730\u8BB2\u89E3\u6E05\u695A",
      "\u8BF7\u8FDB\u4E00\u6B65\u7ED9\u51FA\u8BE6\u7EC6\u7684\u63A8\u5BFC\u6B65\u9AA4",
      "\u8FDB\u4E00\u6B65\u5206\u6790\u4E3A\u4EC0\u4E48\u662F\u8FD9\u6837\u7684"
    ];
  }
  showFollowupSuggestions(kind = "chat") {
    this.hideFollowupSuggestions();
    try {
      this.suggestionsEl = buildFollowupSuggestions(this.historyEl, this.followupSuggestions());
      const children = this.suggestionsEl.children;
      if (!children) return;
      for (const button of Array.from(children)) {
        if (button.tagName !== "BUTTON") continue;
        button.addEventListener("click", () => {
          this.inputEl.value = button.textContent || "";
          this.activeComposerKind = kind;
          this.inputEl.focus();
          this.hideFollowupSuggestions();
        });
      }
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    } catch (error) {
      void error;
      this.suggestionsEl = void 0;
    }
  }
  hideFollowupSuggestions() {
    var _a;
    const removable = this.suggestionsEl;
    if (typeof (removable == null ? void 0 : removable.remove) === "function") {
      removable.remove();
    } else if ((_a = this.suggestionsEl) == null ? void 0 : _a.parentElement) {
      this.suggestionsEl.parentElement.removeChild(this.suggestionsEl);
    }
    this.suggestionsEl = void 0;
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
        renderMarkdownIntoBubble(this.app, this.plugin, bubble, message.content).then(() => {
          if (message.status === "stopped") {
            bubble.addClass("is-stopped");
            bubble.createEl("p", { cls: "pdf-chat-stopped-label", text: "[\u5DF2\u505C\u6B62\u751F\u6210]" });
          }
        })
      );
    }
    await Promise.all(renderJobs);
    this.setHistoryLiveMode("polite");
    this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
    const lastMessage = this.transcript[this.transcript.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.status !== "stopped") {
      this.showFollowupSuggestions();
    }
    const scope = this.pdfFile ? "\u672C PDF" : "\u5F53\u524D\u9009\u533A";
    new import_obsidian3.Notice(`\u5DF2\u6062\u590D${scope}\u4E0A\u6B21\u5BF9\u8BDD(${this.transcript.length} \u6761\u6D88\u606F)`);
  }
  async persistConversation() {
    try {
      await this.services.conversations.save(this.conversationKey, this.transcript);
      return true;
    } catch (err) {
      new import_obsidian3.Notice("\u4FDD\u5B58\u5BF9\u8BDD\u5931\u8D25: " + errorMessage(err));
      return false;
    }
  }
  async persistTranslationConversation() {
    try {
      await this.services.conversations.save(
        this.translateConversationKey,
        this.translateTranscript
      );
      return true;
    } catch (err) {
      new import_obsidian3.Notice("\u4FDD\u5B58\u7FFB\u8BD1\u8BB0\u5F55\u5931\u8D25: " + errorMessage(err));
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
  async recordTranslateTurn(question, answer, status) {
    if (typeof answer !== "string" || !answer.trim()) return false;
    this.translateTranscript.push(
      { role: "user", content: question, status: "complete" },
      { role: "assistant", content: answer, status: status === "stopped" ? "stopped" : "complete" }
    );
    await this.persistTranslationConversation();
    return true;
  }
  async resetConversation() {
    if (this.isSending) {
      new import_obsidian3.Notice("\u6B63\u5728\u751F\u6210\u4E2D,\u8BF7\u5148\u505C\u6B62\u6216\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u6E05\u7A7A");
      return;
    }
    this.transcript = [];
    this.messages = [this.buildSystemMessage()];
    this.activeComposerKind = "chat";
    this.fullTextAttached = false;
    this.historyEl.empty();
    this.hideFollowupSuggestions();
    this.emptyStateEl = void 0;
    this.showEmptyState();
    try {
      await this.services.conversations.clear(this.conversationKey);
      new import_obsidian3.Notice("\u5BF9\u8BDD\u5DF2\u6E05\u7A7A,\u539F\u6587\u4E0A\u4E0B\u6587\u4FDD\u7559");
    } catch (err) {
      new import_obsidian3.Notice("\u754C\u9762\u5DF2\u6E05\u7A7A,\u4F46\u5220\u9664\u5DF2\u4FDD\u5B58\u5BF9\u8BDD\u5931\u8D25: " + errorMessage(err));
    }
  }
  applyPreset(id) {
    if (this.isSending) {
      new import_obsidian3.Notice("\u6B63\u5728\u751F\u6210\u4E2D,\u8BF7\u5148\u505C\u6B62\u6216\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u5207\u6362\u9605\u8BFB\u6A21\u5F0F");
      this.modeSelect.value = this.currentPresetId;
      return;
    }
    this.currentPresetId = id;
    this.plugin.settings.lastPresetId = id;
    this.plugin.saveSettings();
    this.messages[0] = this.buildSystemMessage();
    const preset = this.plugin.settings.promptPresets.find((p) => p.id === id);
    const name = id === "__default__" ? "\u9ED8\u8BA4" : preset && preset.name || id;
    new import_obsidian3.Notice(`\u5DF2\u5207\u6362\u5230\u300C${name}\u300D\u6A21\u5F0F,\u540E\u7EED\u56DE\u7B54\u4F1A\u6309\u65B0\u8BBE\u5B9A\u8FDB\u884C`);
  }
  applyModel(id) {
    if (this.isSending) {
      new import_obsidian3.Notice("\u6B63\u5728\u751F\u6210\u4E2D,\u8BF7\u5148\u505C\u6B62\u6216\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u5207\u6362\u6A21\u578B");
      this.modelSelect.value = this.currentModelId;
      return;
    }
    this.currentModelId = id;
    this.plugin.settings.lastModelId = id;
    this.plugin.saveSettings();
    const m = this.plugin.settings.models.find((x) => x.id === id);
    new import_obsidian3.Notice(`\u5DF2\u5207\u6362\u5230\u6A21\u578B\u300C${m && m.name || id}\u300D`);
  }
  applyFontScale(scale) {
    const clamped = Math.round(Math.min(1.6, Math.max(0.7, scale)) * 100) / 100;
    this.plugin.settings.fontScale = clamped;
    this.contentEl.style.setProperty("--pdf-chat-font-scale", String(clamped));
    if (this.zoomLabel) this.zoomLabel.setText(Math.round(clamped * 100) + "%");
    this.plugin.saveSettings();
  }
  refreshSummaryStatus() {
    if (!this.summaryStatusEl || !this.pdfFile) return;
    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    if (cached && cached.summary) {
      this.docSummaryEntry = cached;
      const date = new Date(cached.generatedAt);
      const truncatedNote = cached.truncated ? " \xB7 \u539F\u6587\u8FC7\u957F,\u4EC5\u6458\u8981\u4E86\u524D\u9762\u90E8\u5206" : "";
      this.summaryStatusEl.setText("\u6458\u8981\u5DF2\u7F13\u5B58");
      this.setChipState(this.summaryStatusEl, "success");
      this.summaryStatusEl.setAttr("aria-label", `\u6458\u8981\u5DF2\u7F13\u5B58 \xB7 ${date.toLocaleString()}${truncatedNote}`);
    } else {
      this.docSummaryEntry = null;
      this.summaryStatusEl.setText("\u6458\u8981\u672A\u751F\u6210");
      this.setChipState(this.summaryStatusEl, "neutral");
      this.summaryStatusEl.setAttr("aria-label", "\u5C1A\u672A\u751F\u6210\u5168\u6587\u6458\u8981");
    }
    this.updateComposerContextStatus();
  }
  async ensureDocSummary(forceRefresh) {
    var _a;
    if (this.isGeneratingSummary || !this.pdfFile) return;
    const cached = this.plugin.settings.docSummaries[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docSummaryEntry = cached;
      this.refreshSummaryStatus();
      return;
    }
    this.isGeneratingSummary = true;
    (_a = this.summaryStatusEl) == null ? void 0 : _a.setText("\u6458\u8981\u751F\u6210\u4E2D");
    this.setChipState(this.summaryStatusEl, "pending");
    if (this.summaryRefreshBtn) {
      this.summaryRefreshBtn.setText("\u751F\u6210\u4E2D\u2026");
      this.summaryRefreshBtn.disabled = true;
    }
    if (this.summaryCheckbox) this.summaryCheckbox.disabled = true;
    const notice = new import_obsidian3.Notice("\u6B63\u5728\u7528\u5FEB\u901F\u6A21\u578B\u63D0\u70BC\u5168\u6587\u6458\u8981,\u53EF\u80FD\u9700\u8981\u51E0\u5341\u79D2\u2026", 0);
    try {
      this.docSummaryEntry = await this.services.papers.getOrCreateDocSummary(this.pdfFile, forceRefresh);
      this.refreshSummaryStatus();
      notice.hide();
      new import_obsidian3.Notice("\u5168\u6587\u6458\u8981\u5DF2\u751F\u6210/\u66F4\u65B0");
    } catch (err) {
      notice.hide();
      new import_obsidian3.Notice("\u751F\u6210\u6458\u8981\u5931\u8D25: " + errorMessage(err));
      if (this.summaryCheckbox) this.summaryCheckbox.checked = false;
      this.useDocSummary = false;
    } finally {
      this.isGeneratingSummary = false;
      if (this.summaryRefreshBtn) {
        this.summaryRefreshBtn.setText("\u751F\u6210/\u5237\u65B0\u6458\u8981");
        this.summaryRefreshBtn.disabled = false;
      }
      if (this.summaryCheckbox) this.summaryCheckbox.disabled = false;
      this.updateComposerContextStatus();
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
        this.ragStatusEl.setText("\u5168\u6587\u76F4\u8BFB");
        this.setChipState(this.ragStatusEl, "accent");
        this.ragStatusEl.setAttr(
          "aria-label",
          `\u5168\u6587\u7EA6 ${cached.fullTextLength} \u5B57\uFF0C\u76F4\u63A5\u8BFB\u5168\u6587 \xB7 ${date.toLocaleString()}`
        );
      } else {
        this.ragStatusEl.setText("RAG \u5C31\u7EEA");
        this.setChipState(this.ragStatusEl, "success");
        this.ragStatusEl.setAttr("aria-label", `\u5DF2\u5EFA\u7D22\u5F15 \xB7 ${cached.chunks.length} \u5757 \xB7 ${date.toLocaleString()}`);
      }
    } else {
      this.docChunksEntry = null;
      this.useFullTextMode = false;
      this.ragStatusEl.setText("\u9009\u533A\u4E0A\u4E0B\u6587");
      this.setChipState(this.ragStatusEl, "neutral");
      this.ragStatusEl.setAttr("aria-label", "\u5C1A\u672A\u5EFA\u7ACB\u5168\u6587\u68C0\u7D22\u7D22\u5F15");
    }
    this.updateComposerContextStatus();
  }
  async ensureDocChunks(forceRefresh) {
    var _a;
    if (this.isIndexingRag || !this.pdfFile) return;
    const cached = this.plugin.settings.docChunks[this.pdfFile.path];
    const currentMtime = this.pdfFile.stat && this.pdfFile.stat.mtime;
    if (!forceRefresh && cached && cached.mtime === currentMtime) {
      this.docChunksEntry = cached;
      this.refreshRagStatus();
      return;
    }
    this.isIndexingRag = true;
    (_a = this.ragStatusEl) == null ? void 0 : _a.setText("\u7D22\u5F15\u5EFA\u7ACB\u4E2D");
    this.setChipState(this.ragStatusEl, "pending");
    if (this.ragRefreshBtn) {
      this.ragRefreshBtn.setText("\u5EFA\u7ACB\u4E2D\u2026");
      this.ragRefreshBtn.disabled = true;
    }
    if (this.ragCheckbox) this.ragCheckbox.disabled = true;
    try {
      this.docChunksEntry = await this.services.papers.getOrCreateDocChunks(this.pdfFile, forceRefresh);
      this.refreshRagStatus();
    } catch (err) {
      new import_obsidian3.Notice("\u5EFA\u7ACB\u68C0\u7D22\u7D22\u5F15\u5931\u8D25: " + errorMessage(err));
      if (this.ragCheckbox) this.ragCheckbox.checked = false;
      this.useRag = false;
    } finally {
      this.isIndexingRag = false;
      if (this.ragRefreshBtn) {
        this.ragRefreshBtn.setText("\u5EFA\u7ACB/\u5237\u65B0\u7D22\u5F15");
        this.ragRefreshBtn.disabled = false;
      }
      if (this.ragCheckbox) this.ragCheckbox.disabled = false;
      this.updateComposerContextStatus();
    }
  }
  selectedPaperFiles() {
    const papers = [];
    if (this.pdfFile) papers.push({ file: this.pdfFile, role: "current" });
    for (const file of this.referencedPdfFiles) papers.push({ file, role: "referenced" });
    return papers;
  }
  getMultiPaperQuestion() {
    var _a, _b;
    const typed = (_b = (_a = this.inputEl) == null ? void 0 : _a.value) == null ? void 0 : _b.trim();
    return typed || "\u8BF7\u5BF9\u6BD4\u5F53\u524D\u8BBA\u6587\u548C\u5DF2\u5F15\u7528\u8BBA\u6587\u7684\u76F8\u4F3C\u70B9\u3001\u4E0D\u540C\u70B9\uFF0C\u4EE5\u53CA\u5B83\u4EEC\u662F\u5426\u6709\u7ED3\u5408\u7684\u53EF\u80FD\u6027\u3002";
  }
  multiPaperUserLabel(question) {
    const refs = this.referencedPdfFiles.map((file) => file.name || file.path).join("\u3001");
    return refs ? `\u591A\u8BBA\u6587\u5206\u6790\uFF1A${question}

\u5F15\u7528\u8BBA\u6587\uFF1A${refs}` : `\u591A\u8BBA\u6587\u5206\u6790\uFF1A${question}`;
  }
  async buildApiMultiPaperContext(question, progress) {
    const papers = this.selectedPaperFiles();
    const parts = [];
    for (const { file, role } of papers) {
      progress == null ? void 0 : progress(`\u6B63\u5728\u51C6\u5907 ${file.name || file.path} \u7684\u6458\u8981\u548C\u68C0\u7D22\u7247\u6BB5\u2026`);
      const summary = await this.services.papers.getOrCreateDocSummary(file, false);
      const chunksEntry = await this.services.papers.getOrCreateDocChunks(file, false);
      const retrieved = this.services.papers.retrieveContext(
        chunksEntry.chunks || [],
        [question],
        this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK
      );
      const evidence = retrieved.length ? retrieved.map((chunk) => {
        var _a;
        return `[Page ${chunk.page} / chunk ${(_a = chunk.idx) != null ? _a : "?"}]
${chunk.text}`;
      }).join("\n\n") : "(\u672A\u68C0\u7D22\u5230\u660E\u663E\u76F8\u5173\u7247\u6BB5)";
      parts.push(
        [
          `## ${role === "current" ? "\u5F53\u524D\u8BBA\u6587" : "\u5F15\u7528\u8BBA\u6587"}\uFF1A${file.name || file.path}`,
          `\u8DEF\u5F84\uFF1A${file.path}`,
          "### \u6458\u8981",
          summary.summary || "(\u65E0\u6458\u8981)",
          "### \u53EF\u80FD\u76F8\u5173\u7247\u6BB5",
          evidence
        ].join("\n")
      );
    }
    return [
      "\u4F60\u6B63\u5728\u505A\u591A\u8BBA\u6587\u5BF9\u6BD4\u3002\u8BF7\u53EA\u57FA\u4E8E\u4E0B\u9762\u63D0\u4F9B\u7684\u8BBA\u6587\u6458\u8981\u548C\u68C0\u7D22\u7247\u6BB5\u56DE\u7B54\uFF0C\u5E76\u6807\u660E\u4F9D\u636E\u6765\u81EA\u54EA\u7BC7\u8BBA\u6587\u3002",
      "\u5982\u679C\u8BC1\u636E\u4E0D\u8DB3\uFF0C\u8BF7\u660E\u786E\u8BF4\u660E\u4E0D\u8DB3\uFF0C\u4E0D\u8981\u7F16\u9020\u3002",
      "",
      parts.join("\n\n---\n\n"),
      "",
      "## \u7528\u6237\u95EE\u9898",
      question
    ].join("\n");
  }
  async completeApiMultiPaperAnswer(question, userLabel, bubble) {
    var _a, _b;
    const outgoing = await this.buildApiMultiPaperContext(question, (message) => {
      var _a2;
      (_a2 = this.multiPaperStatusEl) == null ? void 0 : _a2.setText(message);
      setBubbleText(bubble, message);
    });
    let fullText = "";
    let firstChunkArrived = false;
    fullText = await this.services.llm.chat({
      messages: [...this.messages, { role: "user", content: outgoing }],
      onChunk: (_piece, acc) => {
        fullText = acc;
        if (!firstChunkArrived) {
          firstChunkArrived = true;
          bubble.removeClass("is-loading");
        }
        setBubbleText(bubble, acc);
        this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
      },
      signal: (_a = this.abortController) == null ? void 0 : _a.signal,
      modelProfile: this.services.models.get(this.currentModelId)
    });
    bubble.removeClass("is-loading");
    bubble.addClass("is-rendered");
    await renderMarkdownIntoBubble(this.app, this.plugin, bubble, fullText);
    this.messages.push({ role: "user", content: userLabel }, { role: "assistant", content: fullText });
    await this.recordTranscriptTurn(userLabel, fullText, "complete");
    this.showFollowupSuggestions("chat");
    (_b = this.multiPaperStatusEl) == null ? void 0 : _b.setText("\u5DF2\u964D\u7EA7\u4E3A\u666E\u901A\u591A\u8BBA\u6587\u5BF9\u6BD4\u5E76\u5B8C\u6210\u3002");
  }
  async prepareCodexPapers(progress) {
    const prepared = [];
    const usedIds = /* @__PURE__ */ new Map();
    for (const { file, role } of this.selectedPaperFiles()) {
      progress == null ? void 0 : progress(`\u6B63\u5728\u62BD\u53D6 ${file.name || file.path} \u7684\u5168\u6587\u3001\u5206\u9875\u6587\u672C\u548C\u7F13\u5B58\u8D44\u4EA7\u2026`);
      const [pages, summary, chunksEntry] = await Promise.all([
        this.services.papers.extractPages(file),
        this.services.papers.getOrCreateDocSummary(file, false),
        this.services.papers.getOrCreateDocChunks(file, false)
      ]);
      const baseId = file.path || file.name || `paper-${prepared.length + 1}`;
      const seen = usedIds.get(baseId) || 0;
      usedIds.set(baseId, seen + 1);
      prepared.push({
        id: seen ? `${baseId}-${seen + 1}` : baseId,
        role,
        name: file.name || file.path,
        vaultPath: file.path,
        mtime: file.stat && file.stat.mtime,
        summary: summary.summary || "",
        chunks: chunksEntry.chunks || [],
        pages
      });
    }
    return prepared;
  }
  async runOrdinaryMultiPaperCompare() {
    var _a, _b;
    if (!this.pdfFile) {
      new import_obsidian3.Notice("\u591A\u8BBA\u6587\u5BF9\u6BD4\u9700\u8981\u4ECE PDF \u89C6\u56FE\u6253\u5F00\u3002");
      return;
    }
    if (!this.referencedPdfFiles.length) {
      new import_obsidian3.Notice("\u8BF7\u5148 @ \u5F15\u7528\u81F3\u5C11\u4E00\u7BC7\u5176\u4ED6 PDF\u3002");
      return;
    }
    if (this.isSending) return;
    const question = this.getMultiPaperQuestion();
    const loadingNotice = new import_obsidian3.Notice("\u6B63\u5728\u51C6\u5907\u591A\u8BBA\u6587\u5BF9\u6BD4\u4E0A\u4E0B\u6587\u2026", 0);
    try {
      const outgoing = await this.buildApiMultiPaperContext(question, (message) => {
        var _a2;
        (_a2 = this.multiPaperStatusEl) == null ? void 0 : _a2.setText(message);
      });
      loadingNotice.hide();
      await this.handleSubmit({
        question: this.multiPaperUserLabel(question),
        outgoingContentOverride: outgoing,
        skipContextAugmentation: true
      });
      (_a = this.multiPaperStatusEl) == null ? void 0 : _a.setText("\u666E\u901A\u5BF9\u6BD4\u5DF2\u5B8C\u6210\uFF0C\u53EF\u7EE7\u7EED\u8FFD\u95EE\u3002");
    } catch (error) {
      loadingNotice.hide();
      new import_obsidian3.Notice("\u666E\u901A\u591A\u8BBA\u6587\u5BF9\u6BD4\u51C6\u5907\u5931\u8D25: " + errorMessage(error));
      (_b = this.multiPaperStatusEl) == null ? void 0 : _b.setText("\u666E\u901A\u5BF9\u6BD4\u51C6\u5907\u5931\u8D25\u3002");
    }
  }
  async runCodexDeepAnalysis() {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!this.pdfFile) {
      new import_obsidian3.Notice("Codex \u6DF1\u5EA6\u5206\u6790\u9700\u8981\u4ECE PDF \u89C6\u56FE\u6253\u5F00\u3002");
      return;
    }
    if (!this.referencedPdfFiles.length) {
      new import_obsidian3.Notice("\u8BF7\u5148 @ \u5F15\u7528\u81F3\u5C11\u4E00\u7BC7\u5176\u4ED6 PDF\u3002");
      return;
    }
    if (!this.plugin.settings.codexDeepAnalysis.enabled) {
      new import_obsidian3.Notice("\u9700\u8981\u5148\u5728 PDF Chat \u8BBE\u7F6E\u4E2D\u542F\u7528 Codex CLI \u6DF1\u5EA6\u5206\u6790\u3002");
      (_a = this.multiPaperStatusEl) == null ? void 0 : _a.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5C1A\u672A\u542F\u7528\u3002");
      return;
    }
    if (this.isSending) return;
    const question = this.getMultiPaperQuestion();
    const userLabel = this.multiPaperUserLabel(question);
    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.addBubble("user", userLabel);
    this.inputEl.value = "";
    if (this.inputEl.style) this.inputEl.style.height = "";
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "\u6B63\u5728\u51C6\u5907 Codex \u591A\u8BBA\u6587\u5206\u6790\u5305\u2026", { loading: true });
    this.abortController = new AbortController();
    let analysisDir = "";
    try {
      const taskId = String(Date.now());
      const papers = await this.prepareCodexPapers((message) => {
        var _a2;
        (_a2 = this.multiPaperStatusEl) == null ? void 0 : _a2.setText(message);
        setBubbleText(loadingBubble, message);
      });
      analysisDir = createCodexAnalysisTempDir(taskId);
      await writeCodexAnalysisPackage({
        baseDir: analysisDir,
        taskId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        question,
        papers
      });
      const settings = this.plugin.settings.codexDeepAnalysis;
      const execArgs = buildCodexExecArgs({
        analysisDir,
        command: settings.command || DEFAULT_SETTINGS.codexDeepAnalysis.command,
        profile: settings.profile,
        model: settings.model,
        prompt: buildCodexDeepAnalysisPrompt()
      });
      const runningMessage = `Codex \u6B63\u5728\u9605\u8BFB ${papers.length} \u7BC7\u8BBA\u6587\u2026`;
      (_b = this.multiPaperStatusEl) == null ? void 0 : _b.setText(runningMessage);
      setBubbleText(loadingBubble, runningMessage);
      const raw = await runCodexExec(execArgs, {
        timeoutMs: settings.timeoutMs || DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs,
        signal: this.abortController.signal
      });
      const output = parseCodexAnalysisOutput(raw);
      const markdown = renderCodexAnalysisMarkdown(output);
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, markdown);
      this.messages.push({ role: "user", content: userLabel }, { role: "assistant", content: markdown });
      await this.recordTranscriptTurn(userLabel, markdown, "complete");
      this.showFollowupSuggestions("chat");
      (_c = this.multiPaperStatusEl) == null ? void 0 : _c.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5DF2\u5B8C\u6210\u3002");
    } catch (error) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(error)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, "Codex \u6DF1\u5EA6\u5206\u6790\u5DF2\u505C\u6B62\u3002");
        (_d = this.multiPaperStatusEl) == null ? void 0 : _d.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5DF2\u505C\u6B62\u3002");
      } else if (isCodexUnavailableError(error)) {
        setBubbleText(loadingBubble, "Codex CLI \u4E0D\u53EF\u7528\uFF0C\u6B63\u5728\u6539\u7528\u666E\u901A API \u591A\u8BBA\u6587\u5BF9\u6BD4\u2026");
        (_e = this.multiPaperStatusEl) == null ? void 0 : _e.setText("Codex \u4E0D\u53EF\u7528\uFF0C\u964D\u7EA7\u4E3A\u666E\u901A\u5BF9\u6BD4\u3002");
        try {
          await this.completeApiMultiPaperAnswer(question, userLabel, loadingBubble);
        } catch (fallbackError) {
          loadingBubble.removeClass("is-loading");
          loadingBubble.addClass("is-error");
          setBubbleText(loadingBubble, "\u666E\u901A\u5BF9\u6BD4\u4E5F\u5931\u8D25: " + errorMessage(fallbackError));
          (_f = this.multiPaperStatusEl) == null ? void 0 : _f.setText("\u666E\u901A\u5BF9\u6BD4\u964D\u7EA7\u5931\u8D25\u3002");
        }
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "Codex \u6DF1\u5EA6\u5206\u6790\u5931\u8D25: " + errorMessage(error));
        (_g = this.multiPaperStatusEl) == null ? void 0 : _g.setText("Codex \u6DF1\u5EA6\u5206\u6790\u5931\u8D25\uFF0C\u53EF\u6539\u7528\u666E\u901A\u5BF9\u6BD4\u3002");
      }
    } finally {
      const keep = this.plugin.settings.codexDeepAnalysis.keepTempFiles;
      if (analysisDir && !keep) {
        try {
          removeCodexAnalysisTempDir(analysisDir);
        } catch (error) {
          void error;
        }
      }
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  setupDragging(handleEl) {
    handleEl.addClass("pdf-chat-drag-handle");
    handleEl.addEventListener("mousedown", (evt) => {
      if (evt.target instanceof Element && evt.target.closest("button, select, input, textarea, label, .pdf-chat-interactive")) {
        return;
      }
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
    if (sending) this.hideFollowupSuggestions();
    this.sendBtn.setText(sending ? "\u505C\u6B62" : "\u2191");
    this.sendBtn.toggleClass("is-stop", sending);
    labelControl(this.sendBtn, sending ? "\u505C\u6B62\u751F\u6210" : "\u53D1\u9001\u95EE\u9898");
    if (this.translateBtn) {
      this.translateBtn.disabled = sending;
      this.translateBtn.setAttr("aria-disabled", String(sending));
      labelControl(this.translateBtn, sending ? "\u751F\u6210\u671F\u95F4\u65E0\u6CD5\u7FFB\u8BD1\u9009\u533A" : "\u7FFB\u8BD1\u5F53\u524D\u9009\u533A");
    }
  }
  handleTranslate() {
    void this.services.actions.execute("translate", {
      translate: () => this.runTranslation()
    });
  }
  async runTranslation() {
    if (!this.contextText || this.isSending) return;
    this.hideFollowupSuggestions();
    const friendlyLabel = `\u7FFB\u8BD1\u5F53\u524D\u9009\u533A\uFF08${this.contextText.length} \u5B57\uFF09`;
    this.addBubble("user", friendlyLabel);
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "\u6B63\u5728\u7FFB\u8BD1\u2026", { loading: true });
    this.abortController = new AbortController();
    let fullText = "";
    try {
      const result = await this.services.translations.translate({
        source: this.contextText,
        settings: this.plugin.settings.translation,
        modelProfile: this.services.models.get(this.services.models.resolveTranslateId()),
        signal: this.abortController.signal,
        onChunk: (progress) => {
          fullText = progress.combinedText;
          loadingBubble.removeClass("is-loading");
          const progressText = progress.chunkCount > 1 ? `${progress.combinedText}

\u6B63\u5728\u7FFB\u8BD1 ${progress.chunkIndex}/${progress.chunkCount}\u2026` : progress.combinedText;
          setBubbleText(loadingBubble, progressText);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        }
      });
      fullText = result.text;
      loadingBubble.removeClass("is-loading");
      if (!fullText.trim()) {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u7FFB\u8BD1\u672A\u8FD4\u56DE\u5185\u5BB9");
        return;
      }
      const hasFallbackChunks = result.failedChunkIndexes.length > 0;
      const isPartial = result.stoppedEarly || hasFallbackChunks;
      const status = isPartial ? "stopped" : "complete";
      if (isPartial) {
        const notices = [];
        if (result.stoppedEarly) notices.push("[\u5DF2\u505C\u6B62\u751F\u6210]");
        if (hasFallbackChunks) notices.push("[\u90E8\u5206\u5206\u5757\u7FFB\u8BD1\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u539F\u6587]");
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, fullText + "\n\n" + notices.join("\n"));
      } else {
        loadingBubble.addClass("is-rendered");
        await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      }
      await this.recordTranslateTurn(friendlyLabel, fullText, status);
      this.activeComposerKind = "translate";
      if (!isPartial) this.showFollowupSuggestions("translate");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(err) && fullText.trim()) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, fullText + "\n\n[\u5DF2\u505C\u6B62\u751F\u6210]");
        await this.recordTranslateTurn(friendlyLabel, fullText, "stopped");
        this.activeComposerKind = "translate";
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u7FFB\u8BD1\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6A21\u578B\u914D\u7F6E\u6216\u7A0D\u540E\u91CD\u8BD5\u3002");
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  async handleTranslateFollowup(question, usingOverride) {
    this.hideFollowupSuggestions();
    this.addBubble("user", question);
    if (!usingOverride) {
      this.inputEl.value = "";
      if (this.inputEl.style) this.inputEl.style.height = "";
    }
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "\u601D\u8003\u4E2D\u2026", { loading: true });
    this.abortController = new AbortController();
    let fullText = "";
    let firstChunkArrived = false;
    const requestMessages = [
      this.buildSystemMessage(),
      ...this.translateTranscript.map((message) => ({
        role: message.role,
        content: message.content
      })),
      { role: "user", content: question }
    ];
    try {
      fullText = await this.services.llm.chat({
        messages: requestMessages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          setBubbleText(loadingBubble, acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: this.abortController.signal,
        modelProfile: this.services.models.get(this.currentModelId)
      });
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranslateTurn(question, fullText, "complete");
      this.activeComposerKind = "translate";
      this.showFollowupSuggestions("translate");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(err)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, (fullText || "") + "\n\n[\u5DF2\u505C\u6B62\u751F\u6210]");
        if (fullText) await this.recordTranslateTurn(question, fullText, "stopped");
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u8BF7\u6C42\u5931\u8D25: " + errorMessage(err));
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  async handleSubmit(options = {}) {
    const opts = options || {};
    const usingOverride = typeof opts.question === "string";
    const question = typeof opts.question === "string" ? opts.question.trim() : this.inputEl.value.trim();
    if (!question) return;
    if (this.isSending) {
      new import_obsidian3.Notice("\u4E0A\u4E00\u4E2A\u95EE\u9898\u8FD8\u5728\u751F\u6210\u4E2D,\u8BF7\u7A0D\u5019\u6216\u70B9\u51FB\u505C\u6B62");
      return;
    }
    if (this.activeComposerKind === "translate" && this.translateTranscript.length) {
      await this.handleTranslateFollowup(question, usingOverride);
      return;
    }
    this.activeComposerKind = "chat";
    this.hideFollowupSuggestions();
    this.addBubble("user", question);
    if (!usingOverride) {
      this.inputEl.value = "";
      if (this.inputEl.style) this.inputEl.style.height = "";
    }
    this.setSendingState(true);
    const loadingBubble = this.addBubble("assistant", "\u601D\u8003\u4E2D\u2026", { loading: true });
    let outgoingContent = opts.outgoingContentOverride || question;
    if (opts.outgoingContentOverride) {
    } else if (opts.skipContextAugmentation) {
    } else if (this.useRag && this.useFullTextMode && this.pdfFile && !this.fullTextAttached) {
      setBubbleText(loadingBubble, "\u6B63\u5728\u8BFB\u53D6\u5168\u6587\u2026");
      try {
        if (!this.fullTextForQA) {
          this.fullTextForQA = await this.services.papers.extractFullText(this.pdfFile);
        }
        outgoingContent = "\u3010\u8BBA\u6587\u5168\u6587\u3011:\n" + this.fullTextForQA + "\n\n\u3010\u6211\u7684\u95EE\u9898\u3011:\n" + question;
        this.fullTextAttached = true;
      } catch (err) {
      }
      setBubbleText(loadingBubble, "\u601D\u8003\u4E2D\u2026");
    } else if (!this.useFullTextMode && this.useRag && this.docChunksEntry && this.docChunksEntry.chunks && this.docChunksEntry.chunks.length) {
      const retrievalQueries = [question];
      if (this.plugin.settings.ragQueryTranslate) {
        setBubbleText(loadingBubble, "\u6B63\u5728\u601D\u8003\u68C0\u7D22\u89D2\u5EA6\u2026");
        try {
          const variants = await this.services.papers.planRagQueries(question);
          if (variants && variants.length) retrievalQueries.push(...variants);
        } catch (err) {
        }
      }
      const topK = this.plugin.settings.ragTopK || DEFAULT_SETTINGS.ragTopK;
      const expanded = this.services.papers.retrieveContext(
        this.docChunksEntry.chunks,
        retrievalQueries,
        topK
      );
      if (expanded.length) {
        const retrievedText = expanded.map((c) => `[\u7B2C${c.page}\u9875]
${c.text}`).join("\n\n---\n\n");
        outgoingContent = "\u3010\u4ECE\u5168\u6587\u4E2D\u6309\u5173\u952E\u8BCD\u68C0\u7D22\u5230\u7684\u53EF\u80FD\u76F8\u5173\u7247\u6BB5(\u4E0D\u4E00\u5B9A\u5B8C\u5168\u51C6\u786E,\u4EC5\u4F9B\u53C2\u8003)\u3011:\n" + retrievedText + "\n\n\u3010\u6211\u7684\u95EE\u9898\u3011:\n" + question;
      }
      setBubbleText(loadingBubble, "\u601D\u8003\u4E2D\u2026");
    }
    this.messages.push({ role: "user", content: outgoingContent });
    this.abortController = new AbortController();
    let fullText = "";
    let firstChunkArrived = false;
    try {
      fullText = await this.services.llm.chat({
        messages: this.messages,
        onChunk: (_piece, acc) => {
          fullText = acc;
          if (!firstChunkArrived) {
            firstChunkArrived = true;
            loadingBubble.removeClass("is-loading");
          }
          setBubbleText(loadingBubble, acc);
          this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "auto" });
        },
        signal: this.abortController.signal,
        modelProfile: this.services.models.get(this.currentModelId)
      });
      loadingBubble.removeClass("is-loading");
      loadingBubble.addClass("is-rendered");
      this.messages.push({ role: "assistant", content: fullText });
      await renderMarkdownIntoBubble(this.app, this.plugin, loadingBubble, fullText);
      await this.recordTranscriptTurn(question, fullText, "complete");
      this.showFollowupSuggestions("chat");
    } catch (err) {
      loadingBubble.removeClass("is-loading");
      if (isAbortError(err)) {
        loadingBubble.addClass("is-stopped");
        setBubbleText(loadingBubble, (fullText || "") + "\n\n[\u5DF2\u505C\u6B62\u751F\u6210]");
        if (fullText) {
          this.messages.push({ role: "assistant", content: fullText });
          await this.recordTranscriptTurn(question, fullText, "stopped");
        } else {
          this.messages.pop();
        }
      } else {
        loadingBubble.addClass("is-error");
        setBubbleText(loadingBubble, "\u8BF7\u6C42\u5931\u8D25: " + errorMessage(err));
        this.messages.pop();
      }
    } finally {
      this.setSendingState(false);
      this.abortController = null;
      this.inputEl.focus();
    }
  }
  addBubble(role, text, opts = {}) {
    this.removeEmptyState();
    const bubble = this.historyEl.createDiv({ cls: `pdf-chat-bubble ${role}` });
    const compatibleBubble = bubble;
    if (typeof compatibleBubble.setAttr === "function") {
      compatibleBubble.setAttr("aria-label", role === "user" ? "\u4F60\u7684\u6D88\u606F" : "PDF Chat \u7684\u6D88\u606F");
    } else if (typeof compatibleBubble.setAttribute === "function") {
      compatibleBubble.setAttribute("aria-label", role === "user" ? "\u4F60\u7684\u6D88\u606F" : "PDF Chat \u7684\u6D88\u606F");
    }
    if (opts && opts.loading) bubble.addClass("is-loading");
    if (!canCreateBubbleChildren(bubble)) {
      setBubbleText(bubble, text);
    } else if (role === "assistant") {
      const meta = createBubbleDiv(bubble, { cls: "pdf-chat-message-meta" });
      meta.createEl("span", { text: "PDF Chat", cls: "pdf-chat-message-author" });
      meta.createEl("span", { text: "\u57FA\u4E8E\u5F53\u524D\u8BBA\u6587\u4E0A\u4E0B\u6587", cls: "pdf-chat-message-context" });
      bubble.pdfChatContentEl = createBubbleDiv(bubble, { cls: "pdf-chat-message-content" });
      setBubbleText(bubble, text);
    } else {
      const translationDisplay = formatTranslationUserDisplay(text);
      bubble.pdfChatContentEl = createBubbleDiv(bubble, { cls: "pdf-chat-message-content" });
      if (translationDisplay) {
        bubble.addClass("is-translation-request");
        createBubbleDiv(bubble.pdfChatContentEl, {
          text: translationDisplay.title,
          cls: "pdf-chat-user-message-title"
        });
        if (translationDisplay.meta) {
          createBubbleDiv(bubble.pdfChatContentEl, {
            text: translationDisplay.meta,
            cls: "pdf-chat-user-message-meta"
          });
        }
      } else {
        setBubbleText(bubble, text);
      }
    }
    if (!(opts && opts.skipScroll)) {
      this.historyEl.scrollTo({ top: this.historyEl.scrollHeight, behavior: "smooth" });
    }
    return bubble;
  }
  onClose() {
    this.stopGenerating();
    if (this.transcript.length) {
      void this.persistConversation();
    }
    if (this.translateTranscript.length) {
      void this.persistTranslationConversation();
    }
    this.contentEl.empty();
  }
};

// src/quick-translate-marker.ts
var MARKER_GAP = 8;
var SELECTION_DEBOUNCE_MS = 150;
function readSelection(doc) {
  var _a;
  const selection = (_a = doc.defaultView) == null ? void 0 : _a.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const text = cleanSelectionText(selection.toString());
  if (!text) return null;
  const range = selection.getRangeAt(selection.rangeCount - 1);
  const rectangles = Array.from(range.getClientRects());
  const rect = rectangles.length ? rectangles[rectangles.length - 1] : range.getBoundingClientRect();
  if (!rect) return null;
  return { text, rect };
}
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
var QuickTranslateMarker = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
    __publicField(this, "attached", /* @__PURE__ */ new Map());
    __publicField(this, "markerEl", null);
    __publicField(this, "markerDocument", null);
    __publicField(this, "pendingTimer", null);
    __publicField(this, "setTimer");
    __publicField(this, "clearTimer");
    var _a, _b;
    this.setTimer = (_a = dependencies.setTimer) != null ? _a : ((callback, delay) => setTimeout(callback, delay));
    this.clearTimer = (_b = dependencies.clearTimer) != null ? _b : ((timer) => clearTimeout(timer));
  }
  attach(doc) {
    if (!doc || this.attached.has(doc)) return;
    const selectionChange = () => this.scheduleUpdate(doc);
    const mouseDown = (event) => {
      const target = event.target;
      if (this.markerEl && target && this.markerEl.contains(target)) return;
      this.hide();
    };
    const scroll = () => this.hide();
    const keyDown = (event) => {
      if (event.key === "Escape") this.hide();
    };
    doc.addEventListener("selectionchange", selectionChange);
    doc.addEventListener("mousedown", mouseDown, true);
    doc.addEventListener("scroll", scroll, true);
    doc.addEventListener("keydown", keyDown);
    this.attached.set(doc, { selectionChange, mouseDown, scroll, keyDown });
  }
  hide() {
    this.cancelPendingUpdate();
    if (this.markerEl) this.markerEl.hidden = true;
  }
  destroy() {
    var _a;
    this.cancelPendingUpdate();
    for (const [doc, listeners] of this.attached) {
      doc.removeEventListener("selectionchange", listeners.selectionChange);
      doc.removeEventListener("mousedown", listeners.mouseDown, true);
      doc.removeEventListener("scroll", listeners.scroll, true);
      doc.removeEventListener("keydown", listeners.keyDown);
    }
    this.attached.clear();
    (_a = this.markerEl) == null ? void 0 : _a.remove();
    this.markerEl = null;
    this.markerDocument = null;
  }
  scheduleUpdate(doc) {
    this.cancelPendingUpdate();
    this.pendingTimer = this.setTimer(() => {
      this.pendingTimer = null;
      this.updateFromSelection(doc);
    }, SELECTION_DEBOUNCE_MS);
  }
  cancelPendingUpdate() {
    if (this.pendingTimer === null) return;
    this.clearTimer(this.pendingTimer);
    this.pendingTimer = null;
  }
  updateFromSelection(doc) {
    if (!this.dependencies.isEnabled() || !this.dependencies.getActivePdfFile()) {
      this.hide();
      return;
    }
    const snapshot = readSelection(doc);
    if (!snapshot) {
      this.hide();
      return;
    }
    const marker = this.ensureMarker(doc);
    marker.hidden = false;
    this.position(marker, doc, snapshot.rect);
  }
  ensureMarker(doc) {
    var _a;
    if (this.markerEl && this.markerDocument === doc) return this.markerEl;
    (_a = this.markerEl) == null ? void 0 : _a.remove();
    const marker = doc.createElement("button");
    marker.type = "button";
    marker.className = "pdf-chat-quick-translate-marker";
    marker.textContent = "\u8BD1";
    marker.setAttribute("aria-label", "\u7FFB\u8BD1\u5F53\u524D PDF \u9009\u533A");
    marker.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openCurrentSelection(doc);
    });
    doc.body.appendChild(marker);
    this.markerEl = marker;
    this.markerDocument = doc;
    return marker;
  }
  openCurrentSelection(doc) {
    const snapshot = readSelection(doc);
    const file = this.dependencies.getActivePdfFile();
    if (!this.dependencies.isEnabled() || !snapshot || !file) {
      this.hide();
      return;
    }
    this.hide();
    this.dependencies.openModal({
      file,
      selectedText: snapshot.text,
      startFresh: true,
      autoTranslateOnOpen: true
    });
  }
  position(marker, doc, selectionRect) {
    var _a, _b, _c, _d;
    const viewportWidth = (_b = (_a = doc.defaultView) == null ? void 0 : _a.innerWidth) != null ? _b : doc.documentElement.clientWidth;
    const viewportHeight = (_d = (_c = doc.defaultView) == null ? void 0 : _c.innerHeight) != null ? _d : doc.documentElement.clientHeight;
    const markerRect = marker.getBoundingClientRect();
    const width = markerRect.width || 32;
    const height = markerRect.height || 32;
    let left = selectionRect.right + MARKER_GAP;
    if (left + width + MARKER_GAP > viewportWidth) {
      left = selectionRect.left - width - MARKER_GAP;
    }
    let top = selectionRect.top - height - MARKER_GAP;
    if (top < MARKER_GAP) top = selectionRect.bottom + MARKER_GAP;
    marker.style.left = `${clamp(left, MARKER_GAP, viewportWidth - width - MARKER_GAP)}px`;
    marker.style.top = `${clamp(top, MARKER_GAP, viewportHeight - height - MARKER_GAP)}px`;
  }
};

// src/settings.ts
function normalizeRagChunkSettings(chunkSize, chunkOverlap) {
  const ragChunkSize = typeof chunkSize === "number" && Number.isInteger(chunkSize) && chunkSize > 0 ? chunkSize : DEFAULT_SETTINGS.ragChunkSize;
  const fallbackOverlap = Math.min(DEFAULT_SETTINGS.ragChunkOverlap, ragChunkSize - 1);
  const ragChunkOverlap = typeof chunkOverlap === "number" && Number.isInteger(chunkOverlap) && chunkOverlap >= 0 && chunkOverlap < ragChunkSize ? chunkOverlap : fallbackOverlap;
  return {
    ragChunkSize,
    ragChunkOverlap,
    changed: chunkSize !== ragChunkSize || chunkOverlap !== ragChunkOverlap
  };
}
function migrateSettings(savedValue, now = Date.now) {
  var _a, _b;
  const saved = savedValue && typeof savedValue === "object" && !Array.isArray(savedValue) ? savedValue : null;
  const settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  settings.models = saved && Array.isArray(saved.models) && saved.models.length ? saved.models.map((model) => ({ ...model })) : DEFAULT_SETTINGS.models.map((model) => ({ ...model }));
  settings.promptPresets = saved && Array.isArray(saved.promptPresets) && saved.promptPresets.length ? saved.promptPresets.map((preset) => ({ ...preset })) : DEFAULT_SETTINGS.promptPresets.map((preset) => ({ ...preset }));
  settings.docSummaries = saved && saved.docSummaries && typeof saved.docSummaries === "object" ? { ...saved.docSummaries } : {};
  settings.docChunks = saved && saved.docChunks && typeof saved.docChunks === "object" ? { ...saved.docChunks } : {};
  settings.conversationHistories = normalizeConversationHistories(saved && saved.conversationHistories);
  let needsSave = false;
  const normalizedRag = normalizeRagChunkSettings(settings.ragChunkSize, settings.ragChunkOverlap);
  settings.ragChunkSize = normalizedRag.ragChunkSize;
  settings.ragChunkOverlap = normalizedRag.ragChunkOverlap;
  if (normalizedRag.changed) needsSave = true;
  const hasTranslationObject = Boolean(
    saved && saved.translation && typeof saved.translation === "object" && !Array.isArray(saved.translation)
  );
  const nestedChunkChars = (_a = saved == null ? void 0 : saved.translation) == null ? void 0 : _a.chunkChars;
  const validNestedChunkChars = typeof nestedChunkChars === "number" && Number.isInteger(nestedChunkChars) && nestedChunkChars > 0 ? nestedChunkChars : null;
  const legacyChunkChars = saved == null ? void 0 : saved.translateChunkMaxChars;
  const validLegacyChunkChars = typeof legacyChunkChars === "number" && Number.isInteger(legacyChunkChars) && legacyChunkChars > 0 ? legacyChunkChars : null;
  if (nestedChunkChars !== void 0 && validNestedChunkChars === null) needsSave = true;
  if (hasTranslationObject) {
    settings.translation = {
      ...DEFAULT_SETTINGS.translation,
      ...saved.translation,
      chunkChars: (_b = validNestedChunkChars != null ? validNestedChunkChars : validLegacyChunkChars) != null ? _b : DEFAULT_SETTINGS.translation.chunkChars
    };
  } else {
    const legacyInstruction = typeof (saved == null ? void 0 : saved.translatePrompt) === "string" ? saved.translatePrompt : "";
    settings.translation = {
      ...DEFAULT_SETTINGS.translation,
      additionalInstruction: legacyInstruction.trim() && legacyInstruction !== LEGACY_0_4_0_TRANSLATE_PROMPT ? legacyInstruction : "",
      chunkChars: validLegacyChunkChars != null ? validLegacyChunkChars : DEFAULT_SETTINGS.translation.chunkChars
    };
    needsSave = true;
  }
  const savedCodex = saved && saved.codexDeepAnalysis && typeof saved.codexDeepAnalysis === "object" && !Array.isArray(saved.codexDeepAnalysis) ? saved.codexDeepAnalysis : {};
  settings.codexDeepAnalysis = {
    ...DEFAULT_SETTINGS.codexDeepAnalysis,
    ...savedCodex,
    enabled: savedCodex.enabled === true,
    command: typeof savedCodex.command === "string" && savedCodex.command.trim() ? savedCodex.command.trim() : DEFAULT_SETTINGS.codexDeepAnalysis.command,
    profile: typeof savedCodex.profile === "string" ? savedCodex.profile.trim() : "",
    model: typeof savedCodex.model === "string" ? savedCodex.model.trim() : "",
    timeoutMs: typeof savedCodex.timeoutMs === "number" && Number.isFinite(savedCodex.timeoutMs) && savedCodex.timeoutMs >= 3e4 ? Math.floor(savedCodex.timeoutMs) : DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs,
    keepTempFiles: savedCodex.keepTempFiles === true
  };
  if (saved && (saved.endpoint || saved.apiKey || saved.model) && !(saved.models && saved.models.length)) {
    const migrated = {
      id: "migrated-" + now(),
      name: "\u8FC1\u79FB\u81EA\u65E7\u8BBE\u7F6E",
      endpoint: saved.endpoint || DEFAULT_SETTINGS.models[0].endpoint,
      apiKey: saved.apiKey || DEFAULT_SETTINGS.models[0].apiKey,
      model: saved.model || DEFAULT_SETTINGS.models[0].model
    };
    settings.models = [migrated, ...DEFAULT_SETTINGS.models.map((model) => ({ ...model }))];
    settings.activeModelId = migrated.id;
    needsSave = true;
  }
  if (!settings.models.length) {
    settings.models = DEFAULT_SETTINGS.models.map((model) => ({ ...model }));
    needsSave = true;
  }
  if (!settings.models.find((model) => model.id === settings.activeModelId)) {
    settings.activeModelId = settings.models[0].id;
    needsSave = true;
  }
  if (settings.endpoint !== void 0 || settings.apiKey !== void 0 || settings.model !== void 0) {
    delete settings.endpoint;
    delete settings.apiKey;
    delete settings.model;
    needsSave = true;
  }
  if (settings.translatePrompt !== void 0) {
    delete settings.translatePrompt;
    needsSave = true;
  }
  if (settings.translateChunkMaxChars !== void 0) {
    delete settings.translateChunkMaxChars;
    needsSave = true;
  }
  return { settings, needsSave };
}
function enqueueSettingsSave(owner) {
  const previousSave = owner._saveQueue || Promise.resolve();
  const nextSave = previousSave.catch(() => void 0).then(() => owner.saveData(owner.settings));
  owner._saveQueue = nextSave;
  return nextSave;
}

// src/settings-tab.ts
var import_obsidian4 = require("obsidian");

// src/settings-ui.ts
function createSettingsSection(parent, title) {
  const section = parent.createEl("section", {
    cls: "pdf-chat-settings-section",
    attr: { "aria-labelledby": `pdf-chat-settings-${title}` }
  });
  const compatibleSection = section;
  if (typeof compatibleSection.createEl !== "function") return parent;
  section.createEl("h3", {
    text: title,
    attr: { id: `pdf-chat-settings-${title}` }
  });
  return section;
}

// src/settings-tab.ts
function labelExtraButton(button, label) {
  if (!button.extraSettingsEl) return;
  button.extraSettingsEl.setAttr("aria-label", label);
}
var PDFChatSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PDF Chat \u8BBE\u7F6E" });
    this.renderModelSection(createSettingsSection(containerEl, "\u6A21\u578B"));
    this.renderChatSection(createSettingsSection(containerEl, "\u804A\u5929"));
    this.renderTranslationSection(createSettingsSection(containerEl, "\u7FFB\u8BD1"));
    this.renderPaperContextSection(createSettingsSection(containerEl, "\u8BBA\u6587\u4E0A\u4E0B\u6587"));
    this.renderAdvancedSection(createSettingsSection(containerEl, "\u9AD8\u7EA7"));
  }
  renderModelSection(containerEl) {
    containerEl.createEl("p", {
      text: "\u53EF\u4EE5\u6DFB\u52A0\u591A\u5957 OpenAI \u517C\u5BB9\u6A21\u578B\u914D\u7F6E\u3002\u5F39\u7A97\u4F1A\u5217\u51FA\u5168\u90E8\u6761\u76EE\uFF0C\u6807\u4E3A\u9ED8\u8BA4\u7684\u6761\u76EE\u7528\u4E8E\u65B0\u5BF9\u8BDD\u3002",
      cls: "setting-item-description"
    });
    this.plugin.settings.models.forEach((model, index) => {
      const isActive = model.id === this.plugin.settings.activeModelId;
      const header = new import_obsidian4.Setting(containerEl).setName(`\u6A21\u578B ${index + 1}${isActive ? " \xB7 \u9ED8\u8BA4" : ""}`);
      header.addText(
        (text) => text.setPlaceholder("\u540D\u79F0").setValue(model.name).onChange(async (value) => {
          model.name = value;
          await this.plugin.saveSettings();
        })
      );
      if (!isActive) {
        header.addExtraButton((button) => {
          labelExtraButton(button, "\u8BBE\u4E3A\u9ED8\u8BA4");
          button.setIcon("star").onClick(async () => {
            this.plugin.settings.activeModelId = model.id;
            await this.plugin.saveSettings();
            this.display();
          });
        });
      }
      header.addExtraButton((button) => {
        labelExtraButton(button, "\u5220\u9664\u8FD9\u4E2A\u6A21\u578B");
        button.setIcon("trash").onClick(async () => {
          if (this.plugin.settings.models.length <= 1) {
            new import_obsidian4.Notice("\u81F3\u5C11\u8981\u4FDD\u7559\u4E00\u4E2A\u6A21\u578B\u914D\u7F6E");
            return;
          }
          this.plugin.settings.models.splice(index, 1);
          if (this.plugin.settings.activeModelId === model.id) {
            this.plugin.settings.activeModelId = this.plugin.settings.models[0].id;
          }
          await this.plugin.saveSettings();
          this.display();
        });
      });
      new import_obsidian4.Setting(containerEl).setName("Endpoint").addText(
        (text) => text.setPlaceholder("OpenAI \u517C\u5BB9\u7684 chat/completions \u63A5\u53E3\u5730\u5740").setValue(model.endpoint).onChange(async (value) => {
          model.endpoint = value.trim();
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian4.Setting(containerEl).setName("API Key").addText((text) => {
        text.inputEl.type = "password";
        text.setValue(model.apiKey).onChange(async (value) => {
          model.apiKey = value.trim();
          await this.plugin.saveSettings();
        });
      });
      new import_obsidian4.Setting(containerEl).setName("\u6A21\u578B\u540D(model \u5B57\u6BB5)").addText(
        (text) => text.setValue(model.model).onChange(async (value) => {
          model.model = value.trim();
          await this.plugin.saveSettings();
        })
      );
      containerEl.createEl("hr");
    });
    new import_obsidian4.Setting(containerEl).addButton(
      (button) => button.setButtonText("+ \u6DFB\u52A0\u6A21\u578B").setCta().onClick(async () => {
        this.plugin.settings.models.push({
          id: "model-" + Date.now(),
          name: "\u65B0\u6A21\u578B",
          endpoint: "",
          apiKey: "",
          model: ""
        });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
  renderChatSection(containerEl) {
    new import_obsidian4.Setting(containerEl).setName("\u6D41\u5F0F\u8F93\u51FA").setDesc("\u5F00\u542F\u540E\u7B54\u6848\u4F1A\u4E00\u8FB9\u751F\u6210\u4E00\u8FB9\u663E\u793A\uFF1B\u5173\u95ED\u5219\u7B49\u751F\u6210\u5B8C\u518D\u4E00\u6B21\u6027\u663E\u793A").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.stream).onChange(async (value) => {
        this.plugin.settings.stream = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Temperature").addText(
      (text) => text.setValue(String(this.plugin.settings.temperature)).onChange(async (value) => {
        const parsed = parseFloat(value);
        this.plugin.settings.temperature = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.temperature;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Max Tokens").addText(
      (text) => text.setValue(String(this.plugin.settings.maxTokens)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.maxTokens = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.maxTokens;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u7EE7\u7EED\u5BF9\u8BDD\u4F7F\u7528\u7684\u6A21\u578B").setDesc("\u7559\u7A7A\u65F6\u4F18\u5148\u9009\u62E9 id\u3001\u6A21\u578B\u540D\u6216\u663E\u793A\u540D\u79F0\u4E2D\u5305\u542B GLM \u7684\u6A21\u578B\uFF0C\u7136\u540E\u56DE\u9000\u5230\u9ED8\u8BA4\u6A21\u578B\u3002").addDropdown((dropdown) => {
      dropdown.addOption("", "\u81EA\u52A8\uFF08\u4F18\u5148 GLM\uFF09");
      this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
      dropdown.setValue(this.plugin.settings.continueModelId);
      dropdown.onChange(async (value) => {
        this.plugin.settings.continueModelId = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u7CFB\u7EDF\u63D0\u793A\u8BCD").setDesc("\u4F1A\u81EA\u52A8\u9644\u52A0\u9009\u4E2D\u7684\u539F\u6587\u7247\u6BB5\u5728\u5176\u540E").addTextArea((text) => {
      text.inputEl.rows = 6;
      text.setValue(this.plugin.settings.systemPrompt).onChange(async (value) => {
        this.plugin.settings.systemPrompt = value;
        await this.plugin.saveSettings();
      });
    });
  }
  renderTranslationSection(containerEl) {
    new import_obsidian4.Setting(containerEl).setName("\u7FFB\u8BD1\u4F7F\u7528\u7684\u6A21\u578B").setDesc("\u7559\u7A7A\u65F6\u4F18\u5148\u9009\u62E9 id\u3001\u6A21\u578B\u540D\u6216\u663E\u793A\u540D\u79F0\u4E2D\u5305\u542B DeepSeek \u7684\u6A21\u578B\uFF0C\u7136\u540E\u56DE\u9000\u5230\u9ED8\u8BA4\u6A21\u578B\u3002").addDropdown((dropdown) => {
      dropdown.addOption("", "\u81EA\u52A8\uFF08\u4F18\u5148 DeepSeek\uFF09");
      this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
      dropdown.setValue(this.plugin.settings.translateModelId);
      dropdown.onChange(async (value) => {
        this.plugin.settings.translateModelId = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u5212\u8BCD\u540E\u81EA\u52A8\u51FA\u73B0\u300C\u8BD1\u300D\u60AC\u6D6E\u56FE\u6807").setDesc("\u4EC5\u5728\u6D3B\u52A8\u89C6\u56FE\u662F PDF \u4E14\u9009\u533A\u975E\u7A7A\u65F6\u663E\u793A\uFF1B\u70B9\u51FB\u540E\u6253\u5F00\u65B0\u5F39\u7A97\u5E76\u81EA\u52A8\u7FFB\u8BD1\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.quickTranslateMarkerEnabled).onChange(async (value) => {
        this.plugin.settings.quickTranslateMarkerEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u7FFB\u8BD1\u76EE\u6807\u8BED\u8A00").setDesc("\u7528\u4E8E\u5F39\u7A97\u4E2D\u7684\u9009\u533A\u7FFB\u8BD1\uFF0C\u4F8B\u5982 zh-CN\u3001en \u6216 ja").addText(
      (text) => text.setValue(this.plugin.settings.translation.targetLanguage).onChange(async (value) => {
        this.plugin.settings.translation.targetLanguage = value.trim() || DEFAULT_SETTINGS.translation.targetLanguage;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u7FFB\u8BD1\u5206\u5757\u5927\u5C0F\uFF08Unicode \u5B57\u7B26\uFF09").setDesc("\u957F\u9009\u533A\u4F1A\u6309 Unicode \u5B57\u7B26\u6570\u5206\u5757\u53D1\u9001\u3002\u8BF7\u8F93\u5165\u5927\u4E8E 0 \u7684\u6574\u6570\uFF1B\u65E0\u6548\u503C\u6062\u590D\u4E3A 8000\u3002").addText(
      (text) => text.setValue(String(this.plugin.settings.translation.chunkChars)).onChange(async (value) => {
        const parsed = Number(value.trim());
        this.plugin.settings.translation.chunkChars = Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_SETTINGS.translation.chunkChars;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u7FFB\u8BD1\u9644\u52A0\u8981\u6C42").setDesc("\u53EF\u9009\u3002\u7528\u4E8E\u8865\u5145\u672F\u8BED\u3001\u98CE\u683C\u6216\u9886\u57DF\u7EA6\u5B9A\uFF1B\u539F\u6587\u7531\u72EC\u7ACB\u7FFB\u8BD1\u4EFB\u52A1\u5B89\u5168\u9644\u52A0\u3002").addTextArea((text) => {
      text.inputEl.rows = 4;
      text.setValue(this.plugin.settings.translation.additionalInstruction).onChange(async (value) => {
        this.plugin.settings.translation.additionalInstruction = value;
        await this.plugin.saveSettings();
      });
    });
  }
  renderPaperContextSection(containerEl) {
    containerEl.createEl("h4", { text: "\u5168\u6587\u6458\u8981" });
    containerEl.createEl("p", {
      text: "\u5168\u6587\u6458\u8981\u6309\u6587\u4EF6\u8DEF\u5F84\u548C\u4FEE\u6539\u65F6\u95F4\u7F13\u5B58\uFF0C\u53EF\u4F5C\u4E3A\u5F53\u524D\u9009\u533A\u4E4B\u5916\u7684\u7B80\u8981\u80CC\u666F\u3002\u4EC5\u5BF9 PDF \u751F\u6548\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian4.Setting(containerEl).setName("\u6253\u5F00 PDF \u5212\u8BCD\u5F39\u7A97\u65F6\u81EA\u52A8\u9644\u5E26\u5168\u6587\u6458\u8981").setDesc("\u6709\u7F13\u5B58\u65F6\u76F4\u63A5\u4F7F\u7528\uFF1B\u6CA1\u6709\u7F13\u5B58\u65F6\u81EA\u52A8\u751F\u6210\u4E00\u6B21\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoDocSummary).onChange(async (value) => {
        this.plugin.settings.autoDocSummary = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u6458\u8981\u751F\u6210\u7528\u7684\u6A21\u578B").setDesc("\u5EFA\u8BAE\u9009\u62E9\u901F\u5EA6\u5FEB\u3001\u6210\u672C\u4F4E\u7684\u6A21\u578B\uFF0C\u804A\u5929\u4E3B\u6A21\u578B\u53EF\u4EE5\u4E0D\u540C\u3002").addDropdown((dropdown) => {
      this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
      dropdown.setValue(this.plugin.settings.summaryModelId || this.plugin.settings.activeModelId);
      dropdown.onChange(async (value) => {
        this.plugin.settings.summaryModelId = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u5168\u6587\u622A\u65AD\u5B57\u7B26\u6570\u4E0A\u9650").addText(
      (text) => text.setValue(String(this.plugin.settings.summaryMaxChars)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.summaryMaxChars = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.summaryMaxChars;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u6458\u8981\u6700\u5927\u8F93\u51FA token \u6570").addText(
      (text) => text.setValue(String(this.plugin.settings.summaryMaxTokens)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.summaryMaxTokens = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.summaryMaxTokens;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u6458\u8981\u751F\u6210\u63D0\u793A\u8BCD").addTextArea((text) => {
      text.inputEl.rows = 5;
      text.inputEl.style.width = "100%";
      text.setValue(this.plugin.settings.summaryPrompt).onChange(async (value) => {
        this.plugin.settings.summaryPrompt = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u6E05\u7A7A\u5DF2\u7F13\u5B58\u7684\u5168\u6587\u6458\u8981").setDesc(`\u5F53\u524D\u5DF2\u7F13\u5B58 ${Object.keys(this.plugin.settings.docSummaries || {}).length} \u7BC7\u6587\u6863\u7684\u6458\u8981`).addButton(
      (button) => button.setButtonText("\u6E05\u7A7A\u7F13\u5B58").onClick(async () => {
        this.plugin.settings.docSummaries = {};
        await this.plugin.saveSettings();
        this.display();
      })
    );
    containerEl.createEl("h4", { text: "\u5168\u6587\u76F4\u8BFB / RAG \u68C0\u7D22" });
    containerEl.createEl("p", {
      text: "\u8F83\u77ED PDF \u76F4\u63A5\u63D0\u4F9B\u5168\u6587\uFF1B\u8D85\u8FC7\u9608\u503C\u65F6\u9000\u56DE\u672C\u5730 BM25 \u68C0\u7D22\u3002\u68C0\u7D22\u4E0E\u6458\u8981\u4E92\u8865\uFF0C\u4E0D\u9700\u8981 embedding \u6A21\u578B\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian4.Setting(containerEl).setName("\u5168\u6587\u76F4\u8BFB\u7684\u5B57\u6570\u9608\u503C").setDesc("\u5168\u6587\u4E0D\u8D85\u8FC7\u6B64\u503C\u65F6\u76F4\u63A5\u4EA4\u7ED9\u6A21\u578B\u56DE\u7B54\uFF1B\u8D85\u8FC7\u65F6\u4F7F\u7528\u5173\u952E\u8BCD\u68C0\u7D22\u3002").addText(
      (text) => text.setValue(String(this.plugin.settings.ragFullTextThreshold)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.ragFullTextThreshold = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.ragFullTextThreshold;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u6253\u5F00 PDF \u5212\u8BCD\u5F39\u7A97\u65F6\u81EA\u52A8\u5EFA\u7ACB\u68C0\u7D22\u7D22\u5F15").setDesc("\u7D22\u5F15\u662F\u7EAF\u672C\u5730\u6587\u672C\u5207\u5757\uFF0C\u51E0\u4E4E\u4E0D\u8017\u65F6\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoRag).onChange(async (value) => {
        this.plugin.settings.autoRag = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u63D0\u95EE\u524D\u5148\u8BA9\u5FEB\u6A21\u578B\u601D\u8003\u68C0\u7D22\u89D2\u5EA6").setDesc("\u751F\u6210\u591A\u7EC4\u4E2D\u82F1\u53CC\u8BED\u68C0\u7D22\u8BCD\u540E\u878D\u5408\u6392\u5E8F\uFF0C\u4EE3\u4EF7\u662F\u6BCF\u6B21\u63D0\u95EE\u591A\u4E00\u6B21\u6A21\u578B\u8C03\u7528\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ragQueryTranslate).onChange(async (value) => {
        this.plugin.settings.ragQueryTranslate = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u68C0\u7D22\u89D2\u5EA6\u89C4\u5212\u63D0\u793A\u8BCD").addTextArea((text) => {
      text.inputEl.rows = 5;
      text.inputEl.style.width = "100%";
      text.setValue(this.plugin.settings.ragQueryPrompt).onChange(async (value) => {
        this.plugin.settings.ragQueryPrompt = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian4.Setting(containerEl).setName("\u6BCF\u6B21\u68C0\u7D22\u8FD4\u56DE\u7684\u7247\u6BB5\u6570(Top K)").addText(
      (text) => text.setValue(String(this.plugin.settings.ragTopK)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.ragTopK = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.ragTopK;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u5355\u5757\u6700\u5927\u5B57\u7B26\u6570").addText(
      (text) => text.setValue(String(this.plugin.settings.ragChunkSize)).onChange(async (value) => {
        const normalized = normalizeRagChunkSettings(
          Number(value.trim()),
          this.plugin.settings.ragChunkOverlap
        );
        this.plugin.settings.ragChunkSize = normalized.ragChunkSize;
        this.plugin.settings.ragChunkOverlap = normalized.ragChunkOverlap;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u5207\u5757\u91CD\u53E0\u5B57\u7B26\u6570").addText(
      (text) => text.setValue(String(this.plugin.settings.ragChunkOverlap)).onChange(async (value) => {
        const normalized = normalizeRagChunkSettings(
          this.plugin.settings.ragChunkSize,
          Number(value.trim())
        );
        this.plugin.settings.ragChunkSize = normalized.ragChunkSize;
        this.plugin.settings.ragChunkOverlap = normalized.ragChunkOverlap;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u6E05\u7A7A\u5DF2\u7F13\u5B58\u7684\u68C0\u7D22\u7D22\u5F15").setDesc(`\u5F53\u524D\u5DF2\u4E3A ${Object.keys(this.plugin.settings.docChunks || {}).length} \u7BC7\u6587\u6863\u5EFA\u7ACB\u8FC7\u7D22\u5F15`).addButton(
      (button) => button.setButtonText("\u6E05\u7A7A\u7F13\u5B58").onClick(async () => {
        this.plugin.settings.docChunks = {};
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
  renderAdvancedSection(containerEl) {
    containerEl.createEl("p", {
      text: "\u9ED8\u8BA4\u5FEB\u6377\u952E\uFF1ACtrl+Alt+Q \u65B0\u5F00\u5BF9\u8BDD\uFF1BCtrl+Q \u7EE7\u7EED\u4E0A\u6B21\u5BF9\u8BDD\u3002\u53EF\u5728 \u8BBE\u7F6E\u2192\u5FEB\u6377\u952E\u2192\u641C\u7D22\u201CPDF Chat\u201D\u4E2D\u4FEE\u6539\u3002\u5F39\u7A97\u652F\u6301\u62D6\u52A8\u3001\u7F29\u653E\u3001\u8FDE\u7EED\u8FFD\u95EE\u548C\u505C\u6B62\u751F\u6210\u3002",
      cls: "setting-item-description"
    });
    containerEl.createEl("h4", { text: "Codex \u6DF1\u5EA6\u591A\u8BBA\u6587\u5206\u6790" });
    containerEl.createEl("p", {
      text: "\u542F\u7528\u540E\uFF0C\u8BBA\u6587\u4E0A\u4E0B\u6587\u533A\u4F1A\u5141\u8BB8\u624B\u52A8\u89E6\u53D1 Codex CLI\u3002\u63D2\u4EF6\u53EA\u4F1A\u628A\u8BBA\u6587\u6587\u672C\u548C\u5F53\u524D\u95EE\u9898\u5199\u5165\u4E34\u65F6\u5206\u6790\u5305\uFF0C\u4E0D\u4F1A\u590D\u5236 data.json\u3001API key \u6216\u6A21\u578B endpoint\u3002",
      cls: "setting-item-description"
    });
    new import_obsidian4.Setting(containerEl).setName("\u542F\u7528 Codex CLI \u6DF1\u5EA6\u5206\u6790").setDesc("\u4EC5\u684C\u9762\u7AEF\u53EF\u7528\u3002Codex \u4F7F\u7528\u5B83\u81EA\u5DF1\u7684\u767B\u5F55/\u914D\u7F6E\uFF0C\u4E0D\u4F7F\u7528 PDF Chat \u7684 API key\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.codexDeepAnalysis.enabled).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.enabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Codex \u547D\u4EE4").setDesc("\u9ED8\u8BA4 codex\uFF1B\u5982\u679C\u4E0D\u5728 PATH \u4E2D\uFF0C\u53EF\u586B\u5199 codex \u53EF\u6267\u884C\u6587\u4EF6\u7684\u5B8C\u6574\u8DEF\u5F84\u3002").addText(
      (text) => text.setValue(this.plugin.settings.codexDeepAnalysis.command).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.command = value.trim() || DEFAULT_SETTINGS.codexDeepAnalysis.command;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Codex profile").setDesc("\u53EF\u9009\uFF1B\u5BF9\u5E94 codex exec --profile\u3002\u7559\u7A7A\u5219\u4F7F\u7528 Codex \u9ED8\u8BA4\u914D\u7F6E\u3002").addText(
      (text) => text.setValue(this.plugin.settings.codexDeepAnalysis.profile).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.profile = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Codex model").setDesc("\u53EF\u9009\uFF1B\u5BF9\u5E94 codex exec --model\u3002\u7559\u7A7A\u5219\u4F7F\u7528 Codex \u9ED8\u8BA4\u6A21\u578B\u3002").addText(
      (text) => text.setValue(this.plugin.settings.codexDeepAnalysis.model).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.model = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Codex \u8D85\u65F6\u6BEB\u79D2").setDesc("\u9ED8\u8BA4 600000\uFF0C\u5373 10 \u5206\u949F\uFF1B\u8D85\u65F6\u540E\u4F1A\u7EC8\u6B62 Codex \u8FDB\u7A0B\u3002").addText(
      (text) => text.setValue(String(this.plugin.settings.codexDeepAnalysis.timeoutMs)).onChange(async (value) => {
        const parsed = Number(value.trim());
        this.plugin.settings.codexDeepAnalysis.timeoutMs = Number.isFinite(parsed) && parsed >= 3e4 ? Math.floor(parsed) : DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u4FDD\u7559 Codex \u4E34\u65F6\u5206\u6790\u5305").setDesc("\u4EC5\u7528\u4E8E\u8C03\u8BD5\u3002\u5173\u95ED\u65F6\u4EFB\u52A1\u7ED3\u675F\u4F1A\u5220\u9664\u4E34\u65F6\u5305\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.codexDeepAnalysis.keepTempFiles).onChange(async (value) => {
        this.plugin.settings.codexDeepAnalysis.keepTempFiles = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h4", { text: "\u9605\u8BFB\u6A21\u5F0F\u9884\u8BBE" });
    containerEl.createEl("p", {
      text: "\u5F39\u7A97\u7684\u9605\u8BFB\u6A21\u5F0F\u4F1A\u5217\u51FA\u8FD9\u4E9B\u9884\u8BBE\uFF1B\u5207\u6362\u540E\u66FF\u6362\u7CFB\u7EDF\u63D0\u793A\u8BCD\uFF0C\u9009\u533A\u539F\u6587\u4ECD\u4F1A\u81EA\u52A8\u9644\u52A0\u3002",
      cls: "setting-item-description"
    });
    this.plugin.settings.promptPresets.forEach((preset, index) => {
      const nameSetting = new import_obsidian4.Setting(containerEl).setName(`\u9884\u8BBE ${index + 1}`);
      nameSetting.addText(
        (text) => text.setPlaceholder("\u540D\u79F0").setValue(preset.name).onChange(async (value) => {
          preset.name = value;
          await this.plugin.saveSettings();
        })
      );
      nameSetting.addExtraButton((button) => {
        labelExtraButton(button, "\u5220\u9664\u8FD9\u4E2A\u9884\u8BBE");
        button.setIcon("trash").onClick(async () => {
          this.plugin.settings.promptPresets.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      });
      new import_obsidian4.Setting(containerEl).addTextArea((text) => {
        text.inputEl.rows = 4;
        text.inputEl.style.width = "100%";
        text.setPlaceholder("\u8FD9\u5957\u6A21\u5F0F\u7684\u7CFB\u7EDF\u63D0\u793A\u8BCD/\u6307\u4EE4").setValue(preset.prompt).onChange(async (value) => {
          preset.prompt = value;
          await this.plugin.saveSettings();
        });
      });
    });
    new import_obsidian4.Setting(containerEl).addButton(
      (button) => button.setButtonText("+ \u6DFB\u52A0\u9884\u8BBE").setCta().onClick(async () => {
        this.plugin.settings.promptPresets.push({
          id: "preset-" + Date.now(),
          name: "\u65B0\u9884\u8BBE",
          prompt: ""
        });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};

// src/main.ts
var PDFChatPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "_saveQueue", Promise.resolve());
    __publicField(this, "conversationStore");
    __publicField(this, "llmTransport");
    __publicField(this, "paperContextService");
    __publicField(this, "translationService");
    __publicField(this, "actionRegistry");
    __publicField(this, "modalServices");
    __publicField(this, "quickTranslateMarker");
  }
  async onload() {
    var _a;
    this._saveQueue = Promise.resolve();
    await this.loadSettings();
    this.conversationStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    this.llmTransport = new OpenAICompatibleTransport(
      () => this.settings,
      (id) => this.getModelProfile(id)
    );
    this.paperContextService = new PaperContextService(
      this.app,
      () => this.settings,
      () => this.saveSettings(),
      this.llmTransport,
      (id) => this.getModelProfile(id)
    );
    this.translationService = new TranslationService(this.llmTransport);
    this.actionRegistry = createResearchActionRegistry();
    this.modalServices = createPDFChatModalServices(this, {
      conversations: {
        getKey: (file, selectedText, kind) => getConversationKey(file, selectedText, kind),
        get: (key) => this.conversationStore.get(key),
        save: (key, messages) => this.conversationStore.save(key, messages),
        clear: (key) => this.conversationStore.clear(key)
      },
      papers: {
        getOrCreateDocSummary: (file, forceRefresh) => this.paperContextService.getOrCreateDocSummary(file, forceRefresh),
        getOrCreateDocChunks: (file, forceRefresh) => this.paperContextService.getOrCreateDocChunks(file, forceRefresh),
        extractPages: (file) => this.paperContextService.extractPages(file),
        extractFullText: (file) => this.paperContextService.extractFullText(file),
        planRagQueries: (question) => this.paperContextService.planRagQueries(question),
        retrieveContext: (chunks, queries, topK) => this.paperContextService.retrieveContext(chunks, queries, topK)
      },
      llm: { chat: (request) => this.llmTransport.chat(request) },
      models: {
        get: (id) => this.getModelProfile(id),
        resolveTranslateId: () => this.resolveTranslateModelId(),
        resolveContinueId: () => this.resolveContinueModelId()
      },
      actions: this.actionRegistry,
      translations: this.translationService
    });
    this.addSettingTab(new PDFChatSettingTab(this.app, this));
    this.addCommand({
      id: "ask-about-selection",
      name: "\u9488\u5BF9\u9009\u4E2D\u5185\u5BB9\u63D0\u95EE,\u65B0\u5F00\u5BF9\u8BDD (PDF Chat)",
      hotkeys: [{ modifiers: ["Mod", "Alt"], key: "Q" }],
      callback: () => this.openChatModal(true)
    });
    this.addCommand({
      id: "continue-conversation",
      name: "\u9488\u5BF9\u9009\u4E2D\u5185\u5BB9\u63D0\u95EE,\u7EE7\u7EED\u4E0A\u6B21\u5BF9\u8BDD (PDF Chat)",
      hotkeys: [{ modifiers: ["Mod"], key: "Q" }],
      callback: () => this.openChatModal(false)
    });
    this.quickTranslateMarker = new QuickTranslateMarker({
      isEnabled: () => this.settings.quickTranslateMarkerEnabled,
      getActivePdfFile: () => getActivePdfFile(this.app),
      openModal: (request) => this.openQuickTranslateModal(request)
    });
    if (typeof document !== "undefined") this.quickTranslateMarker.attach(document);
    const workspace = (_a = this.app) == null ? void 0 : _a.workspace;
    workspace == null ? void 0 : workspace.onLayoutReady(() => {
      const eventRef = workspace.on("window-open", (workspaceWindow) => {
        var _a2;
        if (workspaceWindow == null ? void 0 : workspaceWindow.doc) (_a2 = this.quickTranslateMarker) == null ? void 0 : _a2.attach(workspaceWindow.doc);
      });
      this.registerEvent(eventRef);
    });
  }
  onunload() {
    var _a;
    (_a = this.quickTranslateMarker) == null ? void 0 : _a.destroy();
    this.quickTranslateMarker = void 0;
  }
  // startFresh=true: 新开一份对话,不加载这个 PDF(或选区)之前保存的记录;
  // startFresh=false: 加载并接续之前保存的记录(如果有)。两个快捷键共用同一段取选中文字的逻辑。
  openChatModal(startFresh) {
    const win = activeWindow || window;
    const sel = win.getSelection ? win.getSelection() : null;
    const raw = sel ? sel.toString() : "";
    const text = cleanSelectionText(raw || "");
    if (!text) {
      new import_obsidian5.Notice("\u6CA1\u6709\u68C0\u6D4B\u5230\u9009\u4E2D\u7684\u6587\u5B57,\u8BF7\u5148\u5212\u9009\u4E00\u6BB5\u5185\u5BB9\u518D\u6309\u5FEB\u6377\u952E");
      return;
    }
    const pdfFile = getActivePdfFile(this.app);
    const paperContext = this.paperContextService.createContext(
      pdfFile,
      text,
      getConversationKey(pdfFile, text)
    );
    new PDFChatModal(this.app, this, paperContext, null, startFresh, this.modalServices).open();
  }
  openQuickTranslateModal(request) {
    const paperContext = this.paperContextService.createContext(
      request.file,
      request.selectedText,
      getConversationKey(request.file, request.selectedText)
    );
    new PDFChatModal(
      this.app,
      this,
      paperContext,
      null,
      request.startFresh,
      this.modalServices,
      request.autoTranslateOnOpen
    ).open();
  }
  async loadSettings() {
    const { settings, needsSave } = migrateSettings(await this.loadData());
    this.settings = settings;
    if (needsSave) await this.saveSettings();
  }
  async saveSettings() {
    return enqueueSettingsSave(this);
  }
  getConversationKey(pdfFile, contextText, kind = "chat") {
    return getConversationKey(pdfFile, contextText, kind);
  }
  getConversation(key) {
    if (this.conversationStore) return this.conversationStore.get(key);
    const histories = this.settings.conversationHistories || {};
    const entry = histories[key];
    return entry ? normalizeConversationMessages(entry.messages) : [];
  }
  async saveConversation(key, messages) {
    if (this.conversationStore) return this.conversationStore.save(key, messages);
    const fallbackStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    return fallbackStore.save(key, messages);
  }
  async clearConversation(key) {
    if (this.conversationStore) return this.conversationStore.clear(key);
    const fallbackStore = new ConversationStore(
      () => this.settings,
      () => this.saveSettings()
    );
    return fallbackStore.clear(key);
  }
  getModelProfile(id) {
    return this.settings.models.find((m) => m.id === id) || this.settings.models[0];
  }
  async generateDocSummary(file) {
    return this.paperContextService.generateDocSummary(file);
  }
  resolveTranslateModelId() {
    return resolveTranslateModelId(this.settings);
  }
  resolveContinueModelId() {
    return resolveContinueModelId(this.settings);
  }
  async getOrCreateDocSummary(file, forceRefresh) {
    return this.paperContextService.getOrCreateDocSummary(file, forceRefresh);
  }
  async generateDocChunks(file) {
    return this.paperContextService.generateDocChunks(file);
  }
  async planRagQueries(question) {
    return this.paperContextService.planRagQueries(question);
  }
  async getOrCreateDocChunks(file, forceRefresh) {
    return this.paperContextService.getOrCreateDocChunks(file, forceRefresh);
  }
  async chat(messages, onChunk, signal, modelProfile, options = {}) {
    return this.llmTransport.chat({
      messages,
      onChunk,
      signal,
      modelProfile,
      stream: options.stream,
      maxTokensOverride: options.maxTokensOverride,
      temperatureOverride: options.temperatureOverride
    });
  }
  async chatOnce(messages, signal, profile, maxTokensOverride) {
    return this.llmTransport.chatOnce(messages, signal, profile, maxTokensOverride);
  }
  async chatStream(messages, onChunk, signal, profile) {
    return this.llmTransport.chatStream(messages, onChunk, signal, profile);
  }
};
