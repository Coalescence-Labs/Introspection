"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadQuestions, loadTodayConfig } from "@/lib/content/loader";
import { getTodayQuestion } from "@/lib/content/rotation";
import type { LLMType, Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";
import { getTodayString } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

const llms: LLMType[] = ["claude", "chatgpt", "gemini", "perplexity"];

export default function PreviewPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [prompts, setPrompts] = useState<Record<LLMType, { title: string; fullPrompt: string }>>(
    {} as Record<LLMType, { title: string; fullPrompt: string }>
  );

  useEffect(() => {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      window.location.href = "/";
      return;
    }

    async function loadTodayQuestion() {
      const questions = await loadQuestions();
      const todayConfig = await loadTodayConfig();

      let todayQuestion: Question;
      if (todayConfig) {
        const found = questions.find((q) => q.id === todayConfig);
        todayQuestion = found || getTodayQuestion(questions);
      } else {
        todayQuestion = getTodayQuestion(questions);
      }

      setQuestion(todayQuestion);

      // Generate prompts for all LLMs
      const generated: Record<LLMType, { title: string; fullPrompt: string }> = {} as Record<
        LLMType,
        { title: string; fullPrompt: string }
      >;
      for (const llm of llms) {
        generated[llm] = generatePrompt(todayQuestion, {
          llm,
          speechFriendly: false,
        });
      }
      setPrompts(generated);
    }

    loadTodayQuestion();
  }, []);

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to today
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Prompt Preview</h1>
          <div className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Development Only
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Today's question • {getTodayString()} • ID: {question.id}
        </p>
      </div>

      {/* Question */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{question.simpleText}</p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs">
              Category: {question.category}
            </span>
            {question.cadence && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                Cadence: {question.cadence}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Prompts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Generated Prompts (Template Mode)</h2>
        {llms.map((llm) => {
          const prompt = prompts[llm];
          if (!prompt) return null;

          return (
            <Card key={llm}>
              <CardHeader>
                <CardTitle className="capitalize">{llm}</CardTitle>
                <CardDescription>
                  {question.variants?.[llm] ? "Using editorial variant" : "Using template"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
                  {prompt.fullPrompt}
                </pre>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        <p>This page is only available in development mode</p>
      </footer>
    </main>
  );
}
