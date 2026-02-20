"use client";

import { useState, useEffect } from "react";

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
