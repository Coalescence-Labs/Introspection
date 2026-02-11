"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyIconButton } from "@/components/copy-icon-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadQuestions } from "@/lib/content/loader";
import type { LLMType, Question, QuestionCategory } from "@/lib/content/schema";
import { generatePrompt } from "@/lib/prompt/engine";

const categoryLabels: Record<QuestionCategory, string> = {
  career: "Career & Growth",
  ideas: "Ideas & Creativity",
  learning: "Learning & Knowledge",
  patterns: "Patterns & Self-Awareness",
  productivity: "Productivity & Process",
  reflection: "Reflection & Growth",
};

export default function LibraryPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | "all">("all");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedLLM] = useState<LLMType>("claude"); // Default to Claude

  useEffect(() => {
    async function load() {
      const loaded = await loadQuestions();
      setQuestions(loaded);
    }
    load();
  }, []);

  const categories = Object.keys(categoryLabels) as QuestionCategory[];

  const filteredQuestions =
    selectedCategory === "all"
      ? questions
      : questions.filter((q) => q.category === selectedCategory);

  const questionsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = filteredQuestions.filter((q) => q.category === category);
      return acc;
    },
    {} as Record<QuestionCategory, Question[]>
  );

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-24 sm:py-32">
      {/* Header */}
      <div className="mb-12">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to today
        </Link>
        <h1 className="text-4xl font-bold">Question Library</h1>
        <p className="mt-2 text-muted-foreground">Browse all introspection questions by category</p>
      </div>

      {/* Category Filters */}
      <div className="mb-12 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-accent/10"
          }`}
          type="button"
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === category
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent/10"
            }`}
            type="button"
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Questions by Category */}
      <div className="space-y-16">
        {categories.map((category) => {
          const categoryQuestions = questionsByCategory[category];
          if (categoryQuestions.length === 0) return null;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="mb-6 text-2xl font-semibold">{categoryLabels[category]}</h2>
              <div className="space-y-3">
                {categoryQuestions.map((question) => {
                  const isHovered = hoveredCard === question.id;
                  const prompt = generatePrompt(question, {
                    llm: selectedLLM,
                    speechFriendly: false,
                  });

                  return (
                    <motion.div
                      key={question.id}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setHoveredCard(question.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <Card className="group relative cursor-pointer border-l-4 border-l-accent/50 transition-all hover:border-l-accent hover:shadow-md">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{question.simpleText}</CardTitle>
                              {question.tags && (
                                <CardDescription className="mt-2 flex gap-2">
                                  {question.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-muted px-2 py-0.5 text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </CardDescription>
                              )}
                            </div>

                            {/* Copy button - appears on hover */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{
                                opacity: isHovered ? 1 : 0,
                                scale: isHovered ? 1 : 0.8,
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <CopyIconButton text={prompt.fullPrompt} />
                            </motion.div>
                          </div>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-muted-foreground">
        <div className="mb-4 flex justify-center">
          <ThemeToggle />
        </div>
        <p>{questions.length} questions available</p>
      </footer>
    </main>
  );
}
