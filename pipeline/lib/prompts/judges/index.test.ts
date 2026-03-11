import { expect, test } from "bun:test";
import {
  CLARITY_JUDGE_SYSTEM_PROMPT,
  NOVELTY_JUDGE_SYSTEM_PROMPT,
  TONE_JUDGE_SYSTEM_PROMPT,
} from "./index";

/** Rough upper bound: ~1500 tokens ≈ 6000 chars; 8500 allows margin for candidateId instructions. */
const MAX_CHARS_PER_PROMPT = 8500;

test("judge prompts are non-empty", () => {
  expect(NOVELTY_JUDGE_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  expect(CLARITY_JUDGE_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  expect(TONE_JUDGE_SYSTEM_PROMPT.length).toBeGreaterThan(0);
});

test("judge prompts are under token cap (character heuristic)", () => {
  expect(NOVELTY_JUDGE_SYSTEM_PROMPT.length).toBeLessThanOrEqual(MAX_CHARS_PER_PROMPT);
  expect(CLARITY_JUDGE_SYSTEM_PROMPT.length).toBeLessThanOrEqual(MAX_CHARS_PER_PROMPT);
  expect(TONE_JUDGE_SYSTEM_PROMPT.length).toBeLessThanOrEqual(MAX_CHARS_PER_PROMPT);
});

test("judge prompts mention JSON output, candidateId, and score range", () => {
  const prompts = [
    NOVELTY_JUDGE_SYSTEM_PROMPT,
    CLARITY_JUDGE_SYSTEM_PROMPT,
    TONE_JUDGE_SYSTEM_PROMPT,
  ];
  for (const p of prompts) {
    expect(p).toContain("JSON");
    expect(p).toContain("scores");
    expect(p).toContain("candidateId");
    expect(p).toMatch(/0.*10|0\.\.\.10|0 through 10/);
  }
});
