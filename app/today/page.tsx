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
 * Questions and today config are fetched in parallel to avoid a server waterfall.
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

/** Fetches request-bound data (connection + date) then renders the full layout with server-computed date label. Wrapped in Suspense so we can show a shell fallback immediately. */
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

/** Shown while the outer shell (layout + date label) is still loading. */
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

/** Today page: two Suspense levels so we can show shell fallback first, then layout + question fallback, then full content. */
export default function TodayPage() {
  return (
    <Suspense fallback={<TodayShellFallback />}>
      <TodayPageWithLabel />
    </Suspense>
  );
}
