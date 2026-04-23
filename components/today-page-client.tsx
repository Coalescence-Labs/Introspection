"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CopyIconButton } from "@/components/copy-icon-button";
import { LLMSelector } from "@/components/llm-selector";
import { PromptPreview } from "@/components/prompt-preview";
import { SpeechToggle } from "@/components/speech-toggle";
import { TodayOpenInChatButton } from "@/components/today-open-in-chat-button";
import type { LLMType } from "@/lib/content/schema";
import type { OpenInMenuDestinationId } from "@/lib/prompt/open-in-chat-urls";
import type { GeneratedPrompt } from "@/lib/prompt/types";
import { loadTodayLocalPrefs, saveTodayLocalPrefs } from "@/lib/today-local-prefs";

/** Shared state for the Today page: LLM choice, speech-friendly toggle, and current prompt (set by TodayQuestionBlock). */
interface TodayPageContextValue {
  selectedLLM: LLMType;
  setSelectedLLM: (llm: LLMType) => void;
  speechFriendly: boolean;
  setSpeechFriendly: (v: boolean) => void;
  prompt: GeneratedPrompt | null;
  setPrompt: (p: GeneratedPrompt | null) => void;
}

const TodayPageContext = createContext<TodayPageContextValue | null>(null);

/** Hook to read/update today page state. Must be used inside TodayPageShell. */
export function useTodayPage() {
  const ctx = useContext(TodayPageContext);
  if (!ctx) throw new Error("useTodayPage must be used within TodayPageShell");
  return ctx;
}

/**
 * Client island for the Today page: header (with server-provided todayLabel), Suspense children slot
 * (hero + question block), LLM selector, speech toggle, copy button, and expandable prompt preview below the fold.
 */
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
  const [manualOpenInDestination, setManualOpenInDestination] =
    useState<OpenInMenuDestinationId | null>(null);

  /** After first `useLayoutEffect` storage read; blocks `save` until then so defaults do not overwrite stored prefs mid-hydrate. */
  const prefsHydratedRef = useRef(false);

  useLayoutEffect(() => {
    const loaded = loadTodayLocalPrefs();
    if (loaded) {
      setSelectedLLM(loaded.selectedLLM);
      setSpeechFriendly(loaded.speechFriendly);
      setManualOpenInDestination(loaded.manualOpenInDestination);
    }
    prefsHydratedRef.current = true;
  }, []);

  // Persist after hydration; first run may write minimal defaults if storage was empty.
  useEffect(() => {
    if (!prefsHydratedRef.current) return;
    saveTodayLocalPrefs({
      selectedLLM,
      speechFriendly,
      manualOpenInDestination,
    });
  }, [selectedLLM, speechFriendly, manualOpenInDestination]);

  const value: TodayPageContextValue = {
    selectedLLM,
    setSelectedLLM,
    speechFriendly,
    setSpeechFriendly,
    prompt,
    setPrompt,
  };

  // Global shortcuts: Arrow keys cycle LLM, T toggles speech-friendly, C copies prompt (when available).
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
        {/* Header: date label (from server) and link to library. */}
        <div className="mb-16 sm:mb-20 flex items-center justify-between">
          <div className="select-none text-xs text-muted-foreground">
            Daily Question • {todayLabel}
          </div>
          <Link
            href="/library"
            className="select-none text-sm text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={0}
          >
            Browse all questions →
          </Link>
        </div>
        {children}
        {/* Controls: LLM selector, speech-friendly toggle, copy button. */}
        <div>
          <div className="mb-10">
            <LLMSelector selected={selectedLLM} onSelect={setSelectedLLM} />
          </div>
          <div className="mb-10">
            <SpeechToggle enabled={speechFriendly} onToggle={setSpeechFriendly} />
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 justify-self-end">
          <TodayOpenInChatButton
            query={prompt?.fullPrompt ?? ""}
            disabled={!prompt}
            selectedLLM={selectedLLM}
            manualOpenInDestination={manualOpenInDestination}
            onManualOpenInDestination={setManualOpenInDestination}
          />
          <CopyIconButton text={prompt?.fullPrompt ?? ""} disabled={!prompt} />
        </div>
        <div className="flex-1" />
      </section>
      {/* Expandable prompt preview below the 100dvh section; only when prompt is set by question block. */}
      {prompt && (
        <div className="pb-12">
          <PromptPreview title={prompt.title} fullPrompt={prompt.fullPrompt} />
        </div>
      )}
    </TodayPageContext.Provider>
  );
}
