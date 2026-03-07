import { Suspense } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { TodayPageLayout } from "@/components/today-page-layout";
import { TodayQuestionBlock } from "@/components/today-question-block";
import { getCachedQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import { getTodayLabel, getTodayString } from "@/lib/utils";

/**
 * Returns the daily question for the given date. Cached per calendar day (dateKey)
 * so requests at 8pm Day1 and 7am Day2 get the correct question for each day.
 */
async function getCachedDailyQuestion(dateKey: string) {
  "use cache";
  cacheLife("days");
  cacheTag("daily-question");
  const [questions, todayConfig] = await Promise.all([
    getCachedQuestions(),
    loadTodayConfig(),
  ]);
  return todayConfig
    ? (questions.find((q) => q.id === todayConfig) ?? getTodayQuestion(questions))
    : getTodayQuestion(questions);
}

/** Fetches the daily question; runs inside Suspense so the shell can render instantly. */
async function TodayQuestionContent() {
  await connection();
  const todayQuestion = await getCachedDailyQuestion(getTodayString());
  return <TodayQuestionBlock initialQuestion={todayQuestion} />;
}

/** Fallback for the question block (hero only); shell is already visible. */
function TodayQuestionFallback() {
  return (
    <div className="mb-16 sm:mb-20 flex-1 flex flex-col items-center justify-center min-h-[200px]">
      <div className="text-muted-foreground animate-pulse">Loading today’s question…</div>
    </div>
  );
}

/** Async shell: fetches request-bound data (connection + date) then renders layout with server-computed label. */
async function TodayPageWithLabel() {
  await connection();
  const todayLabel = getTodayLabel();
  return (
    <TodayPageLayout todayLabel={todayLabel}>
      <Suspense fallback={<TodayQuestionFallback />}>
        <TodayQuestionContent />
      </Suspense>
    </TodayPageLayout>
  );
}

/** Fallback while shell (including date label) is loading. */
function TodayShellFallback() {
  return (
    <main className="mx-auto max-w-5xl px-6 flex flex-col gap-20">
      <section className="flex flex-col py-16 sm:py-20" style={{ height: "100dvh" }}>
        <div className="mb-16 sm:mb-20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Daily Question</div>
        </div>
        <TodayQuestionFallback />
      </section>
    </main>
  );
}

/** Today's question page. Shell (with label) and question load in Suspense. */
export default function TodayPage() {
  return (
    <Suspense fallback={<TodayShellFallback />}>
      <TodayPageWithLabel />
    </Suspense>
  );
}
