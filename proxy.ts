import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEV_ONLY_PREFIXES = ["/__preview", "/sandbox-organic-llm"] as const;

/**
 * Next.js 16 proxy (request interceptor). Rewrites dev-only routes to /404 in production.
 */
export default function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
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
  matcher: ["/__preview/:path*", "/sandbox-organic-llm/:path*"],
};
