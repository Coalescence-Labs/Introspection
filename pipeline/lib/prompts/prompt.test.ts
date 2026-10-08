import { describe, expect, test } from "bun:test";
import { QuestionCategory, SIMPLE_TEXT_MAX_LENGTH } from "../../../lib/content/schema";
import { LLMGeneratedDailyQuestion } from "../schema";
import {
  EVIDENCE_BOUNDARIES,
  FIELD_REQUIREMENTS,
  INTERNAL_PROCESS_DAILY,
  INTERNAL_PROCESS_EXPANSIVE,
  INTROSPECTIVE_STANDARD,
  OUTPUT_FORMAT,
  OUTPUT_FORMAT_EXPANSIVE,
  QUALITY_CHECK,
  STYLE_EXEMPLARS_EXPANSIVE,
  VOICE,
} from "./chunks";
import { DAILY_GENERATOR_PROMPT, EXPANSIVE_GENERATOR_PROMPT } from "./prompt";

for (const [name, prompt, selection] of [
  ["daily", DAILY_GENERATOR_PROMPT, INTERNAL_PROCESS_DAILY],
  ["expansive", EXPANSIVE_GENERATOR_PROMPT, INTERNAL_PROCESS_EXPANSIVE],
]) {
  describe(`${name} generator prompt`, () => {
    test("includes shared self-insight, evidence, voice, and quality requirements", () => {
      for (const chunk of [INTROSPECTIVE_STANDARD, EVIDENCE_BOUNDARIES, VOICE, QUALITY_CHECK]) {
        expect(prompt).toContain(chunk);
      }
    });

    test("establishes evidence boundaries before selection and checks before output", () => {
      for (const chunk of [selection, OUTPUT_FORMAT, FIELD_REQUIREMENTS]) {
        expect(prompt).toContain(chunk);
      }
      expect(prompt.indexOf(INTROSPECTIVE_STANDARD)).toBeLessThan(
        prompt.indexOf(EVIDENCE_BOUNDARIES)
      );
      expect(prompt.indexOf(EVIDENCE_BOUNDARIES)).toBeLessThan(prompt.indexOf(selection));
      expect(prompt.indexOf(selection)).toBeLessThan(prompt.indexOf(QUALITY_CHECK));
      expect(prompt.indexOf(QUALITY_CHECK)).toBeLessThan(prompt.indexOf(OUTPUT_FORMAT));
    });
  });
}

test("daily and expansive prompts keep their distinct output contracts", () => {
  expect(DAILY_GENERATOR_PROMPT).toContain("output only the final JSON object");
  expect(DAILY_GENERATOR_PROMPT).not.toContain(OUTPUT_FORMAT_EXPANSIVE);
  expect(EXPANSIVE_GENERATOR_PROMPT).toContain(OUTPUT_FORMAT_EXPANSIVE);
  expect(EXPANSIVE_GENERATOR_PROMPT).toContain('a single key, "questions"');
});

test("field instructions match the generated question schema", () => {
  expect(Object.keys(LLMGeneratedDailyQuestion.shape).sort()).toEqual(["category", "simple_text"]);
  expect(FIELD_REQUIREMENTS).toContain(QuestionCategory.options.join(", "));
  expect(FIELD_REQUIREMENTS).toContain(`12–${SIMPLE_TEXT_MAX_LENGTH} characters`);
  expect(FIELD_REQUIREMENTS).toContain("Do not include any other fields");
  expect(FIELD_REQUIREMENTS).not.toMatch(/\b(?:intent|tags)\b/);
});

test("positive calibration examples fit the voice and question text constraints", () => {
  const examples = [
    ...Array.from(
      INTROSPECTIVE_STANDARD.matchAll(
        /^\s+(?:Self-insight|Evidence-bounded inquiry): "([^"]+)"$/gm
      ),
      (match) => match[1] ?? ""
    ),
    ...Array.from(STYLE_EXEMPLARS_EXPANSIVE.matchAll(/^- "([^"]+)"$/gm), (match) => match[1] ?? ""),
  ];

  expect(examples).toHaveLength(7);
  for (const question of examples) {
    expect(question.length).toBeGreaterThanOrEqual(12);
    expect(question.length).toBeLessThanOrEqual(SIMPLE_TEXT_MAX_LENGTH);
    expect(question).toMatch(/\b(?:I|me|my)\b/);
    expect(question.endsWith("?")).toBe(true);
    expect(question.match(/\?/g)).toHaveLength(1);
    expect(question).not.toMatch(/\[|\]|\n/);
    expect(
      LLMGeneratedDailyQuestion.safeParse({ category: "reflection", simple_text: question }).success
    ).toBe(true);
  }
});
