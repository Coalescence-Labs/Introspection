import { expect, mock, test } from "bun:test";
import type { OrganicHandoffContent } from "@/lib/organic-relay/schemas";

const threeCandidates: OrganicHandoffContent[] = [
  {
    title: "Alpha session",
    goal: "Reflect on alpha",
    systemInstructions: "Guide alpha",
    initialOverview: "## Alpha\n\nStart here.",
    steps: [{ id: "orient", title: "Orient" }],
  },
  {
    title: "Beta session",
    goal: "Reflect on beta",
    systemInstructions: "Guide beta",
    initialOverview: "## Beta\n\nStart here.",
    steps: [{ id: "orient", title: "Orient" }],
  },
  {
    title: "Gamma session",
    goal: "Reflect on gamma",
    systemInstructions: "Guide gamma",
    initialOverview: "## Gamma\n\nStart here.",
    steps: [{ id: "orient", title: "Orient" }],
  },
];

function makeJudgeOutput(scores: { candidateId: string; score: number }[]) {
  return { scores: scores.map((s) => ({ candidateId: s.candidateId, score: s.score })) };
}

mock.module("../llm-metrics", () => ({
  executeLlmCall: async <T>(input: {
    operation: string;
    execute: () => Promise<{ data: T }>;
  }) => {
    if (input.operation === "organicHandoffGenerator") {
      return {
        ok: true as const,
        data: { candidates: threeCandidates },
        modelId: "openai/gpt-5.2",
      };
    }

    if (input.operation === "handoff-judge-tone") {
      return {
        ok: true as const,
        data: makeJudgeOutput([
          { candidateId: "cand_000", score: 6 },
          { candidateId: "cand_001", score: 9 },
          { candidateId: "cand_002", score: 7 },
        ]),
        modelId: "openai/gpt-5.2",
      };
    }

    if (input.operation === "handoff-judge-clarity") {
      return {
        ok: true as const,
        data: makeJudgeOutput([
          { candidateId: "cand_000", score: 5 },
          { candidateId: "cand_001", score: 8 },
          { candidateId: "cand_002", score: 8 },
        ]),
        modelId: "openai/gpt-5.2",
      };
    }

    throw new Error(`unexpected operation ${input.operation}`);
  },
}));

const { runOrganicHandoffNetwork, buildHandoffJudgeUserMessage, assignHandoffCandidateIds } =
  await import("./organic-handoff-network");

test("buildHandoffJudgeUserMessage includes source question", () => {
  const candidates = assignHandoffCandidateIds(threeCandidates);
  const msg = buildHandoffJudgeUserMessage(candidates, {
    simple_text: "What patterns appear?",
  });
  expect(msg).toContain("What patterns appear?");
  expect(msg).toContain("cand_001");
});

test("runOrganicHandoffNetwork ranks winner by combined judge scores", async () => {
  const result = await runOrganicHandoffNetwork({
    question: { simple_text: "Test question", category: "reflection" },
    candidateCount: 3,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;

  expect(result.winner.title).toBe("Beta session");
  expect(result.allCandidates[0].combinedScore).toBeGreaterThan(result.allCandidates[1].combinedScore);
});
