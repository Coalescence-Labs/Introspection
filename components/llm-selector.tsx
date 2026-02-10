"use client";

import { Card } from "@/components/ui/card";
import type { LLMType } from "@/lib/content/schema";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const llms = [
  {
    id: "claude" as LLMType,
    name: "Claude",
    description: "Anthropic",
  },
  {
    id: "chatgpt" as LLMType,
    name: "ChatGPT",
    description: "OpenAI",
  },
  {
    id: "gemini" as LLMType,
    name: "Gemini",
    description: "Google",
  },
  {
    id: "perplexity" as LLMType,
    name: "Perplexity",
    description: "Research-focused",
  },
];

interface LLMSelectorProps {
  selected: LLMType;
  onSelect: (llm: LLMType) => void;
}

export function LLMSelector({ selected, onSelect }: LLMSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {llms.map((llm) => {
        const isSelected = selected === llm.id;
        return (
          <motion.button
            key={llm.id}
            onClick={() => onSelect(llm.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            type="button"
          >
            <Card
              className={cn(
                "relative cursor-pointer border p-3 transition-all hover:shadow-sm",
                isSelected
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border hover:border-accent/50"
              )}
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold">{llm.name}</span>
                <span className="text-xs text-muted-foreground">{llm.description}</span>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}
