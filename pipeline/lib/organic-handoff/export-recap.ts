import { buildBootstrapPayloadFromContent } from "@/lib/organic-relay/build-payload";
import { encryptBootstrapPayload } from "@/lib/organic-relay/crypto";
import type { OrganicHandoffContent } from "@/lib/organic-relay/schemas";
import type { OrganicHandoffCandidateWithScores } from "../generation/organic-handoff-network";
import type { OrganicHandoffSourceQuestion } from "../generation/organic-handoff-network";
import { isOrganicHandoffEnabled, getOrganicBaseUrl } from "@/lib/organic/handoff-config";

export interface OrganicHandoffRecap {
  generatedAt: string;
  sourceQuestion: OrganicHandoffSourceQuestion;
  winner: OrganicHandoffContent;
  allCandidates: OrganicHandoffCandidateWithScores[];
  bootstrapPayload?: ReturnType<typeof buildBootstrapPayloadFromContent>;
  encryptedWire?: string;
  handoffUrl?: string;
}

export function buildOrganicHandoffRecap(input: {
  sourceQuestion: OrganicHandoffSourceQuestion;
  winner: OrganicHandoffContent;
  allCandidates: OrganicHandoffCandidateWithScores[];
}): OrganicHandoffRecap {
  const recap: OrganicHandoffRecap = {
    generatedAt: new Date().toISOString(),
    sourceQuestion: input.sourceQuestion,
    winner: input.winner,
    allCandidates: input.allCandidates,
  };

  if (isOrganicHandoffEnabled()) {
    const bootstrapPayload = buildBootstrapPayloadFromContent(input.winner);
    const encryptedWire = encryptBootstrapPayload(bootstrapPayload);
    const handoffUrl = `${getOrganicBaseUrl()}/introspection/start?p=${encodeURIComponent(encryptedWire)}`;

    recap.bootstrapPayload = bootstrapPayload;
    recap.encryptedWire = encryptedWire;
    recap.handoffUrl = handoffUrl;
  }

  return recap;
}
