"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { LLMSelector } from "@/components/llm-selector";
import { PromptPreview } from "@/components/prompt-preview";
import { QuestionHero } from "@/components/question-hero";
import { SpeechToggle } from "@/components/speech-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { loadQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import type { LLMType, Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";
import { getTodayString } from "@/lib/utils";

export default function TodayPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedLLM, setSelectedLLM] = useState<LLMType>("claude");
  const [speechFriendly, setSpeechFriendly] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<{
    title: string;
    fullPrompt: string;
  } | null>(null);

  useEffect(() => {
    async function loadTodayQuestion() {
      const questions = await loadQuestions();
      const todayConfig = await loadTodayConfig();

      let todayQuestion: Question;
      if (todayConfig) {
        const found = questions.find((q) => q.id === todayConfig);
        todayQuestion = found || getTodayQuestion(questions);
      } else {
        todayQuestion = getTodayQuestion(questions);
      }

      setQuestion(todayQuestion);
    }

    loadTodayQuestion();
  }, []);

  useEffect(() => {
    if (question) {
      const prompt = generatePrompt(question, {
        llm: selectedLLM,
        speechFriendly,
      });
      setGeneratedPrompt(prompt);
    }
  }, [question, selectedLLM, speechFriendly]);

  // Keyboard shortcuts
  useEffect(() => {
    const llms: LLMType[] = ["claude", "chatgpt", "gemini", "perplexity"];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow keys: switch LLM
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const currentIndex = llms.indexOf(selectedLLM);
        const nextIndex =
          e.key === "ArrowRight"
            ? (currentIndex + 1) % llms.length
            : (currentIndex - 1 + llms.length) % llms.length;
        setSelectedLLM(llms[nextIndex]);
      }

      // "T" key: toggle speech-friendly
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setSpeechFriendly((prev) => !prev);
      }

      // "C" key: trigger copy
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (generatedPrompt) {
          navigator.clipboard.writeText(generatedPrompt.fullPrompt).catch(console.error);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLLM, generatedPrompt]);

  if (!question || !generatedPrompt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6">
      <div className="flex min-h-screen flex-col py-16 sm:py-20">
        {/* Header */}
        <div className="mb-16 sm:mb-20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Daily Question • {getTodayString()}</div>
          <Link
            href="/library"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={20}
          >
            Browse all questions →
          </Link>
        </div>

        {/* Hero Question */}
        <div className="mb-16 sm:mb-20">
          <QuestionHero question={question.simpleText} />
        </div>

        {/* LLM Selector */}
        <div className="mb-10">
          <LLMSelector selected={selectedLLM} onSelect={setSelectedLLM} />
        </div>

        {/* Speech-Friendly Toggle */}
        <div className="mb-10">
          <SpeechToggle enabled={speechFriendly} onToggle={setSpeechFriendly} />
        </div>

        {/* Vertical spacer - pushes copy button to center of remaining space */}
        <div className="flex-1" />

        {/* Copy Button */}
        <div className="flex justify-center">
          <CopyButton text={generatedPrompt.fullPrompt} />
        </div>

        {/* Vertical spacer - equal space below copy button */}
        <div className="flex-1" />
      </div>

      {/* Prompt Preview - below the fold */}
      <div className="pb-12">
        <PromptPreview title={generatedPrompt.title} fullPrompt={generatedPrompt.fullPrompt} />
      </div>

      {/* Footer */}
      <footer className="pb-16 text-center text-xs text-muted-foreground">
        <div className="mb-4 flex justify-center">
          <ThemeToggle tabIndex={10} />
        </div>
        <p>Introspection - Reflect on your AI conversations</p>
      </footer>
    </main>
  );
}
