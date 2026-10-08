import type { GatewayModelId } from "ai";
import {
  type GenerationConfig,
  GenerationConfigSchema,
} from "../schemas/generation-config";

const generationConfigSource = {
  networkEnabled: false,

  postAboveBenchmarkToLibrary: false,
  minAcceptableScore: 24,
  generatorQuestionCount: 10,

  models: {
    generator: "anthropic/claude-opus-5.5" as GatewayModelId,
    noveltyJudge: "anthropic/claude-sonnet-5.5" as GatewayModelId,
    clarityJudge: "anthropic/claude-sonnet-5.5" as GatewayModelId,
    toneJudge: "anthropic/claude-sonnet-5.5" as GatewayModelId,
    utility: "openai/gpt-6-luna" as GatewayModelId
  },

  scoring: {
    noveltyWeight: 1,
    clarityWeight: 1,
    toneWeight: 1,
  },
} satisfies GenerationConfig;

export const generationConfig = GenerationConfigSchema.parse(
  generationConfigSource,
);
