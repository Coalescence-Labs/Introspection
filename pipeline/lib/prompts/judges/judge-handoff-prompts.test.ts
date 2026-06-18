import { expect, test } from "bun:test";

import {
  HANDOFF_CLARITY_JUDGE_SYSTEM_PROMPT,
} from "./judge-handoff-clarity";
import { HANDOFF_TONE_JUDGE_SYSTEM_PROMPT } from "./judge-handoff-tone";

test("handoff judge prompts are non-empty", () => {
  expect(HANDOFF_TONE_JUDGE_SYSTEM_PROMPT.length).toBeGreaterThan(40);
  expect(HANDOFF_CLARITY_JUDGE_SYSTEM_PROMPT.length).toBeGreaterThan(40);
});
