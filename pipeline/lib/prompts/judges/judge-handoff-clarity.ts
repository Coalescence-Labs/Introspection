export const HANDOFF_CLARITY_JUDGE_SYSTEM_PROMPT = `You judge Organic LLM handoff packages for clarity.

Score 0-10 whether:
- initialOverview is scannable markdown with a clear hook
- goal matches the source question
- steps (if present) progress logically

Return one score per candidateId.`;
