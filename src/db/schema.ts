import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["todo", "in_progress", "done", "archived"],
  }).notNull().default("todo"),
  priority: text("priority", {
    enum: ["low", "medium", "high"],
  }).notNull().default("medium"),
  dueDate: text("due_date"),
  estimatedMinutes: integer("estimated_minutes"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  description: text("description").notNull(),
  taskId: text("task_id").references(() => tasks.id, {
    onDelete: "set null",
  }),
  durationMinutes: integer("duration_minutes"),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
