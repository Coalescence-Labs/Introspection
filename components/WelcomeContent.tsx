"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function WelcomeContent() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col px-6">
      <div className="snap-start flex flex-col flex-1 relative min-h-dvh pt-20 pb-[14rem] sm:pt-32">
        <div className="mx-auto flex flex-1 w-full max-w-[900px] flex-col items-center justify-center text-center select-none">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            INTROSPECTION
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-[clamp(3rem,8vw,4.5rem)] font-medium leading-[1.4] tracking-[-0.02em] text-foreground"
          >
            Turn AI conversations into lasting insights
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10 max-w-2xl text-lg font-normal leading-relaxed text-foreground/80 sm:text-xl"
          >
            Questions designed to surface what's hidden in your past conversations. <br />
            Works with any LLM — just copy, paste, and look closer.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/today"
              tabIndex={0}
              className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-md bg-accent px-10 py-5 text-base font-semibold text-accent-foreground shadow-sm transition-all duration-[250ms] hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-lg"
              prefetch={true}
            >
              Try a question
            </Link>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute bottom-4 left-0 right-0 text-center text-sm font-light text-muted-foreground/70"
        >
          Built by an independent developer, not a data company
        </motion.p>
      </div>
      <div className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <div className="mx-auto w-full max-w-[1200px] flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl rounded-2xl border border-border/50 bg-foreground/[0.02] px-8 py-10 text-center backdrop-blur-[2px] sm:px-12 sm:py-12">
            <h2 className="mb-8 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              Your Conversations Already Contain Structure
            </h2>
            <p className="mx-auto mb-6 max-w-xl text-xl font-normal leading-relaxed text-foreground/95">
              If you use AI often, you've created:
            </p>
            <div className="mx-auto mb-10 max-w-xl space-y-2 text-xl font-normal leading-relaxed text-foreground/95">
              <p>emerging themes</p>
              <p>repeated ideas</p>
              <p>implicit goals</p>
              <p>evolving preferences</p>
              <p>unresolved tensions</p>
            </div>
            <p className="mx-auto mb-3 max-w-xl -translate-x-10 text-xl font-normal text-foreground">
              But conversations fade.
            </p>
            <p className="mx-auto mb-10 max-w-xl translate-x-10 text-xl font-normal text-foreground">
              Patterns remain hidden.
            </p>
            <p className="mx-auto max-w-xl text-xl font-normal leading-relaxed text-foreground/95">
              Introspection brings coherence to what already exists.
            </p>
          </div>
        </div>
      </div>
      <div className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
          <h2 className="mb-10 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <ol className="mx-auto mb-12 max-w-xl list-inside list-decimal space-y-4 text-left text-xl font-normal leading-relaxed text-foreground/80">
            <li>Choose a reflection prompt</li>
            <li>Copy & Paste into your preferred LLM</li>
            <li>Receive a structured analysis</li>
          </ol>
          <div className="space-y-2 text-xl font-normal leading-relaxed text-foreground/80">
            <p>Model-agnostic.</p>
            <p>Privacy-forward.</p>
            <p>Lightweight by design.</p>
          </div>
        </div>
      </div>
      <div className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
          <h2 className="mb-10 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            The Result
          </h2>
          <div className="mb-10 space-y-2 text-xl font-normal leading-relaxed text-foreground/80">
            <p>Clarity.</p>
            <p>Integration.</p>
            <p>Durable insight.</p>
          </div>
          <p className="mb-4 text-xl font-normal leading-relaxed text-foreground/80">
            You've already done the thinking.
          </p>
          <p className="text-xl font-normal leading-relaxed text-foreground/80">Now see it.</p>
        </div>
      </div>
      <div className="snap-start flex flex-col items-center justify-center relative h-dvh px-6">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
          <h2 className="mb-6 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Ready to reflect?
          </h2>
          <p className="mb-10 max-w-xl text-xl font-normal leading-relaxed text-foreground/80">
            Start with a question designed to surface what's already in your conversations.
          </p>
          <Link
            href="/today"
            className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-md bg-accent px-10 py-5 text-base font-semibold text-accent-foreground shadow-sm transition-all duration-[250ms] hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-lg"
            prefetch={true}
          >
            Try a question
          </Link>
        </div>
      </div>
    </main>
  );
}
