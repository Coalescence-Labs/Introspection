"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LLMType, Question } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";

const llms: LLMType[] = ["claude", "chatgpt", "gemini", "perplexity"];

interface PreviewPageClientProps {
  initialQuestion: Question;
  todayLabel: string;
}

export function PreviewPageClient({ initialQuestion, todayLabel }: PreviewPageClientProps) {
  const [prompts, setPrompts] = useState<Record<LLMType, { title: string; fullPrompt: string }>>(
    {} as Record<LLMType, { title: string; fullPrompt: string }>
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      window.location.href = "/";
      return;
    }

    const generated: Record<LLMType, { title: string; fullPrompt: string }> = {} as Record<
      LLMType,
      { title: string; fullPrompt: string }
    >;
    for (const llm of llms) {
      generated[llm] = generatePrompt(initialQuestion, {
        llm,
        speechFriendly: false,
      });
    }
    setPrompts(generated);
  }, [initialQuestion]);

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  const question = initialQuestion;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
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
          Today's question • {todayLabel} • ID: {question.id}
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{question.simple_text}</p>
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

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        <p>This page is only available in development mode</p>
      </footer>
    </main>
  );
}
