#!/usr/bin/env bun

/**
 * Seed Supabase with questions and today_config from content files.
 * Requires write access: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Run: bun run pipeline/seed-supabase.ts
 * Or: bun run pipeline:seed (add script to package.json)
 */

import { createClient } from "@supabase/supabase-js";
import { questions } from "@/content/questions";
import todayConfig from "@/content/today";
import { type LLMType, PromptVariantRow, QuestionRow, TodayConfigRow } from "@/lib/content/schema";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run the seed script.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

const LLMS: LLMType[] = ["claude", "chatgpt", "gemini", "perplexity"];

async function main() {
  console.log("Seeding Supabase...\n");

  // Upsert questions (no variants column)
  const questionRows = QuestionRow.array().parse(
    questions.map((q) => ({
      id: q.id,
      category: q.category,
      simple_text: q.simple_text,
      tags: q.tags ?? null,
      cadence: q.cadence ?? null,
    }))
  );

  const { error: questionsError } = await supabase.from("questions").upsert(questionRows, {
    onConflict: "id",
  });

  if (questionsError) {
    console.error("Failed to upsert questions:", questionsError);
    process.exit(1);
  }
  console.log(`Upserted ${questionRows.length} questions.`);

  // Build prompt_variants rows from question.variants
  const variantRows: PromptVariantRow[] = [];
  for (const q of questions) {
    const variants = q.variants;
    if (!variants) continue;
    for (const llm of LLMS) {
      const v = variants[llm];
      if (v) {
        variantRows.push(
          PromptVariantRow.parse({
            question_id: q.id,
            llm,
            title: v.title,
            full_prompt: v.fullPrompt,
          })
        );
      }
    }
  }

  if (variantRows.length > 0) {
    const { error: variantsError } = await supabase.from("prompt_variants").upsert(variantRows, {
      onConflict: "question_id,llm",
    });
    if (variantsError) {
      console.error("Failed to upsert prompt_variants:", variantsError);
      process.exit(1);
    }
    console.log(`Upserted ${variantRows.length} prompt variants.`);
  } else {
    console.log("No prompt variants in content (template-only mode).");
  }

  // Upsert today_config single row
  const todayRow = TodayConfigRow.parse({
    id: 1,
    today_question_id: todayConfig.todayQuestionId,
  });
  const { error: configError } = await supabase
    .from("today_config")
    .upsert(todayRow, { onConflict: "id" });

  if (configError) {
    console.error("Failed to upsert today_config:", configError);
    process.exit(1);
  }
  console.log("Upserted today_config.");

  console.log("\nDone.");
}

main();
