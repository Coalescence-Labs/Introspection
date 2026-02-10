import type { PromptTemplate } from "../types";

/**
 * Claude (Anthropic) prompt template
 * Uses XML tags, explicit structure, detailed context
 */
export const claudeTemplate: PromptTemplate = {
  generate(question: string, speechFriendly: boolean) {
    const speechInstructions = speechFriendly
      ? `

<output_format>
Provide two versions:
1. Standard formatted response with clear structure
2. Speech-friendly version: Continuous narrative text, no formatting, optimized for text-to-speech playback
</output_format>`
      : "";

    const contextWithHistory = `<context>
I'd like you to analyze my conversation history with AI assistants to gain insights.

If you have access to our full conversation history, please review it thoroughly. If you don't have access to previous conversations or our history is limited, please ask me to paste relevant excerpts or summaries of past conversations so you can provide meaningful analysis.
</context>`;

    const fullPrompt = `${contextWithHistory}

<task>
${question}
</task>

Please analyze the available conversation history and provide:
1. Key patterns or themes that emerge
2. Specific examples that illustrate your findings
3. Actionable insights or recommendations based on what you've observed

Think step-by-step through the conversation history, identifying the most relevant and valuable insights.${speechInstructions}`;

    return {
      title: question,
      fullPrompt,
    };
  },
};
