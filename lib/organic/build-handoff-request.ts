import {
  IntrospectionHandoffRequestSchema,
  type IntrospectionHandoffRequest,
} from "@/lib/organic-relay/schemas";
import type { Question } from "@/lib/content/schema";
import type { LLMType } from "@/lib/content/schema";
import type { GeneratedPrompt } from "@/lib/prompt/types";

export function buildHandoffRequest(input: {
  question: Question;
  prompt: GeneratedPrompt;
  selectedLLM: LLMType;
  speechFriendly: boolean;
}): IntrospectionHandoffRequest {
  return IntrospectionHandoffRequestSchema.parse({
    questionId: input.question.id,
    questionText: input.question.simple_text,
    category: input.question.category,
    llm: input.selectedLLM,
    speechFriendly: input.speechFriendly,
    promptTitle: input.prompt.title,
    fullPrompt: input.prompt.fullPrompt,
  });
}
