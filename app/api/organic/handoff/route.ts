import { buildBootstrapPayloadFromHandoff } from "@/lib/organic-relay/build-payload";
import { encryptBootstrapPayload } from "@/lib/organic-relay/crypto";
import {
  IntrospectionHandoffRequestSchema,
  IntrospectionHandoffResponseSchema,
} from "@/lib/organic-relay/schemas";
import { getOrganicBaseUrl, isOrganicHandoffEnabled } from "@/lib/organic/handoff-config";

export async function POST(request: Request): Promise<Response> {
  if (!isOrganicHandoffEnabled()) {
    return Response.json({ error: "Organic handoff not configured" }, { status: 503 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IntrospectionHandoffRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid handoff request" }, { status: 400 });
  }

  try {
    const bootstrap = buildBootstrapPayloadFromHandoff(parsed.data);
    const wire = encryptBootstrapPayload(bootstrap);
    const baseUrl = getOrganicBaseUrl();
    const url = `${baseUrl}/introspection/start?p=${encodeURIComponent(wire)}`;
    const response = IntrospectionHandoffResponseSchema.parse({ url });

    return Response.json(response);
  } catch {
    return Response.json({ error: "Failed to encrypt handoff payload" }, { status: 500 });
  }
}
