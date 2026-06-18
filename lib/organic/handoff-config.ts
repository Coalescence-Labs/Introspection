/** Server-only Organic LLM handoff configuration. */

export function isOrganicHandoffEnabled(): boolean {
  const secret = process.env.INTROSPECTION_ORGANIC_SHARED_SECRET?.trim();
  const baseUrl = process.env.ORGANIC_BASE_URL?.trim();
  return Boolean(secret && baseUrl);
}

export function getOrganicBaseUrl(): string {
  const raw = process.env.ORGANIC_BASE_URL?.trim();

  if (!raw) {
    throw new Error("ORGANIC_BASE_URL is not configured");
  }

  return raw.replace(/\/+$/, "");
}
