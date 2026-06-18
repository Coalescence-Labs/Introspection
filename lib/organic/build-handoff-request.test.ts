import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

import { buildHandoffRequest } from "./build-handoff-request";

const handoffFixture = JSON.parse(
  readFileSync(join(import.meta.dir, "../organic-relay/fixtures/handoff-v1.json"), "utf8"),
);

describe("buildHandoffRequest", () => {
  test("maps question and prompt to handoff request", () => {
    const result = buildHandoffRequest({
      question: {
        id: "reflection-growth-01",
        category: "patterns",
        simple_text: "What patterns appear in the types of questions I ask?",
      },
      prompt: {
        title: "What patterns appear in the types of questions I ask?",
        fullPrompt: handoffFixture.fullPrompt,
      },
      selectedLLM: "claude",
      speechFriendly: false,
    });

    expect(result).toEqual(handoffFixture);
  });
});
