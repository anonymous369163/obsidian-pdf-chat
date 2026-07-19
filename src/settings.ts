import {
  normalizeConversationHistories,
  normalizeConversationMessages,
  normalizeConversationSessions,
  stableConversationHash,
} from "./conversation";
import { DEFAULT_SETTINGS, LEGACY_0_4_0_TRANSLATE_PROMPT } from "./default-settings";
import type {
  CodexDeepAnalysisSettings,
  CodexInputMode,
  CodexOutputMode,
  CodexReasoningEffort,
  CodexVerbosity,
  ConversationSession,
  PDFChatSettings,
  TranslationSettings,
} from "./types";

interface LegacySettings extends Omit<Partial<PDFChatSettings>, "codexDeepAnalysis" | "translation"> {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  translatePrompt?: string;
  translateChunkMaxChars?: number;
  codexDeepAnalysis?: Partial<CodexDeepAnalysisSettings>;
  translation?: Partial<TranslationSettings>;
}

function normalizePromptHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const text = item.trim();
    if (!text || result[result.length - 1] === text) continue;
    result.push(text);
  }
  return result.slice(-100);
}

function normalizeActiveSessionIds(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized: Record<string, string> = {};
  for (const [key, id] of Object.entries(value)) {
    if (typeof id === "string" && key.trim() && id.trim()) normalized[key] = id.trim();
  }
  return normalized;
}

function normalizeReasoningEffort(value: unknown): CodexReasoningEffort {
  return value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh"
    ? value
    : DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort;
}

function normalizeVerbosity(value: unknown): CodexVerbosity {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : DEFAULT_SETTINGS.codexDeepAnalysis.verbosity;
}

export function normalizeCodexInputMode(value: unknown): CodexInputMode {
  if (value === "debug-full" || value === "text-fallback") return "debug-full";
  return value === "pdf-only" ? "pdf-only" : DEFAULT_SETTINGS.codexDeepAnalysis.inputMode;
}

export function normalizeCodexOutputMode(value: unknown): CodexOutputMode {
  return value === "json-schema" ? "json-schema" : DEFAULT_SETTINGS.codexDeepAnalysis.outputMode;
}

const LEGACY_CODEX_TIMEOUT_MS = 600000;

function legacySessionFromHistory(key: string, history: { updatedAt?: number; messages?: unknown }): ConversationSession | null {
  const messages = normalizeConversationMessages(history.messages);
  if (!messages.length) return null;
  const id = `legacy-${stableConversationHash(key)}`;
  const timestamp =
    typeof history.updatedAt === "number" && Number.isFinite(history.updatedAt) ? history.updatedAt : 0;
  const session: ConversationSession = {
    version: 3,
    id,
    conversationKey: key,
    title: key.replace(/^pdf:/, ""),
    mode: "chat",
    messages,
    referencedPdfPaths: [],
    includeCurrentPdfInCodex: true,
    pinned: false,
    tags: [],
    sourceStatus: "available",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return normalizeConversationSessions({ [id]: session })[id] || null;
}

export interface SettingsMigrationResult {
  settings: PDFChatSettings;
  needsSave: boolean;
}

export interface NormalizedRagChunkSettings {
  ragChunkSize: number;
  ragChunkOverlap: number;
  changed: boolean;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizeContextBudget(value: unknown): {
  contextBudget: PDFChatSettings["contextBudget"];
  changed: boolean;
} {
  const candidate =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<PDFChatSettings["contextBudget"]>)
      : {};
  const contextBudget = {
    maxInputChars: normalizePositiveInteger(
      candidate.maxInputChars,
      DEFAULT_SETTINGS.contextBudget.maxInputChars
    ),
    minRecentTurns: normalizePositiveInteger(
      candidate.minRecentTurns,
      DEFAULT_SETTINGS.contextBudget.minRecentTurns
    ),
    maxSelectionChars: normalizePositiveInteger(
      candidate.maxSelectionChars,
      DEFAULT_SETTINGS.contextBudget.maxSelectionChars
    ),
  };
  return {
    contextBudget,
    changed:
      candidate.maxInputChars !== contextBudget.maxInputChars ||
      candidate.minRecentTurns !== contextBudget.minRecentTurns ||
      candidate.maxSelectionChars !== contextBudget.maxSelectionChars,
  };
}

function normalizePaperCacheQuota(value: unknown): {
  quota: PDFChatSettings["paperCacheQuota"];
  changed: boolean;
} {
  const candidate =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<PDFChatSettings["paperCacheQuota"]>)
      : {};
  const quota = {
    maxEntries: normalizePositiveInteger(
      candidate.maxEntries,
      DEFAULT_SETTINGS.paperCacheQuota.maxEntries
    ),
    maxBytes: normalizePositiveInteger(
      candidate.maxBytes,
      DEFAULT_SETTINGS.paperCacheQuota.maxBytes
    ),
  };
  return {
    quota,
    changed: candidate.maxEntries !== quota.maxEntries || candidate.maxBytes !== quota.maxBytes,
  };
}

