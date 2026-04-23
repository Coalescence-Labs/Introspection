/** Destinations shown in the Today “Open in …” menu (URLs only; icons live in UI). */
export const OPEN_IN_MENU_IDS = [
  "chatgpt",
  "claude",
  "perplexity",
  "t3",
  "scira",
  "cursor",
] as const;

export type OpenInMenuDestinationId = (typeof OPEN_IN_MENU_IDS)[number];

export function createChatGptPromptUrl(prompt: string): string {
  return `https://chatgpt.com/?${new URLSearchParams({
    hints: "search",
    prompt,
  })}`;
}

export function createClaudePromptUrl(q: string): string {
  return `https://claude.ai/new?${new URLSearchParams({ q })}`;
}

/** Perplexity web search; `q` opens the search page with the prompt prefilled. */
export function createPerplexityPromptUrl(q: string): string {
  return `https://www.perplexity.ai/search?${new URLSearchParams({ q })}`;
}

export function createT3PromptUrl(q: string): string {
  return `https://t3.chat/new?${new URLSearchParams({ q })}`;
}

export function createSciraPromptUrl(q: string): string {
  return `https://scira.ai/?${new URLSearchParams({ q })}`;
}

export function createCursorPromptUrl(text: string): string {
  const url = new URL("https://cursor.com/link/prompt");
  url.searchParams.set("text", text);
  return url.toString();
}

export function getOpenInChatDestinationUrl(id: OpenInMenuDestinationId, query: string): string {
  switch (id) {
    case "chatgpt":
      return createChatGptPromptUrl(query);
    case "claude":
      return createClaudePromptUrl(query);
    case "perplexity":
      return createPerplexityPromptUrl(query);
    case "t3":
      return createT3PromptUrl(query);
    case "scira":
      return createSciraPromptUrl(query);
    case "cursor":
      return createCursorPromptUrl(query);
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
