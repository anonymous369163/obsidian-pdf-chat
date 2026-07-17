import { requestUrl } from "obsidian";
import type { LlmMessage, LlmRequest, ModelProfile } from "./types";

export interface LlmTransportSettings {
  activeModelId: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
}

type RequestUrl = typeof requestUrl;

function getDefaultFetchRequest(): typeof fetch {
  const fetchRequest = typeof globalThis !== "undefined" ? globalThis.fetch : undefined;
  if (typeof fetchRequest !== "function") {
    return (() => Promise.reject(new Error("fetch is not available in this environment"))) as typeof fetch;
  }
  return fetchRequest.bind(globalThis) as typeof fetch;
}

interface CompletionDelta {
  content?: string;
  reasoning_content?: string;
  text?: string;
}

interface CompletionChoice {
  message?: CompletionDelta;
  delta?: CompletionDelta;
  text?: string;
}

interface CompletionPayload {
  choices?: CompletionChoice[];
  error?: { message?: string };
}

function asCompletionPayload(value: unknown): CompletionPayload | null {
  return value && typeof value === "object" ? (value as CompletionPayload) : null;
}

export class OpenAICompatibleTransport {
  constructor(
    private readonly getSettings: () => LlmTransportSettings,
    private readonly getModelProfile: (id: string) => ModelProfile,
    private readonly request: RequestUrl = requestUrl,
    private readonly fetchRequest: typeof fetch = getDefaultFetchRequest()
  ) {}

  async chat(request: LlmRequest): Promise<string> {
    const settings = this.getSettings();
    const profile = request.modelProfile || this.getModelProfile(settings.activeModelId);
    const shouldStream = request.stream ?? settings.stream;
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
    request.onChunk?.(text, text);
    return text;
  }

  async chatOnce(
    messages: LlmMessage[],
    signal: AbortSignal | undefined,
    profile: ModelProfile,
    maxTokensOverride?: number,
    temperatureOverride?: number
  ): Promise<string> {
    const settings = this.getSettings();
    const body = {
      model: profile.model,
      temperature: temperatureOverride ?? settings.temperature,
      max_tokens: maxTokensOverride ?? settings.maxTokens,
      stream: false,
      messages,
    };

    const response = await this.request({
      url: profile.endpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify(body),
      throw: false,
    });

    if (signal?.aborted) {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      throw abortError;
    }

    let data: CompletionPayload | null = null;
    try {
      data = asCompletionPayload(response.json);
    } catch {
      data = null;
    }
    if (response.status >= 300) {
      const message = (data && data.error && data.error.message) || response.text || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const choice = data && data.choices && data.choices[0];
    const content = choice && (choice.message ? choice.message.content : choice.text);
    if (!content) throw new Error("模型没有返回内容,原始响应: " + JSON.stringify(data));
    return String(content).trim();
  }

  async chatStream(
    messages: LlmMessage[],
    onChunk: LlmRequest["onChunk"],
    signal: AbortSignal | undefined,
    profile: ModelProfile,
    maxTokensOverride?: number,
    temperatureOverride?: number
  ): Promise<string> {
    const settings = this.getSettings();
    const response = await this.fetchRequest(profile.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify({
        model: profile.model,
        temperature: temperatureOverride ?? settings.temperature,
        max_tokens: maxTokensOverride ?? settings.maxTokens,
        stream: true,
        messages,
      }),
      signal,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        // Keep the status-only fallback.
      }
      let message = errorText || `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        message = (parsed.error && parsed.error.message) || message;
      } catch {
        // The endpoint returned plain text.
      }
      throw new Error(message);
    }

    if (!response.body?.getReader) {
      const data = asCompletionPayload(await response.json());
      const content = data?.choices?.[0]?.message?.content || "";
      onChunk?.(content, content);
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

        let parsed: CompletionPayload | null;
        try {
          parsed = asCompletionPayload(JSON.parse(payload) as unknown);
        } catch {
          continue;
        }
        if (parsed?.error) throw new Error(parsed.error.message || JSON.stringify(parsed.error));
        const choices = parsed?.choices;
        if (!choices?.length) continue;

        const delta = choices[0].delta || choices[0].message || {};
        const piece =
          delta.content || delta.reasoning_content || (typeof delta.text === "string" ? delta.text : "");
        if (piece) {
          full += piece;
          onChunk?.(piece, full);
        }
      }
    }

    return full;
  }
}
