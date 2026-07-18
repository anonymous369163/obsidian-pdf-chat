import { Notice, PluginSettingTab, Setting, type App } from "obsidian";
import { DEFAULT_SETTINGS } from "./default-settings";
import { normalizeRagChunkSettings } from "./settings";
import { createSettingsSection } from "./settings-ui";
import type { PDFChatPluginApi } from "./types";

function labelExtraButton(button: { extraSettingsEl?: HTMLElement }, label: string): void {
  if (!button.extraSettingsEl) return;
  button.extraSettingsEl.setAttr("aria-label", label);
}

export class PDFChatSettingTab extends PluginSettingTab {
  private readonly plugin: PDFChatPluginApi;

  constructor(app: App, plugin: PDFChatPluginApi) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PDF Chat 设置" });
    this.renderModelSection(createSettingsSection(containerEl, "模型"));
    this.renderChatSection(createSettingsSection(containerEl, "聊天"));
    this.renderTranslationSection(createSettingsSection(containerEl, "翻译"));
    this.renderPaperContextSection(createSettingsSection(containerEl, "论文上下文"));
    this.renderAdvancedSection(createSettingsSection(containerEl, "高级"));
  }

  private renderModelSection(containerEl: HTMLElement): void {
    containerEl.createEl("p", {
      text:
        "日常只需要维护主要 API 模型；多模型配置仍然保留在下方高级折叠区。",
      cls: "setting-item-description",
    });

    const renderModelConfig = (
      targetEl: HTMLElement,
      model: PDFChatPluginApi["settings"]["models"][number],
      index: number
    ) => {
      const isActive = model.id === this.plugin.settings.activeModelId;
      const header = new Setting(targetEl).setName(`模型 ${index + 1}${isActive ? " · 默认" : ""}`);
      header.addText((text) =>
        text
          .setPlaceholder("名称")
          .setValue(model.name)
          .onChange(async (value) => {
            model.name = value;
            await this.plugin.saveSettings();
          })
      );
      if (!isActive) {
        header.addExtraButton((button) => {
          labelExtraButton(button, "设为默认");
          button
            .setIcon("star")
            .onClick(async () => {
              this.plugin.settings.activeModelId = model.id;
              await this.plugin.saveSettings();
              this.display();
            });
        });
      }
      header.addExtraButton((button) => {
        labelExtraButton(button, "删除这个模型");
        button
          .setIcon("trash")
          .onClick(async () => {
            if (this.plugin.settings.models.length <= 1) {
              new Notice("至少要保留一个模型配置");
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

      new Setting(targetEl).setName("Endpoint").addText((text) =>
        text
          .setPlaceholder("OpenAI 兼容的 chat/completions 接口地址")
          .setValue(model.endpoint)
          .onChange(async (value) => {
            model.endpoint = value.trim();
            await this.plugin.saveSettings();
          })
      );
      new Setting(targetEl).setName("API Key").addText((text) => {
        text.inputEl.type = "password";
        text.setValue(model.apiKey).onChange(async (value) => {
          model.apiKey = value.trim();
          await this.plugin.saveSettings();
        });
      });
      new Setting(targetEl).setName("模型名(model 字段)").addText((text) =>
        text.setValue(model.model).onChange(async (value) => {
          model.model = value.trim();
          await this.plugin.saveSettings();
        })
      );
      targetEl.createEl("hr");
    };

    const activeIndex = Math.max(
      0,
      this.plugin.settings.models.findIndex((model) => model.id === this.plugin.settings.activeModelId)
    );
    const activeModel = this.plugin.settings.models[activeIndex] || this.plugin.settings.models[0];
    if (activeModel) renderModelConfig(containerEl, activeModel, activeIndex);

    const maybeAdvancedEl = containerEl.createEl("details", { cls: "pdf-chat-settings-advanced-models" });
    const advancedEl =
      maybeAdvancedEl && typeof maybeAdvancedEl.createEl === "function" ? maybeAdvancedEl : containerEl;
    if (advancedEl !== containerEl) {
      advancedEl.createEl("summary", { text: "高级模型配置" });
    }
    this.plugin.settings.models.forEach((model, index) => {
      if (index === activeIndex) return;
      renderModelConfig(advancedEl, model, index);
    });

    new Setting(advancedEl).addButton((button) =>
      button
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
  }

  private renderChatSection(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("流式输出")
      .setDesc("开启后答案会一边生成一边显示；关闭则等生成完再一次性显示")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.stream).onChange(async (value) => {
          this.plugin.settings.stream = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl).setName("Temperature").addText((text) =>
      text.setValue(String(this.plugin.settings.temperature)).onChange(async (value) => {
        const parsed = parseFloat(value);
        this.plugin.settings.temperature = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.temperature;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl).setName("Max Tokens").addText((text) =>
      text.setValue(String(this.plugin.settings.maxTokens)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.maxTokens = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.maxTokens;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl)
      .setName("继续对话使用的模型")
      .setDesc("留空时优先选择 id、模型名或显示名称中包含 GLM 的模型，然后回退到默认模型。")
      .addDropdown((dropdown) => {
        dropdown.addOption("", "自动（优先 GLM）");
        this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
        dropdown.setValue(this.plugin.settings.continueModelId);
        dropdown.onChange(async (value) => {
          this.plugin.settings.continueModelId = value;
          await this.plugin.saveSettings();
        });
      });
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
  }

  private renderTranslationSection(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("翻译使用的模型")
      .setDesc("留空时优先选择 id、模型名或显示名称中包含 DeepSeek 的模型，然后回退到默认模型。")
      .addDropdown((dropdown) => {
        dropdown.addOption("", "自动（优先 DeepSeek）");
        this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
        dropdown.setValue(this.plugin.settings.translateModelId);
        dropdown.onChange(async (value) => {
          this.plugin.settings.translateModelId = value;
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("划词后自动出现「译」悬浮图标")
      .setDesc("仅在活动视图是 PDF 且选区非空时显示；点击后打开新弹窗并自动翻译。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.quickTranslateMarkerEnabled).onChange(async (value) => {
          this.plugin.settings.quickTranslateMarkerEnabled = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("翻译目标语言")
      .setDesc("用于弹窗中的选区翻译，例如 zh-CN、en 或 ja")
      .addText((text) =>
        text.setValue(this.plugin.settings.translation.targetLanguage).onChange(async (value) => {
          this.plugin.settings.translation.targetLanguage =
            value.trim() || DEFAULT_SETTINGS.translation.targetLanguage;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("翻译分块大小（Unicode 字符）")
      .setDesc("长选区会按 Unicode 字符数分块发送。请输入大于 0 的整数；无效值恢复为 8000。")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.translation.chunkChars)).onChange(async (value) => {
          const parsed = Number(value.trim());
          this.plugin.settings.translation.chunkChars =
            Number.isInteger(parsed) && parsed > 0
              ? parsed
              : DEFAULT_SETTINGS.translation.chunkChars;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("翻译附加要求")
      .setDesc("可选。用于补充术语、风格或领域约定；原文由独立翻译任务安全附加。")
      .addTextArea((text) => {
        text.inputEl.rows = 4;
        text.setValue(this.plugin.settings.translation.additionalInstruction).onChange(async (value) => {
          this.plugin.settings.translation.additionalInstruction = value;
          await this.plugin.saveSettings();
        });
      });
  }

  private renderPaperContextSection(containerEl: HTMLElement): void {
    containerEl.createEl("h4", { text: "全文摘要" });
    containerEl.createEl("p", {
      text: "全文摘要按文件路径和修改时间缓存，可作为当前选区之外的简要背景。仅对 PDF 生效。",
      cls: "setting-item-description",
    });
    new Setting(containerEl)
      .setName("打开 PDF 划词弹窗时自动附带全文摘要")
      .setDesc("有缓存时直接使用；没有缓存时自动生成一次。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoDocSummary).onChange(async (value) => {
          this.plugin.settings.autoDocSummary = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("摘要生成用的模型")
      .setDesc("建议选择速度快、成本低的模型，聊天主模型可以不同。")
      .addDropdown((dropdown) => {
        this.plugin.settings.models.forEach((model) => dropdown.addOption(model.id, model.name));
        dropdown.setValue(this.plugin.settings.summaryModelId || this.plugin.settings.activeModelId);
        dropdown.onChange(async (value) => {
          this.plugin.settings.summaryModelId = value;
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl).setName("全文截断字符数上限").addText((text) =>
      text.setValue(String(this.plugin.settings.summaryMaxChars)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.summaryMaxChars = Number.isFinite(parsed)
          ? parsed
          : DEFAULT_SETTINGS.summaryMaxChars;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl).setName("摘要最大输出 token 数").addText((text) =>
      text.setValue(String(this.plugin.settings.summaryMaxTokens)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.summaryMaxTokens = Number.isFinite(parsed)
          ? parsed
          : DEFAULT_SETTINGS.summaryMaxTokens;
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
      .addButton((button) =>
        button.setButtonText("清空缓存").onClick(async () => {
          this.plugin.settings.docSummaries = {};
          await this.plugin.saveSettings();
          this.display();
        })
      );

    containerEl.createEl("h4", { text: "全文直读 / RAG 检索" });
    containerEl.createEl("p", {
      text:
        "较短 PDF 直接提供全文；超过阈值时退回本地 BM25 检索。检索与摘要互补，不需要 embedding 模型。",
      cls: "setting-item-description",
    });
    new Setting(containerEl)
      .setName("全文直读的字数阈值")
      .setDesc("全文不超过此值时直接交给模型回答；超过时使用关键词检索。")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.ragFullTextThreshold)).onChange(async (value) => {
          const parsed = parseInt(value, 10);
          this.plugin.settings.ragFullTextThreshold = Number.isFinite(parsed)
            ? parsed
            : DEFAULT_SETTINGS.ragFullTextThreshold;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("打开 PDF 划词弹窗时自动建立检索索引")
      .setDesc("索引是纯本地文本切块，几乎不耗时。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoRag).onChange(async (value) => {
          this.plugin.settings.autoRag = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("提问前先让快模型思考检索角度")
      .setDesc("生成多组中英双语检索词后融合排序，代价是每次提问多一次模型调用。")
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
    new Setting(containerEl).setName("每次检索返回的片段数(Top K)").addText((text) =>
      text.setValue(String(this.plugin.settings.ragTopK)).onChange(async (value) => {
        const parsed = parseInt(value, 10);
        this.plugin.settings.ragTopK = Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.ragTopK;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl).setName("单块最大字符数").addText((text) =>
      text.setValue(String(this.plugin.settings.ragChunkSize)).onChange(async (value) => {
        const normalized = normalizeRagChunkSettings(
          Number(value.trim()),
          this.plugin.settings.ragChunkOverlap
        );
        this.plugin.settings.ragChunkSize = normalized.ragChunkSize;
        this.plugin.settings.ragChunkOverlap = normalized.ragChunkOverlap;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl).setName("切块重叠字符数").addText((text) =>
      text.setValue(String(this.plugin.settings.ragChunkOverlap)).onChange(async (value) => {
        const normalized = normalizeRagChunkSettings(
          this.plugin.settings.ragChunkSize,
          Number(value.trim())
        );
        this.plugin.settings.ragChunkSize = normalized.ragChunkSize;
        this.plugin.settings.ragChunkOverlap = normalized.ragChunkOverlap;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl)
      .setName("清空已缓存的检索索引")
      .setDesc(`当前已为 ${Object.keys(this.plugin.settings.docChunks || {}).length} 篇文档建立过索引`)
      .addButton((button) =>
        button.setButtonText("清空缓存").onClick(async () => {
          this.plugin.settings.docChunks = {};
          await this.plugin.saveSettings();
          this.display();
        })
      );
  }

  private renderAdvancedSection(containerEl: HTMLElement): void {
    containerEl.createEl("p", {
      text:
        "默认快捷键：Ctrl+Alt+Q 新开对话；Ctrl+Q 继续上次对话。可在 设置→快捷键→搜索“PDF Chat”中修改。弹窗支持拖动、缩放、连续追问和停止生成。",
      cls: "setting-item-description",
    });
    containerEl.createEl("h4", { text: "Codex 深度多论文分析" });
    containerEl.createEl("p", {
      text:
        "启用后，论文上下文区会允许手动触发 Codex CLI。插件只会把论文文本和当前问题写入临时分析包，不会复制 data.json、API key 或模型 endpoint。",
      cls: "setting-item-description",
    });
    new Setting(containerEl)
      .setName("启用 Codex CLI 深度分析")
      .setDesc("仅桌面端可用。Codex 使用它自己的登录/配置，不使用 PDF Chat 的 API key。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.codexDeepAnalysis.enabled).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.enabled = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("Codex 命令")
      .setDesc("默认 codex；如果不在 PATH 中，可填写 codex 可执行文件的完整路径。")
      .addText((text) =>
        text.setValue(this.plugin.settings.codexDeepAnalysis.command).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.command =
            value.trim() || DEFAULT_SETTINGS.codexDeepAnalysis.command;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("Codex profile")
      .setDesc("可选；对应 codex exec --profile。留空则使用 Codex 默认配置。")
      .addText((text) =>
        text.setValue(this.plugin.settings.codexDeepAnalysis.profile).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.profile = value.trim();
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("Codex model")
      .setDesc("对应 codex exec --model。默认 gpt-5.5；也可以在聊天框用 /model 切换。")
      .addText((text) =>
        text.setValue(this.plugin.settings.codexDeepAnalysis.model).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.model =
            value.trim() || DEFAULT_SETTINGS.codexDeepAnalysis.model;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("Codex reasoning effort")
      .setDesc("对应 -c model_reasoning_effort。默认 medium；深度任务可升到 high/xhigh。")
      .addDropdown((dropdown) => {
        for (const effort of ["minimal", "low", "medium", "high", "xhigh"]) {
          dropdown.addOption(effort, effort);
        }
        dropdown.setValue(this.plugin.settings.codexDeepAnalysis.reasoningEffort).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.reasoningEffort =
            value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh"
              ? value
              : DEFAULT_SETTINGS.codexDeepAnalysis.reasoningEffort;
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("Codex verbosity")
      .setDesc("对应 -c model_verbosity。默认 medium，需要更充分时可改 high。")
      .addDropdown((dropdown) => {
        for (const verbosity of ["low", "medium", "high"]) dropdown.addOption(verbosity, verbosity);
        dropdown.setValue(this.plugin.settings.codexDeepAnalysis.verbosity).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.verbosity =
            value === "low" || value === "medium" || value === "high"
              ? value
              : DEFAULT_SETTINGS.codexDeepAnalysis.verbosity;
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("Codex input mode")
      .setDesc("默认 PDF-only：只把所选 PDF 和问题放进临时目录；Debug full 仅用于排查 PDF 读取问题。")
      .addDropdown((dropdown) => {
        dropdown.addOption("pdf-only", "PDF-only");
        dropdown.addOption("debug-full", "Debug full");
        dropdown.setValue(this.plugin.settings.codexDeepAnalysis.inputMode || DEFAULT_SETTINGS.codexDeepAnalysis.inputMode);
        dropdown.onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.inputMode =
            value === "debug-full" ? value : "pdf-only";
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("Codex output mode")
      .setDesc("默认 Markdown：让 Codex 自然回答；JSON schema 仅用于结构化兼容或调试。")
      .addDropdown((dropdown) => {
        dropdown.addOption("markdown", "Markdown (natural)");
        dropdown.addOption("json-schema", "JSON schema (structured/debug)");
        dropdown.setValue(this.plugin.settings.codexDeepAnalysis.outputMode || DEFAULT_SETTINGS.codexDeepAnalysis.outputMode);
        dropdown.onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.outputMode =
            value === "json-schema" ? "json-schema" : "markdown";
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("Codex 默认附带选区上下文")
      .setDesc("开启后，PDF Chat 会把当前划选段落写入 selected-context.md；弹窗内也可用“附选区”按钮或 /context 临时切换。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.codexDeepAnalysis.includeSelectionContext).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.includeSelectionContext = value;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("Codex 超时毫秒")
      .setDesc("默认 1800000，即 30 分钟；PDF 读取或高强度推理可能较慢，超时后会终止 Codex 进程。")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.codexDeepAnalysis.timeoutMs)).onChange(async (value) => {
          const parsed = Number(value.trim());
          this.plugin.settings.codexDeepAnalysis.timeoutMs =
            Number.isFinite(parsed) && parsed >= 30000
              ? Math.floor(parsed)
              : DEFAULT_SETTINGS.codexDeepAnalysis.timeoutMs;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("保留 Codex 临时分析包")
      .setDesc("仅用于调试。关闭时任务结束会删除临时包。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.codexDeepAnalysis.keepTempFiles).onChange(async (value) => {
          this.plugin.settings.codexDeepAnalysis.keepTempFiles = value;
          await this.plugin.saveSettings();
        })
      );
    containerEl.createEl("h4", { text: "阅读模式预设" });
    containerEl.createEl("p", {
      text: "弹窗的阅读模式会列出这些预设；切换后替换系统提示词，选区原文仍会自动附加。",
      cls: "setting-item-description",
    });
    this.plugin.settings.promptPresets.forEach((preset, index) => {
      const nameSetting = new Setting(containerEl).setName(`预设 ${index + 1}`);
      nameSetting.addText((text) =>
        text
          .setPlaceholder("名称")
          .setValue(preset.name)
          .onChange(async (value) => {
            preset.name = value;
            await this.plugin.saveSettings();
          })
      );
      nameSetting.addExtraButton((button) => {
        labelExtraButton(button, "删除这个预设");
        button
          .setIcon("trash")
          .onClick(async () => {
            this.plugin.settings.promptPresets.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          });
      });
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
    new Setting(containerEl).addButton((button) =>
      button
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
