export type TaskPriority = "low" | "medium" | "high";

export type PrioritizableTask = {
  priority: TaskPriority;
  dueDate?: string | null;
  status: "todo" | "in_progress" | "done" | "archived";
};

const priorityWeight: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function getTaskScore(task: PrioritizableTask, today: string) {
  const dueWeight =
    task.dueDate === today ? 3 : task.dueDate && task.dueDate < today ? 4 : 0;
  const activeWeight = task.status === "in_progress" ? 1 : 0;

  return priorityWeight[task.priority] + dueWeight + activeWeight;
}

export function prioritizeTasks<T extends PrioritizableTask>(
  tasks: T[],
  today: string,
) {
  return [...tasks].sort(
    (a, b) => getTaskScore(b, today) - getTaskScore(a, today),
  );
}
