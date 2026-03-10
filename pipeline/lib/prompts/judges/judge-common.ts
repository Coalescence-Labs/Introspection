/**
 * Shared chunks for judge system prompts. Used by novelty, clarity, and tone judges.
 * Output must match JudgePanelOutputSchema in pipeline/schemas/judge-score.ts.
 */

/** One-line context about the app for judge intros. */
export const JUDGE_APP_CONTEXT =
  "Introspection is an app that shows users one daily question meant to be answered by reflecting on their past AI conversations.";

/** Description of what the user message contains (candidates + optional context). */
export const JUDGE_INPUT =
  "The user message will contain candidate questions, indexed 0 through N-1 (typically 0 through 4 for 5 candidates), and may include optional context such as existing library questions or recent daily questions.";

/** Output format: JSON only, no markdown, scores array with questionIndex, score, optional rationale. */
export const JUDGE_OUTPUT_JSON = `Return valid JSON only.
- No markdown, no code fences, no prose before or after the JSON.
- One object with a single key: "scores".
- "scores" is an array of one object per candidate, in order. Do not omit any question.
- Each object has: "questionIndex" (integer 0 through N-1), "score" (integer 0 through 10), and optionally "rationale" (when provided, 1–300 characters; omit the key if no rationale). Do not add extra keys.
- Output nothing except the JSON object.`;
