import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// App / API shapes
// ---------------------------------------------------------------------------

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
 * Today override config (local content)
 */
export const TodayConfig = z.object({
  todayQuestionId: z.string().nullable(),
});
export type TodayConfig = z.infer<typeof TodayConfig>;

// ---------------------------------------------------------------------------
// Supabase row schemas (DB snake_case)
// ---------------------------------------------------------------------------

export const QuestionRow = z.object({
  id: z.string(),
  category: z.string(),
  simple_text: z.string(),
  tags: z.array(z.string()).nullable(),
  cadence: z.string().nullable(),
});
export type QuestionRow = z.infer<typeof QuestionRow>;

export const PromptVariantRow = z.object({
  question_id: z.string(),
  llm: LLMType,
  title: z.string(),
  full_prompt: z.string(),
});
export type PromptVariantRow = z.infer<typeof PromptVariantRow>;

export const TodayConfigRow = z.object({
  id: z.number(),
  today_question_id: z.string().nullable(),
});
export type TodayConfigRow = z.infer<typeof TodayConfigRow>;

/** Shape when selecting only today_question_id from today_config */
export const TodayConfigSelect = TodayConfigRow.pick({ today_question_id: true });
export type TodayConfigSelect = z.infer<typeof TodayConfigSelect>;

/**
 * Mapped question (mapper output before Question parse). category/cadence are string from DB; QuestionLibrary.parse narrows them.
 */
export const MappedQuestion = z.object({
  id: z.string(),
  category: z.string(),
  simpleText: z.string(),
  tags: z.array(z.string()).optional(),
  cadence: z.string().optional(),
  variants: z
    .object({
      claude: PromptVariant.optional(),
      chatgpt: PromptVariant.optional(),
      gemini: PromptVariant.optional(),
      perplexity: PromptVariant.optional(),
    })
    .optional(),
});
export type MappedQuestion = z.infer<typeof MappedQuestion>;
