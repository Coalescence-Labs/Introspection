import { TodayPageClient } from "@/components/today-page-client";
import { loadQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import { getTodayLabel, getTodayString } from "@/lib/utils";

/** Avoid caching so Supabase questions/today config are always fresh. */
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const questions = await loadQuestions();
  const todayConfig = await loadTodayConfig();

  const todayQuestion = todayConfig
    ? (questions.find((q) => q.id === todayConfig) ?? getTodayQuestion(questions))
    : getTodayQuestion(questions);


  return <TodayPageClient initialQuestion={todayQuestion} />;
}
