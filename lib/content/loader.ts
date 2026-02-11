"use server";

import { getSupabase } from "@/lib/supabase/server";
import { mapQuestionsWithVariants } from "./map-supabase";
import type { Question } from "./schema";
import {
  PromptVariantRow,
  QuestionLibrary,
  QuestionRow,
  TodayConfig,
  TodayConfigSelect,
} from "./schema";

async function loadQuestionsFromLocal(): Promise<Question[]> {
  try {
    const { questions } = await import("@/content/questions");
    const validated = QuestionLibrary.parse({ questions });
    return validated.questions;
  } catch {
    return [];
  }
}

async function loadTodayConfigFromLocal(): Promise<string | null> {
  try {
    const config = await import("@/content/today");
    const validated = TodayConfig.parse(config.default);
    return validated.todayQuestionId;
  } catch {
    return null;
  }
}

/**
 * Load and validate question library.
 * Uses Supabase when env is set; otherwise falls back to local content.
 */
export async function loadQuestions(): Promise<Question[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return loadQuestionsFromLocal();
  }

  try {
    const [questionsRes, variantsRes] = await Promise.all([
      supabase.from("questions").select("*"),
      supabase.from("prompt_variants").select("*"),
    ]);

    if (questionsRes.error) throw questionsRes.error;
    if (variantsRes.error) throw variantsRes.error;

    const questionRows = QuestionRow.array().parse(questionsRes.data ?? []);
    const variantRows = PromptVariantRow.array().parse(variantsRes.data ?? []);
    const mapped = mapQuestionsWithVariants(questionRows, variantRows);
    const validated = QuestionLibrary.parse({ questions: mapped });
    return validated.questions;
  } catch {
    return loadQuestionsFromLocal();
  }
}

/**
 * Load today override config.
 * Uses Supabase when env is set; otherwise falls back to local content.
 */
export async function loadTodayConfig(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return loadTodayConfigFromLocal();
  }

  try {
    const { data, error } = await supabase
      .from("today_config")
      .select("today_question_id")
      .eq("id", 1)
      .single();

    if (error) throw error;
    const row = TodayConfigSelect.parse(data);
    return row.today_question_id;
  } catch {
    return loadTodayConfigFromLocal();
  }
}

/**
 * Get a specific question by ID.
 * Uses Supabase when env is set; otherwise falls back to local content.
 */
export async function getQuestionById(id: string): Promise<Question | undefined> {
  const supabase = getSupabase();
  if (!supabase) {
    const questions = await loadQuestionsFromLocal();
    return questions.find((q) => q.id === id);
  }

  try {
    const [questionRes, variantsRes] = await Promise.all([
      supabase.from("questions").select("*").eq("id", id).single(),
      supabase.from("prompt_variants").select("*").eq("question_id", id),
    ]);

    if (questionRes.error || !questionRes.data) throw questionRes.error;
    const questionRow = QuestionRow.parse(questionRes.data);
    const variantRows = PromptVariantRow.array().parse(variantsRes.data ?? []);
    const [mapped] = mapQuestionsWithVariants([questionRow], variantRows);
    return QuestionLibrary.parse({ questions: [mapped] }).questions[0];
  } catch {
    const questions = await loadQuestionsFromLocal();
    return questions.find((q) => q.id === id);
  }
}
