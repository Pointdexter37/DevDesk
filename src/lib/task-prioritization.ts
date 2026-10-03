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

export function getTaskRecommendation(
  task: PrioritizableTask & { title: string; estimatedMinutes?: number | null },
  today: string,
) {
  const estimate = task.estimatedMinutes
    ? ` It should take about ${task.estimatedMinutes} minutes.`
    : "";

  if (task.dueDate && task.dueDate < today) {
    return `Start with "${task.title}" to clear an overdue task.${estimate}`;
  }

  if (task.dueDate === today) {
    return `Start with "${task.title}" because it is due today.${estimate}`;
  }

  if (task.status === "in_progress") {
    return `Continue "${task.title}" while the context is fresh.${estimate}`;
  }

  if (task.priority === "high") {
    return `Start with "${task.title}" because it is high priority.${estimate}`;
  }

  return `Start with "${task.title}" as your next step.${estimate}`;
}
