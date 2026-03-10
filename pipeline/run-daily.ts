/**
 * Daily question pipeline: generate one question for a date via LLM, insert into Supabase, set as today.
 * Usage: bun run pipeline/run-daily.ts [YYYY-MM-DD]. Omit date to use today.
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and LLM gateway env (e.g. AI gateway key).
 * When config.networkEnabled is true, uses runDailyNetwork (generator + judges); else uses generateDailyQuestion.
 */

import type { PostgrestError } from "@supabase/supabase-js";
import type { GatewayModelId } from "ai";
import type { QuestionFeaturedHistory } from "@/lib/content/schema";
import { generationConfig } from "./config/generation";
import { runDailyNetwork } from "./lib/generation";
import {
  type GenerateDailyQuestionOutput,
  generateDailyQuestion,
  getCurrentDateString,
  validateDateString,
} from "./lib/llm";
import type { LLMGeneratedDailyQuestion } from "./lib/schema";
import {
  getRecentDailyQuestions,
  getRunByDate,
  insertGeneratedQuestion,
  insertGeneratedQuestions,
  recordRunResult,
  recordRunStart,
  setDailyQuestion,
} from "./lib/supabase/queries";

let runId: string | null = null;
const modelId: GatewayModelId = "openai/gpt-5.2";
let targetDate: string | undefined;

const RECORD_RUN_RESULT_MAX_ATTEMPTS = 3;

/** Calls recordRunResult with retries (exponential backoff). Throws after final failure. */
async function recordRunResultWithRetry(
  input: Parameters<typeof recordRunResult>[0]
): Promise<void> {
  for (let i = 0; i < RECORD_RUN_RESULT_MAX_ATTEMPTS; i++) {
    try {
      await recordRunResult(input);
      return;
    } catch {
      console.error(`Failed to record run result on attempt ${i + 1}`);
      if (i < RECORD_RUN_RESULT_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
      } else {
        throw new Error("Failed to record run result after 3 attempts");
      }
    }
  }
}

