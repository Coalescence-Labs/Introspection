"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { LLMSelector } from "@/components/llm-selector";
import { PromptPreview } from "@/components/prompt-preview";
import { QuestionHero } from "@/components/question-hero";
import { SpeechToggle } from "@/components/speech-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { LLMType, Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";
import type { GeneratedPrompt } from "@/lib/prompt/types";
import { getTodayString } from "@/lib/utils";

interface TodayPageContextValue {
  selectedLLM: LLMType;
  setSelectedLLM: (llm: LLMType) => void;
  speechFriendly: boolean;
  setSpeechFriendly: (v: boolean) => void;
  prompt: GeneratedPrompt | null;
  setPrompt: (p: GeneratedPrompt | null) => void;
}

const TodayPageContext = createContext<TodayPageContextValue | null>(null);

function useTodayPage() {
  const ctx = useContext(TodayPageContext);
  if (!ctx) throw new Error("useTodayPage must be used within TodayPageShell");
  return ctx;
}

/** Shell: header, LLM selector, speech toggle, copy button. Renders instantly; question-dependent content is in children (Suspense). */
export function TodayPageShell({ children }: { children: React.ReactNode }) {
  const [selectedLLM, setSelectedLLM] = useState<LLMType>("claude");
  const [speechFriendly, setSpeechFriendly] = useState(false);
  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null);
  // Avoid new Date() in Server Components: compute date label only on the client after mount
  const [todayLabel, setTodayLabel] = useState<string | null>(null);
  useEffect(() => {
    setTodayLabel(getTodayString());
  }, []);

  const value: TodayPageContextValue = {
    selectedLLM,
    setSelectedLLM,
    speechFriendly,
    setSpeechFriendly,
    prompt,
    setPrompt,
  };

  // Keyboard shortcuts (prompt from context; copy no-op when null)
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
        if (prompt?.fullPrompt) {
          navigator.clipboard.writeText(prompt.fullPrompt).catch(console.error);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLLM, prompt]);

  return (
    <TodayPageContext.Provider value={value}>
      <main className="mx-auto max-w-5xl px-6 flex flex-col gap-20">
        <section className="flex flex-col py-16 sm:py-20" style={{ height: "100dvh" }}>
          {/* Header - instant */}
          <div className="mb-16 sm:mb-20 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Daily Question{todayLabel ? ` • ${todayLabel}` : ""}
            </div>
            <Link
              href="/library"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={0}
            >
              Browse all questions →
            </Link>
          </div>

          {/* Question hero + preview: inside Suspense (children) */}
          {children}

          {/* LLM Selector - instant */}
          <div>
            <div className="mb-10">
              <LLMSelector selected={selectedLLM} onSelect={setSelectedLLM} />
            </div>

            <div className="mb-10">
              <SpeechToggle enabled={speechFriendly} onToggle={setSpeechFriendly} />
            </div>
          </div>

          <div className="flex justify-center justify-self-end">
            <CopyButton
              text={prompt?.fullPrompt ?? ""}
              disabled={!prompt}
            />
          </div>

          <div className="flex-1" />
        </section>

        {/* Prompt preview - only when we have prompt (rendered by QuestionBlock below the fold) */}
        {prompt && (
          <div className="pb-12">
            <PromptPreview title={prompt.title} fullPrompt={prompt.fullPrompt} />
          </div>
        )}

        <footer className="pb-16 text-center text-xs text-muted-foreground">
          <div className="mb-4 flex justify-center">
            <ThemeToggle tabIndex={0} />
          </div>
          <p>Introspection - Reflect on your AI conversations</p>
        </footer>
      </main>
    </TodayPageContext.Provider>
  );
}

/**
 * Rendered inside Suspense after the question loads. Fills context with generated prompt and shows hero + preview.
 */
export function TodayQuestionBlock({ initialQuestion }: { initialQuestion: Question }) {
  const { selectedLLM, speechFriendly, setPrompt } = useTodayPage();
  const [generatedPrompt, setGeneratedPrompt] = useState(() =>
    generatePrompt(initialQuestion, { llm: selectedLLM, speechFriendly })
  );

  useEffect(() => {
    const next = generatePrompt(initialQuestion, {
      llm: selectedLLM,
      speechFriendly,
    });
    setGeneratedPrompt(next);
    setPrompt(next);
  }, [initialQuestion, selectedLLM, speechFriendly, setPrompt]);

  return (
    <>
      <div className="mb-16 sm:mb-20 flex-1">
        <QuestionHero question={initialQuestion.simple_text} />
      </div>
    </>
  );
}
