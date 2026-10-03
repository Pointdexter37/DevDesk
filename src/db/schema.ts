import {
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
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
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  description: text("description").notNull(),
  taskId: text("task_id").references(() => tasks.id, {
    onDelete: "set null",
  }),
  durationMinutes: integer("duration_minutes"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const dailyReviews = pgTable("daily_reviews", {
  date: text("date").primaryKey(),
  reflection: text("reflection").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
