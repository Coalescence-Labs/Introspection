"use client";

import { useRef } from "react";
import { ParticleField } from "@/components/ParticleField";
import { ThemeToggle } from "@/components/theme-toggle";
import { WelcomeContent } from "@/components/WelcomeContent";
import { WelcomeScrollContext } from "@/lib/contexts/welcome-scroll-context";
import { useCustomScroll } from "@/lib/hooks/useCustomScroll";
import { useTouchDevice } from "@/lib/hooks/useTouchDevice";
import { welcomeSections } from "@/components/welcome-sections";

/**
 * Welcome (landing) page: particle background, section-based scroll, theme toggle.
 * Provides WelcomeScrollContext (currentSection, isScrolling) to children.
 */
export function WelcomePageShell() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchMode = useTouchDevice();
  const { currentSection, isScrolling } = useCustomScroll(
    containerRef,
    welcomeSections.length,
    touchMode
  );

  return (
    <WelcomeScrollContext.Provider value={{ currentSection, isScrolling }}>
      <div
        className={
          touchMode
            ? "relative min-h-screen bg-background"
            : "relative h-dvh overflow-hidden bg-background"
        }
      >
        <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-20">
          <ThemeToggle aria-label="Toggle theme" />
        </div>
        <ParticleField />
        <WelcomeContent containerRef={containerRef} touchMode={touchMode} />
      </div>
    </WelcomeScrollContext.Provider>
  );
}
