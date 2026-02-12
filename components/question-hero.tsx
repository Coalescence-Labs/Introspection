"use client";

import { motion } from "framer-motion";

interface QuestionHeroProps {
  question: string;
}

export function QuestionHero({ question }: QuestionHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="question-hero text-center"
    >
      <h1 className="font-serif text-[clamp(2.125rem,5vw,5rem)] leading-[1.15] tracking-[-0.02em] text-foreground">
        {question}
      </h1>
    </motion.div>
  );
}
