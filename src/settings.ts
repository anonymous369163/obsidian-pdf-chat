import { normalizeConversationHistories } from "./conversation";
import { DEFAULT_SETTINGS, LEGACY_0_4_0_TRANSLATE_PROMPT } from "./default-settings";
import type { PDFChatSettings, TranslationSettings } from "./types";

interface LegacySettings extends Omit<Partial<PDFChatSettings>, "translation"> {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  translatePrompt?: string;
  translateChunkMaxChars?: number;
  translation?: Partial<TranslationSettings>;
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

  let needsSave = false;
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
