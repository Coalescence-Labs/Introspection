"use client";

import { useState, useEffect } from "react";

/** Detects touch-capable device (touchstart, maxTouchPoints, or coarse pointer). Used for scroll mode on welcome page. */
export function useTouchDevice(): boolean {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const check = () =>
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
    setTouch(check());
  }, []);

  return touch;
}
