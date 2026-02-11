import type { Question } from "./schema";
import { QuestionLibrary, TodayConfig } from "./schema";

/**
 * Load and validate question library
 */
export async function loadQuestions(): Promise<Question[]> {
  const { questions } = await import("@/content/questions");
  const validated = QuestionLibrary.parse({ questions });
  return validated.questions;
}

/**
 * Load today override config
 */
export async function loadTodayConfig(): Promise<string | null> {
  const config = await import("@/content/today");
  const validated = TodayConfig.parse(config.default);
  return validated.todayQuestionId;
}

/**
 * Get a specific question by ID
 */
export async function getQuestionById(id: string): Promise<Question | undefined> {
  const questions = await loadQuestions();
  return questions.find((q) => q.id === id);
}
