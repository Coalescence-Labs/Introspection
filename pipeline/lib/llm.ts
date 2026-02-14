import { GatewayModelId, generateText, Output, NoObjectGeneratedError } from "ai";
import { LLMGeneratedDailyQuestion } from "./schema";
import { DAILY_GENERATOR_PROMPT } from "./prompt";

const DEFAULT_MODEL: GatewayModelId = "openai/gpt-5.2"

interface GenerateDailyQuestionInput {
  date: string; // YYYY-MM-DD
  model?: GatewayModelId;
  runId?: string;
  attempt?: number;
  context?: string;
}

type ErrorType = "invalid_input" | "model_error" | "rate_limit_exceeded" | "internal_error" | "unknown";

type PerformanceMetrics = {
  latencyMs?: number;
  inputValidationLatencyMs?: number;
  promptGenerationLatencyMs?: number;
}

type UsageMetrics = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
}

export type GenerateDailyQuestionOutput =
  | {
      ok: true;
      data: LLMGeneratedDailyQuestion;
      dateGeneratedFor: string;
      rawText?: string;
      modelId?: GatewayModelId;
      performanceMetrics?: PerformanceMetrics;
      usage?: UsageMetrics;
      runId?: string;
    }
  | {
      ok: false;
      data: null;
      rawText?: string;
      modelId?: GatewayModelId;
      performanceMetrics?: PerformanceMetrics;
      usage?: UsageMetrics;
      error: {
        message: string;
        type: ErrorType;
        code?: number;
        param?: string;
        value?: string;
        raw_error?: unknown;
      };
      runId?: string;
    };

export async function generateDailyQuestion(input: GenerateDailyQuestionInput): Promise<GenerateDailyQuestionOutput> {
  const startTime = performance.now();

  let date: string;
  
  try {
    if (!input.date) throw new Error("No date specified");
    if (!validateDateString(input.date)) {
      return {
        ok: false,
        data: null,
        error: {
          message: "Invalid date format",
          type: "invalid_input",
        },
        runId: input.runId,
      }
    }
    date = input.date;
  } catch (err) {
    date = getCurrentDateString();
  }
  
  const modelId = input.model || DEFAULT_MODEL;

  const endInputValidation = performance.now();
  const inputValidationLatencyMs = endInputValidation - startTime;

  const startPromptGeneration = performance.now();
  const userPrompt = buildUserPrompt(input.context);
  const endPromptGeneration = performance.now();

  const promptGenerationLatencyMs = endPromptGeneration - startPromptGeneration;

  try {
    const startLLMCall = performance.now();
    const llmResponse = await generateText({
      model: modelId,
      system: DAILY_GENERATOR_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 1200,
      output: Output.object({ schema: LLMGeneratedDailyQuestion }),
      temperature: 0.9,
      presencePenalty: 0.6
    });
    const endLLMCall = performance.now();

    const latencyMs = endLLMCall - startLLMCall;

    const usage = llmResponse.totalUsage;
    
    return {
      ok: true,
      data: llmResponse.output,
      dateGeneratedFor: date,
      rawText: llmResponse.text,
      usage: {
        completionTokens: usage.outputTokens,
        promptTokens: usage.inputTokens,
        totalTokens: usage.totalTokens,
      },
      modelId: modelId,
      performanceMetrics: {
        inputValidationLatencyMs,
        promptGenerationLatencyMs,
        latencyMs,
      },
      runId: input.runId,
    }


  } catch (err) {
    console.error("Failed to generate daily question", JSON.stringify(err, null, 2));
    if (NoObjectGeneratedError.isInstance(err)) {
      console.log('NoObjectGeneratedError');
      console.log('Cause:', err.cause);
      console.log('Text:', err.text);
      console.log('Response:', err.response);
      console.log('Usage:', err.usage);

      return {
        ok: false,
        data: null,
        error: {
          message: "Failed to generate daily question",
          type: "model_error",
          raw_error: err,
        },
        runId: input.runId,
      }
    }

    return {
      ok: false,
      data: null,
      error: {
        message: "Failed to generate daily question",
        type: "model_error",
      },
      runId: input.runId,
    }
  }

  return {
    ok: false,
    data: null,
    error: {
      message: "Unreachable code path",
      type: "internal_error",
    },
    runId: input.runId,
  }

}

/**
 * TODO: Add in further dynamic context on recent daily questions
 * 
 */
function buildUserPrompt(context?: string): string {
  let prompt = `Draft 3 candidates internally, pick the best, output only final JSON.`;
  if (context) {
    prompt += `\nContext: \n${context}`;
  }
  return prompt;
}

// Helper functions, TODO: Move to utils
export function getCurrentDateString(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function validateDateString(dateString: string): boolean {
  // Verify it is in proper structure YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  // Verify it is a valid date
  // Ensure month is 1-12, day is 1-31, and year is 1970-3050
  const [year, month, day] = dateString.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (year < 1970 || year > 3050) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) return false;
  if (month === 2) {
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
      if (day > 29) return false;
    } else {
      if (day > 28) return false;
    }
  }
  return true;
}