"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { LLMSelector } from "@/components/llm-selector";
import { OpenInOrganicLlmButton } from "@/components/open-in-organic-llm-button";
import { PromptPreview } from "@/components/prompt-preview";
import { QuestionHero } from "@/components/question-hero";
import { SpeechToggle } from "@/components/speech-toggle";
import type { Question, LLMType } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";

interface SandboxOrganicLlmPageClientProps {
  question: Question;
  todayLabel: string;
  organicHandoffEnabled: boolean;
}

export function SandboxOrganicLlmPageClient({
  question,
  todayLabel,
  organicHandoffEnabled,
}: SandboxOrganicLlmPageClientProps) {
  const [selectedLLM, setSelectedLLM] = useState<LLMType>("claude");
  const [speechFriendly, setSpeechFriendly] = useState(false);
  const [prompt, setPrompt] = useState<ReturnType<typeof generatePrompt> | null>(null);

  useLayoutEffect(() => {
    setPrompt(generatePrompt(question, { llm: selectedLLM, speechFriendly }));
  }, [question, selectedLLM, speechFriendly]);

  const handoffDisabled = useMemo(
    () => !organicHandoffEnabled || !prompt,
    [organicHandoffEnabled, prompt],
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-6 py-12">
      <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
        <p className="font-medium">Beta — Organic LLM handoff sandbox</p>
        <p className="mt-1 text-xs opacity-90">
          Daily Question • {todayLabel}.{" "}
          <Link href="/today" className="underline underline-offset-2">
            Back to Today
          </Link>
        </p>
        {!organicHandoffEnabled ? (
          <p className="mt-2 text-xs opacity-90">
            Set <code className="rounded bg-black/10 px-1">INTROSPECTION_ORGANIC_SHARED_SECRET</code>{" "}
            and <code className="rounded bg-black/10 px-1">ORGANIC_BASE_URL</code> in{" "}
            <code className="rounded bg-black/10 px-1">.env.local</code> to enable handoff.
          </p>
        ) : null}
      </div>

      <div className="mb-12 flex-1">
        <QuestionHero question={question.simple_text} />
      </div>

      <div className="mb-8">
        <LLMSelector selected={selectedLLM} onSelect={setSelectedLLM} />
      </div>
      <div className="mb-10">
        <SpeechToggle enabled={speechFriendly} onToggle={setSpeechFriendly} />
      </div>

      <div className="mb-12 flex justify-center">
        {prompt ? (
          <OpenInOrganicLlmButton
            question={question}
            prompt={prompt}
            selectedLLM={selectedLLM}
            speechFriendly={speechFriendly}
            disabled={handoffDisabled}
          />
        ) : null}
      </div>

      {prompt ? (
        <div className="pb-12">
          <PromptPreview title={prompt.title} fullPrompt={prompt.fullPrompt} />
        </div>
      ) : null}
    </div>
  );
}
