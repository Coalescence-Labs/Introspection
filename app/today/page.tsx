import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";
import { TodayQuestionBlock } from "@/components/today-question-block";
import { getCachedQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import { getTodayString } from "@/lib/utils";

/**
 * Returns the daily question for the given date. Cached per calendar day (dateKey)
 * so requests at 8pm Day1 and 7am Day2 get the correct question for each day.
 * Questions and today config are fetched in parallel to avoid a server waterfall.
 */
async function getCachedDailyQuestion(_dateKey: string) {
  "use cache";
  cacheLife("days");
  cacheTag("daily-question");
  const [questions, todayConfig] = await Promise.all([getCachedQuestions(), loadTodayConfig()]);
  return todayConfig
    ? (questions.find((q) => q.id === todayConfig) ?? getTodayQuestion(questions))
    : getTodayQuestion(questions);
}

/** Async component that fetches the daily question and renders the hero + prompt block. Runs inside Suspense so the shell can paint first. */
async function TodayQuestionContent() {
  await connection();
  const todayQuestion = await getCachedDailyQuestion(getTodayString());
  return <TodayQuestionBlock initialQuestion={todayQuestion} />;
}

/** Shown in the hero area while the daily question is loading. */
function TodayQuestionFallback() {
  return (
    <div className="mb-16 sm:mb-20 flex-1 flex flex-col items-center justify-center min-h-[200px]">
      <div className="text-muted-foreground animate-pulse">Loading today’s question…</div>
    </div>
  );
}

/** Today page: the route layout owns the shared shell while this page streams the question block into it. */
export default function TodayPage() {
  return (
    <Suspense fallback={<TodayQuestionFallback />}>
      <TodayQuestionContent />
    </Suspense>
  );
}
