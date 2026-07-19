import type {
  ConversationMessage,
  LlmMessage,
  LlmOperations,
  ModelProfile,
  SessionMemory,
} from "./types";

const MEMORY_PREFIX = "【较早对话摘要】\n";
const TRUNCATION_MARKER = "\n\n[内容因上下文预算已截断]";

export interface ContextCompositionRequest {
  system: string;
  transcript: Array<Pick<ConversationMessage, "role" | "content">>;
  currentUser: string;
  currentContext?: string;
  memory?: string;
  maxInputChars: number;
  minRecentTurns: number;
}

export interface ContextComposition {
  messages: LlmMessage[];
  omittedMessageCount: number;
  includedTranscriptStart: number;
  currentInputTruncated: boolean;
}

export interface SessionMemorySummaryRequest {
  transcript: Array<Pick<ConversationMessage, "role" | "content">>;
  coveredMessageCount: number;
  llm: LlmOperations;
  modelProfile: ModelProfile;
  signal?: AbortSignal;
  now?: () => number;
}

export interface EvidencePromptSource {
  alias: string;
  name: string;
  paperPath: string;
}

export function buildEvidenceCitationInstructions(sources: EvidencePromptSource[]): string {
  const normalized = (Array.isArray(sources) ? sources : []).filter(
    (source) => source?.alias?.trim() && source?.paperPath?.trim()
  );
  if (!normalized.length) return "";
  return [
    "论文证据来源别名：",
    ...normalized.map(
      (source) => `- [${source.alias.trim()}] ${source.name || source.paperPath}：${source.paperPath}`
    ),
    "回答中引用可确认的论文证据时，请使用 [P1, p.N] 这种格式（P1 替换为对应别名，N 替换为 PDF 页码）。无法确认页码时请明确说明，不要编造页码。",
  ].join("\n");
}

interface TranscriptTurn {
  start: number;
  messages: LlmMessage[];
  chars: number;
}

function normalizeLimit(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function truncatePrefix(value: string, limit: number): string {
  if (limit <= 0) return "";
  if (value.length <= limit) return value;
  if (limit <= TRUNCATION_MARKER.length) return value.slice(0, limit);
  return value.slice(0, limit - TRUNCATION_MARKER.length).trimEnd() + TRUNCATION_MARKER;
}

function buildMandatoryMessages(
  system: string,
  currentContext: string,
  currentUser: string,
  maxInputChars: number
): { system: LlmMessage; current: LlmMessage; truncated: boolean } {
  const delimiter = currentContext ? "\n\n" : "";
  const fullCurrent = `${currentContext}${delimiter}${currentUser}`;
  if (system.length + fullCurrent.length <= maxInputChars) {
    return {
      system: { role: "system", content: system },
      current: { role: "user", content: fullCurrent },
      truncated: false,
    };
  }

  const systemBudget = Math.min(system.length, Math.max(0, Math.floor(maxInputChars * 0.4)));
  const fittedSystem = truncatePrefix(system, systemBudget);
  const currentBudget = Math.max(0, maxInputChars - fittedSystem.length);
  let fittedCurrent = "";

  if (currentUser.length >= currentBudget) {
    fittedCurrent = truncatePrefix(currentUser, currentBudget);
  } else if (currentContext) {
    const contextBudget = Math.max(0, currentBudget - currentUser.length - delimiter.length);
    const fittedContext = truncatePrefix(currentContext, contextBudget);
    fittedCurrent = fittedContext ? `${fittedContext}${delimiter}${currentUser}` : currentUser;
  } else {
    fittedCurrent = currentUser;
  }

  return {
    system: { role: "system", content: fittedSystem },
    current: { role: "user", content: fittedCurrent },
    truncated: true,
  };
}

function groupTranscriptTurns(
  transcript: Array<Pick<ConversationMessage, "role" | "content">>
): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  let current: TranscriptTurn | null = null;

  transcript.forEach((candidate, index) => {
    if (!candidate || (candidate.role !== "user" && candidate.role !== "assistant")) return;
    if (typeof candidate.content !== "string" || !candidate.content) return;
    const message: LlmMessage = { role: candidate.role, content: candidate.content };
    if (candidate.role === "user") {
      if (current) turns.push(current);
      current = { start: index, messages: [message], chars: message.content.length };
      return;
    }
    if (!current) {
      turns.push({ start: index, messages: [message], chars: message.content.length });
      return;
    }
    current.messages.push(message);
    current.chars += message.content.length;
  });
  if (current) turns.push(current);
  return turns;
}

