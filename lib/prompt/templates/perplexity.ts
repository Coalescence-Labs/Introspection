import type { PromptTemplate } from "../types";

/**
 * Perplexity prompt template
 * Research-focused, analytical, evidence-based
 */
export const perplexityTemplate: PromptTemplate = {
  generate(question: string, speechFriendly: boolean) {
    const speechInstructions = speechFriendly
      ? `

Include an "Audio Summary" at the end: A plain text, narrative version of your insights formatted for natural text-to-speech reading (no bullets, numbers, or formatting).`
      : "";

    const fullPrompt = `Research question: ${question}

Context: I'm asking you to analyze my recent AI conversations to identify patterns and insights.

**Note on conversation history:** If you have access to our full conversation history, please use it for your analysis. If not, please ask me to provide relevant excerpts or summaries from past conversations so you can conduct a thorough analysis.

Analyze and identify:
- Key patterns, themes, or trends across conversations
- Notable connections or recurring topics
- Evidence-based recommendations for next steps

Provide specific examples from our conversations to support your insights.${speechInstructions}`;

    return {
      title: question,
      fullPrompt,
    };
  },
};
