"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary: catches unhandled errors in the app and shows a recovery UI.
 * Logs the error and offers a "Try again" button that re-renders the segment (reset).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="mb-3 text-3xl font-semibold">The page could not be loaded.</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Try again, or refresh if the problem persists.
      </p>
      <Button variant="accent" size="lg" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
