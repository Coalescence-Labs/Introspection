"use client";

import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildHandoffRequest } from "@/lib/organic/build-handoff-request";
import type { Question, LLMType } from "@/lib/content/schema";
import type { GeneratedPrompt } from "@/lib/prompt/types";

type HandoffState = "idle" | "loading" | "error";

interface OpenInOrganicLlmButtonProps {
  question: Question;
  prompt: GeneratedPrompt;
  selectedLLM: LLMType;
  speechFriendly: boolean;
  disabled?: boolean;
}

export function OpenInOrganicLlmButton({
  question,
  prompt,
  selectedLLM,
  speechFriendly,
  disabled = false,
}: OpenInOrganicLlmButtonProps) {
  const [state, setState] = useState<HandoffState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || state === "loading") return;

    setState("loading");
    setErrorMessage(null);

    try {
      const body = buildHandoffRequest({ question, prompt, selectedLLM, speechFriendly });
      const res = await fetch("/api/organic/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Handoff failed — check Organic LLM is running");
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      setState("error");
      setErrorMessage("Handoff failed — missing redirect URL");
    } catch {
      setState("error");
      setErrorMessage("Handoff failed — check Organic LLM is running");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        whileHover={disabled || state === "loading" ? undefined : { scale: 1.02 }}
        whileTap={disabled || state === "loading" ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          type="button"
          variant="accent"
          size="xl"
          disabled={disabled || state === "loading"}
          onClick={() => void handleClick()}
          className="min-w-[240px] cursor-pointer select-none px-6 text-base font-semibold shadow-sm"
        >
          <span className="flex items-center justify-center gap-2">
            {state === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5 shrink-0" />
            )}
            <span>Open in Organic LLM</span>
          </span>
        </Button>
      </motion.div>
      {state === "error" && errorMessage ? (
        <p className="text-destructive max-w-sm text-center text-xs">{errorMessage}</p>
      ) : null}
    </div>
  );
}
