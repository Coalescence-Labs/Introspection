/**
 * Organic handoff network: generator → tone + clarity judges → rank.
 */

import { type GatewayModelId, generateText, Output } from "ai";
import type { OrganicHandoffContent } from "@/lib/organic-relay/schemas";
import { OrganicHandoffCandidateArraySchema } from "@/lib/organic-relay/schemas";
import { generationConfig } from "../../config/generation";
import { executeLlmCall, type LlmCallFailure, type LlmCallResult } from "../llm-metrics";
import { ORGANIC_HANDOFF_GENERATOR_PROMPT } from "../prompts/organic-handoff-generator";
import { HANDOFF_CLARITY_JUDGE_SYSTEM_PROMPT } from "../prompts/judges/judge-handoff-clarity";
import { HANDOFF_TONE_JUDGE_SYSTEM_PROMPT } from "../prompts/judges/judge-handoff-tone";
import {
  validateJudgeScoresByCandidateId,
} from "./network";
import type { JudgePanelOutput } from "../../schemas/judge-score";
import { JudgePanelOutputSchema } from "../../schemas/judge-score";

export interface OrganicHandoffSourceQuestion {
  id?: string;
  simple_text: string;
  category?: string;
}

export interface OrganicHandoffCandidate {
  candidateId: string;
  candidateIndex: number;
  content: OrganicHandoffContent;
}

export interface OrganicHandoffCandidateWithScores {
  candidateId: string;
  content: OrganicHandoffContent;
  combinedScore: number;
  tone: number;
  clarity: number;
}

export interface RunOrganicHandoffNetworkInput {
  question: OrganicHandoffSourceQuestion;
  candidateCount?: number;
  runId?: string;
}

export type RunOrganicHandoffNetworkResult =
  | {
      ok: true;
      winner: OrganicHandoffContent;
      allCandidates: OrganicHandoffCandidateWithScores[];
    }
  | {
      ok: false;
      error: { message: string; type?: string };
      partial?: { candidates: OrganicHandoffContent[] };
    };

const DEFAULT_MODEL: GatewayModelId = "openai/gpt-5.2";
const CANDIDATE_ID_PAD = 3;

export function assignHandoffCandidateIds(
  contents: OrganicHandoffContent[],
): OrganicHandoffCandidate[] {
  return contents.map((content, i) => ({
    candidateId: `cand_${String(i).padStart(CANDIDATE_ID_PAD, "0")}`,
    candidateIndex: i,
    content,
  }));
}

export function buildHandoffJudgeUserMessage(
  candidates: OrganicHandoffCandidate[],
  sourceQuestion: OrganicHandoffSourceQuestion,
): string {
  const payload = JSON.stringify(
    candidates.map((c) => ({
      candidateId: c.candidateId,
      title: c.content.title,
      goal: c.content.goal,
      initialOverview: c.content.initialOverview,
      sourceQuestion: sourceQuestion.simple_text,
    })),
    null,
    2,
  );

  return `Handoff candidates:\n\n${payload}`;
}

async function runHandoffJudge(
  dimension: "tone" | "clarity",
  userMessage: string,
  modelId: GatewayModelId,
  runId?: string,
): Promise<LlmCallResult<JudgePanelOutput>> {
  const systemPrompt =
    dimension === "tone" ? HANDOFF_TONE_JUDGE_SYSTEM_PROMPT : HANDOFF_CLARITY_JUDGE_SYSTEM_PROMPT;

  return executeLlmCall({
    operation: `handoff-judge-${dimension}`,
    modelId,
    runId,
    errorMessage: `Handoff judge ${dimension} failed`,
    execute: async () => {
      const response = await generateText({
        model: modelId,
        system: systemPrompt,
        prompt: userMessage,
        maxOutputTokens: 4000,
        output: Output.object({ schema: JudgePanelOutputSchema }),
      });

      return {
        data: response.output as JudgePanelOutput,
        rawText: response.text ?? "",
        usage: response.totalUsage,
      };
    },
  });
}

function rankHandoffCandidates(
  candidates: OrganicHandoffCandidate[],
  tone: JudgePanelOutput,
  clarity: JudgePanelOutput,
): OrganicHandoffCandidateWithScores[] {
  const expected = new Set(candidates.map((c) => c.candidateId));
  validateJudgeScoresByCandidateId(tone.scores, expected, "handoff-tone");
  validateJudgeScoresByCandidateId(clarity.scores, expected, "handoff-clarity");

  const toneById = new Map(tone.scores.map((s) => [s.candidateId, s.score]));
  const clarityById = new Map(clarity.scores.map((s) => [s.candidateId, s.score]));

  return candidates
    .map((c) => {
      const toneScore = toneById.get(c.candidateId) ?? 0;
      const clarityScore = clarityById.get(c.candidateId) ?? 0;
      return {
        candidateId: c.candidateId,
        content: c.content,
        tone: toneScore,
        clarity: clarityScore,
        combinedScore: (toneScore + clarityScore) / 2,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);
}

export async function runOrganicHandoffNetwork(
  input: RunOrganicHandoffNetworkInput,
): Promise<RunOrganicHandoffNetworkResult> {
  const count = Math.min(Math.max(input.candidateCount ?? 3, 1), 8);
  const modelId = generationConfig.models.generator ?? DEFAULT_MODEL;

  const genResult = await executeLlmCall({
    operation: "organicHandoffGenerator",
    modelId,
    runId: input.runId,
    errorMessage: "Organic handoff generator failed",
    execute: async () => {
      const response = await generateText({
        model: modelId,
        system: ORGANIC_HANDOFF_GENERATOR_PROMPT,
        prompt: `Source question (${input.question.category ?? "reflection"}): ${input.question.simple_text}\n\nGenerate ${count} distinct handoff packages.`,
        maxOutputTokens: 8000,
        output: Output.object({ schema: OrganicHandoffCandidateArraySchema }),
      });

      const output = response.output as { candidates: OrganicHandoffContent[] };
      return {
        data: output,
        rawText: response.text ?? "",
        usage: response.totalUsage,
      };
    },
  });

  if (!genResult.ok) {
    return {
      ok: false,
      error: { message: genResult.error.message, type: genResult.error.type },
    };
  }

  const candidates = assignHandoffCandidateIds(genResult.data.candidates);
  const judgeMessage = buildHandoffJudgeUserMessage(candidates, input.question);

  const [toneResult, clarityResult] = await Promise.all([
    runHandoffJudge("tone", judgeMessage, modelId, input.runId),
    runHandoffJudge("clarity", judgeMessage, modelId, input.runId),
  ]);

  if (!toneResult.ok) {
    return {
      ok: false,
      error: { message: toneResult.error.message, type: toneResult.error.type },
      partial: { candidates: genResult.data.candidates },
    };
  }

  if (!clarityResult.ok) {
    return {
      ok: false,
      error: { message: clarityResult.error.message, type: clarityResult.error.type },
      partial: { candidates: genResult.data.candidates },
    };
  }

  const ranked = rankHandoffCandidates(candidates, toneResult.data, clarityResult.data);

  return {
    ok: true,
    winner: ranked[0].content,
    allCandidates: ranked,
  };
}
