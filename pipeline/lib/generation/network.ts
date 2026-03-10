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
  type JudgeScore,
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

/** A generated question with a stable pipeline-assigned id for judge merge. */
export interface Candidate {
  candidateId: string;
  questionIndex: number;
  question: LLMGeneratedDailyQuestion;
}

export interface CandidateWithScores {
  candidateId: string;
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

const CANDIDATE_ID_PAD = 3;

/** Assigns stable candidateIds (cand_000, cand_001, ...) to generated questions. */
export function assignCandidateIds(
  questions: LLMGeneratedDailyQuestion[]
): Candidate[] {
  const candidates: Candidate[] = questions.map((q, i) => ({
    candidateId: `cand_${String(i).padStart(CANDIDATE_ID_PAD, "0")}`,
    questionIndex: i,
    question: q,
  }));
  const uniqueIds = new Set(candidates.map((c) => c.candidateId));
  if (uniqueIds.size !== candidates.length) {
    throw new Error(
      `assignCandidateIds: duplicate candidateIds (expected ${candidates.length} unique)`
    );
  }
  return candidates;
}

/**
 * Build the shared user message for all three judges.
 * Each candidate includes candidateId, questionIndex, category, simple_text so the judge can key scores by candidateId.
 */
export function buildJudgeUserMessage(
  candidates: Candidate[],
  context?: string
): string {
  const payload = JSON.stringify(
    candidates.map((c) => ({
      candidateId: c.candidateId,
      questionIndex: c.questionIndex,
      category: c.question.category,
      simple_text: c.question.simple_text,
    })),
    null,
    2
  );
  let message = `Candidate questions (each has a stable candidateId; use it in your response to key scores):\n\n${payload}`;
  if (context?.trim()) {
    message += `\n\nContext:\n${context.trim()}`;
  }
  return message;
}

/** Thrown when judge output has wrong/missing/duplicate candidateIds. */
export class JudgeOutputValidationError extends Error {
  constructor(
    message: string,
    public readonly dimension: string,
    public readonly missing?: string[],
    public readonly extra?: string[],
    public readonly duplicates?: string[]
  ) {
    super(message);
    this.name = "JudgeOutputValidationError";
  }
}

const EXPECTED_CANDIDATE_ID_REGEX = /^cand_\d+$/;

/**
 * Validates that judge scores have exactly one entry per expected candidateId.
 * Throws JudgeOutputValidationError on duplicate, missing, or extra candidateIds.
 */
export function validateJudgeScoresByCandidateId(
  scores: JudgeScore[],
  expectedCandidateIds: Set<string>,
  dimension: string
): void {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const extra: string[] = [];

  for (const entry of scores) {
    const id = entry.candidateId;
    if (!EXPECTED_CANDIDATE_ID_REGEX.test(id)) {
      throw new JudgeOutputValidationError(
        `Judge ${dimension}: invalid candidateId "${id}" (expected format cand_000, cand_001, ...)`,
        dimension
      );
    }
    if (!expectedCandidateIds.has(id)) {
      extra.push(id);
      continue;
    }
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }

  const missing = [...expectedCandidateIds].filter((id) => !seen.has(id));

  if (duplicates.length > 0 || missing.length > 0 || extra.length > 0) {
    const parts: string[] = [];
    if (missing.length) parts.push(`missing: ${missing.join(", ")}`);
    if (extra.length) parts.push(`extra: ${extra.join(", ")}`);
    if (duplicates.length) parts.push(`duplicates: ${[...new Set(duplicates)].join(", ")}`);
    throw new JudgeOutputValidationError(
      `Judge ${dimension}: score-candidateId mismatch (${parts.join("; ")})`,
      dimension,
      missing.length ? missing : undefined,
      extra.length ? extra : undefined,
      duplicates.length ? [...new Set(duplicates)] : undefined
    );
  }

  if (scores.length !== expectedCandidateIds.size) {
    throw new JudgeOutputValidationError(
      `Judge ${dimension}: expected ${expectedCandidateIds.size} scores, got ${scores.length}`,
      dimension
    );
  }
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

  const candidates = assignCandidateIds(questions);
  const expectedCandidateIds = new Set(candidates.map((c) => c.candidateId));

  const { persist } = input;
  await persist?.onQuestionsGenerated(questions);

  const userMessage = buildJudgeUserMessage(candidates, context);

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

  try {
    validateJudgeScoresByCandidateId(
      noveltyResult.data.scores,
      expectedCandidateIds,
      "novelty"
    );
    validateJudgeScoresByCandidateId(
      clarityResult.data.scores,
      expectedCandidateIds,
      "clarity"
    );
    validateJudgeScoresByCandidateId(
      toneResult.data.scores,
      expectedCandidateIds,
      "tone"
    );
  } catch (err) {
    const message =
      err instanceof JudgeOutputValidationError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    return {
      ok: false,
      error: {
        message: `Judge output validation failed: ${message}`,
        type: "invalid_judge_output",
      },
      partial,
    };
  }

  const { noveltyWeight, clarityWeight, toneWeight } = config.scoring;
  const scoresByCandidateId = new Map<
    string,
    { novelty: number; clarity: number; tone: number }
  >();
  for (const entry of noveltyResult.data.scores) {
    scoresByCandidateId.set(entry.candidateId, {
      novelty: entry.score,
      clarity: 0,
      tone: 0,
    });
  }
  for (const entry of clarityResult.data.scores) {
    const existing = scoresByCandidateId.get(entry.candidateId);
    if (existing) existing.clarity = entry.score;
  }
  for (const entry of toneResult.data.scores) {
    const existing = scoresByCandidateId.get(entry.candidateId);
    if (existing) existing.tone = entry.score;
  }

  const minAcceptableScore = config.minAcceptableScore;
  const allCandidates: CandidateWithScores[] = [];
  for (const c of candidates) {
    const s =
      scoresByCandidateId.get(c.candidateId) ?? {
        novelty: 0,
        clarity: 0,
        tone: 0,
      };
    const combinedScore =
      s.novelty * noveltyWeight +
      s.clarity * clarityWeight +
      s.tone * toneWeight;
    allCandidates.push({
      candidateId: c.candidateId,
      question: c.question,
      questionIndex: c.questionIndex,
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
