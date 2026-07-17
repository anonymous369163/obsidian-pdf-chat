export type SettingsSectionTitle = "模型" | "聊天" | "翻译" | "论文上下文" | "高级";

export function createSettingsSection(
  parent: HTMLElement,
  title: SettingsSectionTitle
): HTMLElement {
  const section = parent.createEl("section", {
    cls: "pdf-chat-settings-section",
    attr: { "aria-labelledby": `pdf-chat-settings-${title}` },
  });
  const compatibleSection = section as HTMLElement & {
    createEl?: HTMLElement["createEl"];
  };
  if (typeof compatibleSection.createEl !== "function") return parent;
  section.createEl("h3", {
    text: title,
    attr: { id: `pdf-chat-settings-${title}` },
  });
  return section;
}
