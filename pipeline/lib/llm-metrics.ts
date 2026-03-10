import type { GatewayModelId } from "ai";
import { NoObjectGeneratedError } from "ai";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export type ErrorType =
  | "invalid_input"
  | "model_error"
  | "rate_limit_exceeded"
  | "internal_error"
  | "unknown";

export type LlmPerformanceMetrics = {
  latencyMs?: number;
  inputValidationLatencyMs?: number;
  promptGenerationLatencyMs?: number;
};

export type LlmUsageMetrics = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
};

export type LlmCallError = {
  message: string;
  type: ErrorType;
  code?: number;
  param?: string;
  value?: string;
  raw_error?: unknown;
};

export type LlmCallSuccess<T> = {
  ok: true;
  data: T;
  rawText?: string;
  modelId?: GatewayModelId;
  performanceMetrics?: LlmPerformanceMetrics;
  usage?: LlmUsageMetrics;
  runId?: string;
};

export type LlmCallFailure = {
  ok: false;
  data: null;
  rawText?: string;
  modelId?: GatewayModelId;
  performanceMetrics?: LlmPerformanceMetrics;
  usage?: LlmUsageMetrics;
  error: LlmCallError;
  runId?: string;
};

export type LlmCallResult<T> = LlmCallSuccess<T> | LlmCallFailure;

type UsageLike = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  totalCostInUSD?: number;
};

type ExecuteLlmCallSuccess<T> = {
  data: T;
  rawText?: string;
  usage?: UsageLike;
};

type ExecuteLlmCallInput<T> = {
  operation: string;
  modelId: GatewayModelId;
  runId?: string;
  performanceMetrics?: Omit<LlmPerformanceMetrics, "latencyMs">;
  errorMessage: string;
  execute: () => Promise<ExecuteLlmCallSuccess<T>>;
};

type LlmLogEntry = {
  timestamp: string;
  operation: string;
  modelId: string;
  runId?: string;
  ok: boolean;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  errorType?: ErrorType;
  errorMessage?: string;
};

function normalizeUsage(usage?: UsageLike): LlmUsageMetrics | undefined {
  if (!usage) return undefined;

  return {
    promptTokens: usage.inputTokens,
    completionTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    cost: usage.totalCostInUSD,
  };
}

function extractField(
  error: unknown,
  key: "code" | "param" | "value"
): string | number | undefined {
  if (!error || typeof error !== "object" || !(key in error)) {
    return undefined;
  }

  const value = (error as Record<string, unknown>)[key];
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return undefined;
}

function normalizeError(error: unknown, fallbackMessage: string): LlmCallError {
  const message =
    error instanceof Error && error.message ? error.message : fallbackMessage;

  return {
    message: fallbackMessage,
    type: "model_error",
    code: typeof extractField(error, "code") === "number"
      ? (extractField(error, "code") as number)
      : undefined,
    param: typeof extractField(error, "param") === "string"
      ? (extractField(error, "param") as string)
      : undefined,
    value: typeof extractField(error, "value") === "string"
      ? (extractField(error, "value") as string)
      : undefined,
    raw_error: error instanceof Error ? error : error ?? message,
  };
}

function resolveLogPath(): string | null {
  const explicitPath = process.env.INTROSPECTION_LLM_LOG_PATH?.trim();
  if (explicitPath) return explicitPath;

  const logDir = process.env.INTROSPECTION_LLM_LOG_DIR?.trim();
  if (!logDir) return null;

  const dateKey = new Date().toISOString().slice(0, 10);
  return join(logDir, `llm-${dateKey}.jsonl`);
}

async function appendLlmLog(entry: LlmLogEntry): Promise<void> {
  const logPath = resolveLogPath();
  if (!logPath) return;

  try {
    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.warn("Failed to append LLM log entry", error);
  }
}

export async function executeLlmCall<T>({
  operation,
  modelId,
  runId,
  performanceMetrics,
  errorMessage,
  execute,
}: ExecuteLlmCallInput<T>): Promise<LlmCallResult<T>> {
  const startTime = performance.now();

  try {
    const result = await execute();
    const latencyMs = performance.now() - startTime;
    const usage = normalizeUsage(result.usage);
    const mergedMetrics: LlmPerformanceMetrics = {
      ...performanceMetrics,
      latencyMs,
    };

    await appendLlmLog({
      timestamp: new Date().toISOString(),
      operation,
      modelId,
      runId,
      ok: true,
      latencyMs,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
      cost: usage?.cost,
    });

    return {
      ok: true,
      data: result.data,
      rawText: result.rawText,
      usage,
      modelId,
      performanceMetrics: mergedMetrics,
      runId,
    };
  } catch (error) {
    const latencyMs = performance.now() - startTime;
    const mergedMetrics: LlmPerformanceMetrics = {
      ...performanceMetrics,
      latencyMs,
    };
    const normalizedError = normalizeError(error, errorMessage);
    const noObjectError = NoObjectGeneratedError.isInstance(error) ? error : null;
    const usage = normalizeUsage(noObjectError?.usage as UsageLike | undefined);
    const rawText = noObjectError?.text;

    console.error(`${operation} failed`, JSON.stringify(error, null, 2));

    await appendLlmLog({
      timestamp: new Date().toISOString(),
      operation,
      modelId,
      runId,
      ok: false,
      latencyMs,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
      cost: usage?.cost,
      errorType: normalizedError.type,
      errorMessage: normalizedError.message,
    });

    return {
      ok: false,
      data: null,
      rawText,
      usage,
      modelId,
      performanceMetrics: mergedMetrics,
      error: normalizedError,
      runId,
    };
  }
}
