"use client";

import type { RefObject } from "react";
import { useWelcomeScroll } from "@/lib/contexts/welcome-scroll-context";
import { WelcomeSection } from "./welcome-section";
import { welcomeSections } from "./welcome-sections";

const mainClasses = "relative z-10 px-6 flex flex-col";

type WelcomeContentProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  touchMode: boolean;
};

/**
 * Renders welcome sections; on desktop uses containerRef for scroll container (useCustomScroll),
 * on touch uses native window scroll and a simple main wrapper.
 */
export function WelcomeContent({ containerRef, touchMode }: WelcomeContentProps) {
  const { currentSection } = useWelcomeScroll();

  const sections = (
    <>
      {welcomeSections.map((Section, index) => (
        <WelcomeSection
          key={index}
          active={currentSection === index}
          touchScroll={touchMode}
        >
          <Section />
        </WelcomeSection>
      ))}
    </>
  );

  if (touchMode) {
    return <main className={mainClasses}>{sections}</main>;
  }

  return (
    <div
      ref={containerRef}
      className="h-dvh overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
    >
      <main className={mainClasses}>{sections}</main>
    </div>
  );
}
