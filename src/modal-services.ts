import { createResearchActionRegistry } from "./actions";
import { bm25RetrieveMulti, expandWithNeighbors, extractPdfFullText, extractPdfPages } from "./paper-context";
import { TranslationService } from "./translation";
import type {
  LlmOperations,
  PDFChatModalServiceOverrides,
  PDFChatModalServices,
  PDFChatPluginApi,
} from "./types";

export function createPDFChatModalServices(
  plugin: PDFChatPluginApi,
  overrides: PDFChatModalServiceOverrides = {}
): PDFChatModalServices {
  const llm: LlmOperations = {
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
          temperatureOverride: request.temperatureOverride,
        }
      );
    },
  };
  const compatibility: PDFChatModalServices = {
    conversations: {
      getKey: (file, selectedText, kind) => plugin.getConversationKey(file, selectedText, kind),
      get: (key) => plugin.getConversation(key),
      save: (key, messages) => plugin.saveConversation(key, messages),
      clear: (key) => plugin.clearConversation(key),
    },
    papers: {
      getOrCreateDocSummary: (file, forceRefresh) => plugin.getOrCreateDocSummary(file, forceRefresh),
      getOrCreateDocChunks: (file, forceRefresh) => plugin.getOrCreateDocChunks(file, forceRefresh),
      extractPages: (file) =>
        plugin.paperContextService
          ? plugin.paperContextService.extractPages(file)
          : extractPdfPages(plugin.app || {}, file),
      extractFullText: (file) =>
        plugin.paperContextService
          ? plugin.paperContextService.extractFullText(file)
          : extractPdfFullText(plugin.app || {}, file),
      planRagQueries: (question) => plugin.planRagQueries(question),
      retrieveContext: (chunks, queries, topK) =>
        expandWithNeighbors(chunks, bm25RetrieveMulti(chunks, queries, topK)),
    },
    llm,
    models: {
      get: (id) => plugin.getModelProfile(id),
      resolveTranslateId: () => plugin.resolveTranslateModelId(),
      resolveContinueId: () => plugin.resolveContinueModelId(),
    },
    actions: plugin.actionRegistry || createResearchActionRegistry(),
    translations: plugin.translationService || new TranslationService(llm),
    codex: plugin.codexSessionManager,
  };
  return {
    ...compatibility,
    ...overrides,
    conversations: { ...compatibility.conversations, ...(overrides.conversations || {}) },
    papers: { ...compatibility.papers, ...(overrides.papers || {}) },
    llm: { ...compatibility.llm, ...(overrides.llm || {}) },
    models: { ...compatibility.models, ...(overrides.models || {}) },
    actions: overrides.actions || compatibility.actions,
    translations: {
      translate: (request) =>
        overrides.translations?.translate
          ? overrides.translations.translate(request)
          : compatibility.translations.translate(request),
    },
    codex: overrides.codex || compatibility.codex,
  };
}
