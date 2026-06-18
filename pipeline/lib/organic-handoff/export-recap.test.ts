import { afterEach, describe, expect, test } from "bun:test";

import { buildOrganicHandoffRecap } from "./export-recap";

const prevSecret = process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
const prevUrl = process.env.ORGANIC_BASE_URL;

afterEach(() => {
  if (prevSecret !== undefined) process.env.INTROSPECTION_ORGANIC_SHARED_SECRET = prevSecret;
  else delete process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
  if (prevUrl !== undefined) process.env.ORGANIC_BASE_URL = prevUrl;
  else delete process.env.ORGANIC_BASE_URL;
});

describe("buildOrganicHandoffRecap", () => {
  const winner = {
    title: "Test",
    goal: "Goal",
    systemInstructions: "Guide",
    initialOverview: "## Test",
  };

  test("omits wire when env unset", () => {
    delete process.env.INTROSPECTION_ORGANIC_SHARED_SECRET;
    delete process.env.ORGANIC_BASE_URL;

    const recap = buildOrganicHandoffRecap({
      sourceQuestion: { simple_text: "Q?" },
      winner,
      allCandidates: [{ candidateId: "cand_000", content: winner, combinedScore: 8, tone: 8, clarity: 8 }],
    });

    expect(recap.handoffUrl).toBeUndefined();
    expect(recap.encryptedWire).toBeUndefined();
  });

  test("includes wire when env set", () => {
    process.env.INTROSPECTION_ORGANIC_SHARED_SECRET = Buffer.alloc(32, 7).toString("base64");
    process.env.ORGANIC_BASE_URL = "http://localhost:3000";

    const recap = buildOrganicHandoffRecap({
      sourceQuestion: { simple_text: "Q?" },
      winner,
      allCandidates: [{ candidateId: "cand_000", content: winner, combinedScore: 8, tone: 8, clarity: 8 }],
    });

    expect(recap.handoffUrl).toStartWith("http://localhost:3000/introspection/start?p=");
    expect(recap.encryptedWire).toStartWith("intro:v1:");
  });
});
