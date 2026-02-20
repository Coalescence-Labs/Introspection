import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a stable hash from a string (used for deterministic daily rotation)
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Get today's date in UI formatted way
 */
export function getTodayLabel(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/** Throttle a function to at most once per `delay` ms. Preserves argument types. */
export function throttle<T extends readonly unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let last = 0;
  return (...args: T): void => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  };
}
