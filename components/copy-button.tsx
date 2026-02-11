"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Corner sparkle components for success animation
function CornerSparkle({ corner, delay }: { corner: "top-right" | "bottom-left"; delay: number }) {
  const isTopRight = corner === "top-right";

  return (
    <motion.div
      className={`absolute ${isTopRight ? "-top-2 -right-2" : "-bottom-2 -left-2"}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <motion.path
          d="M10 0L11 9L10 10L9 9L10 0Z"
          fill="currentColor"
          className="text-accent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.6, delay }}
        />
        <motion.path
          d="M20 10L11 9L10 10L11 11L20 10Z"
          fill="currentColor"
          className="text-accent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.6, delay: delay + 0.1 }}
        />
        <motion.circle
          cx="10"
          cy="10"
          r="2"
          fill="currentColor"
          className="text-accent"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 0] }}
          transition={{ duration: 0.5, delay: delay + 0.05 }}
        />
      </svg>
    </motion.div>
  );
}

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
}

export function CopyButton({ text, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  // Auto-reset after 1.5s
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Reset copied state when text changes (new prompt being copied)
  // biome-ignore lint/correctness/useExhaustiveDependencies: text dependency is intentional
  useEffect(() => {
    setCopied(false);
  }, [text]);

  const handleCopy = async () => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.();
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const success = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (success) {
          setCopied(true);
          onCopy?.();
        } else {
          throw new Error("Copy command failed");
        }
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      // Show error to user
      alert("Failed to copy to clipboard. Please try selecting and copying the text manually.");
    }
  };

  return (
    <div className="relative">
      {/* Corner sparkles - appear outside button on success */}
      <AnimatePresence>
        {copied && (
          <>
            <CornerSparkle corner="top-right" delay={0} />
            <CornerSparkle corner="bottom-left" delay={0.1} />
          </>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          variant="accent"
          size="xl"
          onClick={handleCopy}
          className="relative w-[280px] overflow-visible"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="copied"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                >
                  <Check className="h-5 w-5" />
                </motion.div>
                Copied!
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex items-center gap-2"
              >
                <Copy className="h-5 w-5" />
                Copy Prompt to Clipboard
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
}
