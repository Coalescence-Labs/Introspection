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

/** Pattern for pipeline-assigned candidate ids (e.g. cand_000, cand_001). */
export const CANDIDATE_ID_REGEX = /^cand_\d+$/;

/**
 * A single judge's evaluation for one generated question.
 * `candidateId` is the stable id from the pipeline (e.g. cand_000); merge/join must use it, not array order.
 * `questionIndex` is optional and informational only; if present, may be cross-checked for consistency.
 */
export const JudgeScoreSchema = z.object({
  candidateId: z
    .string()
    .regex(CANDIDATE_ID_REGEX, "candidateId must match cand_000, cand_001, ...")
    .describe("Stable id from the candidate list (e.g. cand_000). Required to map this score to the correct question."),
  questionIndex: z
    .number()
    .int()
    .min(0)
    .max(49)
    .optional()
    .describe("Zero-based index of the question (informational; do not use for merge)."),
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
 * One score entry per candidate, keyed by candidateId. Order of entries does not matter.
 */
export const JudgePanelOutputSchema = z.object({
  scores: z
    .array(JudgeScoreSchema)
    .min(1)
    .max(50)
    .describe("One score entry per generated candidate; each must include candidateId from the input."),
});

export type JudgeScoreValue = z.infer<typeof JudgeScoreValueSchema>;
export type JudgeScore = z.infer<typeof JudgeScoreSchema>;
export type JudgePanelOutput = z.infer<typeof JudgePanelOutputSchema>;
