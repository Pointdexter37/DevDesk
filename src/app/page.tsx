"use client";

import { FormEvent, type CSSProperties, useEffect, useState } from "react";
import {
  getTaskRecommendation,
  prioritizeTasks,
  type PrioritizableTask,
} from "@/lib/task-prioritization";

type Task = PrioritizableTask & {
  id: string;
  title: string;
  description: string | null;
  estimate: string;
  estimatedMinutes: number | null;
  completedAt?: string | null;
};

type Activity = {
  id: string;
  description: string;
  taskId: string | null;
  time: string;
  duration?: string;
  durationMinutes: number | null;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] =
    useState<Task["priority"]>("medium");
  const [newTaskEstimate, setNewTaskEstimate] = useState("30");
  const [newActivity, setNewActivity] = useState("");
  const [newActivityDuration, setNewActivityDuration] = useState("");
  const [newActivityTaskId, setNewActivityTaskId] = useState("");
  const [reflection, setReflection] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDescription, setEditingTaskDescription] = useState("");
  const [editingTaskDueDate, setEditingTaskDueDate] = useState("");
  const [editingTaskPriority, setEditingTaskPriority] =
    useState<Task["priority"]>("medium");
  const [editingTaskEstimate, setEditingTaskEstimate] = useState("30");
  const [editingTaskStatus, setEditingTaskStatus] =
    useState<Task["status"]>("todo");
  const [taskFilter, setTaskFilter] = useState<
    "open" | "in_progress" | "overdue"
  >("open");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const todayDate = new Date();
  const today = getDateKey(todayDate);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Unable to load dashboard data.");
        const data = await response.json();
        setTasks(
          data.tasks.map((task: {
            id: string;
            title: string;
            description: string | null;
            estimatedMinutes: number | null;
            completedAt: string | null;
            priority: Task["priority"];
            dueDate: string | null;
            status: Task["status"];
          }) => ({
            ...task,
            estimate: `${task.estimatedMinutes ?? 0} min`,
          })),
        );
        setActivities(
          data.activities.map((activity: {
            id: string;
            description: string;
            occurredAt: string;
            durationMinutes: number | null;
            taskId: string | null;
          }) => ({
            id: activity.id,
            description: activity.description,
            time: new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(activity.occurredAt)),
            duration: activity.durationMinutes
              ? `${activity.durationMinutes} min`
              : undefined,
            durationMinutes: activity.durationMinutes,
            taskId: activity.taskId,
          })),
        );
        const reviewResponse = await fetch(`/api/reviews?date=${today}`);
        if (!reviewResponse.ok) throw new Error("Unable to load daily review.");
        const review = await reviewResponse.json();
        setReflection(review.reflection ?? "");
      } catch (loadError) {
        console.error(loadError);
        setError("We couldn't load your dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [today]);

  const orderedTasks = prioritizeTasks(
    tasks.filter(
      (task) => task.status !== "done" && task.status !== "archived",
    ),
    today,
  );
  const visibleTasks = orderedTasks.filter((task) => {
    if (taskFilter === "in_progress") return task.status === "in_progress";
    if (taskFilter === "overdue") return Boolean(task.dueDate && task.dueDate < today);
    return true;
  });
  const completedCount = tasks.filter((task) => task.status === "done").length;
  const completedTasks = tasks.filter((task) => task.status === "done");
  const plannedMinutes = orderedTasks.reduce(
    (total, task) => total + (task.estimatedMinutes ?? 0),
    0,
  );
  const loggedMinutes = activities.reduce(
    (total, activity) => total + (activity.durationMinutes ?? 0),
    0,
  );
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const focusTask = orderedTasks[0];
  const focusMessage = focusTask
    ? getTaskRecommendation(focusTask, today)
    : "Add a task to create a clear focus for your day.";

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          dueDate: today,
          priority: newTaskPriority,
          estimatedMinutes: Number(newTaskEstimate),
        }),
      });
      if (!response.ok) throw new Error("Unable to create task.");
      const task = await response.json();
      setTasks((current) => [
        ...current,
        { ...task, estimate: `${task.estimatedMinutes ?? 0} min` },
      ]);
      setNewTask("");
      setNewTaskPriority("medium");
      setNewTaskEstimate("30");
    } catch (taskError) {
      console.error(taskError);
      setError("We couldn't save that task.");
    }
  }

  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const description = newActivity.trim();
    if (!description) return;

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          durationMinutes: newActivityDuration
            ? Number(newActivityDuration)
            : undefined,
          taskId: newActivityTaskId || null,
        }),
      });
      if (!response.ok) throw new Error("Unable to create activity.");
      const activity = await response.json();
      setActivities((current) => [
        {
          id: activity.id,
          description: activity.description,
          time: "Just now",
          duration: activity.durationMinutes
            ? `${activity.durationMinutes} min`
            : undefined,
          durationMinutes: activity.durationMinutes,
          taskId: activity.taskId,
        },
        ...current,
      ]);
      setNewActivity("");
      setNewActivityDuration("");
      setNewActivityTaskId("");
    } catch (activityError) {
      console.error(activityError);
      setError("We couldn't save that activity.");
    }
  }

  async function toggleTask(task: Task) {
    const status = task.status === "done" ? "todo" : "done";
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status }),
      });
      if (!response.ok) throw new Error("Unable to update task.");
      const updatedTask = await response.json();
      setTasks((current) =>
        current.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                ...updatedTask,
                estimate: `${updatedTask.estimatedMinutes ?? 0} min`,
              }
            : currentTask,
        ),
      );
    } catch (taskError) {
      console.error(taskError);
      setError("We couldn't update that task.");
    }
  }

  function startEditingTask(task: Task) {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
    setEditingTaskDescription(task.description ?? "");
    setEditingTaskDueDate(task.dueDate ?? "");
    setEditingTaskPriority(task.priority);
    setEditingTaskEstimate(String(task.estimatedMinutes ?? 30));
    setEditingTaskStatus(task.status);
  }

  async function saveTask(event: FormEvent<HTMLFormElement>, task: Task) {
    event.preventDefault();
    const title = editingTaskTitle.trim();
    if (!title) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          title,
          description: editingTaskDescription.trim() || null,
          dueDate: editingTaskDueDate || null,
          priority: editingTaskPriority,
          estimatedMinutes: Number(editingTaskEstimate),
          status: editingTaskStatus,
        }),
      });
      if (!response.ok) throw new Error("Unable to edit task.");
      const updatedTask = await response.json();
      setTasks((current) =>
        current.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                ...updatedTask,
                estimate: `${updatedTask.estimatedMinutes ?? 0} min`,
              }
            : currentTask,
        ),
      );
      setEditingTaskId(null);
    } catch (taskError) {
      console.error(taskError);
      setError("We couldn't edit that task.");
    }
  }

  async function archiveTask(task: Task) {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: "archived" }),
      });
      if (!response.ok) throw new Error("Unable to archive task.");
      setTasks((current) =>
        current.map((currentTask) =>
          currentTask.id === task.id
            ? { ...currentTask, status: "archived" }
            : currentTask,
        ),
      );
    } catch (taskError) {
      console.error(taskError);
      setError("We couldn't archive that task.");
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
      if (!response.ok) throw new Error("Unable to delete task.");
      setTasks((current) =>
        current.filter((currentTask) => currentTask.id !== task.id),
      );
    } catch (taskError) {
      console.error(taskError);
      setError("We couldn't delete that task.");
    }

  }

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingReview(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, reflection }),
      });
      if (!response.ok) throw new Error("Unable to save daily review.");
    } catch (reviewError) {
      console.error(reviewError);
      setError("We couldn't save your daily review.");
    } finally {
      setIsSavingReview(false);
    }
  }

  return (
    <main className="havu-shell min-h-screen bg-[#f7f8fa] text-[#17202a]">
      {error ? (
        <div className="fixed right-5 top-5 z-10 rounded-xl bg-[#9f2d3d] px-4 py-3 text-sm font-medium text-white shadow-lg">
          {error}
          <button className="ml-3 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      ) : null}
      <div className="havu-page mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-[#e7eaee] bg-white px-6 py-8 lg:block">
          <div className="mb-14 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17202a] text-sm font-bold text-white">
              D
            </div>
            <span className="text-lg font-bold tracking-tight">DevDesk</span>
          </div>
          <nav className="space-y-2 text-sm font-medium">
            <a className="flex items-center gap-3 rounded-xl bg-[#eef2ff] px-4 py-3 text-[#4255d4]" href="#today">
              <span>◷</span> Today
            </a>
            <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#68727d] hover:bg-[#f4f5f7]" href="#tasks">
              <span>□</span> Tasks <span className="ml-auto text-xs text-[#a0a8b0]">{tasks.length}</span>
            </a>
            <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#68727d] hover:bg-[#f4f5f7]" href="/activity">
              <span>↗</span> Activity
            </a>
          </nav>
          <div className="mt-auto pt-72">
            <div className="rounded-2xl bg-[#f7f8fa] p-4 text-xs leading-5 text-[#68727d]">
              <p className="mb-2 font-semibold text-[#17202a]">Your daily rhythm</p>
              Capture the plan, do the work, then make the day visible.
            </div>
          </div>
        </aside>

        <section className="flex-1 px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
          <nav className="mb-6 flex items-center gap-2 overflow-x-auto lg:hidden" aria-label="Mobile navigation">
            <a className="shrink-0 rounded-xl bg-[#eef2ff] px-4 py-2.5 text-sm font-semibold text-[#4255d4]" href="#today">Today</a>
            <a className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#68727d]" href="#tasks">Tasks ({tasks.length})</a>
            <a className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#68727d]" href="/activity">Activity</a>
          </nav>
          <header className="mb-10 flex items-start justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#7b8490]">{formatDate(todayDate)}</p>
              <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Good morning, Alex.</h1>
              <p className="mt-3 text-[#68727d]">Let&apos;s make today count.</p>
            </div>
            <button className="rounded-full border border-[#e0e4e8] bg-white px-4 py-2 text-sm font-medium text-[#53606c] shadow-sm hover:bg-[#f8f9fa]" aria-label="Open settings">
              <span className="mr-2">⚙</span> Settings
            </button>
          </header>

          <div className="mb-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section id="today" className="rounded-3xl bg-[#17202a] p-7 text-white shadow-[0_18px_50px_rgba(23,32,42,0.12)] sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-4 text-sm font-medium text-[#aeb8c1]">Focus for today</p>
                  <h2 className="max-w-md text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
                    {focusMessage}
                  </h2>
                </div>
                <span className="rounded-full bg-[#2d3945] px-3 py-1 text-xs font-semibold text-[#cbd2d8]">
                  {Math.floor(plannedMinutes / 60)}h {plannedMinutes % 60}m planned
                </span>
              </div>
              <div className="mt-9 flex items-center justify-between border-t border-[#35414c] pt-5 text-sm">
                <span className="text-[#aeb8c1]">Today&apos;s progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#35414c]">
                <div className="h-full rounded-full bg-[#a8b3ff] transition-all" style={{ width: `${Math.max(progress, 8)}%` }} />
              </div>
            </section>

            <section className="rounded-3xl border border-[#e7eaee] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,42,0.03)] sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-4 text-sm font-medium text-[#7b8490]">Quick capture</p>
                  <h2 className="text-xl font-semibold tracking-[-0.03em]">What are you working on?</h2>
                </div>
                <span className="text-2xl text-[#a8b3ff]">✦</span>
              </div>
              <form className="mt-7 flex gap-2" onSubmit={addActivity}>
                <input className="min-w-0 flex-1 rounded-xl border border-[#e0e4e8] bg-[#fafbfc] px-4 py-3 text-sm outline-none placeholder:text-[#a0a8b0] focus:border-[#7685ec]" placeholder="Log an activity..." value={newActivity} onChange={(event) => setNewActivity(event.target.value)} />
                <input className="w-20 rounded-xl border border-[#e0e4e8] bg-[#fafbfc] px-3 py-3 text-sm outline-none placeholder:text-[#a0a8b0] focus:border-[#7685ec]" type="number" min="1" max="1440" placeholder="Min" aria-label="Activity duration in minutes" value={newActivityDuration} onChange={(event) => setNewActivityDuration(event.target.value)} />
                <select className="max-w-36 rounded-xl border border-[#e0e4e8] bg-[#fafbfc] px-3 py-3 text-sm text-[#53606c] outline-none focus:border-[#7685ec]" aria-label="Link activity to task" value={newActivityTaskId} onChange={(event) => setNewActivityTaskId(event.target.value)}>
                  <option value="">No task</option>
                  {tasks.filter((task) => task.status !== "archived").map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
                </select>
                <button className="rounded-xl bg-[#4255d4] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3446bf]" type="submit">Log</button>
              </form>
              <p className="mt-3 text-xs text-[#9aa3ac]">A quick note is enough. Add detail later if you need it.</p>
            </section>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section id="tasks" className="rounded-3xl border border-[#e7eaee] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,42,0.03)] sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#7b8490]">Your plan</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Up next</h2>
                </div>
                <div className="flex items-center gap-2">
                  <select className="rounded-xl border border-[#e0e4e8] bg-white px-2 py-1.5 text-xs font-semibold text-[#5364d5] outline-none" aria-label="Filter tasks" value={taskFilter} onChange={(event) => setTaskFilter(event.target.value as typeof taskFilter)}>
                    <option value="open">All open</option>
                    <option value="in_progress">In progress</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <span className="rounded-full bg-[#f0f2ff] px-3 py-1 text-xs font-semibold text-[#5364d5]">{visibleTasks.length} tasks</span>
                </div>
              </div>
              <div className="space-y-2">
                {visibleTasks.map((task, index) =>
                  editingTaskId === task.id ? (
                    <form key={task.id} className="havu-reveal rounded-2xl bg-[#f8f9fb] p-4" style={{ "--reveal-delay": `${index * 55}ms` } as CSSProperties} onSubmit={(event) => void saveTask(event, task)}>
                      <input className="w-full rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7685ec]" value={editingTaskTitle} onChange={(event) => setEditingTaskTitle(event.target.value)} aria-label="Task title" />
                      <textarea className="mt-2 min-h-16 w-full rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7685ec]" placeholder="Description (optional)" value={editingTaskDescription} onChange={(event) => setEditingTaskDescription(event.target.value)} aria-label="Task description" />
                      <div className="mt-2 flex gap-2">
                        <select className="rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm" value={editingTaskStatus} onChange={(event) => setEditingTaskStatus(event.target.value as Task["status"])} aria-label="Task status">
                          <option value="todo">Todo</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="archived">Archived</option>
                        </select>
                        <select className="rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm" value={editingTaskPriority} onChange={(event) => setEditingTaskPriority(event.target.value as Task["priority"])} aria-label="Task priority">
                          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                        </select>
                        <input className="w-32 rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm" type="date" value={editingTaskDueDate} onChange={(event) => setEditingTaskDueDate(event.target.value)} aria-label="Task due date" />
                        <input className="w-20 rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm" type="number" min="1" max="1440" value={editingTaskEstimate} onChange={(event) => setEditingTaskEstimate(event.target.value)} aria-label="Estimated minutes" />
                        <button className="rounded-xl bg-[#4255d4] px-3 py-2 text-xs font-semibold text-white" type="submit">Save</button>
                        <button className="rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#53606c]" type="button" onClick={() => setEditingTaskId(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div key={task.id} className="havu-reveal group flex items-center gap-3 rounded-2xl px-3 py-4 transition hover:bg-[#f8f9fb]" style={{ "--reveal-delay": `${index * 55}ms` } as CSSProperties}>
                      <button className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${index === 0 ? "border-[#4255d4] bg-[#4255d4] text-white" : "border-[#d8dde2] text-transparent group-hover:border-[#9aa7f0]"}`} onClick={() => void toggleTask(task)} aria-label={`Complete ${task.title}`}>✓</button>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#27323d]">{task.title}</span>
                        <span className="mt-1 block text-xs text-[#8b949d]">
                          {task.estimate} <span className="mx-1">·</span> {task.priority} priority
                          {task.dueDate && task.dueDate < today ? <span className="ml-2 font-semibold text-[#9f2d3d]">Overdue</span> : null}
                          {task.status === "in_progress" ? <span className="ml-2 font-semibold text-[#5364d5]">In progress</span> : null}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-[#8b949d]">{index === 0 ? "Now" : "Later"}</span>
                      <button className="text-xs font-semibold text-[#5364d5] opacity-0 group-hover:opacity-100" onClick={() => startEditingTask(task)}>Edit</button>
                      <button className="text-xs font-semibold text-[#9a6b27] opacity-0 group-hover:opacity-100" onClick={() => void archiveTask(task)}>Archive</button>
                      <button className="text-xs font-semibold text-[#9f2d3d] opacity-0 group-hover:opacity-100" onClick={() => void deleteTask(task)}>Delete</button>
                    </div>
                  ),
                )}
                {visibleTasks.length === 0 ? <p className="rounded-2xl bg-[#f8f9fb] px-4 py-6 text-center text-sm text-[#9aa3ac]">No tasks match this filter.</p> : null}
              </div>
              <form className="mt-5 flex flex-wrap gap-2 border-t border-[#eef0f2] pt-5" onSubmit={addTask}>
                <input className="min-w-0 flex-1 rounded-xl border border-[#e0e4e8] px-4 py-3 text-sm outline-none placeholder:text-[#a0a8b0] focus:border-[#7685ec]" placeholder="Add a task..." value={newTask} onChange={(event) => setNewTask(event.target.value)} />
                <select className="rounded-xl border border-[#e0e4e8] bg-white px-3 py-3 text-sm text-[#53606c] outline-none focus:border-[#7685ec]" aria-label="Task priority" value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value as Task["priority"])}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input className="w-20 rounded-xl border border-[#e0e4e8] px-3 py-3 text-sm outline-none placeholder:text-[#a0a8b0] focus:border-[#7685ec]" type="number" min="1" max="1440" aria-label="Estimated task minutes" value={newTaskEstimate} onChange={(event) => setNewTaskEstimate(event.target.value)} />
                <button className="rounded-xl border border-[#dfe3e8] px-4 py-3 text-sm font-semibold text-[#53606c] hover:bg-[#f8f9fa]" type="submit">Add</button>
              </form>
              <div className="mt-8 border-t border-[#eef0f2] pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-[#7b8490]">What you did</p>
                    <h3 className="text-lg font-semibold tracking-[-0.03em]">Completed today</h3>
                  </div>
                  <span className="rounded-full bg-[#eef8f1] px-3 py-1 text-xs font-semibold text-[#368154]">{completedCount}</span>
                </div>
                {completedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f8f9fb]">
                        <button className="flex h-5 w-5 items-center justify-center rounded-full bg-[#368154] text-xs text-white" onClick={() => void toggleTask(task)} aria-label={`Reopen ${task.title}`}>✓</button>
                        <span className="flex-1 truncate text-sm text-[#53606c]">{task.title}</span>
                        <span className="text-xs text-[#9aa3ac]">{task.estimate}</span>
                        <button className="text-xs font-semibold text-[#5364d5] opacity-0 group-hover:opacity-100" onClick={() => startEditingTask(task)}>Edit</button>
                        <button className="text-xs font-semibold text-[#9f2d3d] opacity-0 group-hover:opacity-100" onClick={() => void deleteTask(task)}>Delete</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#9aa3ac]">Complete a task to see it here.</p>
                )}
              </div>
            </section>

            <section id="activity" className="rounded-3xl border border-[#e7eaee] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,42,0.03)] sm:p-8">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#7b8490]">Your day so far</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Activity</h2>
                </div>
                <span className="text-sm font-semibold text-[#4255d4]">Today</span>
              </div>
              <div className="mb-6 rounded-2xl bg-[#f7f8fa] px-4 py-3 text-sm text-[#68727d]">
                <span className="font-semibold text-[#35404b]">{loggedMinutes} min</span> logged so far
              </div>
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div className="havu-reveal relative flex gap-4" key={activity.id} style={{ "--reveal-delay": `${activities.indexOf(activity) * 70}ms` } as CSSProperties}>
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#a8b3ff] ring-4 ring-[#f0f2ff]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-5 text-[#35404b]">{activity.description}</p>
                      <p className="mt-1 text-xs text-[#9aa3ac]">{activity.time}{activity.duration ? ` · ${activity.duration}` : ""}</p>
                      {activity.taskId ? <p className="mt-1 text-xs font-medium text-[#5364d5]">{tasks.find((task) => task.id === activity.taskId)?.title ?? "Linked task"}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
              {isLoading ? <p className="text-sm text-[#9aa3ac]">Loading your activity...</p> : null}
              {!isLoading && activities.length === 0 ? <p className="text-sm text-[#9aa3ac]">No activity logged yet today.</p> : null}
              <a className="mt-8 block w-full rounded-xl border border-[#e0e4e8] py-3 text-center text-sm font-semibold text-[#53606c] hover:bg-[#f8f9fa]" href="/activity">View full history</a>
            </section>
          </div>
          <section className="mt-5 rounded-3xl border border-[#e7eaee] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,42,0.03)] sm:p-8">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-medium text-[#7b8490]">End-of-day review</p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">Make the day visible</h2>
                <p className="mt-2 text-sm text-[#68727d]">
                  {completedCount} completed, {orderedTasks.length} still open, {loggedMinutes} minutes logged.
                </p>
              </div>
              <span className="rounded-full bg-[#f0f2ff] px-3 py-1 text-xs font-semibold text-[#5364d5]">Private note</span>
            </div>
            <form onSubmit={saveReview}>
              <textarea
                className="min-h-28 w-full resize-y rounded-2xl border border-[#e0e4e8] bg-[#fafbfc] px-4 py-3 text-sm leading-6 outline-none placeholder:text-[#a0a8b0] focus:border-[#7685ec]"
                placeholder="What went well? What should carry into tomorrow?"
                value={reflection}
                onChange={(event) => setReflection(event.target.value)}
                maxLength={2000}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#9aa3ac]">{reflection.length}/2000</span>
                <button className="rounded-xl bg-[#4255d4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3446bf] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSavingReview}>
                  {isSavingReview ? "Saving..." : "Save review"}
                </button>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
