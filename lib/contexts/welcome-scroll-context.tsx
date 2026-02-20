"use client";

import { createContext, useContext } from "react";

/** Injected by WelcomePageShell; used by ParticleField (repel/attract), WelcomeContent (active section), ScrollInvite. */
export type WelcomeScrollContextValue = {
  currentSection: number;
  isScrolling: boolean;
  scrollToNextSection: () => void;
};

const WelcomeScrollContext = createContext<WelcomeScrollContextValue>({
  currentSection: 0,
  isScrolling: false,
  scrollToNextSection: () => {},
});

/** Consume welcome scroll state. Returns defaults if used outside provider. */
export function useWelcomeScroll(): WelcomeScrollContextValue {
  const value = useContext(WelcomeScrollContext);
  if (value == null) {
    return { currentSection: 0, isScrolling: false, scrollToNextSection: () => {} };
  }
  return value;
}

export { WelcomeScrollContext };
