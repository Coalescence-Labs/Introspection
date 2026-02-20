"use client";

import { RefObject, useState, useEffect, useRef } from "react";
import { throttle } from "@/lib/utils";

const SCROLL_DELAY_MS = 600;
const SCROLL_THROTTLE_MS = 900;
const TOUCH_SWIPE_THRESHOLD_PX = 50;
const TOUCH_SECTION_THROTTLE_MS = 700;
const TOUCH_MOVE_IGNORE_PX = 12;
const IS_SCROLLING_RESET_MS = 700;

/** Map scroll position to section index (0-based). Clamped to [0, count-1]. */
function sectionFromScrollTop(scrollTop: number, sectionHeight: number, count: number): number {
  if (sectionHeight <= 0) return 0;
  const index = Math.round(scrollTop / sectionHeight);
  return Math.max(0, Math.min(index, count - 1));
}

/**
 * Section-based scroll behavior for the welcome page.
 * Desktop: wheel events advance one section; container scroll is driven by currentSection.
 * Touch: native window scroll; currentSection synced from scrollY; swipe advances one section with throttle.
 * Returns { currentSection, setCurrentSection, isScrolling } for UI and particle effects.
 */
export function useCustomScroll(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
  touchMode: boolean
) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnappingRef = useRef(false);
  const currentSectionRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchIsScrollRef = useRef(false);

  currentSectionRef.current = currentSection;

  /** Set isScrolling true and clear it after IS_SCROLLING_RESET_MS (for scroll-locked UI). */
  const markScrolling = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, IS_SCROLLING_RESET_MS);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Desktop: drive container scroll to currentSection (smooth scroll after short delay)
  useEffect(() => {
    if (touchMode) return;
    const container = containerRef.current;
    if (!container) return;

    const scrollIncrement = container.offsetHeight;
    const id = setTimeout(() => {
      container.scrollTo({
        top: currentSection * scrollIncrement,
        behavior: "smooth",
      });
    }, SCROLL_DELAY_MS);

    return () => clearTimeout(id);
  }, [currentSection, containerRef, touchMode]);

  // Desktop: keep currentSection in sync with container scroll position (throttled)
  useEffect(() => {
    if (touchMode) return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const h = container.offsetHeight;
      const index = sectionFromScrollTop(container.scrollTop, h, itemCount);
      setCurrentSection(index);
    };

    const throttledSync = throttle(handleScroll, 100);
    container.addEventListener("scroll", throttledSync, { passive: true });
    return () => container.removeEventListener("scroll", throttledSync);
  }, [containerRef, itemCount, touchMode]);

  // Touch: sync currentSection from window.scrollY (same logic as desktop but for window)
  useEffect(() => {
    if (!touchMode) return;

    const handleScroll = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      const index = sectionFromScrollTop(window.scrollY, h, itemCount);
      setCurrentSection(index);
    };

    const throttledSync = throttle(handleScroll, 100);
    window.addEventListener("scroll", throttledSync, { passive: true });
    return () => window.removeEventListener("scroll", throttledSync);
  }, [itemCount, touchMode]);

  // Touch: one section per swipe (prevent default on move; on end, advance by deltaY and scroll)
  useEffect(() => {
    if (!touchMode) return;

    const h = () => window.visualViewport?.height ?? window.innerHeight;
    const scrollToSection = (index: number) => {
      const top = Math.max(0, Math.min(index, itemCount - 1)) * h();
      setCurrentSection(Math.max(0, Math.min(index, itemCount - 1)));
      markScrolling();
      window.scrollTo({ top, behavior: "smooth" });
    };

    const throttledAdvance = throttle((dir: number) => {
      const next = currentSectionRef.current + dir;
      if (next < 0 || next >= itemCount) return;
      scrollToSection(next);
    }, TOUCH_SECTION_THROTTLE_MS);

    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
      touchIsScrollRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchIsScrollRef.current) {
        const dy = Math.abs(e.touches[0].clientY - touchStartYRef.current);
        if (dy < TOUCH_MOVE_IGNORE_PX) return;
        touchIsScrollRef.current = true;
      }
      e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchIsScrollRef.current) return;
      const endY = e.changedTouches[0].clientY;
      const deltaY = touchStartYRef.current - endY;
      if (Math.abs(deltaY) < TOUCH_SWIPE_THRESHOLD_PX) return;
      const dir = deltaY > 0 ? 1 : -1;
      throttledAdvance(dir);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [itemCount, touchMode]);

  // Desktop: wheel events change currentSection (one section per throttled tick)
  useEffect(() => {
    if (touchMode) return;
    const container = containerRef.current;
    if (!container) return;

    const throttledScroll = throttle((e: WheelEvent) => {
      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (dir === 0) return;
      setCurrentSection((prev) =>
        Math.max(0, Math.min(prev + dir, itemCount - 1))
      );
    }, SCROLL_THROTTLE_MS);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      throttledScroll(e);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [containerRef, itemCount, touchMode]);

  return { currentSection, setCurrentSection, isScrolling };
}