async function main() {
  /***
   * 1. Get target date, accept CLI arguments
   */

  targetDate = process.argv[2];

  if (!targetDate) {
    // Use today
    targetDate = getCurrentDateString();
  } else if (!validateDateString(targetDate)) {
    console.error("Invalid date format, must be YYYY-MM-DD");
    process.exit(1);
  }

  /**
   * 2. Record run start in supabase
   * Supabase has a unique constraint on date,
   * ensuring that idempotency per date
   */
  try {
    runId = await recordRunStart(targetDate);
    if (!runId) {
      throw new Error("Failed to record run start");
    }
  } catch (error) {
    if ((error as PostgrestError).code === "23505") {
      console.error(`Run already recorded for ${targetDate}`);

      const run = await getRunByDate(targetDate);
      if (run) {
        runId = run.id;
        switch (run.status) {
          case "error":
            console.log(`Retrying failed run for ${targetDate} with model ${run.model}`);
            try {
              await recordRunResultWithRetry({
                date: targetDate,
                status: "started",
                model: run.model,
                runId: run.id,
              });
            } catch {
              process.exit(1);
            }
            break;
          case "success":
            console.log(`Run already successful for ${targetDate}`);
            process.exit(0);
            break;
          case "started":
            console.log(`Run already started for ${targetDate}`);
            process.exit(0);
            break;
          default:
            console.error("Unknown run status", run.status);
            process.exit(1);
            break;
        }
      } else {
        console.error(`Run already recorded for ${targetDate} but could not load run record`);
        process.exit(1);
      }
    } else {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Failed to record run start for ${targetDate}: ${msg}`);
      console.error(`Error type: ${typeof error}`);
      process.exit(1);
    }
  }

  /**
   * 3. Gather recent daily questions from supabase
   */
  let recentDailyQuestions: QuestionFeaturedHistory[] = [];
  try {
    recentDailyQuestions = await getRecentDailyQuestions({ limit: 30 });
    if (recentDailyQuestions.length === 0) {
      console.log("No recent daily questions found");
    } else {
      console.log("");
    }
  } catch {
    console.warn("Failed to get recent daily questions, continuing with empty context");
    recentDailyQuestions = [];
  }

  let context = "";

  if (recentDailyQuestions.length > 0) {
    context = `Recent daily questions:\n`;

    context += recentDailyQuestions
      .map((question) => `- ${question.question.simple_text}`)
      .join("\n");
  }

  /**
   * 4. Generate: network (generator + judges) or legacy single call
   */
  if (generationConfig.networkEnabled) {
    const result = await runDailyNetwork({
      date: targetDate,
      context,
      runId: runId ?? undefined,
    });

    if (!result.ok) {
      console.error("Run ID", runId);
      console.error("Network failed:", result.error.message, result.error.type ?? "");
      const notes = result.partial?.questions.length
        ? `${result.error.message} (partial result available)`
        : result.error.message;
      try {
        await recordRunResultWithRetry({
          date: targetDate,
          status: "error",
          model: "network",
          runId,
          notes,
        });
      } catch {
        /* already logged */
      }
      process.exit(1);
    }

    const generatedQuestionData: LLMGeneratedDailyQuestion = result.dailyQuestion;
    let questionId: string | null = null;

    try {
      questionId = await insertGeneratedQuestion({
        question: {
          category: generatedQuestionData.category,
          simple_text: generatedQuestionData.simple_text,
          tags: [],
          cadence: "daily",
        },
      });
      if (!questionId) {
        throw new Error("Failed to insert generated question");
      }
    } catch {
      console.error(
        "Failed to insert generated question",
        JSON.stringify(generatedQuestionData, null, 2)
      );
      try {
        await recordRunResultWithRetry({
          date: targetDate,
          status: "error",
          model: "network",
          runId,
          notes: `Failed to insert generated question: ${JSON.stringify(generatedQuestionData, null, 2)}`,
        });
      } catch {
        /* already logged */
      }
      process.exit(1);
    }

    try {
      await setDailyQuestion({ questionId });
    } catch {
      console.error("Failed to set daily question", questionId);
      try {
        await recordRunResultWithRetry({
          date: targetDate,
          status: "error",
          model: "network",
          runId,
          notes: `Failed to set daily question: ${questionId}`,
        });
      } catch {
        /* already logged */
      }
      process.exit(1);
    }

    let libraryAdded = 0;
    if (generationConfig.postAboveBenchmarkToLibrary && result.aboveBenchmarkIndices.length > 0) {
      const winnerIndex = result.allCandidates[0].questionIndex;
      const nonWinnerAboveBenchmark = result.allCandidates.filter(
        (c) =>
          result.aboveBenchmarkIndices.includes(c.questionIndex) && c.questionIndex !== winnerIndex
      );
      if (nonWinnerAboveBenchmark.length > 0) {
        const ids = await insertGeneratedQuestions({
          questions: nonWinnerAboveBenchmark.map((c) => ({
            category: c.question.category,
            simple_text: c.question.simple_text,
            tags: [],
            cadence: "daily",
          })),
        });
        libraryAdded = ids.length;
      }
    }

    const topScore = result.allCandidates[0].combinedScore;
    let notes = `Generated question: ${generatedQuestionData.simple_text}`;
    notes += `\nTop combined score: ${topScore}`;
    if (libraryAdded > 0) {
      notes += `\n${libraryAdded} added to library`;
    }
    if (result.metrics.totalTokens > 0) {
      notes += `\nTokens: ${result.metrics.totalTokens}, latency: ${(result.metrics.totalLatencyMs / 1000).toFixed(1)}s`;
    }
    notes += `\nContext: ${context}`;

    await recordRunResultWithRetry({
      date: targetDate,
      status: "success",
      model: "network:generator+judges",
      runId,
      notes,
    });

    console.log("Daily question set successfully", questionId);
    process.exit(0);
  }

  /**
   * Legacy path: single generateDailyQuestion
   */
  let generatedQuestion: GenerateDailyQuestionOutput | null = null;
  try {
    generatedQuestion = await generateDailyQuestion({
      date: targetDate,
      runId,
      context,
      model: modelId,
    });
  } catch {
    generatedQuestion = null;
  }

  if (!generatedQuestion?.ok) {
    console.error("Run ID", runId);
    console.error(
      "Failed to generate daily question",
      JSON.stringify(generatedQuestion?.error, null, 2)
    );
    try {
      await recordRunResultWithRetry({
        date: targetDate,
        status: "error",
        model: modelId,
        runId,
      });
    } catch {
      /* already logged */
    }
    process.exit(1);
  }

  const generatedQuestionData: LLMGeneratedDailyQuestion = generatedQuestion.data;
  let questionId: string | null = null;

  try {
    questionId = await insertGeneratedQuestion({
      question: {
        category: generatedQuestionData.category,
        simple_text: generatedQuestionData.simple_text,
        tags: [],
        cadence: "daily",
      },
    });
    if (!questionId) {
      throw new Error("Failed to insert generated question");
    }
  } catch {
    console.error(
      "Failed to insert generated question",
      JSON.stringify(generatedQuestionData, null, 2)
    );
    try {
      await recordRunResultWithRetry({
        date: targetDate,
        status: "error",
        model: modelId,
        runId,
        notes: `Failed to insert generated question: ${JSON.stringify(generatedQuestionData, null, 2)}`,
      });
    } catch {
      /* already logged */
    }
    process.exit(1);
  }

  try {
    await setDailyQuestion({ questionId });
  } catch {
    console.error("Failed to set daily question", questionId);
    try {
      await recordRunResultWithRetry({
        date: targetDate,
        status: "error",
        model: modelId,
        runId,
        notes: `Failed to set daily question: ${questionId}`,
      });
    } catch {
      /* already logged */
    }
    process.exit(1);
  }

  let notes = `Generated question: ${generatedQuestionData.simple_text}`;
  notes += `\nContext: ${context}`;
  await recordRunResultWithRetry({
    date: targetDate,
    status: "success",
    model: generatedQuestion.modelId ?? "unknown",
    runId,
    notes,
  });

  console.log("Daily question set successfully", questionId);
  process.exit(0);
}

main().catch(async (error) => {
  try {
    await recordRunResultWithRetry({
      status: "error",
      model: "unknown",
      date: targetDate,
      runId: runId ?? "",
    });
  } catch {
    console.error("Failed to record run result on error");
  }
  console.error("Fatal error", error);
  process.exit(1);
});
