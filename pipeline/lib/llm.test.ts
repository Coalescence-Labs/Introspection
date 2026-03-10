import { expect, mock, test } from "bun:test";
import type { LLMGeneratedDailyQuestion } from "./schema";

type GenerateTextResult = {
  output: unknown;
  text: string;
  totalUsage: { inputTokens: number; outputTokens: number; totalTokens: number };
};

const generateTextResults: (GenerateTextResult | { throw: Error })[] = [];

mock.module("ai", () => {
  const ai = require("ai");
  return {
    ...ai,
    generateText: async (_opts: { system?: string; prompt?: string }) => {
      const preset = generateTextResults.shift();
      if (preset && "throw" in preset) throw preset.throw;
      if (preset && "output" in preset) return preset;
      return {
        output: { category: "reflection", simple_text: "Fallback?" },
        text: "raw",
        totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
      };
    },
    Output: ai.Output,
  };
});

const { generateDailyQuestion, generateQuestions, getCurrentDateString, validateDateString } =
  await import("./llm");

test("validateDateString rejects malformed dates", () => {
  expect(validateDateString("not-a-date")).toBe(false);
  expect(validateDateString("2025-13-01")).toBe(false);
  expect(validateDateString("2025-00-15")).toBe(false);
  expect(validateDateString("2025-02-30")).toBe(false);
  expect(validateDateString("")).toBe(false);
});

test("validateDateString accepts valid YYYY-MM-DD", () => {
  expect(validateDateString("2025-02-14")).toBe(true);
  expect(validateDateString("1970-01-01")).toBe(true);
  expect(validateDateString("2025-12-31")).toBe(true);
});

test("getCurrentDateString returns YYYY-MM-DD", () => {
  const s = getCurrentDateString();
  expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(validateDateString(s)).toBe(true);
});

test("generateDailyQuestion returns invalid_input for malformed date", async () => {
  generateTextResults.length = 0;

  const result = await generateDailyQuestion({
    date: "2025-13-01",
    runId: "r1",
  });

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.error.type).toBe("invalid_input");
  expect(result.error.message).toContain("Invalid date");
});

test("generateDailyQuestion falls back to getCurrentDateString when date missing", async () => {
  generateTextResults.length = 0;
  const today = getCurrentDateString();
  const successQuestion: LLMGeneratedDailyQuestion = {
    category: "reflection",
    simple_text: "What did you learn?",
  };
  generateTextResults.push({
    output: successQuestion,
    text: "raw",
    totalUsage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
  });

  const result = await generateDailyQuestion({
    date: "",
    runId: "r2",
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.dateGeneratedFor).toBe(today);
  expect(result.data?.simple_text).toBe("What did you learn?");
});

test("generateDailyQuestion adds dateGeneratedFor on success", async () => {
  generateTextResults.length = 0;
  const q: LLMGeneratedDailyQuestion = {
    category: "career",
    simple_text: "What step will you take next?",
  };
  generateTextResults.push({
    output: q,
    text: "raw",
    totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
  });

  const result = await generateDailyQuestion({
    date: "2025-03-10",
    runId: "r3",
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.dateGeneratedFor).toBe("2025-03-10");
  expect(result.data?.simple_text).toBe("What step will you take next?");
});

test("generateDailyQuestion preserves failure from wrapper", async () => {
  generateTextResults.length = 0;
  generateTextResults.push({ throw: new Error("Model error") });
  const badResult = await generateDailyQuestion({
    date: "2025-03-10",
    runId: "r4",
  });
  expect(badResult.ok).toBe(false);
  if (badResult.ok) return;
  expect(badResult.error.type).toBe("model_error");
  expect(badResult.error.message).toContain("Failed to generate");
});

test("generateQuestions clamps count to 1..20", async () => {
  generateTextResults.length = 0;
  const oneQuestion: LLMGeneratedDailyQuestion[] = [{ category: "reflection", simple_text: "Q1?" }];
  const twentyQuestions: LLMGeneratedDailyQuestion[] = Array.from({ length: 20 }, (_, i) => ({
    category: "reflection" as const,
    simple_text: `Q${i + 1}?`,
  }));
  generateTextResults.push({
    output: { questions: oneQuestion },
    text: "raw",
    totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
  });
  generateTextResults.push({
    output: { questions: twentyQuestions },
    text: "raw",
    totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
  });

  const resultZero = await generateQuestions({ count: 0 });
  expect(resultZero.ok).toBe(true);
  if (!resultZero.ok) return;
  expect((resultZero.data as unknown[]).length).toBe(1);

  const resultHuge = await generateQuestions({ count: 100 });
  expect(resultHuge.ok).toBe(true);
  if (!resultHuge.ok) return;
  expect((resultHuge.data as unknown[]).length).toBe(20);
});

test("generateQuestions unwraps questions array from parsed result", async () => {
  generateTextResults.length = 0;
  const questions: LLMGeneratedDailyQuestion[] = [
    { category: "a", simple_text: "First?" },
    { category: "b", simple_text: "Second?" },
  ];
  generateTextResults.push({
    output: { questions },
    text: "raw",
    totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
  });

  const result = await generateQuestions({
    count: 2,
    runId: "r5",
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.data).toHaveLength(2);
  expect(result.data[0].simple_text).toBe("First?");
  expect(result.data[1].simple_text).toBe("Second?");
});

test("generateQuestions preserves failure when wrapper returns error", async () => {
  generateTextResults.length = 0;
  generateTextResults.push({ throw: new Error("Rate limit") });
  const result = await generateQuestions({ count: 3, runId: "r6" });
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.error.type).toBe("model_error");
  expect(result.data).toBeNull();
});
