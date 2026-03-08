"use client";

import { useLayoutEffect } from "react";
import { QuestionHero } from "@/components/question-hero";
import type { Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";
import { useTodayPage } from "@/components/today-page-client";

/**
 * Rendered inside Suspense after the daily question is loaded. Renders the question hero and
 * syncs the generated prompt (for the current LLM and speech-friendly setting) into Today page
 * context so the copy button and prompt preview can use it. useLayoutEffect ensures the shell
 * has the prompt before first paint and avoids an extra render.
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
