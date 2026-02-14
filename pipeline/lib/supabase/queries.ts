import { QuestionFeaturedHistory, QuestionRow } from "@/lib/content/schema";
import { supabaseWorker } from "./supabase-worker";


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

interface RecordRunResultInput {
  status: "started" | "success" | "error";
  model: string;
  runId: string;
  date?: string;
  notes?: string;
}

export async function recordRunResult({ date, status, model, runId, notes }: RecordRunResultInput): Promise<void> {

  try {
    const { data, error } = await supabaseWorker.from("generation_runs").upsert({
      run_date: date,
      status,
      model,
      run_id: runId,
      notes,
    }, {
      onConflict: "run_date",
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Failed to record run result:", error);
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
        .limit(limit ?? 10);

    if (error) {
      throw error;
    }
    if (data && data.length === 0) {
      console.warn("No recent daily questions found");
      return [];
    }

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
  try {
    const { data, error } = await supabaseWorker
      .from("questions")
      .insert({
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