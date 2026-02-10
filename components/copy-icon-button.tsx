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

// Particle component for sparkle effect
function Particle({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute h-1 w-1 rounded-full bg-accent"
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1, 0],
        x: [0, Math.random() * 40 - 20],
        y: [0, Math.random() * 40 - 20],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut",
      }}
    />
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
      >
        {/* Particles - appear when copied */}
        <AnimatePresence>
          {copied && (
            <>
              {[...Array(6)].map((_, i) => (
                <Particle key={i} delay={i * 0.05} />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Icon with transform animation */}
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check className="h-4 w-4 text-accent" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
