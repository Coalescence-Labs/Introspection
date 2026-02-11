"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import type { LLMType } from "@/lib/content/schema";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLLM = llms.find((llm) => llm.id === selected);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (!isExpanded) return;

      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isExpanded]);

  const handleSelect = (llm: LLMType) => {
    onSelect(llm);
    setIsExpanded(false);
  };

  return (
    <div className="relative h-[60px]" ref={containerRef}>
      {/* Condensed View - Selected LLM */}
      {!isExpanded && (
        <div className="flex justify-center">
          <motion.button
            onClick={() => setIsExpanded(true)}
            className="flex w-auto items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-sm transition-colors hover:border-accent/30 hover:shadow-md cursor-pointer"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.28 } }}
            exit={{ opacity: 0 }}
            tabIndex={0}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Optimize for:</span>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold tracking-tight">{selectedLLM?.name}</span>
                <span className="text-xs text-muted-foreground">{selectedLLM?.description}</span>
              </div>
            </div>
            <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </motion.button>
        </div>
      )}

      {/* Expanded View - All Options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-0 z-10 rounded-lg border border-border bg-background p-4 shadow-lg"
          >
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-3 text-center text-xs text-muted-foreground"
            >
              Choose export target for optimal prompt
            </motion.div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {llms.map((llm, index) => {
                const isSelected = selected === llm.id;

                // Calculate position relative to center for animation
                // For 2-col: indices 0,1 -> positions -0.5, 0.5
                // For 4-col: indices 0,1,2,3 -> positions -1.5, -0.5, 0.5, 1.5
                const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
                const cols = isMobile ? 2 : 4;
                const centerOffset = (index - (cols - 1) / 2) * 100;

                return (
                  <motion.button
                    key={llm.id}
                    onClick={() => handleSelect(llm.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    initial={{
                      opacity: 0,
                      scale: 0.6,
                      x: -centerOffset,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.6,
                      x: -centerOffset,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      delay: index * 0.04,
                    }}
                  >
                    <Card
                      className={cn(
                        "relative cursor-pointer border p-4 shadow-sm transition-all duration-200",
                        isSelected
                          ? "border-accent bg-accent/5 shadow-md ring-1 ring-accent/20"
                          : "border-border hover:border-accent/30 hover:shadow-md"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <span className="text-sm font-semibold tracking-tight">{llm.name}</span>
                        <span className="text-xs text-muted-foreground">{llm.description}</span>
                      </div>
                      {isSelected && (
                        <motion.div
                          className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                          layoutId="selected-underline"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                    </Card>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
