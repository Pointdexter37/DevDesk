import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthConfigured, isValidSessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) return NextResponse.next();
  if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const authenticated = await isValidSessionToken(
    request.cookies.get("devdesk_session")?.value,
  );
  if (authenticated) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
