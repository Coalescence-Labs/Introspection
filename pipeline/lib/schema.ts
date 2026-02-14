import { Question } from "../../lib/content/schema";
import z from "zod";


export const LLMGeneratedDailyQuestion = Question.omit({
  id: true,
  variants: true,
  tags: true,
  cadence: true,
})

export type LLMGeneratedDailyQuestion = z.infer<typeof LLMGeneratedDailyQuestion>;

/** Schema for LLM output that returns multiple questions in one call */
export const LLMGeneratedDailyQuestionArray = z.object({
  questions: z.array(LLMGeneratedDailyQuestion),
});

export type LLMGeneratedDailyQuestionArray = z.infer<typeof LLMGeneratedDailyQuestionArray>;

export const GenerationRunsRow = z.object({
  id: z.uuidv7(),
  run_date: z.date(),
  status: z.string(),
  model: z.string(),
  notes: z.string().nullable(),
  created_at: z.date(),
})

export type GenerationRunsRow = z.infer<typeof GenerationRunsRow>;