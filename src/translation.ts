import type {
  LlmMessage,
  LlmOperations,
  TranslationProgress,
  TranslationSettings,
  TranslationTaskRequest,
  TranslationTaskResult,
} from "./types";

const FAILED_CHUNK_PREFIX = "[翻译失败，保留原文]";
const GENERIC_TRANSLATION_FAILURE = "Translation failed for every chunk.";

function isWhitespace(value: string): boolean {
  return /^\s$/u.test(value);
}

function sentenceBoundary(points: string[], start: number, hardEnd: number): number {
  const punctuation = new Set([".", "!", "?", "。", "！", "？"]);
  const closers = new Set(['"', "'", "”", "’", "）", "]"]);
  let boundary = -1;
  for (let index = start; index < hardEnd; index += 1) {
    if (!punctuation.has(points[index])) continue;
    let after = index + 1;
    while (after < hardEnd && closers.has(points[after])) after += 1;
    if (after >= hardEnd || !isWhitespace(points[after])) continue;
    while (after < hardEnd && isWhitespace(points[after])) after += 1;
    boundary = after;
  }
  return boundary;
}

function preferredBoundary(points: string[], start: number, hardEnd: number): number {
  for (let index = hardEnd - 2; index >= start; index -= 1) {
    if (points[index] === "\n" && points[index + 1] === "\n") return index + 2;
  }
  for (let index = hardEnd - 1; index >= start; index -= 1) {
    if (points[index] === "\n") return index + 1;
  }
  const sentence = sentenceBoundary(points, start, hardEnd);
  if (sentence > start) return sentence;
  for (let index = hardEnd - 1; index >= start; index -= 1) {
    if (isWhitespace(points[index])) return index + 1;
  }
  return hardEnd;
}

export function splitTranslationChunks(source: string, limit: number): string[] {
  if (!source) return [];
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError("Translation chunk limit must be a positive integer");
  }
  const points = Array.from(source);
  if (points.length <= limit) return [source];

  const chunks: string[] = [];
  let start = 0;
  while (start < points.length) {
    const hardEnd = Math.min(start + limit, points.length);
    const end = hardEnd === points.length ? hardEnd : preferredBoundary(points, start, hardEnd);
    chunks.push(points.slice(start, end).join(""));
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

function stoppedResult(
  chunks: string[],
  completed: string[],
  failedChunkIndexes: number[]
): TranslationTaskResult {
  return {
    text: combineTranslations(completed),
    chunkCount: chunks.length,
    stoppedEarly: true,
    failedChunkIndexes: [...failedChunkIndexes],
  };
}

function emitProgress(
  request: TranslationTaskRequest,
  chunkIndex: number,
  chunkCount: number,
  chunkText: string,
  completed: string[]
): void {
  const progress: TranslationProgress = {
    chunkIndex: chunkIndex + 1,
    chunkCount,
    chunkText,
    combinedText: combineTranslations(completed),
  };
  request.onChunk?.(progress);
}

export class TranslationService {
  constructor(private readonly llm: LlmOperations) {}

  async translate(request: TranslationTaskRequest): Promise<TranslationTaskResult> {
    const chunks = splitTranslationChunks(request.source, request.settings.chunkChars);
    if (!chunks.length) {
      return {
        text: "",
        chunkCount: 0,
        stoppedEarly: false,
        failedChunkIndexes: [],
      };
    }

    const completed: string[] = [];
    const failedChunkIndexes: number[] = [];

    const requestOnce = async (chunk: string): Promise<string> => {
      return this.llm.chat({
        messages: buildTranslationMessages(chunk, request.settings),
        modelProfile: request.modelProfile,
        signal: request.signal,
        stream: true,
        temperatureOverride: request.settings.temperature,
        maxTokensOverride: request.settings.maxTokens,
      });
    };

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      if (request.signal?.aborted) {
        return stoppedResult(chunks, completed, failedChunkIndexes);
      }

      const chunk = chunks[chunkIndex];
      let translated = "";
      let failed = false;
      try {
        translated = (await requestOnce(chunk)).trim();
        if (request.signal?.aborted) {
          return stoppedResult(chunks, completed, failedChunkIndexes);
        }
        if (!translated) {
          if (request.signal?.aborted) {
            return stoppedResult(chunks, completed, failedChunkIndexes);
          }
          translated = (await requestOnce(chunk)).trim();
          if (request.signal?.aborted) {
            return stoppedResult(chunks, completed, failedChunkIndexes);
          }
          failed = !translated;
        }
      } catch {
        if (request.signal?.aborted) {
          return stoppedResult(chunks, completed, failedChunkIndexes);
        }
        failed = true;
      }

      const output = failed ? `${FAILED_CHUNK_PREFIX}\n${chunk}` : translated;
      if (failed) failedChunkIndexes.push(chunkIndex);
      completed.push(output);
      emitProgress(request, chunkIndex, chunks.length, output, completed);
    }

    if (failedChunkIndexes.length === chunks.length) {
      throw new Error(GENERIC_TRANSLATION_FAILURE);
    }
    return {
      text: combineTranslations(completed),
      chunkCount: chunks.length,
      stoppedEarly: false,
      failedChunkIndexes,
    };
  }
}
