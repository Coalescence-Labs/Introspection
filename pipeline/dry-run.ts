import { GatewayModelId } from "ai";
import { generateDailyQuestion, GenerateDailyQuestionOutput, getCurrentDateString } from "./lib/llm";
import { LLMGeneratedDailyQuestion } from "./lib/schema";
import { getRecentDailyQuestions } from "./lib/supabase/queries";
import { QuestionFeaturedHistory } from "@/lib/content/schema";


async function main() {


  const targetDate = getCurrentDateString();
  const modelId: GatewayModelId = "openai/gpt-5.2-chat";
  
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
    generatedQuestion = await generateDailyQuestion({ date: targetDate, runId: "dry-run", context, model: modelId });
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

  console.log(`GeneratedQuestion: ${JSON.stringify(generatedQuestionData, null, 2)}`)
}


main().catch((err) => {
  console.error(err)
  process.exit(1)
})