import type { LLMType } from "@/lib/content/schema";
import type { OpenInMenuDestinationId } from "@/lib/prompt/open-in-chat-urls";

export type { OpenInMenuDestinationId } from "@/lib/prompt/open-in-chat-urls";

/** Inputs for resolving where “Open in …” should send the user. Extend this object later for extra criteria. */
export type ResolveOpenInDestinationInput = {
  selectedLLM: LLMType;
  /** Explicit destination from the dropdown (session). When set, drives the primary CTA until cleared or criteria change later. */
  manualOverride: OpenInMenuDestinationId | null;
};

/**
 * Resolves the default chat destination for the primary CTA.
 * - If the user picked a destination from the menu, that wins (updates main button + primary click).
 * - Otherwise: Claude / ChatGPT map 1:1; Gemini / Perplexity default to ChatGPT until native links exist.
 */
export function resolveOpenInDestination(
  input: ResolveOpenInDestinationInput
): OpenInMenuDestinationId {
  const { selectedLLM, manualOverride } = input;
  if (manualOverride != null) {
    return manualOverride;
  }
  if (selectedLLM === "gemini" || selectedLLM === "perplexity") {
    return "chatgpt";
  }
  if (selectedLLM === "claude") return "claude";
  if (selectedLLM === "chatgpt") return "chatgpt";
  return "chatgpt";
}

/** Short name for the button label after “Open in ”. */
export function openInDestinationShortLabel(id: OpenInMenuDestinationId): string {
  switch (id) {
    case "chatgpt":
      return "ChatGPT";
    case "claude":
      return "Claude";
    case "t3":
      return "T3 Chat";
    case "scira":
      return "Scira";
    case "v0":
      return "v0";
    case "cursor":
      return "Cursor";
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function primaryOpenInButtonLabel(destination: OpenInMenuDestinationId): string {
  return `Open in ${openInDestinationShortLabel(destination)}`;
}
