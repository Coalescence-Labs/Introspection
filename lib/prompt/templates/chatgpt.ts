import type { PromptTemplate } from "../types";

/**
 * ChatGPT (OpenAI) prompt template
 * Direct conversational tone, clear structure, numbered lists
 */
export const chatgptTemplate: PromptTemplate = {
  generate(question: string, speechFriendly: boolean) {
    const speechInstructions = speechFriendly
      ? `

At the end, provide a "For Audio Playback" section with your response rewritten as a continuous, naturally flowing narrative without any formatting—optimized for text-to-speech.`
      : "";

    const fullPrompt = `You're analyzing my past AI conversations to help me gain insights.

Question: ${question}

**If you have access to our conversation history:** Please review it thoroughly and provide detailed analysis.

**If you don't have access or our history is limited:** Please ask me to share relevant excerpts or summaries from past conversations so you can give meaningful insights.

Please provide:
- Key patterns and themes you notice
- Specific examples from our conversations
- 3-5 actionable takeaways based on your analysis

Format your response with clear sections.${speechInstructions}`;

    return {
      title: question,
      fullPrompt,
    };
  },
};
