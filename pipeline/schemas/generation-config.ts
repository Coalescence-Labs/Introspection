import type { GatewayModelId } from "ai";
import { z } from "zod";

const ModelIdSchema = z
  .string()
  .trim()
  .min(1, "Model ID cannot be empty") as z.ZodType<GatewayModelId>;

export const GenerationConfigSchema = z.object({
  networkEnabled: z.boolean(),

  postAboveBenchmarkToLibrary: z.boolean(),
  minAcceptableScore: z.number().finite().gte(0),
  generatorQuestionCount: z.number().int().min(1).max(20),

  models: z.object({
    generator: ModelIdSchema,
    noveltyJudge: ModelIdSchema,
    clarityJudge: ModelIdSchema,
    toneJudge: ModelIdSchema,
  }),

  scoring: z.object({
    noveltyWeight: z.number().finite().gte(0),
    clarityWeight: z.number().finite().gte(0),
    toneWeight: z.number().finite().gte(0),
  }),
});

export type GenerationConfig = z.infer<typeof GenerationConfigSchema>;
