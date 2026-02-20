"use client";

import { createContext, useContext } from "react";

export type WelcomeScrollContextValue = {
  currentSection: number;
  isScrolling: boolean;
};

const WelcomeScrollContext = createContext<WelcomeScrollContextValue>({
  currentSection: 0,
  isScrolling: false,
});

export function useWelcomeScroll(): WelcomeScrollContextValue {
  const value = useContext(WelcomeScrollContext);
  if (value == null) {
    return { currentSection: 0, isScrolling: false };
  }
  return value;
}

export { WelcomeScrollContext };
