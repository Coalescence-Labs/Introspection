/**
 * Pipeline Supabase queries (service role). Generation runs, questions, today_config, featured history.
 * Not used by the web app; app uses anon client in lib/supabase/server.ts.
 */

import { QuestionFeaturedHistory, QuestionRow } from "@/lib/content/schema";
import { supabaseWorker } from "./supabase-worker";
import { PostgrestError } from "@supabase/supabase-js";
import { GenerationRunsRow } from "../schema";

export async function hasRunForDate(date: string): Promise<boolean> {

  try {
    const { data, error } = 
      await supabaseWorker
        .from("generation_runs")
        .select("id")
        .eq("run_date", date)

    if (error) {
      throw error;
    }
    if (data && data.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to check if run for date exists:", error);
    throw error;
  }
}

/**
 * Records the start of a generation run for the given date.
 * @param date - Run date (YYYY-MM-DD).
 * @returns The new run's UUID.
 * @throws If insert fails (e.g. run_date is not unique; Supabase enforces uniqueness on run_date).
 */
export async function recordRunStart(date: string): Promise<string> {
  try {
    // Bun/uuid: Generate v7 UUID (date based) for the run id
    const runId = crypto.randomUUID();
    const { data, error } = await supabaseWorker.from("generation_runs").insert({
      run_date: date,
      status: "started",
      model: "unknown",
      id: runId,
    });

    if (error) {
      throw error;
    }

    return runId;
  } catch (error) {
    console.error("Failed to record run start:", error);
    throw error;
  }
}

export async function getRunByDate(date: string): Promise<GenerationRunsRow | null> {
  try {
    const { data, error } = await supabaseWorker.from("generation_runs").select("*").eq("run_date", date).maybeSingle();
    if (error) {
      throw error;
    }
    return data ?? null;
  } catch (error) {
    console.error("Failed to get run by date:", error);
    throw error;
  }
}

interface RecordRunResultInput {
  status: "started" | "success" | "error";
  model: string;
  runId?: string;
  date?: string;
  notes?: string;
}

export async function recordRunResult({ date, status, model, runId, notes }: RecordRunResultInput): Promise<void> {

  try {
    const { data, error } = await supabaseWorker.from("generation_runs").upsert({
      run_date: date,
      status,
      model,
      id: runId,
      notes,
    }, {
      onConflict: "run_date",
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches questions from the library (questions table) for context when generating new ones.
 */
export async function getLibraryQuestions({ limit = 50 }: { limit?: number }): Promise<QuestionRow[]> {
  try {
    const { data, error } = await supabaseWorker
      .from("questions")
      .select("id, category, simple_text, tags, cadence")
      .order("id", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!data?.length) {
      return [];
    }

    return QuestionRow.array().parse(data);
  } catch (error) {
    console.error("Failed to get library questions:", error);
    throw error;
  }
}

export async function getRecentDailyQuestions({ limit }: { limit?: number }): Promise<QuestionFeaturedHistory[]> {
  try {
    const { data, error } = 
      await supabaseWorker
        .from("question_featured_history")
        .select(`
          question_id,
          featured_date,
          questions (
            id,
            category,
            simple_text,
            tags,
            cadence
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit ?? 30);

    if (error) {
      throw error;
    }
    if (data && data.length === 0) {
      console.warn("No recent daily questions found");
      return [];
    }

    console.log("Recent daily questions:", JSON.stringify(data, null, 2));

    const questionFeaturedHistory = QuestionFeaturedHistory.array().parse(data?.filter((item) => item.questions).map((item) => ({
      questionId: item.question_id,
      featuredDate: item.featured_date,
      question: QuestionRow.parse(item.questions),
    })) ?? []);


    if (data?.length === 0) {
      console.warn("No recent daily questions found");
    }

    return questionFeaturedHistory;
  } catch (error) {
    console.error("Failed to get recent daily questions:", error);
    throw error;
  }
}

export async function insertGeneratedQuestion({ question }: { question: Omit<QuestionRow, "id"> }): Promise<string | null> {
  const id = crypto.randomUUID();
  try {
    const { data, error } = await supabaseWorker
      .from("questions")
      .insert({
        id,
        category: question.category,
        simple_text: question.simple_text,
        tags: question.tags ?? null,
        cadence: question.cadence ?? null,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data?.id ?? null;

  } catch (error) {
    console.error("Failed to insert generated question:", error);
    throw error;
  }
}

/**
 * Inserts multiple questions in a single Supabase request.
 * @returns Array of inserted question IDs (same order as input).
 */
export async function insertGeneratedQuestions({
  questions,
}: {
  questions: Omit<QuestionRow, "id">[];
}): Promise<string[]> {
  if (questions.length === 0) {
    return [];
  }
  const rows = questions.map((q) => ({
    id: crypto.randomUUID(),
    category: q.category,
    simple_text: q.simple_text,
    tags: q.tags ?? null,
    cadence: q.cadence ?? null,
  }));
  const ids = rows.map((r) => r.id);
  try {
    const { error } = await supabaseWorker.from("questions").insert(rows);

    if (error) {
      throw error;
    }

    return ids;
  } catch (error) {
    console.error("Failed to insert generated questions:", error);
    throw error;
  }
}

export async function setDailyQuestion({
  questionId,
  force = false,
}: {
  questionId: string;
  force?: boolean;
}): Promise<boolean> {
  // Read current value (singleton row)
  const { data: current, error: readError } = await supabaseWorker
    .from("today_config")
    .select("id, today_question_id")
    .eq("id", 1)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  // If already set to the same question and not forcing, no-op
  if (!force && current?.today_question_id === questionId) {
    return false;
  }

  // Upsert singleton row
  const { error: upsertError } = await supabaseWorker
    .from("today_config")
    .upsert(
      {
        id: 1,
        today_question_id: questionId,
      },
      { onConflict: "id" }
    );

  if (upsertError) {
    throw upsertError;
  }

  return true;
}