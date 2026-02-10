"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PromptPreviewProps {
  title: string;
  fullPrompt: string;
}

export function PromptPreview({ title, fullPrompt }: PromptPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-muted/50">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between text-left transition-colors hover:text-accent"
          type="button"
        >
          <div className="space-y-1">
            <CardTitle className="text-base">Prompt Preview</CardTitle>
            <CardDescription className="text-xs">
              See the full optimized prompt that will be copied
            </CardDescription>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
                {fullPrompt}
              </pre>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
