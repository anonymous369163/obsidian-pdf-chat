import type { ModelProfile, PDFChatSettings } from "./types";

type ModelRoutingSettings = Pick<
  PDFChatSettings,
  "models" | "activeModelId" | "translateModelId" | "continueModelId"
>;

function validConfiguredId(models: ModelProfile[], configuredId: string): string | null {
  if (!configuredId) return null;
  return models.some((model) => model.id === configuredId) ? configuredId : null;
}

function keywordModelId(models: ModelProfile[], keyword: string): string | null {
  const normalizedKeyword = keyword.toLocaleLowerCase();
  const match = models.find((model) =>
    [model.id, model.model, model.name].some((value) =>
      String(value ?? "").toLocaleLowerCase().includes(normalizedKeyword)
    )
  );
  return match?.id ?? null;
}

function activeOrFirstId(settings: ModelRoutingSettings): string {
  return validConfiguredId(settings.models, settings.activeModelId) ?? settings.models[0]?.id ?? "";
}

export function resolveTranslateModelId(settings: ModelRoutingSettings): string {
  return (
    validConfiguredId(settings.models, settings.translateModelId) ??
    keywordModelId(settings.models, "deepseek") ??
    activeOrFirstId(settings)
  );
}

export function resolveContinueModelId(settings: ModelRoutingSettings): string {
  return (
    validConfiguredId(settings.models, settings.continueModelId) ??
    keywordModelId(settings.models, "glm") ??
    activeOrFirstId(settings)
  );
}
