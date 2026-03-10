import { GatewayModelId, generateText, Output } from "ai";
import { LLMGeneratedDailyQuestion, LLMGeneratedDailyQuestionArray } from "./schema";
import { DAILY_GENERATOR_PROMPT, EXPANSIVE_GENERATOR_PROMPT } from "./prompts";
import {
  executeLlmCall,
  type LlmCallFailure,
  type LlmCallResult,
  type LlmCallSuccess,
  type LlmPerformanceMetrics,
} from "./llm-metrics";

const DEFAULT_MODEL: GatewayModelId = "openai/gpt-5.2"

interface GenerateDailyQuestionInput {
  date: string; // YYYY-MM-DD
  model?: GatewayModelId;
  runId?: string;
  attempt?: number;
  context?: string;
}

export type GenerateDailyQuestionOutput =
  | (LlmCallSuccess<LLMGeneratedDailyQuestion> & {
      dateGeneratedFor: string;
    })
  | LlmCallFailure;

/**
 * Call the LLM to generate a single daily question for the given date.
 * Validates date; builds prompt with optional context; returns parsed schema or error with metrics.
 */
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
  const performanceMetrics: Omit<LlmPerformanceMetrics, "latencyMs"> = {
    inputValidationLatencyMs,
    promptGenerationLatencyMs,
  };

  const result = await executeLlmCall({
    operation: "generateDailyQuestion",
    modelId,
    runId: input.runId,
    performanceMetrics,
    errorMessage: "Failed to generate daily question",
    execute: async () => {
      const llmResponse = await generateText({
        model: modelId,
        system: DAILY_GENERATOR_PROMPT,
        prompt: userPrompt,
        maxOutputTokens: 1200,
        output: Output.object({ schema: LLMGeneratedDailyQuestion }),
        temperature: 0.9,
        presencePenalty: 0.6
      });

      return {
        data: llmResponse.output,
        rawText: llmResponse.text,
        usage: llmResponse.totalUsage,
      };
    },
  });

  if (!result.ok) {
    return result;
  }

  return {
    ...result,
    dateGeneratedFor: date,
  };
}

// ---------------------------------------------------------------------------
// Batch generation (array of questions in one call)
// ---------------------------------------------------------------------------

export interface GenerateQuestionsInput {
  model?: GatewayModelId;
  runId?: string;
  context?: string;
  /** Number of questions to generate (default 5) */
  count?: number;
}

export type GenerateQuestionsOutput = LlmCallResult<LLMGeneratedDailyQuestion[]>;

export async function generateQuestions(
  input: GenerateQuestionsInput
): Promise<GenerateQuestionsOutput> {
  const count = Math.min(Math.max(1, input.count ?? 5), 20);
  const modelId = input.model ?? DEFAULT_MODEL;

  const startPromptGeneration = performance.now();
  const userPrompt = buildUserPromptForBatch(count, input.context);
  const endPromptGeneration = performance.now();
  const promptGenerationLatencyMs = endPromptGeneration - startPromptGeneration;

  return executeLlmCall({
    operation: "generateQuestions",
    modelId,
    runId: input.runId,
    performanceMetrics: {
      promptGenerationLatencyMs,
    },
    errorMessage: "Failed to generate questions",
    execute: async () => {
      const llmResponse = await generateText({
        model: modelId,
        system: EXPANSIVE_GENERATOR_PROMPT,
        prompt: userPrompt,
        maxOutputTokens: 4000,
        output: Output.object({ schema: LLMGeneratedDailyQuestionArray }),
        temperature: 0.9,
        presencePenalty: 0.6,
      });

      return {
        data: llmResponse.output.questions,
        rawText: llmResponse.text,
        usage: llmResponse.totalUsage,
      };
    },
  });
}

/**
 * Build the user prompt for the daily-question generator. Optional context (e.g. recent daily questions) is appended.
 * Future: add more dynamic context (recent questions, diversity hints).
 */
function buildUserPrompt(context?: string): string {
  let prompt = `Draft 3 candidates internally, pick the best, output only final JSON.`;
  if (context) {
    prompt += `\nContext: \n${context}`;
  }
  return prompt;
}

/**
 * Prompt for generating multiple questions in one call. Output must be JSON with a "questions" array.
 */
function buildUserPromptForBatch(count: number, context?: string): string {
  let prompt = `Generate exactly ${count} distinct questions. Output only valid JSON with a single key "questions" whose value is an array of ${count} objects. Each object must match the schema (category, simple_text). Ensure variety: different angles, categories, and phrasing. Do not duplicate or lightly rephrase.`;
  if (context) {
    prompt += `\nContext:\n${context}`;
  }
  return prompt;
}

/** Current date in YYYY-MM-DD (ISO slice). Used by pipeline when no date is provided. */
export function getCurrentDateString(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

/** Returns true if dateString is YYYY-MM-DD with valid calendar date (e.g. month 1–12, day valid for month/year). */
export function validateDateString(dateString: string): boolean {
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