import type {
  LlmMessage,
  LlmOperations,
  ModelProfile,
  TranslationProgress,
  TranslationSettings,
  TranslationTaskRequest,
  TranslationTaskResult,
} from "./types";

function lastRegexBoundary(text: string, start: number, end: number, pattern: RegExp): number {
  pattern.lastIndex = start;
  let boundary = -1;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const candidate = match.index + match[0].length;
    if (candidate > end) break;
    if (candidate > start) boundary = candidate;
    if (match[0].length === 0) pattern.lastIndex += 1;
  }
  return boundary;
}

function findPreferredBoundary(source: string, start: number, hardEnd: number): number {
  const paragraph = source.lastIndexOf("\n\n", hardEnd - 2);
  if (paragraph >= start) return paragraph + 2;

  const line = source.lastIndexOf("\n", hardEnd - 1);
  if (line >= start) return line + 1;

  const sentence = lastRegexBoundary(
    source,
    start,
    hardEnd,
    /[.!?。！？](?:["'”’）\]]*)\s+/g
  );
  if (sentence > start) return sentence;

  for (let index = hardEnd - 1; index >= start; index -= 1) {
    if (/\s/.test(source[index])) return index + 1;
  }
  return hardEnd;
}

function keepSurrogatePairTogether(source: string, start: number, end: number): number {
  if (end <= start || end >= source.length) return end;
  const previous = source.charCodeAt(end - 1);
  const next = source.charCodeAt(end);
  const splitsPair =
    previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff;
  if (!splitsPair) return end;
  return end - 1 > start ? end - 1 : end + 1;
}

export function splitTranslationChunks(source: string, limit: number): string[] {
  if (!source) return [];
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError("Translation chunk limit must be a positive integer");
  }
  if (source.length <= limit) return [source];

  const chunks: string[] = [];
  let start = 0;
  while (start < source.length) {
    const hardEnd = Math.min(start + limit, source.length);
    const preferredEnd =
      hardEnd === source.length ? hardEnd : findPreferredBoundary(source, start, hardEnd);
    const end = keepSurrogatePairTogether(source, start, preferredEnd);
    chunks.push(source.slice(start, end));
    start = end;
  }
  return chunks;
}

export function buildTranslationMessages(
  source: string,
  settings: TranslationSettings
): [LlmMessage, LlmMessage] {
  const system =
    `You are an expert academic translator. Produce a faithful academic translation into ${settings.targetLanguage}. ` +
    "Preserve paragraph boundaries and paragraph order. Preserve formulas, code, variables, citations, and figure and table numbers exactly. " +
    "Output only the translated text.";
  const additional = settings.additionalInstruction
    ? `Additional instruction:\n${settings.additionalInstruction}\n\n`
    : "";
  return [
    { role: "system", content: system },
    {
      role: "user",
      content: `${additional}<source_text>\n${source}\n</source_text>`,
    },
  ];
}

function combineTranslations(translations: string[]): string {
  return translations.filter((translation) => translation.trim().length > 0).join("\n\n");
}

function throwIfTranslationAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) return;
  const error = new Error("Translation aborted");
  error.name = "AbortError";
  throw error;
}

export class TranslationService {
  constructor(private readonly llm: LlmOperations) {}

  async translate(request: TranslationTaskRequest): Promise<TranslationTaskResult> {
    const chunks = splitTranslationChunks(request.source, request.settings.chunkChars);
    if (!chunks.length) return { text: "", chunkCount: 0 };
    const completed: string[] = [];

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      throwIfTranslationAborted(request.signal);
      let streamedChunk = "";
      const translated = await this.llm.chat({
        messages: buildTranslationMessages(chunks[chunkIndex], request.settings),
        modelProfile: request.modelProfile,
        signal: request.signal,
        stream: true,
        temperatureOverride: request.settings.temperature,
        maxTokensOverride: request.settings.maxTokens,
        onChunk: (_piece, accumulatedText) => {
          streamedChunk = accumulatedText;
          request.onChunk?.({
            chunkIndex: chunkIndex + 1,
            chunkCount: chunks.length,
            chunkText: accumulatedText,
            combinedText: combineTranslations([...completed, accumulatedText]),
          });
        },
      });
      throwIfTranslationAborted(request.signal);
      const finalChunk = translated.trim();
      if (!finalChunk) {
        throw new Error(`Empty translation output for chunk ${chunkIndex + 1}/${chunks.length}`);
      }
      if (finalChunk !== streamedChunk) {
        request.onChunk?.({
          chunkIndex: chunkIndex + 1,
          chunkCount: chunks.length,
          chunkText: finalChunk,
          combinedText: combineTranslations([...completed, finalChunk]),
        });
      }
      completed.push(finalChunk);
    }

    throwIfTranslationAborted(request.signal);
    return { text: combineTranslations(completed), chunkCount: chunks.length };
  }
}
