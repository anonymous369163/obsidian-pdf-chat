import { normalizeConversationHistories } from "./conversation";
import { DEFAULT_SETTINGS } from "./default-settings";

export type PDFChatSettings = typeof DEFAULT_SETTINGS & Record<string, unknown>;

export interface SettingsMigrationResult {
  settings: PDFChatSettings;
  needsSave: boolean;
}

export function migrateSettings(savedValue: unknown, now: () => number = Date.now): SettingsMigrationResult {
  const saved =
    savedValue && typeof savedValue === "object" && !Array.isArray(savedValue)
      ? (savedValue as Record<string, any>)
      : null;
  const settings = Object.assign({}, DEFAULT_SETTINGS, saved) as Record<string, any>;

  settings.models =
    saved && Array.isArray(saved.models) && saved.models.length
      ? saved.models.map((model: Record<string, unknown>) => ({ ...model }))
      : DEFAULT_SETTINGS.models.map((model) => ({ ...model }));
  settings.promptPresets =
    saved && Array.isArray(saved.promptPresets) && saved.promptPresets.length
      ? saved.promptPresets.map((preset: Record<string, unknown>) => ({ ...preset }))
      : DEFAULT_SETTINGS.promptPresets.map((preset) => ({ ...preset }));
  settings.docSummaries =
    saved && saved.docSummaries && typeof saved.docSummaries === "object" ? { ...saved.docSummaries } : {};
  settings.docChunks = saved && saved.docChunks && typeof saved.docChunks === "object" ? { ...saved.docChunks } : {};
  settings.conversationHistories = normalizeConversationHistories(saved && saved.conversationHistories);

  let needsSave = false;
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
  if (!settings.models.find((model: Record<string, unknown>) => model.id === settings.activeModelId)) {
    settings.activeModelId = settings.models[0].id;
    needsSave = true;
  }

  if (settings.endpoint !== undefined || settings.apiKey !== undefined || settings.model !== undefined) {
    delete settings.endpoint;
    delete settings.apiKey;
    delete settings.model;
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
