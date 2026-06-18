import { redirect } from "next/navigation";
import { SandboxOrganicLlmPageClient } from "@/components/sandbox-organic-llm-page-client";
import { loadQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import { isOrganicHandoffEnabled } from "@/lib/organic/handoff-config";
import { getTodayString } from "@/lib/utils";

export default async function SandboxOrganicLlmPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const [questions, todayConfig] = await Promise.all([loadQuestions(), loadTodayConfig()]);

  const todayQuestion = todayConfig
    ? (questions.find((q) => q.id === todayConfig) ?? getTodayQuestion(questions))
    : getTodayQuestion(questions);

  const todayLabel = getTodayString();

  return (
    <SandboxOrganicLlmPageClient
      question={todayQuestion}
      todayLabel={todayLabel}
      organicHandoffEnabled={isOrganicHandoffEnabled()}
    />
  );
}