export function normalizeRagChunkSettings(
  chunkSize: unknown,
  chunkOverlap: unknown
): NormalizedRagChunkSettings {
  const ragChunkSize =
    typeof chunkSize === "number" && Number.isInteger(chunkSize) && chunkSize > 0
      ? chunkSize
      : DEFAULT_SETTINGS.ragChunkSize;
  const fallbackOverlap = Math.min(DEFAULT_SETTINGS.ragChunkOverlap, ragChunkSize - 1);
  const ragChunkOverlap =
    typeof chunkOverlap === "number" &&
    Number.isInteger(chunkOverlap) &&
    chunkOverlap >= 0 &&
    chunkOverlap < ragChunkSize
      ? chunkOverlap
      : fallbackOverlap;
  return {
    ragChunkSize,
    ragChunkOverlap,
    changed: chunkSize !== ragChunkSize || chunkOverlap !== ragChunkOverlap,
  };
}

export function migrateSettings(savedValue: unknown, now: () => number = Date.now): SettingsMigrationResult {
  const saved =
    savedValue && typeof savedValue === "object" && !Array.isArray(savedValue)
      ? (savedValue as LegacySettings)
      : null;
  const settings = Object.assign({}, DEFAULT_SETTINGS, saved) as PDFChatSettings & LegacySettings;
  let needsSave = false;

  settings.readerDataVersion = saved?.readerDataVersion === 1 ? 1 : 0;
  if (saved && saved.readerDataVersion !== settings.readerDataVersion) needsSave = true;

  settings.models =
    saved && Array.isArray(saved.models) && saved.models.length
      ? saved.models.map((model) => ({ ...model }))
      : DEFAULT_SETTINGS.models.map((model) => ({ ...model }));
  settings.promptPresets =
    saved && Array.isArray(saved.promptPresets) && saved.promptPresets.length
      ? saved.promptPresets.map((preset) => ({ ...preset }))
      : DEFAULT_SETTINGS.promptPresets.map((preset) => ({ ...preset }));
  settings.docSummaries =
    saved && saved.docSummaries && typeof saved.docSummaries === "object" ? { ...saved.docSummaries } : {};
  settings.docChunks = saved && saved.docChunks && typeof saved.docChunks === "object" ? { ...saved.docChunks } : {};
  settings.conversationHistories = normalizeConversationHistories(saved && saved.conversationHistories);
  settings.conversationSessions = normalizeConversationSessions(saved && saved.conversationSessions);
  settings.activeConversationSessionIds = normalizeActiveSessionIds(saved && saved.activeConversationSessionIds);
  settings.promptHistory = normalizePromptHistory(saved && saved.promptHistory);
  const normalizedContextBudget = normalizeContextBudget(saved?.contextBudget);
  settings.contextBudget = normalizedContextBudget.contextBudget;
  if (saved && normalizedContextBudget.changed) needsSave = true;
  const normalizedPaperCacheQuota = normalizePaperCacheQuota(saved?.paperCacheQuota);
  settings.paperCacheQuota = normalizedPaperCacheQuota.quota;
  if (saved && normalizedPaperCacheQuota.changed) needsSave = true;
  for (const session of Object.values(settings.conversationSessions)) {
    if (session.pendingTurn?.status !== "running") continue;
    session.pendingTurn = {
      ...session.pendingTurn,
      status: "interrupted",
      progress: session.pendingTurn.progress || "Obsidian 或 PDF Chat 在任务完成前退出",
    };
    needsSave = true;
  }
  for (const [key, history] of Object.entries(settings.conversationHistories)) {
    const hasSession = Object.values(settings.conversationSessions).some((session) => session.conversationKey === key);
    if (hasSession) continue;
    const session = legacySessionFromHistory(key, history);
    if (!session) continue;
    settings.conversationSessions[session.id] = session;
    settings.activeConversationSessionIds[key] = session.id;
    needsSave = true;
  }

  const normalizedRag = normalizeRagChunkSettings(settings.ragChunkSize, settings.ragChunkOverlap);
  settings.ragChunkSize = normalizedRag.ragChunkSize;
  settings.ragChunkOverlap = normalizedRag.ragChunkOverlap;
  if (normalizedRag.changed) needsSave = true;
  const hasTranslationObject = Boolean(
    saved && saved.translation && typeof saved.translation === "object" && !Array.isArray(saved.translation)
  );
  const nestedChunkChars = saved?.translation?.chunkChars;
  const validNestedChunkChars =
    typeof nestedChunkChars === "number" && Number.isInteger(nestedChunkChars) && nestedChunkChars > 0
      ? nestedChunkChars
      : null;
  const legacyChunkChars = saved?.translateChunkMaxChars;
  const validLegacyChunkChars =
    typeof legacyChunkChars === "number" && Number.isInteger(legacyChunkChars) && legacyChunkChars > 0
      ? legacyChunkChars
      : null;
  if (nestedChunkChars !== undefined && validNestedChunkChars === null) needsSave = true;
  if (hasTranslationObject) {
    settings.translation = {
      ...DEFAULT_SETTINGS.translation,
      ...saved!.translation,
      chunkChars:
        validNestedChunkChars ?? validLegacyChunkChars ?? DEFAULT_SETTINGS.translation.chunkChars,
    };
  } else {
    const legacyInstruction = typeof saved?.translatePrompt === "string" ? saved.translatePrompt : "";
    settings.translation = {
      ...DEFAULT_SETTINGS.translation,
      additionalInstruction:
        legacyInstruction.trim() && legacyInstruction !== LEGACY_0_4_0_TRANSLATE_PROMPT
          ? legacyInstruction
          : "",
      chunkChars: validLegacyChunkChars ?? DEFAULT_SETTINGS.translation.chunkChars,
    };
    needsSave = true;
  }

  const savedCodex =
    saved && saved.codexDeepAnalysis && typeof saved.codexDeepAnalysis === "object" && !Array.isArray(saved.codexDeepAnalysis)
      ? saved.codexDeepAnalysis
      : {};
  const savedCodexTimeout =
    typeof savedCodex.timeoutMs === "number" &&
    Number.isFinite(savedCodex.timeoutMs) &&
    savedCodex.timeoutMs >= 30000
      ? Math.floor(savedCodex.timeoutMs)
      : null;
  const normalizedCodexTimeout =
    savedCodexTimeout === null || savedCodexTimeout === LEGACY_CODEX_TIMEOUT_MS
      ? DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs
      : savedCodexTimeout;
  if (savedCodexTimeout !== normalizedCodexTimeout) needsSave = true;

  settings.codexDeepAnalysis = {
    ...DEFAULT_SETTINGS.codexDeepAnalysis,
    ...savedCodex,
    enabled: savedCodex.enabled === true,
    command:
      typeof savedCodex.command === "string" && savedCodex.command.trim()
        ? savedCodex.command.trim()
        : DEFAULT_SETTINGS.codexDeepAnalysis.command,
    profile: typeof savedCodex.profile === "string" ? savedCodex.profile.trim() : "",
    model:
      typeof savedCodex.model === "string" && savedCodex.model.trim()
        ? savedCodex.model.trim()
        : DEFAULT_SETTINGS.codexDeepAnalysis.model,
    reasoningEffort: normalizeReasoningEffort(savedCodex.reasoningEffort),
    verbosity: normalizeVerbosity(savedCodex.verbosity),
    inputMode: normalizeCodexInputMode(savedCodex.inputMode),
    outputMode: normalizeCodexOutputMode(savedCodex.outputMode),
    modelPresets:
      Array.isArray(savedCodex.modelPresets) && savedCodex.modelPresets.length
        ? savedCodex.modelPresets
            .filter(
              (preset): preset is { model: string; reasoningEffort: CodexReasoningEffort; label: string } =>
                !!preset &&
                typeof preset === "object" &&
                typeof preset.model === "string" &&
                !!preset.model.trim()
            )
            .map((preset) => ({
              model: preset.model.trim(),
              reasoningEffort: normalizeReasoningEffort(preset.reasoningEffort),
              label:
                typeof preset.label === "string" && preset.label.trim()
                  ? preset.label.trim()
                  : `${preset.model.trim()} · ${normalizeReasoningEffort(preset.reasoningEffort)}`,
            }))
        : DEFAULT_SETTINGS.codexDeepAnalysis.modelPresets.map((preset) => ({ ...preset })),
    timeoutMs: normalizedCodexTimeout,
    keepTempFiles: savedCodex.keepTempFiles === true,
    includeSelectionContext:
      typeof savedCodex.includeSelectionContext === "boolean"
        ? savedCodex.includeSelectionContext
        : DEFAULT_SETTINGS.codexDeepAnalysis.includeSelectionContext,
  };
  if (saved && (saved.endpoint || saved.apiKey || saved.model) && !(saved.models && saved.models.length)) {
    const migrated = {
      id: "migrated-" + now(),
      name: "迁移自旧设置",
      endpoint: saved.endpoint || DEFAULT_SETTINGS.models[0].endpoint,
      apiKey: saved.apiKey || DEFAULT_SETTINGS.models[0].apiKey,
      model: saved.model || DEFAULT_SETTINGS.models[0].model,
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

  if (settings.endpoint !== undefined || settings.apiKey !== undefined || settings.model !== undefined) {
    delete settings.endpoint;
    delete settings.apiKey;
    delete settings.model;
    needsSave = true;
  }
  if (settings.translatePrompt !== undefined) {
    delete settings.translatePrompt;
    needsSave = true;
  }
  if (settings.translateChunkMaxChars !== undefined) {
    delete settings.translateChunkMaxChars;
    needsSave = true;
  }

  return { settings: settings as PDFChatSettings, needsSave };
}

export interface SaveQueueOwner {
  _saveQueue?: Promise<void>;
  settings: unknown;
  saveData(settings: unknown): Promise<void>;
}

export function enqueueSettingsSave(owner: SaveQueueOwner): Promise<void> {
  const previousSave = owner._saveQueue || Promise.resolve();
  const nextSave = previousSave.catch(() => undefined).then(() => owner.saveData(owner.settings));
  owner._saveQueue = nextSave;
  return nextSave;
}