export function composeBoundedContext(request: ContextCompositionRequest): ContextComposition {
  const maxInputChars = normalizeLimit(request.maxInputChars, 60_000);
  const minRecentTurns = normalizeLimit(request.minRecentTurns, 6);
  const system = typeof request.system === "string" ? request.system : "";
  const currentUser = typeof request.currentUser === "string" ? request.currentUser : "";
  const currentContext = typeof request.currentContext === "string" ? request.currentContext : "";
  const mandatory = buildMandatoryMessages(system, currentContext, currentUser, maxInputChars);
  let remaining = Math.max(
    0,
    maxInputChars - mandatory.system.content.length - mandatory.current.content.length
  );

  const transcript = Array.isArray(request.transcript) ? request.transcript : [];
  const turns = groupTranscriptTurns(transcript);
  const included: TranscriptTurn[] = [];
  let nextTurnIndex = turns.length - 1;
  while (nextTurnIndex >= 0 && included.length < minRecentTurns) {
    const turn = turns[nextTurnIndex];
    if (turn.chars > remaining) break;
    included.unshift(turn);
    remaining -= turn.chars;
    nextTurnIndex -= 1;
  }

  const memory = typeof request.memory === "string" ? request.memory.trim() : "";
  const memoryContent = memory ? `${MEMORY_PREFIX}${memory}` : "";
  const includeMemory = !!memoryContent && memoryContent.length <= remaining;
  if (!includeMemory) {
    while (nextTurnIndex >= 0) {
      const turn = turns[nextTurnIndex];
      if (turn.chars > remaining) break;
      included.unshift(turn);
      remaining -= turn.chars;
      nextTurnIndex -= 1;
    }
  }

  const includedTranscriptStart = included.length ? included[0].start : transcript.length;
  const messages: LlmMessage[] = [mandatory.system];
  if (includeMemory) messages.push({ role: "system", content: memoryContent });
  for (const turn of included) messages.push(...turn.messages);
  messages.push(mandatory.current);

  return {
    messages,
    omittedMessageCount: includedTranscriptStart,
    includedTranscriptStart,
    currentInputTruncated: mandatory.truncated,
  };
}

export async function summarizeSessionMemory(
  request: SessionMemorySummaryRequest
): Promise<SessionMemory> {
  const visibleMessages = request.transcript
    .slice(0, Math.max(0, request.coveredMessageCount))
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => `${message.role === "user" ? "用户" : "助手"}: ${message.content}`)
    .join("\n\n");
  if (!visibleMessages.trim()) throw new Error("No visible conversation turns to summarize");
  const content = await request.llm.chat({
    messages: [
      {
        role: "system",
        content:
          "请把较早的论文阅读对话压缩成简洁、忠实的会话记忆。保留用户目标、已确认结论、关键术语、未解决问题和必要证据；不要补造信息，不要输出标题或说明。",
      },
      { role: "user", content: visibleMessages },
    ],
    modelProfile: request.modelProfile,
    signal: request.signal,
    stream: false,
    temperatureOverride: 0.1,
    maxTokensOverride: 1200,
  });
  const normalized = content.trim();
  if (!normalized) throw new Error("Conversation memory summarization returned empty output");
  return {
    content: normalized,
    coveredMessageCount: Math.max(0, Math.min(request.coveredMessageCount, request.transcript.length)),
    updatedAt: (request.now || Date.now)(),
  };
}
