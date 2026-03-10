/**
 * Part 4: Network orchestration. Generator → 3 parallel judges → compile → rank → benchmark.
 * No Supabase or run-daily logic; pure LLM + config + scoring.
 */

import { type GatewayModelId, generateText } from "ai";
import { generationConfig } from "../../config/generation";
import { executeLlmCall, type LlmCallFailure, type LlmCallResult } from "../llm-metrics";
import { generateQuestions } from "../llm";
import type { LLMGeneratedDailyQuestion } from "../schema";
import {
  JudgePanelOutputSchema,
  type JudgePanelOutput,
} from "../../schemas/judge-score";
import {
  CLARITY_JUDGE_SYSTEM_PROMPT,
  NOVELTY_JUDGE_SYSTEM_PROMPT,
  TONE_JUDGE_SYSTEM_PROMPT,
} from "../prompts/judges";

const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const MAX_RETRIES_RATE_LIMIT = 3;
const MAX_RETRIES_TRANSIENT = 2;
const MAX_PARSE_RETRIES = 1;

/** Optional callbacks to persist data as it becomes available so nothing is lost on failure. */
export interface RunDailyNetworkPersist {
  onQuestionsGenerated(questions: LLMGeneratedDailyQuestion[]): void | Promise<void>;
  onJudgeComplete(
    dimension: "novelty" | "clarity" | "tone",
    result: JudgePanelOutput
  ): void | Promise<void>;
}

export interface RunDailyNetworkInput {
  date: string;
  context?: string;
  runId?: string;
  /** Override how many questions to generate (capped by generator/judge limits). If omitted, uses config.generatorQuestionCount. */
  questionCount?: number;
  /** If provided, called after generator succeeds and after each judge succeeds. */
  persist?: RunDailyNetworkPersist;
}

export interface CandidateWithScores {
  question: LLMGeneratedDailyQuestion;
  questionIndex: number;
  combinedScore: number;
  novelty: number;
  clarity: number;
  tone: number;
}

/** Per-call metrics (generator or one judge). */
export interface NetworkCallMetrics {
  operation: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
}

/** Aggregated metrics for a full network run. */
export interface NetworkRunMetrics {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalLatencyMs: number;
  calls: NetworkCallMetrics[];
}

/** Partial result available on failure so the caller can persist and not lose data. */
export interface PartialNetworkResult {
  questions: LLMGeneratedDailyQuestion[];
  novelty?: JudgePanelOutput;
  clarity?: JudgePanelOutput;
  tone?: JudgePanelOutput;
}

export type RunDailyNetworkResult =
  | {
      ok: true;
      dailyQuestion: LLMGeneratedDailyQuestion;
      allCandidates: CandidateWithScores[];
      aboveBenchmarkIndices: number[];
      metrics: NetworkRunMetrics;
      /** Raw judge outputs (scores + rationale per question) for recap/audit. */
      judgeOutputs: {
        novelty: JudgePanelOutput;
        clarity: JudgePanelOutput;
        tone: JudgePanelOutput;
      };
    }
  | {
      ok: false;
      error: { message: string; type?: string };
      /** Present when we have at least questions (and any completed judge results) to persist. */
      partial?: PartialNetworkResult;
    };

/**
 * Build the shared user message for all three judges: 5 questions as JSON + optional context.
 */
export function buildJudgeUserMessage(
  questions: LLMGeneratedDailyQuestion[],
  context?: string
): string {
  const payload = JSON.stringify(
    questions.map((q) => ({
      category: q.category,
      simple_text: q.simple_text,
    })),
    null,
    2
  );
  let message = `Candidate questions (indexed 0 through ${questions.length - 1}):\n\n${payload}`;
  if (context?.trim()) {
    message += `\n\nContext:\n${context.trim()}`;
  }
  return message;
}

function parseJudgeResponse(raw: string): JudgePanelOutput | null {
  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = JudgePanelOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  const delay = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.round(delay + jitter);
}

type JudgeDimension = "novelty" | "clarity" | "tone";

const JUDGE_SYSTEM_PROMPTS: Record<JudgeDimension, string> = {
  novelty: NOVELTY_JUDGE_SYSTEM_PROMPT,
  clarity: CLARITY_JUDGE_SYSTEM_PROMPT,
  tone: TONE_JUDGE_SYSTEM_PROMPT,
};

