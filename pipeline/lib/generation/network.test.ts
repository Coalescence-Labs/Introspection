import { expect, mock, test } from "bun:test";
import type { LLMGeneratedDailyQuestion } from "../schema";

const fiveQuestions: LLMGeneratedDailyQuestion[] = [
  { category: "reflection", simple_text: "Q1?" },
  { category: "patterns", simple_text: "Q2?" },
  { category: "learning", simple_text: "Q3?" },
  { category: "career", simple_text: "Q4?" },
  { category: "ideas", simple_text: "Q5?" },
];

function makeJudgeOutput(scores: { questionIndex: number; score: number }[]) {
  return JSON.stringify({
    scores: scores.map((s) => ({ questionIndex: s.questionIndex, score: s.score })),
  });
}

mock.module("../llm", () => ({
  generateQuestions: async () => ({
    ok: true as const,
    data: fiveQuestions,
    modelId: "openai/gpt-5.2",
    runId: undefined,
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
  }),
}));

mock.module("../llm-metrics", () => ({
  executeLlmCall: async <T>(input: { execute: () => Promise<{ data: T }> }) => {
    const result = await input.execute();
    return {
      ok: true as const,
      data: result.data,
      modelId: "openai/gpt-5.2",
      runId: undefined,
      performanceMetrics: { latencyMs: 100 },
    };
  },
}));

const { buildJudgeUserMessage, runDailyNetwork } = await import("./network");

test("buildJudgeUserMessage returns JSON payload and optional context", () => {
  const msg = buildJudgeUserMessage(fiveQuestions);
  expect(msg).toContain("Candidate questions (indexed 0 through 4)");
  expect(msg).toContain("Q1?");
  expect(msg).toContain("Q5?");
  const withContext = buildJudgeUserMessage(fiveQuestions, "Recent: A, B");
  expect(withContext).toContain("Context:");
  expect(withContext).toContain("Recent: A, B");
});

test("runDailyNetwork returns partial on judge failure so caller can persist", async () => {
  mock.module("../llm", () => ({
    generateQuestions: async () => ({
      ok: true as const,
      data: fiveQuestions,
      modelId: "openai/gpt-5.2",
      runId: undefined,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    }),
  }));
  mock.module("../llm-metrics", () => ({
    executeLlmCall: async <T>(input: { operation: string }) => {
      if (input.operation === "judge-tone") {
        return {
          ok: false as const,
          data: null,
          error: { message: "Tone judge failed", type: "model_error" as const },
          runId: undefined,
        } as unknown as import("../llm-metrics").LlmCallResult<T>;
      }
      const scores = [1, 2, 3, 4, 5].map((score, questionIndex) => ({ questionIndex, score }));
      return {
        ok: true as const,
        data: makeJudgeOutput(scores) as T,
        modelId: "openai/gpt-5.2",
        runId: undefined,
        performanceMetrics: { latencyMs: 100 },
      };
    },
  }));
  const { runDailyNetwork: runWithMock } = await import("./network");
  const result = await runWithMock({ date: "2025-03-10" });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.message).toContain("Tone judge");
    expect(result.partial).toBeDefined();
    expect(result.partial!.questions).toHaveLength(5);
    expect(result.partial!.novelty).toBeDefined();
    expect(result.partial!.clarity).toBeDefined();
    expect(result.partial!.tone).toBeUndefined();
  }
});

test("runDailyNetwork returns ok false when generator fails", async () => {
  const { runDailyNetwork: runWithMock } = await import("./network");
  mock.module("../llm", () => ({
    generateQuestions: async () => ({
      ok: false as const,
      data: null,
      error: { message: "Generator failed", type: "model_error" as const },
      runId: undefined,
    }),
  }));
  const result = await runWithMock({ date: "2025-03-10" });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.message).toBe("Generator failed");
  }
});

test("runDailyNetwork returns shape and compile/rank/benchmark", async () => {
  mock.module("../llm", () => ({
    generateQuestions: async () => ({
      ok: true as const,
      data: fiveQuestions,
      modelId: "openai/gpt-5.2",
      runId: undefined,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    }),
  }));

  const noveltyScores = [1, 3, 5, 7, 9];
  const clarityScores = [2, 4, 6, 8, 10];
  const toneScores = [3, 5, 7, 9, 10];

  mock.module("../llm-metrics", () => ({
    executeLlmCall: async <T>(input: { operation: string }) => {
      let scores: { questionIndex: number; score: number }[];
      if (input.operation === "judge-novelty") {
        scores = noveltyScores.map((score, questionIndex) => ({ questionIndex, score }));
      } else if (input.operation === "judge-clarity") {
        scores = clarityScores.map((score, questionIndex) => ({ questionIndex, score }));
      } else {
        scores = toneScores.map((score, questionIndex) => ({ questionIndex, score }));
      }
      return {
        ok: true as const,
        data: makeJudgeOutput(scores) as T,
        modelId: "openai/gpt-5.2",
        runId: undefined,
        performanceMetrics: { latencyMs: 100 },
      };
    },
  }));

  const { runDailyNetwork: runWithJudgeMocks } = await import("./network");
  const result = await runWithJudgeMocks({ date: "2025-03-10" });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.dailyQuestion).toBeDefined();
  expect(result.allCandidates).toHaveLength(5);
  expect(result.aboveBenchmarkIndices).toBeDefined();
  expect(Array.isArray(result.aboveBenchmarkIndices)).toBe(true);

  for (const c of result.allCandidates) {
    expect(c).toHaveProperty("question");
    expect(c).toHaveProperty("questionIndex");
    expect(c).toHaveProperty("combinedScore");
    expect(c).toHaveProperty("novelty");
    expect(c).toHaveProperty("clarity");
    expect(c).toHaveProperty("tone");
    expect(typeof c.combinedScore).toBe("number");
    expect(typeof c.novelty).toBe("number");
    expect(typeof c.clarity).toBe("number");
    expect(typeof c.tone).toBe("number");
  }

  for (let i = 1; i < result.allCandidates.length; i++) {
    expect(result.allCandidates[i].combinedScore).toBeLessThanOrEqual(
      result.allCandidates[i - 1].combinedScore
    );
  }

  const expectedCombined = (idx: number) =>
    noveltyScores[idx] + clarityScores[idx] + toneScores[idx];
  const sortedByScore = [...result.allCandidates].sort(
    (a, b) => b.combinedScore - a.combinedScore
  );
  expect(sortedByScore[0].combinedScore).toBe(expectedCombined(4));
  expect(sortedByScore[4].combinedScore).toBe(expectedCombined(0));
});
