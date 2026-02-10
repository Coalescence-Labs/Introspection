"use client";

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Sparkle component for success animation
function Sparkle({ delay, angle }: { delay: number; angle: number }) {
  const distance = 30;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-accent"
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1, 0.5, 0],
        x: [0, x * 0.5, x, x * 1.2],
        y: [0, y * 0.5, y, y * 1.2],
        opacity: [1, 1, 0.8, 0],
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
}

export function CopyButton({ text, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.();

        // Reset after 1.5s
        setTimeout(() => {
          setCopied(false);
        }, 1500);
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

          setTimeout(() => {
            setCopied(false);
          }, 1500);
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
      {/* Sparkle particles - appear outside button on success */}
      <AnimatePresence>
        {copied && (
          <>
            {[...Array(8)].map((_, i) => (
              <Sparkle key={i} delay={i * 0.05} angle={(Math.PI * 2 * i) / 8} />
            ))}
          </>
        )}
      </AnimatePresence>

      <Button
        variant="accent"
        size="xl"
        onClick={handleCopy}
        className="relative min-w-[240px] overflow-visible"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="copied"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-2"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <Check className="h-5 w-5" />
              </motion.div>
              Copied!
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-2"
            >
              <Copy className="h-5 w-5" />
              Copy Prompt to Clipboard
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}
