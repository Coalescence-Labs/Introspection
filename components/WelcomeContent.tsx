"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function WelcomeContent() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-16 sm:pt-32 sm:pb-24">
      <div className="mx-auto flex w-full max-w-[900px] flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-xs uppercase tracking-[0.2em] text-[#EDEDED]/60"
        >
          INTROSPECTION
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-[clamp(3rem,8vw,4.5rem)] font-bold leading-[1.2] tracking-[-0.02em] text-[#EDEDED]"
        >
          Turn AI conversations into lasting insights
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 max-w-2xl text-lg font-medium leading-relaxed text-[#EDEDED]/80 sm:text-xl"
        >
          Curated introspection questions, optimized for every LLM. Copy, paste, discover
          patterns you&apos;d never notice on your own.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="/today"
            className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-md bg-accent px-10 py-5 text-base font-semibold text-accent-foreground shadow-sm transition-all duration-[250ms] hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0F11] sm:text-lg"
            prefetch={true}
          >
            Try a question
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-sm text-[#EDEDED]/60"
        >
          Built by an independent developer, not a data company
        </motion.p>
      </div>
    </main>
  );
}
