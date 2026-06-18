function parseTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** When true, dev-only routes (/__preview, /sandbox-organic-llm) work in production builds (e.g. Aetherion). */
export function isPreviewModeEnabled(): boolean {
  return (
    parseTruthy(process.env.PREVIEW_MODE) || parseTruthy(process.env["preview-mode"])
  );
}

/** Dev-only routes are available in development or when preview mode is explicitly enabled. */
export function isDevOnlyRouteEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || isPreviewModeEnabled();
}
