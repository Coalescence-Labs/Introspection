import type { LLMType } from "@/lib/content/schema";

/**
 * Request to generate a prompt variant
 */
export interface GenerateVariantRequest {
  questionId: string;
  questionText: string;
  llm: LLMType;
  speechFriendly: boolean;
}

/**
 * Generated prompt variant response
 */
export interface GenerateVariantResponse {
  title: string;
  fullPrompt: string;
}

/**
 * Provider interface for LLM APIs
 * Future implementations will call real APIs (Claude, OpenAI, etc.)
 */
export interface LLMProvider {
  name: string;

  /**
   * Generate a refined prompt variant for a specific LLM
   * In real implementation, this would call the provider's API
   */
  generateVariant(request: GenerateVariantRequest): Promise<GenerateVariantResponse>;
}
