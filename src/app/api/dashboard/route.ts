import { and, desc, gte, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activities, tasks } from "@/db/schema";
import { getUtcDayRange } from "@/lib/date-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const timezoneOffsetMinutes = Number(
    searchParams.get("timezoneOffsetMinutes") ?? 0,
  );

  if (
    !date ||
    !z.string().date().safeParse(date).success ||
    !Number.isInteger(timezoneOffsetMinutes) ||
    timezoneOffsetMinutes < -840 ||
    timezoneOffsetMinutes > 840
  ) {
    return NextResponse.json(
      { error: "A valid date and timezone offset are required." },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const { start, end } = getUtcDayRange(date, timezoneOffsetMinutes);
    const [taskRows, activityRows] = await Promise.all([
      db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(500),
      db
        .select()
        .from(activities)
        .where(
          and(gte(activities.occurredAt, start), lt(activities.occurredAt, end)),
        )
        .orderBy(desc(activities.occurredAt))
        .limit(500),
    ]);

    return NextResponse.json({
      tasks: taskRows,
      activities: activityRows,
    });
  } catch (error) {
    console.error("Failed to load dashboard data", error);
    return NextResponse.json(
      { error: "Unable to load dashboard data." },
      { status: 500 },
    );
  }
}
