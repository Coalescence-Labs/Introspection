import { Suspense } from "react";
import { headers } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";
import { TodayPageClient } from "@/components/today-page-client";
import { getCachedQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import { getTodayString } from "@/lib/utils";

/** Cache key is per calendar day (dateKey) so 8pm Day1 → 7am Day2 gets fresh question. */
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

async function TodayContent() {
  await headers(); // Opt into dynamic so getTodayString() / new Date() is allowed
  const todayQuestion = await getCachedDailyQuestion(getTodayString());
  return <TodayPageClient initialQuestion={todayQuestion} />;
}

function TodayFallback() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-muted-foreground animate-pulse">Loading today’s question…</div>
    </main>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<TodayFallback />}>
      <TodayContent />
    </Suspense>
  );
}
