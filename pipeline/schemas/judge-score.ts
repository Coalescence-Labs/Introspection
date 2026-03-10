import { z } from "zod";

/**
 * ------------------------------------------------------------
 * Judge score rubric (0-10)
 * ------------------------------------------------------------
 * 0-2  = poor / clearly not usable
 * 3-4  = weak / underdeveloped
 * 5-6  = decent / acceptable but unremarkable
 * 7-8  = strong / clearly good
 * 9    = excellent
 * 10   = exceptional / rare
 * ------------------------------------------------------------
 */
export const JudgeScoreValueSchema = z.number().int().min(0).max(10);

/**
 * A single judge's evaluation for one generated question.
 * `questionIndex` lets the orchestration layer map scores back to candidates
 * without relying on string matching.
 */
export const JudgeScoreSchema = z.object({
  questionIndex: z
    .number()
    .int()
    .min(0)
    .max(49)
    .describe("Zero-based index of the generated question being evaluated."),
  score: JudgeScoreValueSchema.describe(
    "Judge score from 0 to 10 using the rubric documented above."
  ),
  rationale: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .optional()
    .describe("Optional short explanation for the score, primarily for debugging or audit logs."),
});

/**
 * Output contract for one specialist judge (novelty, clarity, or tone).
 * The caller can expect one entry per generated candidate question.
 */
export const JudgePanelOutputSchema = z.object({
  scores: z
    .array(JudgeScoreSchema)
    .min(1)
    .max(50)
    .describe("One score entry per generated candidate question."),
});

export type JudgeScoreValue = z.infer<typeof JudgeScoreValueSchema>;
export type JudgeScore = z.infer<typeof JudgeScoreSchema>;
export type JudgePanelOutput = z.infer<typeof JudgePanelOutputSchema>;