async function runJudgeOnce(
  dimension: JudgeDimension,
  userMessage: string,
  modelId: GatewayModelId,
  runId?: string
): Promise<LlmCallResult<string>> {
  const systemPrompt = JUDGE_SYSTEM_PROMPTS[dimension];
  return executeLlmCall({
    operation: `judge-${dimension}`,
    modelId,
    runId,
    errorMessage: `Judge ${dimension} failed`,
    execute: async () => {
      const response = await generateText({
        model: modelId,
        system: systemPrompt,
        prompt: userMessage,
        maxOutputTokens: 2000,
      });
      const text = response.text ?? "";
      return { data: text, rawText: text, usage: response.totalUsage };
    },
  });
}

async function runJudgeWithRetry(
  dimension: JudgeDimension,
  userMessage: string,
  modelId: GatewayModelId,
  runId?: string
): Promise<LlmCallResult<JudgePanelOutput>> {
  let attempt = 0;
  const maxRetries =
    dimension === "novelty" ? MAX_RETRIES_RATE_LIMIT : MAX_RETRIES_TRANSIENT;

  while (true) {
    const result = await runJudgeOnce(dimension, userMessage, modelId, runId);

    if (result.ok) {
      const parsed = parseJudgeResponse(result.data);
      if (parsed) {
        return { ...result, data: parsed };
      }
      if (attempt < MAX_PARSE_RETRIES) {
        attempt++;
        continue;
      }
      return {
        ok: false,
        data: null,
        error: {
          message: `Judge ${dimension} returned invalid JSON`,
          type: "model_error",
        },
        runId: result.runId,
      };
    }

    const { error } = result as LlmCallFailure;
    const isRateLimit = error.type === "rate_limit_exceeded" || error.code === 429;
    const isTransient =
      error.type === "internal_error" || (error.code && (error.code >= 500 || error.code === 408));
    const isRetryable = isRateLimit || isTransient;

    if (!isRetryable || attempt >= (isRateLimit ? MAX_RETRIES_RATE_LIMIT : maxRetries)) {
      return result as LlmCallResult<JudgePanelOutput>;
    }

    attempt++;
    await sleep(backoffDelay(attempt));
  }
}

