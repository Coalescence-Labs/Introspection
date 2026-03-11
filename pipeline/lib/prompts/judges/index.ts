/**
 * Static system prompts for the three specialist judges (novelty, clarity, tone).
 * Each judge receives these as the system message; the user message contains
 * the candidate questions (and optional context). Judge response must be
 * valid JSON matching JudgePanelOutputSchema in pipeline/schemas/judge-score.ts:
 * { scores: [{ candidateId, score, rationale? }, ...] }, one entry per candidate (keyed by candidateId).
 *
 * Target: ~1500 tokens max per prompt.
 */

export { CLARITY_JUDGE_SYSTEM_PROMPT } from "./judge-clarity";
export { NOVELTY_JUDGE_SYSTEM_PROMPT } from "./judge-novelty";
export { TONE_JUDGE_SYSTEM_PROMPT } from "./judge-tone";
