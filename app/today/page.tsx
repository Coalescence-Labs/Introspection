import { Suspense } from "react";
import { headers } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";
import { TodayPageClient } from "@/components/today-page-client";
import { getCachedQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import { getTodayString } from "@/lib/utils";

/**
 * Returns the daily question for the given date. Cached per calendar day (dateKey)
 * so requests at 8pm Day1 and 7am Day2 get the correct question for each day.
 */
async function getCachedDailyQuestion(dateKey: string) {
  "use cache";
  cacheLife("days");
  cacheTag("daily-question");
  const questions = await getCachedQuestions();
  const todayConfig = await loadTodayConfig();
  return todayConfig
    ? (questions.find((q) => q.id === todayConfig) ?? getTodayQuestion(questions))
    : getTodayQuestion(questions);
}

/** Fetches dynamic data (headers + date); must run inside Suspense to avoid blocking the route. */
async function TodayContent() {
  await headers();
  const todayQuestion = await getCachedDailyQuestion(getTodayString());
  return <TodayPageClient initialQuestion={todayQuestion} />;
}

/** Shown while TodayContent is loading (Suspense fallback). */
function TodayFallback() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-muted-foreground animate-pulse">Loading today’s question…</div>
    </main>
  );
}

/** Today's question page. Dynamic (date-dependent); data cached per day via getCachedDailyQuestion. */
export default function TodayPage() {
  return (
    <Suspense fallback={<TodayFallback />}>
      <TodayContent />
    </Suspense>
  );
}
