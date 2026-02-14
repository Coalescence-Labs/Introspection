import { QuestionFeaturedHistory } from "@/lib/content/schema";
import { generateDailyQuestion, type GenerateDailyQuestionOutput, getCurrentDateString, validateDateString } from "./lib/llm";
import { getRecentDailyQuestions, hasRunForDate, insertGeneratedQuestion, recordRunResult, recordRunStart, setDailyQuestion } from "./lib/supabase/queries";
import { LLMGeneratedDailyQuestion } from "./lib/schema";

let runId: string | null = null;

async function main() {
  /***
   * 1. Get target date, accept CLI arguments
   */

  let targetDate: string | undefined = process.argv[2];

  if (!targetDate) {
    // Use today
    targetDate = getCurrentDateString();
  } else if (!validateDateString(targetDate)) {
    console.error("Invalid date format, must be YYYY-MM-DD");
    process.exit(1);
  }

  /**
   * 2. Check Supabase for idempotency
   */
  const hasRun = await hasRunForDate(targetDate);
  if (hasRun) {
    console.log("Run already exists for date", targetDate);
    process.exit(0);
  }

  /**
   * 2a. Record run start in supabase
   */
  try {
    runId = await recordRunStart(targetDate);
    if (!runId) {
      throw new Error("Failed to record run start");
    }
  } catch {
    console.error("Failed to record run start", targetDate);
    process.exit(1);
  }


  /**
   * 3. Gather recent daily questions from supabase
   */
  let recentDailyQuestions: QuestionFeaturedHistory[] = [];
  try {
    recentDailyQuestions = await getRecentDailyQuestions({ limit: 10 });
    if (recentDailyQuestions.length === 0) {
      console.log("No recent daily questions found");
    } else {
        console.log("")
    }
  } catch {
    recentDailyQuestions = []
  }

  let context = `Recent daily questions:\n`;
  
  context += recentDailyQuestions.map((question) => `- ${question.question.simple_text}`).join("\n");

  /**
   * 4. Call generateDailyQuestion
   */
  let generatedQuestion: GenerateDailyQuestionOutput | null = null;
  try {
    generatedQuestion = await generateDailyQuestion({ date: targetDate, runId: crypto.randomUUID(), context });
  } catch {
    generatedQuestion = null;
  }

  /***
   * 5. Store result in supabase
   */
  if (!generatedQuestion?.ok) {
    console.error("Failed to generate daily question", JSON.stringify(generatedQuestion?.error, null, 2));
    process.exit(1);
  }

  const generatedQuestionData: LLMGeneratedDailyQuestion = generatedQuestion.data;
  let questionId: string | null = null;

  try {
    questionId = await insertGeneratedQuestion({
      question: {
        category: generatedQuestionData.category,
        simple_text: generatedQuestionData.simple_text,
        tags: generatedQuestionData.tags ?? null,
        cadence: generatedQuestionData.cadence ?? null,
      },
    });
    if (!questionId) {
      throw new Error("Failed to insert generated question");
    }
  } catch {
    console.error("Failed to insert generated question", JSON.stringify(generatedQuestionData, null, 2));
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
    process.exit(1);
  }

  /**
   * 7. Record run result in supabase
   */
  try {
    await recordRunResult({ date: targetDate, status: "success", model: generatedQuestion.modelId ?? "unknown", runId: runId });
  } catch {
    console.error("Failed to record run result", targetDate);
    process.exit(1);
  }

  console.log("Daily question set successfully", questionId);
  process.exit(0);
}

main().catch(async (error) => {
  try {
    await recordRunResult({ status: "error", model: "unknown", runId: runId ?? "" });
  } catch {
    console.error("Failed to record run result on error");
  }
  console.error("Fatal error", error);
  process.exit(1);
});