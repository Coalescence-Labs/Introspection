"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { LLMSelector } from "@/components/llm-selector";
import { PromptPreview } from "@/components/prompt-preview";
import { SpeechToggle } from "@/components/speech-toggle";
import type { LLMType } from "@/lib/content/schema";
import type { GeneratedPrompt } from "@/lib/prompt/types";

interface TodayPageContextValue {
  selectedLLM: LLMType;
  setSelectedLLM: (llm: LLMType) => void;
  speechFriendly: boolean;
  setSpeechFriendly: (v: boolean) => void;
  prompt: GeneratedPrompt | null;
  setPrompt: (p: GeneratedPrompt | null) => void;
}

const TodayPageContext = createContext<TodayPageContextValue | null>(null);

export function useTodayPage() {
  const ctx = useContext(TodayPageContext);
  if (!ctx) throw new Error("useTodayPage must be used within TodayPageShell");
  return ctx;
}

/** Client island: context, section (header + Suspense slot + controls), prompt preview below section. */
export function TodayPageShell({
  todayLabel,
  children,
}: {
  todayLabel: string;
  children: React.ReactNode;
}) {
  const [selectedLLM, setSelectedLLM] = useState<LLMType>("claude");
  const [speechFriendly, setSpeechFriendly] = useState(false);
  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null);

  const value: TodayPageContextValue = {
    selectedLLM,
    setSelectedLLM,
    speechFriendly,
    setSpeechFriendly,
    prompt,
    setPrompt,
  };

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
      <section className="flex flex-col py-16 sm:py-20" style={{ height: "100dvh" }}>
        <div className="mb-16 sm:mb-20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Daily Question • {todayLabel}</div>
          <Link
            href="/library"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={0}
          >
            Browse all questions →
          </Link>
        </div>
        {children}
        <div>
          <div className="mb-10">
            <LLMSelector selected={selectedLLM} onSelect={setSelectedLLM} />
          </div>
          <div className="mb-10">
            <SpeechToggle enabled={speechFriendly} onToggle={setSpeechFriendly} />
          </div>
        </div>
        <div className="flex justify-center justify-self-end">
          <CopyButton text={prompt?.fullPrompt ?? ""} disabled={!prompt} />
        </div>
        <div className="flex-1" />
      </section>
      {prompt && (
        <div className="pb-12">
          <PromptPreview title={prompt.title} fullPrompt={prompt.fullPrompt} />
        </div>
      )}
    </TodayPageContext.Provider>
  );
}
