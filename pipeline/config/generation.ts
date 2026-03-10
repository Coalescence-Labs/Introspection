import type { GatewayModelId } from "ai";
import { type GenerationConfig, GenerationConfigSchema } from "../schemas/generation-config";

const generationConfigSource = {
  networkEnabled: false,

  postAboveBenchmarkToLibrary: false,
  minAcceptableScore: 24,
  generatorQuestionCount: 5,

  models: {
    generator: "openai/gpt-5.2" as GatewayModelId,
    noveltyJudge: "openai/gpt-5.2" as GatewayModelId,
    clarityJudge: "openai/gpt-5.2" as GatewayModelId,
    toneJudge: "openai/gpt-5.2" as GatewayModelId,
  },

  scoring: {
    noveltyWeight: 1,
    clarityWeight: 1,
    toneWeight: 1,
  },
} satisfies GenerationConfig;

export const generationConfig = GenerationConfigSchema.parse(generationConfigSource);
