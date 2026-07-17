import { Notice, PluginSettingTab, Setting, type App } from "obsidian";
import { DEFAULT_SETTINGS } from "./default-settings";
import type { PDFChatPluginApi } from "./types";

export class PDFChatSettingTab extends PluginSettingTab {
  private readonly plugin: PDFChatPluginApi;

  constructor(app: App, plugin: PDFChatPluginApi) {
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

    new Setting(containerEl)
      .setName("「翻译」按钮的指令")
      .setDesc("点弹窗里的「翻译」按钮时直接发送的固定指令,不需要在输入框里打字。选中的原文片段已经在系统提示词里,这里只需要描述翻译要求。")
      .addTextArea((text) => {
        text.inputEl.rows = 4;
        text.setValue(this.plugin.settings.translatePrompt).onChange(async (value) => {
          this.plugin.settings.translatePrompt = value;
          await this.plugin.saveSettings();
        });
      });

    containerEl.createEl("p", {
      text:
        "默认快捷键: Ctrl+Alt+Q 新开一份对话(不加载之前保存的记录);Ctrl+Q 继续上次对话(恢复之前保存的记录)。" +
        "两个命令都可以在 设置→快捷键→搜索 “PDF Chat” 里自行修改。" +
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
