"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Custom icon that combines Sun (upper left) and Moon (bottom right) split diagonally
function SunMoon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="sun-clip">
          <polygon points="0,0 16,0 0,16" />
        </clipPath>
        <clipPath id="moon-clip">
          <polygon points="16,0 16,16 0,16" />
        </clipPath>
      </defs>

      {/* Sun half (upper left) */}
      <g clipPath="url(#sun-clip)">
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <line x1="8" y1="1" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="13.5" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13.5" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3.2" y1="3.2" x2="4.3" y2="4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11.7" y1="11.7" x2="12.8" y2="12.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3.2" y1="12.8" x2="4.3" y2="11.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11.7" y1="4.3" x2="12.8" y2="3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Moon half (bottom right) */}
      <g clipPath="url(#moon-clip)">
        <path
          d="M10 2.5C10 5.5 9 8 6 8C9 8 10 10.5 10 13.5C10 10.5 11 8 14 8C11 8 10 5.5 10 2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
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
        "relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-accent hover:bg-accent/10",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      title={`Theme: ${theme}`}
      type="button"
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
