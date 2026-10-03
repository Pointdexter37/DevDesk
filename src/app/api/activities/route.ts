import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { activities } from "@/db/schema";

const createActivitySchema = z.object({
  description: z.string().trim().min(1).max(500),
  durationMinutes: z.number().int().positive().max(1440).optional(),
});

export async function POST(request: Request) {
  const parsed = createActivitySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid activity description." },
      { status: 400 },
    );
  }

  const now = new Date();
  const activity = {
    id: crypto.randomUUID(),
    description: parsed.data.description,
    taskId: null,
    durationMinutes: parsed.data.durationMinutes ?? null,
    occurredAt: now,
    createdAt: now,
  };

  try {
    await db.insert(activities).values(activity);
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Failed to create activity", error);
    return NextResponse.json(
      { error: "Unable to create activity." },
      { status: 500 },
    );
  }
}
