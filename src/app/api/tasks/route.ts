import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueDate: z.string().date().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedMinutes: z.number().int().positive().max(1440).default(30),
});

export async function POST(request: Request) {
  const parsed = createTaskSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid task title and due date." },
      { status: 400 },
    );
  }

  const now = new Date();
  const task = {
    id: crypto.randomUUID(),
    title: parsed.data.title,
    description: null,
    status: "todo" as const,
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate ?? null,
    estimatedMinutes: parsed.data.estimatedMinutes,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.insert(tasks).values(task);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task", error);
    return NextResponse.json(
      { error: "Unable to create task." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const parsed = z
    .object({
      id: z.string().uuid(),
      title: z.string().trim().min(1).max(200).optional(),
      dueDate: z.string().date().nullable().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      estimatedMinutes: z.number().int().positive().max(1440).optional(),
      status: z.enum(["todo", "in_progress", "done", "archived"]).optional(),
    })
    .safeParse(await request.json());

  if (!parsed.success || Object.keys(parsed.data).length === 1) {
    return NextResponse.json({ error: "Invalid task update." }, { status: 400 });
  }

  try {
    const completedAt =
      parsed.data.status === "done"
        ? new Date()
        : parsed.data.status
          ? null
          : undefined;
    const [task] = await db
      .update(tasks)
      .set({
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.dueDate !== undefined && {
          dueDate: parsed.data.dueDate,
        }),
        ...(parsed.data.priority !== undefined && {
          priority: parsed.data.priority,
        }),
        ...(parsed.data.estimatedMinutes !== undefined && {
          estimatedMinutes: parsed.data.estimatedMinutes,
        }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(completedAt !== undefined && { completedAt }),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, parsed.data.id))
      .returning();

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task", error);
    return NextResponse.json(
      { error: "Unable to update task." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const parsed = z
    .object({ id: z.string().uuid() })
    .safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(tasks)
      .where(eq(tasks.id, parsed.data.id))
      .returning({ id: tasks.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ id: parsed.data.id });
  } catch (error) {
    console.error("Failed to delete task", error);
    return NextResponse.json(
      { error: "Unable to delete task." },
      { status: 500 },
    );
  }
}
