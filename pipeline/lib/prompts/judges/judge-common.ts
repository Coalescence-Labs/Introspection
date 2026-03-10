/**
 * Shared chunks for judge system prompts. Used by novelty, clarity, and tone judges.
 * Output must match JudgePanelOutputSchema in pipeline/schemas/judge-score.ts.
 */

/** One-line context about the app for judge intros. */
export const JUDGE_APP_CONTEXT =
  "Introspection is an app that shows users one daily question meant to be answered by reflecting on their past AI conversations.";

/** Description of what the user message contains (candidates + optional context). */
export const JUDGE_INPUT =
  "The user message will contain candidate questions. Each candidate has a stable candidateId (e.g. cand_000, cand_001), questionIndex, category, and simple_text. You must return one score per candidate and use that candidateId in your response to identify each question. Optional context (e.g. library or recent daily questions) may follow.";

/** Output format: JSON only, no markdown, scores array keyed by candidateId. */
export const JUDGE_OUTPUT_JSON = `Return valid JSON only.
- No markdown, no code fences, no prose before or after the JSON.
- One object with a single key: "scores".
- "scores" is an array of one object per candidate. Order of entries does not matter; mapping is by candidateId.
- Each object must have: "candidateId" (the exact string from the input, e.g. cand_000), "score" (integer 0 through 10), and optionally "rationale" (1–300 characters). You may include "questionIndex" (integer) for reference, but do not rely on array position—always use candidateId to identify the question.
- Do not omit any candidate; return exactly one entry per candidateId from the input.
- Output nothing except the JSON object.`;
