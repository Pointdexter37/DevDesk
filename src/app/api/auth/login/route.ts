import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  isAuthConfigured,
} from "@/lib/auth";

const loginSchema = z.object({
  password: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("devdesk_session", await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
