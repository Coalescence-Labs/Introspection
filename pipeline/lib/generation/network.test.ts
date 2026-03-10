import { expect, mock, test } from "bun:test";
import type { LLMGeneratedDailyQuestion } from "../schema";

const fiveQuestions: LLMGeneratedDailyQuestion[] = [
  { category: "reflection", simple_text: "Q1?" },
  { category: "patterns", simple_text: "Q2?" },
  { category: "learning", simple_text: "Q3?" },
  { category: "career", simple_text: "Q4?" },
  { category: "ideas", simple_text: "Q5?" },
];

function makeJudgeOutput(scores: { candidateId: string; score: number }[]) {
  return {
    scores: scores.map((s) => ({ candidateId: s.candidateId, score: s.score })),
  };
}

function makeJudgeOutputJson(scores: { candidateId: string; score: number }[]) {
  return JSON.stringify(makeJudgeOutput(scores));
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

const {
  assignCandidateIds,
  buildJudgeUserMessage,
  runDailyNetwork,
} = await import("./network");

test("buildJudgeUserMessage returns JSON payload with candidateId and optional context", () => {
  const candidates = assignCandidateIds(fiveQuestions);
  const msg = buildJudgeUserMessage(candidates);
  expect(msg).toContain("candidateId");
  expect(msg).toContain("Q1?");
  expect(msg).toContain("Q5?");
  expect(msg).toContain("cand_000");
  expect(msg).toContain("cand_004");
  const withContext = buildJudgeUserMessage(candidates, "Recent: A, B");
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
      const scores = [1, 2, 3, 4, 5].map((score, i) => ({
        candidateId: `cand_${String(i).padStart(3, "0")}`,
        score,
      }));
      return {
        ok: true as const,
        data: makeJudgeOutputJson(scores) as T,
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
    expect(result.partial?.questions).toHaveLength(5);
    expect(result.partial?.novelty).toBeDefined();
    expect(result.partial?.clarity).toBeDefined();
    expect(result.partial?.tone).toBeUndefined();
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
      performanceMetrics: { latencyMs: 50 },
    }),
  }));

  const noveltyScores = [1, 3, 5, 7, 9];
  const clarityScores = [2, 4, 6, 8, 10];
  const toneScores = [3, 5, 7, 9, 10];

  mock.module("../llm-metrics", () => ({
    executeLlmCall: async <T>(input: { operation: string }) => {
      let scores: { candidateId: string; score: number }[];
      if (input.operation === "judge-novelty") {
        scores = noveltyScores.map((score, i) => ({
          candidateId: `cand_${String(i).padStart(3, "0")}`,
          score,
        }));
      } else if (input.operation === "judge-clarity") {
        scores = clarityScores.map((score, i) => ({
          candidateId: `cand_${String(i).padStart(3, "0")}`,
          score,
        }));
      } else {
        scores = toneScores.map((score, i) => ({
          candidateId: `cand_${String(i).padStart(3, "0")}`,
          score,
        }));
      }
      return {
        ok: true as const,
        data: makeJudgeOutputJson(scores) as T,
        modelId: "openai/gpt-5.2",
        runId: undefined,
        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
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
  expect(result.metrics).toBeDefined();
  expect(result.metrics.totalTokens).toBe(30 + 150 * 3);
  expect(result.metrics.calls).toHaveLength(4);
  expect(result.metrics.totalLatencyMs).toBe(50 + 100 * 3);

  for (const c of result.allCandidates) {
    expect(c).toHaveProperty("candidateId");
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

  expect(result.judgeOutputs).toBeDefined();
  expect(result.judgeOutputs.novelty.scores).toHaveLength(5);
  expect(result.judgeOutputs.clarity.scores).toHaveLength(5);
  expect(result.judgeOutputs.tone.scores).toHaveLength(5);
});

test("runDailyNetwork with questionCount override uses that count and returns judgeOutputs", async () => {
  const twoQuestions: LLMGeneratedDailyQuestion[] = [
    { category: "reflection", simple_text: "A?" },
    { category: "learning", simple_text: "B?" },
  ];
  mock.module("../llm", () => ({
    generateQuestions: async () => ({
      ok: true as const,
      data: twoQuestions,
      modelId: "openai/gpt-5.2",
      runId: undefined,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      performanceMetrics: { latencyMs: 50 },
    }),
  }));

  mock.module("../llm-metrics", () => ({
    executeLlmCall: async <T>(input: { operation: string }) => {
      const scores = [7, 8].map((score, i) => ({
        candidateId: `cand_${String(i).padStart(3, "0")}`,
        score,
      }));
      return {
        ok: true as const,
        data: makeJudgeOutputJson(scores) as T,
        modelId: "openai/gpt-5.2",
        runId: undefined,
        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
        performanceMetrics: { latencyMs: 100 },
      };
    },
  }));

  const { runDailyNetwork: runWithMock } = await import("./network");
  const result = await runWithMock({ date: "2025-03-10", questionCount: 2 });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.allCandidates).toHaveLength(2);
  expect(result.dailyQuestion.simple_text).toBe("B?"); // higher combined 8+8+8
  expect(result.judgeOutputs.novelty.scores).toHaveLength(2);
  expect(result.judgeOutputs.clarity.scores).toHaveLength(2);
  expect(result.judgeOutputs.tone.scores).toHaveLength(2);
});

test("runDailyNetwork merges scores by candidateId when judge returns shuffled order", async () => {
  mock.module("../llm", () => ({
    generateQuestions: async () => ({
      ok: true as const,
      data: fiveQuestions,
      modelId: "openai/gpt-5.2",
      runId: undefined,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      performanceMetrics: { latencyMs: 50 },
    }),
  }));

  const noveltyByCandidateId: Record<string, number> = {
    cand_000: 3,
    cand_001: 5,
    cand_002: 1,
    cand_003: 9,
    cand_004: 7,
  };
  mock.module("../llm-metrics", () => ({
    executeLlmCall: async <T>(input: { operation: string }) => {
      const order = ["cand_002", "cand_000", "cand_001", "cand_004", "cand_003"];
      const scores =
        input.operation === "judge-novelty"
          ? order.map((candidateId) => ({
              candidateId,
              score: noveltyByCandidateId[candidateId] ?? 0,
            }))
          : [0, 1, 2, 3, 4].map((i) => ({
              candidateId: `cand_${String(i).padStart(3, "0")}`,
              score: 5,
            }));
      return {
        ok: true as const,
        data: makeJudgeOutputJson(scores) as T,
        modelId: "openai/gpt-5.2",
        runId: undefined,
        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
        performanceMetrics: { latencyMs: 100 },
      };
    },
  }));

  const { runDailyNetwork: runWithMock } = await import("./network");
  const result = await runWithMock({ date: "2025-03-10" });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const q1 = result.allCandidates.find((c) => c.question.simple_text === "Q1?");
  const q2 = result.allCandidates.find((c) => c.question.simple_text === "Q2?");
  const q3 = result.allCandidates.find((c) => c.question.simple_text === "Q3?");
  expect(q1?.candidateId).toBe("cand_000");
  expect(q1?.novelty).toBe(3);
  expect(q2?.candidateId).toBe("cand_001");
  expect(q2?.novelty).toBe(5);
  expect(q3?.candidateId).toBe("cand_002");
  expect(q3?.novelty).toBe(1);
});

test("runDailyNetwork returns invalid_judge_output when judge returns wrong candidateIds", async () => {
  mock.module("../llm", () => ({
    generateQuestions: async () => ({
      ok: true as const,
      data: fiveQuestions,
      modelId: "openai/gpt-5.2",
      runId: undefined,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      performanceMetrics: { latencyMs: 50 },
    }),
  }));

  mock.module("../llm-metrics", () => ({
    executeLlmCall: async <T>(input: { operation: string }) => {
      const scores =
        input.operation === "judge-novelty"
          ? [{ candidateId: "cand_000", score: 5 }, { candidateId: "cand_001", score: 5 }]
          : [0, 1, 2, 3, 4].map((i) => ({
              candidateId: `cand_${String(i).padStart(3, "0")}`,
              score: 5,
            }));
      return {
        ok: true as const,
        data: makeJudgeOutputJson(scores) as T,
        modelId: "openai/gpt-5.2",
        runId: undefined,
        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
        performanceMetrics: { latencyMs: 100 },
      };
    },
  }));

  const { runDailyNetwork: runWithMock } = await import("./network");
  const result = await runWithMock({ date: "2025-03-10" });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.type).toBe("invalid_judge_output");
    expect(result.error.message).toContain("validation failed");
    expect(result.error.message).toMatch(/missing|novelty/i);
  }
});
