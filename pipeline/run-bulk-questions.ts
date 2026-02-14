import { GatewayModelId } from "ai";
import { generateQuestions, type GenerateQuestionsOutput } from "./lib/llm";
import { getLibraryQuestions, insertGeneratedQuestions } from "./lib/supabase/queries";

const COUNT = 5;
const LIBRARY_CONTEXT_LIMIT = 50;
const modelId: GatewayModelId = "openai/gpt-5.2-chat";

const dryRun = process.argv.includes("--dry-run") || process.argv.includes("-d");

async function main() {
  /**
   * 1. Load up to 50 questions from the library (questions table) for context
   */
  let libraryQuestions: Awaited<ReturnType<typeof getLibraryQuestions>> = [];
  try {
    libraryQuestions = await getLibraryQuestions({ limit: LIBRARY_CONTEXT_LIMIT });
    if (libraryQuestions.length === 0) {
      console.log("No questions in library yet");
    } else {
      console.log(`Loaded ${libraryQuestions.length} questions from library for context`);
    }
  } catch (err) {
    console.warn("Failed to load library questions, continuing with empty context:", err);
    libraryQuestions = [];
  }

  let context = "";
  if (libraryQuestions.length > 0) {
    context = "Existing questions in the library (do not duplicate):\n";
    context += libraryQuestions.map((q) => `- ${q.simple_text}`).join("\n");
  }

  /**
   * 2. Generate COUNT questions in one call
   */
  let result: GenerateQuestionsOutput | null = null;
  try {
    result = await generateQuestions({
      context,
      count: COUNT,
      model: modelId,
      runId: "bulk-library",
    });
  } catch {
    result = null;
  }

  if (!result?.ok) {
    console.error("Failed to generate questions", JSON.stringify(result?.error, null, 2));
    process.exit(1);
  }

  /**
   * 3. Insert all generated questions into the library (unless dry run)
   */
  if (dryRun) {
    console.log("(dry run — no insert)\n");
    result.data.forEach((q, i) => {
      console.log(`[${i + 1}/${result.data.length}] Would insert: ${q.simple_text} [${q.category}]`);
    });
    console.log(`\nDry run complete. Would add ${result.data.length} questions to the library.`);
    return;
  }

  let insertedIds: string[];
  try {
    insertedIds = await insertGeneratedQuestions({
      questions: result.data.map((q) => ({
        category: q.category,
        simple_text: q.simple_text,
        tags: [],
        cadence: "daily",
      })),
    });
  } catch (err) {
    console.error("Failed to insert questions:", err);
    process.exit(1);
  }

  result.data.forEach((q, i) => {
    console.log(`[${i + 1}/${result.data.length}] Inserted: ${q.simple_text} (${insertedIds[i]})`);
  });
  console.log(`\nDone. Added ${insertedIds.length} questions to the library. IDs: ${insertedIds.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
