import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware without database access (Edge Runtime compatible)
export function middleware(request: NextRequest) {
  // For now, we'll rely on server-side auth checks in pages/API routes
  // This avoids Edge Runtime compatibility issues with Prisma/PostgreSQL
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
