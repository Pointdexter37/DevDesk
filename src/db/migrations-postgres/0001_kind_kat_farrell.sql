CREATE INDEX "activities_occurred_at_idx" ON "activities" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "activities_task_id_idx" ON "activities" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "tasks_completed_at_idx" ON "tasks" USING btree ("completed_at");