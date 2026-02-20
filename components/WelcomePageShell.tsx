"use client";

import { useTouchDevice } from "@/lib/hooks/useTouchDevice";

export function WelcomePageShell({ children }: { children: React.ReactNode }) {
  const touchMode = useTouchDevice();
  return (
    <div
      className={
        touchMode
          ? "relative min-h-screen bg-background"
          : "relative h-dvh overflow-hidden bg-background"
      }
    >
      {children}
    </div>
  );
}
