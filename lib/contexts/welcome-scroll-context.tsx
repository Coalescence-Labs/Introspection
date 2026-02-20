"use client";

import { createContext, useContext } from "react";

/** Injected by WelcomePageShell; used by ParticleField (repel/attract) and WelcomeContent (active section). */
export type WelcomeScrollContextValue = {
  currentSection: number;
  isScrolling: boolean;
};

const WelcomeScrollContext = createContext<WelcomeScrollContextValue>({
  currentSection: 0,
  isScrolling: false,
});

/** Consume welcome scroll state. Returns defaults if used outside provider. */
export function useWelcomeScroll(): WelcomeScrollContextValue {
  const value = useContext(WelcomeScrollContext);
  if (value == null) {
    return { currentSection: 0, isScrolling: false };
  }
  return value;
}

export { WelcomeScrollContext };
