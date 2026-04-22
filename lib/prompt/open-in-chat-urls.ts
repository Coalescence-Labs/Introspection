/** Destinations shown in the Today “Open in …” menu (URLs only; icons live in UI). */
export const OPEN_IN_MENU_IDS = ["chatgpt", "claude", "t3", "scira", "v0", "cursor"] as const;

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

export function createT3PromptUrl(q: string): string {
  return `https://t3.chat/new?${new URLSearchParams({ q })}`;
}

export function createSciraPromptUrl(q: string): string {
  return `https://scira.ai/?${new URLSearchParams({ q })}`;
}

export function createV0PromptUrl(q: string): string {
  return `https://v0.app?${new URLSearchParams({ q })}`;
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
    case "t3":
      return createT3PromptUrl(query);
    case "scira":
      return createSciraPromptUrl(query);
    case "v0":
      return createV0PromptUrl(query);
    case "cursor":
      return createCursorPromptUrl(query);
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
