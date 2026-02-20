import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 proxy (request interceptor). Rewrites /__preview to /404 in production
 * so the prompt-preview dev page is not accessible in production.
 */
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/__preview") && process.env.NODE_ENV === "production") {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/__preview/:path*",
};
