import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  // Block __preview route in production
  if (
    request.nextUrl.pathname.startsWith("/__preview") &&
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/__preview/:path*",
};
