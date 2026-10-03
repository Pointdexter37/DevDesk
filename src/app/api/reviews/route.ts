import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { dailyReviews } from "@/db/schema";

const reviewSchema = z.object({
  date: z.string().date(),
  reflection: z.string().trim().max(2000),
});

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");

  if (!date || !z.string().date().safeParse(date).success) {
    return NextResponse.json(
      { error: "A valid review date is required." },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const [review] = await db
      .select()
      .from(dailyReviews)
      .where(eq(dailyReviews.date, date));

    return NextResponse.json(review ?? { date, reflection: "" });
  } catch (error) {
    console.error("Failed to load daily review", error);
    return NextResponse.json(
      { error: "Unable to load daily review." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const parsed = reviewSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid review." },
      { status: 400 },
    );
  }

  const now = new Date();

  try {
    const db = getDb();
    const [review] = await db
      .insert(dailyReviews)
      .values({
        date: parsed.data.date,
        reflection: parsed.data.reflection,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: dailyReviews.date,
        set: {
          reflection: parsed.data.reflection,
          updatedAt: now,
        },
      })
      .returning();

    return NextResponse.json(review);
  } catch (error) {
    console.error("Failed to save daily review", error);
    return NextResponse.json(
      { error: "Unable to save daily review." },
      { status: 500 },
    );
  }
}
