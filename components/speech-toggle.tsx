"use client";

import { Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SpeechToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function SpeechToggle({ enabled, onToggle }: SpeechToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Switch
        id="speech-friendly"
        checked={enabled}
        onCheckedChange={onToggle}
        aria-label="Include speech-friendly version for TTS"
        tabIndex={0}
      />
      <label
        htmlFor="speech-friendly"
        className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Volume2 className="h-4 w-4" />
        <span>Include speech-friendly version for TTS</span>
      </label>
    </div>
  );
}
