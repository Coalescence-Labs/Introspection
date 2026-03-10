import { expect, mock, test } from "bun:test";

const appendFileCalls: { path: string; data: string }[] = [];
const mkdirCalls: string[] = [];

mock.module("node:fs/promises", () => ({
  appendFile: async (path: string, data: string) => {
    appendFileCalls.push({ path, data });
  },
  mkdir: async (path: string) => {
    mkdirCalls.push(path);
  },
}));

const { executeLlmCall: executeLlmCallWithMockedFs } = await import("./llm-metrics");

test("executeLlmCall success path returns data and normalized metadata", async () => {
  const result = await executeLlmCallWithMockedFs({
    operation: "testOp",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    runId: "run-1",
    performanceMetrics: { promptGenerationLatencyMs: 5 },
    errorMessage: "fail",
    execute: async () => ({
      data: { foo: "bar" },
      rawText: "raw",
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
        totalCostInUSD: 0.001,
      },
    }),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.data).toEqual({ foo: "bar" });
  expect(result.rawText).toBe("raw");
  expect(result.modelId).toBe("openai/gpt-4");
  expect(result.runId).toBe("run-1");
  expect(result.usage).toEqual({
    promptTokens: 10,
    completionTokens: 20,
    totalTokens: 30,
    cost: 0.001,
  });
  expect(result.performanceMetrics?.promptGenerationLatencyMs).toBe(5);
  expect(typeof result.performanceMetrics?.latencyMs).toBe("number");
});

test("executeLlmCall normalizes usage from inputTokens/outputTokens", async () => {
  const result = await executeLlmCallWithMockedFs({
    operation: "usageTest",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    errorMessage: "fail",
    execute: async () => ({
      data: null,
      usage: {
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
      },
    }),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.usage?.promptTokens).toBe(100);
  expect(result.usage?.completionTokens).toBe(200);
  expect(result.usage?.totalTokens).toBe(300);
});

test("executeLlmCall includes latencyMs in performanceMetrics on success", async () => {
  const result = await executeLlmCallWithMockedFs({
    operation: "latencyTest",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    errorMessage: "fail",
    execute: async () => ({ data: 1 }),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(typeof result.performanceMetrics?.latencyMs).toBe("number");
  expect((result.performanceMetrics?.latencyMs ?? 0) >= 0).toBe(true);
});

test("executeLlmCall returns normalized error on generic throw", async () => {
  const result = await executeLlmCallWithMockedFs({
    operation: "errorOp",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    runId: "run-err",
    errorMessage: "Custom fail message",
    execute: async () => {
      throw new Error("inner");
    },
  });

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.data).toBeNull();
  expect(result.error.message).toBe("Custom fail message");
  expect(result.error.type).toBe("model_error");
  expect(result.runId).toBe("run-err");
  expect(typeof result.performanceMetrics?.latencyMs).toBe("number");
});

test("executeLlmCall does not write log when env vars unset", async () => {
  const prevPath = process.env.INTROSPECTION_LLM_LOG_PATH;
  const prevDir = process.env.INTROSPECTION_LLM_LOG_DIR;
  delete process.env.INTROSPECTION_LLM_LOG_PATH;
  delete process.env.INTROSPECTION_LLM_LOG_DIR;

  appendFileCalls.length = 0;
  mkdirCalls.length = 0;

  await executeLlmCallWithMockedFs({
    operation: "noLogOp",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    errorMessage: "fail",
    execute: async () => ({ data: 1 }),
  });

  if (prevPath !== undefined) process.env.INTROSPECTION_LLM_LOG_PATH = prevPath;
  if (prevDir !== undefined) process.env.INTROSPECTION_LLM_LOG_DIR = prevDir;

  expect(appendFileCalls.length).toBe(0);
});

test("executeLlmCall writes one JSONL entry when INTROSPECTION_LLM_LOG_PATH set", async () => {
  const prev = process.env.INTROSPECTION_LLM_LOG_PATH;
  process.env.INTROSPECTION_LLM_LOG_PATH = "/tmp/intro-llm-test.jsonl";
  appendFileCalls.length = 0;
  mkdirCalls.length = 0;

  await executeLlmCallWithMockedFs({
    operation: "logOp",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    runId: "run-log",
    errorMessage: "fail",
    execute: async () => ({
      data: 1,
      usage: { inputTokens: 1, outputTokens: 2 },
    }),
  });

  if (prev !== undefined) process.env.INTROSPECTION_LLM_LOG_PATH = prev;
  else delete process.env.INTROSPECTION_LLM_LOG_PATH;

  expect(appendFileCalls.length).toBe(1);
  expect(appendFileCalls[0].path).toBe("/tmp/intro-llm-test.jsonl");
  const entry = JSON.parse(appendFileCalls[0].data.trim()) as Record<string, unknown>;
  expect(entry.operation).toBe("logOp");
  expect(entry.modelId).toBe("openai/gpt-4");
  expect(entry.runId).toBe("run-log");
  expect(entry.ok).toBe(true);
  expect(typeof entry.latencyMs).toBe("number");
  expect(entry.promptTokens).toBe(1);
  expect(entry.completionTokens).toBe(2);
});

test("executeLlmCall writes error log entry on failure when log path set", async () => {
  const prev = process.env.INTROSPECTION_LLM_LOG_PATH;
  process.env.INTROSPECTION_LLM_LOG_PATH = "/tmp/intro-llm-err.jsonl";
  appendFileCalls.length = 0;

  await executeLlmCallWithMockedFs({
    operation: "errLogOp",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    errorMessage: "Expected fail",
    execute: async () => {
      throw new Error("boom");
    },
  });

  if (prev !== undefined) process.env.INTROSPECTION_LLM_LOG_PATH = prev;
  else delete process.env.INTROSPECTION_LLM_LOG_PATH;

  expect(appendFileCalls.length).toBe(1);
  const entry = JSON.parse(appendFileCalls[0].data.trim()) as Record<string, unknown>;
  expect(entry.ok).toBe(false);
  expect(entry.errorType).toBe("model_error");
  expect(entry.errorMessage).toBe("Expected fail");
});

test("executeLlmCall passthrough rawText and usage when NoObjectGeneratedError is thrown", async () => {
  const NoObjectGeneratedError = (await import("ai")).NoObjectGeneratedError;
  const err = new Error("parse failed") as Error & {
    text?: string;
    usage?: { inputTokens?: number; outputTokens?: number };
  };
  err.text = "raw model text";
  err.usage = { inputTokens: 5, outputTokens: 10 };

  const result = await executeLlmCallWithMockedFs({
    operation: "noObjectOp",
    modelId: "openai/gpt-4" as import("ai").GatewayModelId,
    errorMessage: "No object",
    execute: async () => {
      throw err;
    },
  });

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.error.type).toBe("model_error");
  if (!NoObjectGeneratedError.isInstance(err)) {
    expect(result.rawText).toBeUndefined();
    expect(result.usage).toBeUndefined();
    return;
  }
  expect(result.rawText).toBe("raw model text");
  expect(result.usage?.promptTokens).toBe(5);
  expect(result.usage?.completionTokens).toBe(10);
});
