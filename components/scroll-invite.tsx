"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface ScrollInviteProps {
  /** ID of the element to scroll to on click. Ignored if onScrollClick is set. */
  targetId?: string;
  /** Optional accessible label. */
  label?: string;
  /** Optional: custom handler (e.g. section-based scroll). When set, targetId is ignored. */
  onScrollClick?: () => void;
}

/** 0 = hidden, 1 = visible static, 2 = visible pulsing */
type Phase = 0 | 1 | 2;

const HIDE_MS = 7000;
const STATIC_MS = 7000;

/**
 * Pulsing down arrow that invites scrolling. Hidden 0–7s, visible static 7–14s, then pulsing.
 * On click, either calls onScrollClick or smooth-scrolls to targetId.
 */
export function ScrollInvite({
  targetId = "today-next",
  label = "Scroll to next section",
  onScrollClick,
}: ScrollInviteProps) {
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), HIDE_MS);
    const t2 = setTimeout(() => setPhase(2), HIDE_MS + STATIC_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleClick = () => {
    if (onScrollClick) {
      onScrollClick();
    } else {
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-hidden={phase === 0}
      className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full p-2 cursor-pointer"
      style={{
        visibility: phase === 0 ? "hidden" : "visible",
        pointerEvents: phase === 0 ? "none" : "auto",
      }}
      animate={{ opacity: phase === 0 ? 0 : 1 }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { type: "spring", stiffness: 400, damping: 17 },
      }}
      whileHover={phase > 0 ? { scale: 1.05 } : undefined}
      whileTap={phase > 0 ? { scale: 0.98 } : undefined}
    >
      <motion.span
        className="flex items-center justify-center"
        animate={phase === 2 ? { y: [0, 5, 0] } : { y: 0 }}
        transition={
          phase === 2
            ? {
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.22, 1, 0.36, 1],
            }
            : { duration: 0.3 }
        }
      >
        <ChevronDown className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.75} />
      </motion.span>
    </motion.button>
  );
}
