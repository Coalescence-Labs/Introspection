"use client";

import { motion } from "framer-motion";
import { ChevronDown, ExternalLinkIcon, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { OpenIn, OpenInContent } from "@/components/ai-elements/open-in-chat";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { LLMType } from "@/lib/content/schema";
import {
  getOpenInChatDestinationUrl,
  OPEN_IN_MENU_IDS,
  type OpenInMenuDestinationId,
} from "@/lib/prompt/open-in-chat-urls";
import {
  openInDestinationShortLabel,
  primaryOpenInButtonLabel,
  resolveOpenInDestination,
} from "@/lib/prompt/open-in-routing";

interface TodayOpenInChatButtonProps {
  query: string;
  disabled?: boolean;
  selectedLLM: LLMType;
  manualOpenInDestination: OpenInMenuDestinationId | null;
  onManualOpenInDestination: (id: OpenInMenuDestinationId) => void;
}

export function TodayOpenInChatButton({
  query,
  disabled,
  selectedLLM,
  manualOpenInDestination,
  onManualOpenInDestination,
}: TodayOpenInChatButtonProps) {
  const resolvedDestination = useMemo(
    () =>
      resolveOpenInDestination({
        selectedLLM,
        manualOverride: manualOpenInDestination,
      }),
    [selectedLLM, manualOpenInDestination]
  );

  const primaryLabel = useMemo(
    () => primaryOpenInButtonLabel(resolvedDestination),
    [resolvedDestination]
  );

  const primaryUrl = useMemo(
    () => getOpenInChatDestinationUrl(resolvedDestination, query),
    [resolvedDestination, query]
  );

  const openPrimary = () => {
    if (disabled || !query.trim()) return;
    window.open(primaryUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <OpenIn query={query}>
      <motion.div
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="inline-flex"
      >
        <div className="flex w-[min(100vw-2rem,320px)] max-w-[320px] overflow-hidden rounded-md shadow-sm sm:w-[280px]">
          <Button
            type="button"
            variant="accent"
            size="xl"
            disabled={disabled}
            onClick={openPrimary}
            className="relative min-w-0 flex-1 cursor-pointer overflow-visible rounded-r-none border-r border-accent-foreground/15 bg-accent px-6 text-base font-semibold text-accent-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            <span className="flex items-center justify-center gap-2 truncate">
              <Sparkles className="h-5 w-5 shrink-0" />
              <span className="truncate">{primaryLabel}</span>
            </span>
          </Button>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="accent"
              size="xl"
              disabled={disabled}
              className="relative shrink-0 cursor-pointer rounded-l-none border-l border-accent-foreground/15 bg-accent px-3 text-accent-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              aria-label="More chat apps"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
        </div>
      </motion.div>
      <OpenInContent align="end" className="w-[260px]">
        {OPEN_IN_MENU_IDS.map((id) => (
          <DropdownMenuItem
            key={id}
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              onManualOpenInDestination(id);
              if (!query.trim()) return;
              window.open(getOpenInChatDestinationUrl(id, query), "_blank", "noopener,noreferrer");
            }}
          >
            <span className="flex flex-1 items-center gap-2">
              <span className="flex-1">Open in {openInDestinationShortLabel(id)}</span>
              <ExternalLinkIcon className="size-4 shrink-0" />
            </span>
          </DropdownMenuItem>
        ))}
      </OpenInContent>
    </OpenIn>
  );
}
