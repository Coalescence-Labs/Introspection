/**
 * Daily question pipeline: generate one question for a date via LLM, insert into Supabase, set as today.
 * Usage: bun run pipeline/run-daily.ts [YYYY-MM-DD]. Omit date to use today.
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and LLM gateway env (e.g. AI gateway key).
 */

import { QuestionFeaturedHistory } from "@/lib/content/schema";
import { generateDailyQuestion, type GenerateDailyQuestionOutput, getCurrentDateString, validateDateString } from "./lib/llm";
import { getRecentDailyQuestions, getRunByDate, hasRunForDate, insertGeneratedQuestion, recordRunResult, recordRunStart, setDailyQuestion } from "./lib/supabase/queries";
import { LLMGeneratedDailyQuestion } from "./lib/schema";
import { PostgrestError } from "@supabase/supabase-js";
import { GatewayModelId } from "ai";

let runId: string | null = null;
const modelId: GatewayModelId = "openai/gpt-5.2";
let targetDate: string | undefined = undefined;

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
      console.error(`Run already recorded for ${targetDate}`)

      const run = await getRunByDate(targetDate);
      if (run) {
        runId = run.id;
        switch (run.status) {
          case "error":
            console.log(`Retrying failed run for ${targetDate} with model ${run.model}`);
            await recordRunResult({ date: targetDate, status: "started", model: run.model, runId: run.id });
            break;
          case "success":
            console.log(`Run already successful for ${targetDate}`);
            process.exit(0)
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
        console.log("")
    }
  } catch {
    console.warn("Failed to get recent daily questions, continuing with empty context");
    recentDailyQuestions = []
  }

  let context = "";

  if (recentDailyQuestions.length > 0) {
  context = `Recent daily questions:\n`;
  
  context += recentDailyQuestions.map((question) => `- ${question.question.simple_text}`).join("\n");
  }

  /**
   * 4. Call generateDailyQuestion
   */
  let generatedQuestion: GenerateDailyQuestionOutput | null = null;
  try {
    generatedQuestion = await generateDailyQuestion({ date: targetDate, runId, context, model: modelId });
  } catch {
    generatedQuestion = null;
  }

  /***
   * 5. Store result in supabase
   */
  if (!generatedQuestion?.ok) {
    console.error("Run ID", runId);
    console.error("Failed to generate daily question", JSON.stringify(generatedQuestion?.error, null, 2));

    // Clean up run
    await recordRunResult({ date: targetDate, status: "error", model: modelId, runId });

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
    console.error("Failed to insert generated question", JSON.stringify(generatedQuestionData, null, 2));
    await recordRunResult({ date: targetDate, status: "error", model: modelId, runId, notes: `Failed to insert generated question: ${JSON.stringify(generatedQuestionData, null, 2)}` });
    process.exit(1);
  }

  /***
   * 5. Possibly, generate variants
   */

  // No op for now

  /****
   * 6. Update today_config in supabase
   */
  try {
    await setDailyQuestion({ questionId });
  } catch {
    console.error("Failed to set daily question", questionId);
    await recordRunResult({ date: targetDate, status: "error", model: modelId, runId, notes: `Failed to set daily question: ${questionId}` });
    process.exit(1);
  }

  /**
   * 7. Record run result in supabase
   */
    for (let i = 0; i < 3; i++) {
      try {
        let notes = `Generated question: ${generatedQuestionData.simple_text}`;
        notes += `\nContext: ${context}`;
        await recordRunResult({ date: targetDate, status: "success", model: generatedQuestion.modelId ?? "unknown", runId, notes });
        break;
      } catch {
        console.error(`Failed to record run result on attempt ${i + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }

  console.log("Daily question set successfully", questionId);
  process.exit(0);
}

main().catch(async (error) => {
  try {
    await recordRunResult({ status: "error", model: "unknown", date: targetDate, runId: runId ?? "" });
  } catch {
    console.error("Failed to record run result on error");
  }
  console.error("Fatal error", error);
  process.exit(1);
});