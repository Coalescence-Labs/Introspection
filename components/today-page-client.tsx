"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { LLMSelector } from "@/components/llm-selector";
import { PromptPreview } from "@/components/prompt-preview";
import { QuestionHero } from "@/components/question-hero";
import { SpeechToggle } from "@/components/speech-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { LLMType, Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";

interface TodayPageClientProps {
  initialQuestion: Question;
  todayLabel?: string;
}

/**
 * Today page UI: question hero, LLM selector, speech-friendly toggle, prompt preview, copy button.
 * Keyboard: Arrow Left/Right (LLM), T (speech), C (copy). Regenerates prompt when question/LLM/speech change.
 */
export function TodayPageClient({ initialQuestion, todayLabel }: TodayPageClientProps) {
  const [selectedLLM, setSelectedLLM] = useState<LLMType>("claude");
  const [speechFriendly, setSpeechFriendly] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState(() =>
    generatePrompt(initialQuestion, { llm: selectedLLM, speechFriendly })
  );

  useEffect(() => {
    const prompt = generatePrompt(initialQuestion, {
      llm: selectedLLM,
      speechFriendly,
    });
    setGeneratedPrompt(prompt);
  }, [initialQuestion, selectedLLM, speechFriendly]);

  // Keyboard shortcuts
  useEffect(() => {
    const llms: LLMType[] = ["claude", "chatgpt", "gemini", "perplexity"];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const currentIndex = llms.indexOf(selectedLLM);
        const nextIndex =
          e.key === "ArrowRight"
            ? (currentIndex + 1) % llms.length
            : (currentIndex - 1 + llms.length) % llms.length;
        setSelectedLLM(llms[nextIndex]);
      }

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setSpeechFriendly((prev) => !prev);
      }

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

  return (
    <main className="mx-auto max-w-5xl px-6 flex flex-col gap-20">
      <section className="flex flex-col py-16 sm:py-20" style={{ height: "100dvh" }}>
        {/* Header */}
        <div className="mb-16 sm:mb-20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Daily Question {todayLabel ? `• ${todayLabel}` : ""}</div>
          <Link
            href="/library"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={0}
          >
            Browse all questions →
          </Link>
        </div>

        {/* Hero Question */}
        <div className="mb-16 sm:mb-20 flex-1">
          <QuestionHero question={initialQuestion.simple_text} />
        </div>

        {/* LLM Selector */}
        <div>
          <div className="mb-10">
            <LLMSelector selected={selectedLLM} onSelect={setSelectedLLM} />
          </div>

          {/* Speech-Friendly Toggle */}
          <div className="mb-10">
            <SpeechToggle enabled={speechFriendly} onToggle={setSpeechFriendly} />
          </div>
        </div>

        <div className="flex justify-center justify-self-end">
          <CopyButton text={generatedPrompt.fullPrompt} />
        </div>

        <div className="flex-1" />
      </section>

      <div className="pb-12">
        <PromptPreview title={generatedPrompt.title} fullPrompt={generatedPrompt.fullPrompt} />
      </div>

      <footer className="pb-16 text-center text-xs text-muted-foreground">
        <div className="mb-4 flex justify-center">
          <ThemeToggle tabIndex={0} />
        </div>
        <p>Introspection - Reflect on your AI conversations</p>
      </footer>
    </main>
  );
}
