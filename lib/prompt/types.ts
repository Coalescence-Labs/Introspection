import type { LLMType } from "@/lib/content/schema";

export interface GeneratePromptOptions {
  question: string;
  llm: LLMType;
  speechFriendly: boolean;
}

export interface GeneratedPrompt {
  title: string;
  fullPrompt: string;
}

export interface PromptTemplate {
  /**
   * Generate a prompt for this LLM
   */
  generate(question: string, speechFriendly: boolean): GeneratedPrompt;
}
