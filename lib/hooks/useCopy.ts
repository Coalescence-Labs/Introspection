import { useState, useEffect } from "react";

interface useCopyProps {
  text: string;
  onCopy?: () => void;
}

interface useCopyReturn {
  copied: boolean;
  handleCopy: (e: React.MouseEvent) => Promise<void>;
}

export function useCopy({ text, onCopy }: useCopyProps): useCopyReturn {
  const [copied, setCopied] = useState(false);
  // Auto-reset after 1.5s
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Reset copied state when text changes (different prompt being copied)
  // biome-ignore lint/correctness/useExhaustiveDependencies: text dependency is intentional
  useEffect(() => {
    setCopied(false);
  }, [text]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.();
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const success = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (success) {
          setCopied(true);
          onCopy?.();
        }
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    } finally {
      onCopy?.();
    }
  };
  return { copied, handleCopy: handleCopy };
}
