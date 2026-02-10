"use client";

import { CopyButton } from "@/components/copy-button";
import { LLMSelector } from "@/components/llm-selector";
import { PromptPreview } from "@/components/prompt-preview";
import { QuestionHero } from "@/components/question-hero";
import { SpeechToggle } from "@/components/speech-toggle";
import { loadQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import type { LLMType, Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";
import { getTodayString } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  if (!question || !generatedPrompt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-20">
      {/* Header */}
      <div className="mb-20 flex items-center justify-between">
        <Link
          href="/library"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse all questions →
        </Link>
        <div className="text-xs text-muted-foreground">
          Daily Question • {getTodayString()}
        </div>
      </div>

      {/* Hero Question */}
      <div className="mb-20">
        <QuestionHero question={question.simpleText} />
      </div>

      {/* LLM Selector */}
      <div className="mb-10">
        <LLMSelector selected={selectedLLM} onSelect={setSelectedLLM} />
      </div>

      {/* Speech-Friendly Toggle */}
      <div className="mb-12">
        <SpeechToggle enabled={speechFriendly} onToggle={setSpeechFriendly} />
      </div>

      {/* Copy Button */}
      <div className="mb-12 flex justify-center">
        <CopyButton text={generatedPrompt.fullPrompt} />
      </div>

      {/* Prompt Preview */}
      <div className="mb-8">
        <PromptPreview title={generatedPrompt.title} fullPrompt={generatedPrompt.fullPrompt} />
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-muted-foreground">
        <p>Introspection - Reflect on your AI conversations</p>
      </footer>
    </main>
  );
}
