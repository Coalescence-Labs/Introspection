"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface QuestionHeroProps {
  question: string;
}

export function QuestionHero({ question }: QuestionHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="question-hero text-center h-full flex items-center justify-center overflow-hidden shrink-0"
    >
      <h1 className="font-serif text-[clamp(2.125rem,5vw,4rem)] leading-[1.15] tracking-[-0.02em] text-foreground w-full min-h-[3.45em] flex items-center justify-center">
        {question}
      </h1>
    </motion.div>
  );
}
