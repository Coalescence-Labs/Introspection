"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Custom icon that combines Sun (upper left) and Moon (bottom right) split diagonally
function SunMoon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Diagonal clip paths */}
      <defs>
        <clipPath id="clip-sun">
          <polygon points="0,0 24,0 0,24" />
        </clipPath>
        <clipPath id="clip-moon">
          <polygon points="24,0 24,24 0,24" />
        </clipPath>
      </defs>

      {/* Sun (top-left half) - matches Lucide Sun */}
      <g clipPath="url(#clip-sun)">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>

      {/* Moon (bottom-right half) - matches Lucide Moon */}
      <g clipPath="url(#clip-moon)">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </g>

      {/* Diagonal divider - pronounced split */}
      <line x1="0" y1="24" x2="24" y2="0" strokeWidth="2" opacity="0.6" />
    </svg>
  );
}

export function ThemeToggle({ className, ...props }: React.ComponentProps<typeof motion.button>) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex h-9 w-9 items-center justify-center", className)}>
        <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "system") return "system";
    if (theme === "dark") return "dark";
    return "light";
  };

  const iconKey = getIcon();

  return (
    <motion.button
      onClick={cycleTheme}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-accent hover:bg-accent/10 cursor-pointer",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      title={`Theme: ${theme}`}
      type="button"
      {...props}
    >
      <AnimatePresence mode="wait">
        {iconKey === "dark" && (
          <motion.div
            key="dark"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 600, damping: 15, delay: 0 }}
          >
            <Moon className="h-4 w-4 text-foreground" />
          </motion.div>
        )}
        {iconKey === "light" && (
          <motion.div
            key="light"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 600, damping: 15, delay: 0 }}
          >
            <Sun className="h-4 w-4 text-foreground" />
          </motion.div>
        )}
        {iconKey === "system" && (
          <motion.div
            key="system"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 600, damping: 15, delay: 0 }}
          >
            <SunMoon className="h-4 w-4 text-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
