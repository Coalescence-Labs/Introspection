"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyIconButtonProps {
  text: string;
  onCopy?: () => void;
  className?: string;
}

// Corner sparkle for success animation
function CornerSparkle({ corner, delay }: { corner: "top-right" | "bottom-left"; delay: number }) {
  const isTopRight = corner === "top-right";

  return (
    <motion.div
      className={`absolute ${isTopRight ? "-top-1 -right-1" : "-bottom-1 -left-1"}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <motion.path
          d="M6 0L6.5 5.5L6 6L5.5 5.5L6 0Z"
          fill="currentColor"
          className="text-accent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, delay }}
        />
        <motion.path
          d="M12 6L6.5 5.5L6 6L6.5 6.5L12 6Z"
          fill="currentColor"
          className="text-accent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, delay: delay + 0.08 }}
        />
        <motion.circle
          cx="6"
          cy="6"
          r="1.5"
          fill="currentColor"
          className="text-accent"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 0] }}
          transition={{ duration: 0.4, delay: delay + 0.04 }}
        />
      </svg>
    </motion.div>
  );
}

export function CopyIconButton({ text, onCopy, className }: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.();

        setTimeout(() => {
          setCopied(false);
        }, 1500);
      } else {
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

          setTimeout(() => {
            setCopied(false);
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="relative">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !copied && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground shadow-lg"
          >
            Copy prompt
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onClick={handleCopy}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-accent hover:bg-accent/10",
          className
        )}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        type="button"
      >
        {/* Corner sparkles - appear when copied */}
        <AnimatePresence>
          {copied && (
            <>
              <CornerSparkle corner="top-right" delay={0} />
              <CornerSparkle corner="bottom-left" delay={0.08} />
            </>
          )}
        </AnimatePresence>

        {/* Icon with transform animation */}
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
            >
              <Check className="h-4 w-4 text-accent" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
