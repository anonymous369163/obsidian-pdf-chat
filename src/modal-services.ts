// @ts-nocheck
import { createCompatibilityActionRegistry } from "./actions";
import { DEFAULT_SETTINGS } from "./default-settings";
import { bm25RetrieveMulti, expandWithNeighbors, extractPdfFullText } from "./paper-context";

export function createPDFChatModalServices(plugin, overrides = {}) {
  const compatibility = {
    conversations: {
      getKey: (file, selectedText) => plugin.getConversationKey(file, selectedText),
      get: (key) => plugin.getConversation(key),
      save: (key, messages) => plugin.saveConversation(key, messages),
      clear: (key) => plugin.clearConversation(key),
    },
    papers: {
      getOrCreateDocSummary: (file, forceRefresh) => plugin.getOrCreateDocSummary(file, forceRefresh),
      getOrCreateDocChunks: (file, forceRefresh) => plugin.getOrCreateDocChunks(file, forceRefresh),
      extractFullText: (file) =>
        plugin.paperContextService
          ? plugin.paperContextService.extractFullText(file)
          : extractPdfFullText(plugin.app || {}, file),
      planRagQueries: (question) => plugin.planRagQueries(question),
      retrieveContext: (chunks, queries, topK) =>
        expandWithNeighbors(chunks, bm25RetrieveMulti(chunks, queries, topK)),
    },
    llm: {
      chat: (request) =>
        plugin.chat(request.messages, request.onChunk, request.signal, request.modelProfile),
    },
    models: {
      get: (id) => plugin.getModelProfile(id),
    },
    actions:
      plugin.actionRegistry || createCompatibilityActionRegistry(DEFAULT_SETTINGS.translatePrompt),
  };
  return {
    ...compatibility,
    ...overrides,
    conversations: { ...compatibility.conversations, ...(overrides.conversations || {}) },
    papers: { ...compatibility.papers, ...(overrides.papers || {}) },
    llm: { ...compatibility.llm, ...(overrides.llm || {}) },
    models: { ...compatibility.models, ...(overrides.models || {}) },
  };
}
