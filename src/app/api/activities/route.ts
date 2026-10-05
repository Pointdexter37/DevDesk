import { NextResponse } from "next/server";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activities, tasks } from "@/db/schema";
import { getUtcDayRange } from "@/lib/date-utils";

const createActivitySchema = z.object({
  description: z.string().trim().min(1).max(500),
  durationMinutes: z.number().int().positive().max(1440).optional(),
  taskId: z.string().uuid().nullable().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const timezoneOffsetMinutes = Number(
    searchParams.get("timezoneOffsetMinutes") ?? 0,
  );

  if (
    (date && !z.string().date().safeParse(date).success) ||
    !Number.isInteger(timezoneOffsetMinutes) ||
    timezoneOffsetMinutes < -840 ||
    timezoneOffsetMinutes > 840
  ) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  try {
    const db = getDb();
    const range = date
      ? getUtcDayRange(date, timezoneOffsetMinutes)
      : undefined;
    const conditions = range
      ? and(
          gte(activities.occurredAt, range.start),
          lt(activities.occurredAt, range.end),
        )
      : undefined;
    const rows = await db
      .select({
        id: activities.id,
        description: activities.description,
        taskId: activities.taskId,
        taskTitle: tasks.title,
        durationMinutes: activities.durationMinutes,
        occurredAt: activities.occurredAt,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .leftJoin(tasks, eq(activities.taskId, tasks.id))
      .where(conditions)
      .orderBy(desc(activities.occurredAt))
      .limit(500);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load activity history", error);
    return NextResponse.json(
      { error: "Unable to load activity history." },
      { status: 500 },
    );
  }
}

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
    taskId: parsed.data.taskId ?? null,
    durationMinutes: parsed.data.durationMinutes ?? null,
    occurredAt: now,
    createdAt: now,
  };

  try {
    const db = getDb();
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

export async function PATCH(request: Request) {
  const parsed = z
    .object({
      id: z.string().uuid(),
      description: z.string().trim().min(1).max(500),
      durationMinutes: z.number().int().positive().max(1440).nullable(),
      taskId: z.string().uuid().nullable().optional(),
    })
    .safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid activity description and duration." },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const [activity] = await db
      .update(activities)
      .set({
        description: parsed.data.description,
        durationMinutes: parsed.data.durationMinutes,
        ...(parsed.data.taskId !== undefined && {
          taskId: parsed.data.taskId,
        }),
      })
      .where(eq(activities.id, parsed.data.id))
      .returning();

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Failed to update activity", error);
    return NextResponse.json(
      { error: "Unable to update activity." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const parsed = z
    .object({ id: z.string().uuid() })
    .safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid activity id." }, { status: 400 });
  }

  try {
    const db = getDb();
    const deleted = await db
      .delete(activities)
      .where(eq(activities.id, parsed.data.id))
      .returning({ id: activities.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Activity not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ id: parsed.data.id });
  } catch (error) {
    console.error("Failed to delete activity", error);
    return NextResponse.json(
      { error: "Unable to delete activity." },
      { status: 500 },
    );
  }
}