export async function runDailyNetwork(
  input: RunDailyNetworkInput
): Promise<RunDailyNetworkResult> {
  const config = generationConfig;
  const count =
    input.questionCount != null
      ? Math.min(Math.max(1, input.questionCount), 50)
      : config.generatorQuestionCount;
  const { context, runId } = input;

  const generatorResult = await generateQuestions({
    count,
    context,
    runId,
    model: config.models.generator,
  });

  if (!generatorResult.ok) {
    return {
      ok: false,
      error: {
        message: generatorResult.error.message,
        type: generatorResult.error.type,
      },
    };
  }

  const questions = generatorResult.data;
  if (questions.length === 0) {
    return { ok: false, error: { message: "Generator returned no questions", type: "model_error" } };
  }

  const { persist } = input;
  await persist?.onQuestionsGenerated(questions);

  const userMessage = buildJudgeUserMessage(questions, context);

  const runAndPersist = async (
    dimension: JudgeDimension
  ): Promise<LlmCallResult<JudgePanelOutput>> => {
    const modelId =
      dimension === "novelty"
        ? config.models.noveltyJudge
        : dimension === "clarity"
          ? config.models.clarityJudge
          : config.models.toneJudge;
    const result = await runJudgeWithRetry(dimension, userMessage, modelId, runId);
    if (result.ok) {
      await persist?.onJudgeComplete(dimension, result.data);
    }
    return result;
  };

  const [noveltyResult, clarityResult, toneResult] = await Promise.all([
    runAndPersist("novelty"),
    runAndPersist("clarity"),
    runAndPersist("tone"),
  ]);

  const partial: PartialNetworkResult = {
    questions,
    ...(noveltyResult.ok && { novelty: noveltyResult.data }),
    ...(clarityResult.ok && { clarity: clarityResult.data }),
    ...(toneResult.ok && { tone: toneResult.data }),
  };

  if (!noveltyResult.ok) {
    return {
      ok: false,
      error: {
        message: noveltyResult.error.message,
        type: noveltyResult.error.type,
      },
      partial,
    };
  }
  if (!clarityResult.ok) {
    return {
      ok: false,
      error: {
        message: clarityResult.error.message,
        type: clarityResult.error.type,
      },
      partial,
    };
  }
  if (!toneResult.ok) {
    return {
      ok: false,
      error: {
        message: toneResult.error.message,
        type: toneResult.error.type,
      },
      partial,
    };
  }

  const n = questions.length;
  const { noveltyWeight, clarityWeight, toneWeight } = config.scoring;

  const scoresByIndex = new Map<
    number,
    { novelty: number; clarity: number; tone: number }
  >();
  for (const entry of noveltyResult.data.scores) {
    scoresByIndex.set(entry.questionIndex, {
      novelty: entry.score,
      clarity: 0,
      tone: 0,
    });
  }
  for (const entry of clarityResult.data.scores) {
    const existing = scoresByIndex.get(entry.questionIndex);
    if (existing) existing.clarity = entry.score;
  }
  for (const entry of toneResult.data.scores) {
    const existing = scoresByIndex.get(entry.questionIndex);
    if (existing) existing.tone = entry.score;
  }

  const minAcceptableScore = config.minAcceptableScore;
  const allCandidates: CandidateWithScores[] = [];
  for (let i = 0; i < n; i++) {
    const s = scoresByIndex.get(i) ?? { novelty: 0, clarity: 0, tone: 0 };
    const combinedScore =
      s.novelty * noveltyWeight +
      s.clarity * clarityWeight +
      s.tone * toneWeight;
    allCandidates.push({
      question: questions[i],
      questionIndex: i,
      combinedScore,
      novelty: s.novelty,
      clarity: s.clarity,
      tone: s.tone,
    });
  }

  allCandidates.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
    if (b.novelty !== a.novelty) return b.novelty - a.novelty;
    if (b.clarity !== a.clarity) return b.clarity - a.clarity;
    return b.tone - a.tone;
  });

  const aboveBenchmarkIndices = allCandidates
    .filter((c) => c.combinedScore >= minAcceptableScore)
    .map((c) => c.questionIndex)
    .sort((a, b) => a - b);

  const winner = allCandidates[0];
  const dailyQuestion = winner.question;

  const calls: NetworkCallMetrics[] = [];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalLatencyMs = 0;

  if (generatorResult.ok) {
    const u = generatorResult.usage;
    const p = generatorResult.performanceMetrics?.latencyMs ?? 0;
    const pt = u?.promptTokens ?? 0;
    const ct = u?.completionTokens ?? 0;
    const tt = u?.totalTokens ?? pt + ct;
    totalPromptTokens += pt;
    totalCompletionTokens += ct;
    totalLatencyMs += p;
    calls.push({
      operation: "generator",
      promptTokens: pt,
      completionTokens: ct,
      totalTokens: tt,
      latencyMs: p,
    });
  }
  for (const [label, result] of [
    ["judge-novelty", noveltyResult],
    ["judge-clarity", clarityResult],
    ["judge-tone", toneResult],
  ] as const) {
    if (result.ok) {
      const u = result.usage;
      const p = result.performanceMetrics?.latencyMs ?? 0;
      const pt = u?.promptTokens ?? 0;
      const ct = u?.completionTokens ?? 0;
      const tt = u?.totalTokens ?? pt + ct;
      totalPromptTokens += pt;
      totalCompletionTokens += ct;
      totalLatencyMs += p;
      calls.push({
        operation: label,
        promptTokens: pt,
        completionTokens: ct,
        totalTokens: tt,
        latencyMs: p,
      });
    }
  }

  const metrics: NetworkRunMetrics = {
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens: totalPromptTokens + totalCompletionTokens,
    totalLatencyMs,
    calls,
  };

  return {
    ok: true,
    dailyQuestion,
    allCandidates,
    aboveBenchmarkIndices,
    metrics,
    judgeOutputs: {
      novelty: noveltyResult.data,
      clarity: clarityResult.data,
      tone: toneResult.data,
    },
  };
}
