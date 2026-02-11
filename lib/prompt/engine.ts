import type { Question } from "@/lib/content/schema";
import { chatgptTemplate } from "./templates/chatgpt";
import { claudeTemplate } from "./templates/claude";
import { geminiTemplate } from "./templates/gemini";
import { perplexityTemplate } from "./templates/perplexity";
import type { GeneratedPrompt, GeneratePromptOptions, PromptTemplate } from "./types";

const templates: Record<string, PromptTemplate> = {
  claude: claudeTemplate,
  chatgpt: chatgptTemplate,
  gemini: geminiTemplate,
  perplexity: perplexityTemplate,
};

/**
 * Generate a prompt for a specific LLM
 * Supports both Mode A (template-driven) and Mode B (editorial variants)
 *
 * Mode B: If question.variants[llm] exists, use it
 * Mode A: Otherwise, generate from template
 */
export function generatePrompt(
  question: Question,
  options: Pick<GeneratePromptOptions, "llm" | "speechFriendly">
): GeneratedPrompt {
  const { llm, speechFriendly } = options;

  // Mode B: Check for editorial variant
  const variant = question.variants?.[llm];
  if (variant) {
    // Editorial variant exists - use it directly
    // Note: speechFriendly is already baked into editorial variants
    return {
      title: variant.title,
      fullPrompt: variant.fullPrompt,
    };
  }

  // Mode A: Generate from template
  const template = templates[llm];
  if (!template) {
    throw new Error(`No template found for LLM: ${llm}`);
  }

  return template.generate(question.simpleText, speechFriendly);
}
