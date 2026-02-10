import { z } from "zod";

export const LLMType = z.enum(["claude", "chatgpt", "gemini", "perplexity"]);
export type LLMType = z.infer<typeof LLMType>;

export const QuestionCategory = z.enum([
  "career",
  "ideas",
  "learning",
  "patterns",
  "productivity",
  "reflection",
]);
export type QuestionCategory = z.infer<typeof QuestionCategory>;

export const Cadence = z.enum(["daily", "weekly", "monthly"]);
export type Cadence = z.infer<typeof Cadence>;

/**
 * Per-LLM prompt variant (Mode B - editorial/pipeline generated)
 */
export const PromptVariant = z.object({
  title: z.string(),
  fullPrompt: z.string(),
});
export type PromptVariant = z.infer<typeof PromptVariant>;

/**
 * Question schema - supports both Mode A (template-driven) and Mode B (editorial variants)
 */
export const Question = z.object({
  id: z.string(),
  category: QuestionCategory,
  simpleText: z.string(),
  tags: z.array(z.string()).optional(),
  cadence: Cadence.optional(),
  // Mode B: Optional per-LLM variants (if present, these override templates)
  variants: z
    .object({
      claude: PromptVariant.optional(),
      chatgpt: PromptVariant.optional(),
      gemini: PromptVariant.optional(),
      perplexity: PromptVariant.optional(),
    })
    .optional(),
});
export type Question = z.infer<typeof Question>;

export const QuestionLibrary = z.object({
  questions: z.array(Question),
});
export type QuestionLibrary = z.infer<typeof QuestionLibrary>;

/**
 * Today override config
 */
export const TodayConfig = z.object({
  todayQuestionId: z.string().nullable(),
});
export type TodayConfig = z.infer<typeof TodayConfig>;
