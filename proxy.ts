import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isPreviewModeEnabled } from "@/lib/preview-mode";

const DEV_ONLY_PREFIXES = ["/__preview", "/sandbox-organic-llm"] as const;

/**
 * Next.js 16 proxy (request interceptor). Rewrites dev-only routes to /404 in production
 * unless PREVIEW_MODE=true (or preview-mode=true) is set for private deploys like Aetherion.
 */
export default function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !isPreviewModeEnabled()) {
    const { pathname } = request.nextUrl;
    const blocked = DEV_ONLY_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (blocked) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/__preview", "/__preview/:path*", "/sandbox-organic-llm", "/sandbox-organic-llm/:path*"],
};
