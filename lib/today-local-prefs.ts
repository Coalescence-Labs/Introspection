import { z } from "zod";
import { LLMType } from "@/lib/content/schema";
import { OPEN_IN_MENU_IDS, type OpenInMenuDestinationId } from "@/lib/prompt/open-in-chat-urls";

/** Short key to minimize bytes in localStorage. */
export const TODAY_LOCAL_PREFS_KEY = "i.t";

export type ParsedTodayPrefs = {
  selectedLLM: z.infer<typeof LLMType>;
  manualOpenInDestination: OpenInMenuDestinationId | null;
  speechFriendly: boolean;
};

const openInMenuZodEnum = z.enum(
  OPEN_IN_MENU_IDS as unknown as [OpenInMenuDestinationId, ...OpenInMenuDestinationId[]]
);

/** Raw stored shape: short keys; unknown keys stripped. */
const todayPrefsStoredRecordSchema = z
  .object({
    v: z.number().int().optional(),
    l: LLMType,
    o: z.union([openInMenuZodEnum, z.null()]).optional(),
    s: z.boolean().optional(),
  })
  .strip();

function normalizeStoredRecord(
  data: z.infer<typeof todayPrefsStoredRecordSchema>
): ParsedTodayPrefs {
  return {
    selectedLLM: data.l,
    manualOpenInDestination: data.o === undefined ? null : data.o,
    speechFriendly: data.s ?? false,
  };
}

/**
 * Parse a JSON string as stored by `saveTodayLocalPrefs`.
 * Returns normalized prefs or `null` if invalid.
 */
export function parseTodayPrefsStoredJson(raw: string): ParsedTodayPrefs | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const result = todayPrefsStoredRecordSchema.safeParse(parsed);
  if (!result.success) {
    return null;
  }

  return normalizeStoredRecord(result.data);
}

/** Read prefs from `localStorage` (client only). */
export function loadTodayLocalPrefs(): ParsedTodayPrefs | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(TODAY_LOCAL_PREFS_KEY);
    if (raw === null) {
      return null;
    }
    return parseTodayPrefsStoredJson(raw);
  } catch {
    return null;
  }
}

/** Persist prefs with minimal JSON (omit default null/false). */
export function saveTodayLocalPrefs(prefs: ParsedTodayPrefs): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: Record<string, unknown> = { l: prefs.selectedLLM };
    if (prefs.manualOpenInDestination !== null) {
      payload.o = prefs.manualOpenInDestination;
    }
    if (prefs.speechFriendly) {
      payload.s = true;
    }
    window.localStorage.setItem(TODAY_LOCAL_PREFS_KEY, JSON.stringify(payload));
  } catch {
    // Quota, private mode, etc.
  }
}
