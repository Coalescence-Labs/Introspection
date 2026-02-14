#!/usr/bin/env bun

import { questions } from "@/content/questions";
import { getTodayQuestion } from "@/lib/content/rotation";
import type { LLMType } from "@/lib/content/schema";
import { StubProvider } from "./providers/stub-provider";

/**
 * Generate stub content for today's question across all LLMs
 * Run with: bun run pipeline:generate
 *
 * This demonstrates the editorial pipeline architecture.
 * Future implementation will:
 * 1. Use real LLM APIs to generate refined prompts
 * 2. Store generated variants in content files
 * 3. Run on a schedule to refresh content
 * 4. Support approval workflow before publishing
 */
async function main() {
  console.log("🎯 Generating stub content for today's question...\n");

  const provider = new StubProvider();
  const todayQuestion = getTodayQuestion(questions);
  const llms: LLMType[] = ["claude", "chatgpt", "gemini", "perplexity"];

  console.log(`📝 Question: "${todayQuestion.simple_text}"`);
  console.log(`🆔 ID: ${todayQuestion.id}\n`);

  console.log("Generating variants for all LLMs...\n");

  for (const llm of llms) {
    const variant = await provider.generateVariant({
      questionId: todayQuestion.id,
      questionText: todayQuestion.simple_text,
      llm,
      speechFriendly: false,
    });

    console.log(`\n${"=".repeat(60)}`);
    console.log(`LLM: ${llm.toUpperCase()}`);
    console.log("=".repeat(60));
    console.log(`Title: ${variant.title}`);
    console.log("\nFull Prompt:");
    console.log(variant.fullPrompt);
  }

  console.log(`\n${"=".repeat(60)}\n`);
  console.log("✅ Stub generation complete!");
  console.log("\n💡 Next steps for real implementation:");
  console.log("   1. Implement real providers (ClaudeProvider, OpenAIProvider, etc.)");
  console.log("   2. Add environment variables for API keys");
  console.log("   3. Create storage layer to persist generated variants");
  console.log("   4. Add approval workflow for editorial review");
  console.log("   5. Set up scheduled jobs to refresh content");
}

main();
