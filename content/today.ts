import type { TodayConfig } from "@/lib/content/schema";

/**
 * Override for today's question
 * Set to null to use automatic daily rotation
 * Set to a question ID to force a specific question
 */
const config: TodayConfig = {
  todayQuestionId: null, // null = use rotation based on hash(YYYY-MM-DD)
};

export default config;
