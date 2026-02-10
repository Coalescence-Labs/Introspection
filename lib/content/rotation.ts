import { getTodayString, hashString } from "@/lib/utils";
import type { Question } from "./schema";

/**
 * Get today's question using deterministic rotation
 * index = hash(YYYY-MM-DD) % questions.length
 */
export function getTodayQuestion(questions: Question[]): Question {
  if (questions.length === 0) {
    throw new Error("No questions available");
  }

  const today = getTodayString();
  const hash = hashString(today);
  const index = hash % questions.length;

  return questions[index];
}

/**
 * Get the next question in rotation (used for "New question" button)
 * Cycles through based on current index
 */
export function getNextQuestion(questions: Question[], currentId: string): Question {
  if (questions.length === 0) {
    throw new Error("No questions available");
  }

  const currentIndex = questions.findIndex((q) => q.id === currentId);
  const nextIndex = (currentIndex + 1) % questions.length;

  return questions[nextIndex];
}
