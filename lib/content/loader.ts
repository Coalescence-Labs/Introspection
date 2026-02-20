"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { mapQuestionsWithVariants } from "./map-supabase";
import { Question } from "./schema";
import {
  PromptVariantRow,
  QuestionLibrary,
  QuestionRow,
  TodayConfig,
  TodayConfigSelect,
} from "./schema";

/** Load question library from local content/questions module. Returns [] on failure. */
async function loadQuestionsFromLocal(): Promise<Question[]> {
  try {
    const { questions } = await import("@/content/questions");
    const validated = QuestionLibrary.parse({ questions });
    return validated.questions;
  } catch {
    return [];
  }
}

/** Load today override (question ID) from local content/today module. Returns null on failure. */
async function loadTodayConfigFromLocal(): Promise<string | null> {
  try {
    const config = await import("@/content/today");
    const validated = TodayConfig.parse(config.default);
    return validated.todayQuestionId;
  } catch {
    return null;
  }
}

/** Parse variant rows from Supabase; on empty or invalid data return []. */
function parseVariantRows(data: unknown): PromptVariantRow[] {
  const raw = Array.isArray(data) ? data : [];
  if (raw.length === 0) return [];
  const parsed = PromptVariantRow.array().safeParse(raw);
  return parsed.success ? parsed.data : [];
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
    const variantRows = parseVariantRows(variantsRes.data);
    const mapped = mapQuestionsWithVariants(questionRows, variantRows);
    const validated = QuestionLibrary.parse({ questions: mapped });
    return validated.questions;
  } catch (error) {
    console.error("Failed to load questions from Supabase", error);
    return loadQuestionsFromLocal();
  }
}

/**
 * Cached question list shared by today and library pages.
 * Revalidate every hour so both pages benefit from one cache.
 */
export async function getCachedQuestions(): Promise<Question[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("questions");
  return loadQuestions();
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
  } catch (error) {
    console.error("Failed to load today config from Supabase", error);
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
    const variantRows = parseVariantRows(variantsRes.data);
    const [mapped] = mapQuestionsWithVariants([questionRow], variantRows);
    return QuestionLibrary.parse({ questions: [mapped] }).questions[0];
  } catch (error) {
    console.error("Failed to get question by ID from Supabase", error);
    const questions = await loadQuestionsFromLocal();
    return questions.find((q) => q.id === id);
  }
}


/**
 * Load the current daily question from Supabase (today_config + question + variants).
 * Requires Supabase; on failure falls back to local questions with day-of-year rotation.
 * Prefer getCachedDailyQuestion(dateKey) on the today page for cached, date-keyed results.
 */
export async function getDailyQuestion(): Promise<Question> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Supabase not initialized");
    }
    const { data, error } = await supabase
      .from("today_config")
      .select("today_question_id,question:today_question_id(*)")
      .eq("id", 1)
      .single();

    if (error) throw error;

    const row = QuestionRow.parse(data.question);
    if (!row) throw new Error("Question not found");

    const variants = await supabase.from("prompt_variants").select("*").eq("question_id", row.id);
    if (variants.error) {
      console.error("Failed to get variants from Supabase", variants.error);
    }

    const variantRows = parseVariantRows(variants.data);
    const mapped = mapQuestionsWithVariants([row], variantRows);

    return Question.parse(mapped[0]);
  } catch (error) {
    console.error("Failed to get daily question from Supabase", error);
    const questions = await loadQuestionsFromLocal();
    const date = new Date();
    const dayOfYear = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    return questions[dayOfYear % questions.length];
  }
}
