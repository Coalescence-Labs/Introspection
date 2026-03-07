"use client";

import { useLayoutEffect } from "react";
import { QuestionHero } from "@/components/question-hero";
import type { Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";
import { useTodayPage } from "@/components/today-page-client";

/**
 * Rendered inside Suspense after the question loads. Fills context with generated prompt and shows hero.
 */
export function TodayQuestionBlock({ initialQuestion }: { initialQuestion: Question }) {
  const { selectedLLM, speechFriendly, setPrompt } = useTodayPage();

  useLayoutEffect(() => {
    const next = generatePrompt(initialQuestion, {
      llm: selectedLLM,
      speechFriendly,
    });
    setPrompt(next);
  }, [initialQuestion, selectedLLM, speechFriendly, setPrompt]);

  return (
    <div className="mb-16 sm:mb-20 flex-1">
      <QuestionHero question={initialQuestion.simple_text} />
    </div>
  );
}
