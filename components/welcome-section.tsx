"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ZOOM_DURATION_S = 0.4;

const sectionVariants = {
  active: { scale: 1 },
  inactive: { scale: 0.9 },
};

export const WelcomeSection = ({
  active,
  touchScroll,
  children,
  className,
}: {
  active: boolean;
  touchScroll?: boolean;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.section
      className={cn(
        "flex flex-col justify-center relative px-2 origin-center",
        touchScroll ? "min-h-dvh" : "h-dvh shrink-0",
        className
      )}
      variants={sectionVariants}
      animate={active ? "active" : "inactive"}
      transition={{ duration: ZOOM_DURATION_S, ease: "easeInOut" }}
    >
      {children}
    </motion.section>
  );
};