import { TodayPageClient } from "@/components/today-page-client";
import { loadQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import { getTodayString } from "@/lib/utils";

export default async function TodayPage() {
  const questions = await loadQuestions();
  const todayConfig = await loadTodayConfig();

  const todayQuestion = todayConfig
    ? (questions.find((q) => q.id === todayConfig) ?? getTodayQuestion(questions))
    : getTodayQuestion(questions);

  const todayLabel = getTodayString();

  return <TodayPageClient initialQuestion={todayQuestion} todayLabel={todayLabel} />;
}
