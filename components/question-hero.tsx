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
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center"
    >
      <h1 className="text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
        {question}
      </h1>
    </motion.div>
  );
}
