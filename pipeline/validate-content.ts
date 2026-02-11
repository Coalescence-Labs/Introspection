#!/usr/bin/env bun

import { questions } from "@/content/questions";
import { QuestionLibrary } from "@/lib/content/schema";

/**
 * Validate content against Zod schema
 * Run with: bun run pipeline:validate
 */
async function main() {
  console.log("🔍 Validating content...\n");

  try {
    const validated = QuestionLibrary.parse({ questions });
    console.log(`✅ Successfully validated ${validated.questions.length} questions\n`);

    // Show summary by category
    const byCategory = validated.questions.reduce(
      (acc, q) => {
        acc[q.category] = (acc[q.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📊 Questions by category:");
    Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });

    console.log("\n✅ Content validation passed!");
  } catch (error) {
    console.error("❌ Content validation failed:\n");
    console.error(error);
    process.exit(1);
  }
}

main();
