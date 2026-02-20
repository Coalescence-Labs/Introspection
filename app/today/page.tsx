import { Suspense } from "react";
import { headers } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";
import { TodayPageShell, TodayQuestionBlock } from "@/components/today-page-client";
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

/** Fetches the daily question; runs inside Suspense so the shell can render instantly. */
async function TodayQuestionContent() {
  await headers();
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

/** Today's question page. Shell (header, LLM, speech, copy) shows immediately; question loads in Suspense. */
export default function TodayPage() {
  return (
    <TodayPageShell>
      <Suspense fallback={<TodayQuestionFallback />}>
        <TodayQuestionContent />
      </Suspense>
    </TodayPageShell>
  );
}
