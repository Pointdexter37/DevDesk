import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { activities, tasks } from "@/db/schema";

export async function GET() {
  try {
    const [taskRows, activityRows] = await Promise.all([
      db.select().from(tasks).orderBy(desc(tasks.createdAt)),
      db.select().from(activities).orderBy(desc(activities.occurredAt)),
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
