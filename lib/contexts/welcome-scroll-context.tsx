"use client";

import { createContext, useContext } from "react";

export type WelcomeScrollContextValue = {
  currentSection: number;
};

const WelcomeScrollContext = createContext<WelcomeScrollContextValue>({
  currentSection: 0,
});

export function useWelcomeScroll(): WelcomeScrollContextValue {
  const value = useContext(WelcomeScrollContext);
  if (value == null) {
    return { currentSection: 0 };
  }
  return value;
}

export { WelcomeScrollContext };
