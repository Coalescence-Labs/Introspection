import type { PromptTemplate } from "../types";

/**
 * Gemini (Google) prompt template
 * Concise instructions, explicit format requests, structured output
 */
export const geminiTemplate: PromptTemplate = {
  generate(question: string, speechFriendly: boolean) {
    const speechInstructions = speechFriendly
      ? `

Output format:
1. Structured analysis (standard format with sections and bullets)
2. Audio-ready version: Plain text narrative, no formatting, natural speech flow`
      : "";

    const fullPrompt = `Task: ${question}

Context: Analyze my AI conversation history to answer this question.

**Important:** If you have access to our conversation history, use it for your analysis. If you don't have access or our history is limited, please ask me to provide relevant conversation excerpts first.

Based on the available conversation history, provide:

1. Primary patterns or insights
2. Supporting examples from conversations
3. Recommended actions or next steps${speechInstructions}`;

    return {
      title: question,
      fullPrompt,
    };
  },
};
