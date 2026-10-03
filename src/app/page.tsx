"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  prioritizeTasks,
  type PrioritizableTask,
} from "@/lib/task-prioritization";

type Task = PrioritizableTask & {
  id: string;
  title: string;
  estimate: string;
};

type Activity = {
  id: string;
  description: string;
  time: string;
  duration?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const today = "2026-10-03";

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
            estimatedMinutes: number | null;
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
          })),
        );
      } catch (loadError) {
        console.error(loadError);
        setError("We couldn't load your dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const orderedTasks = useMemo(
    () => prioritizeTasks(tasks.filter((task) => task.status !== "done"), today),
    [tasks],
  );
  const completedCount = tasks.filter((task) => task.status === "done").length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate: today }),
      });
      if (!response.ok) throw new Error("Unable to create task.");
      const task = await response.json();
      setTasks((current) => [
        ...current,
        { ...task, estimate: `${task.estimatedMinutes ?? 0} min` },
      ]);
      setNewTask("");
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
        body: JSON.stringify({ description }),
      });
      if (!response.ok) throw new Error("Unable to create activity.");
      const activity = await response.json();
      setActivities((current) => [
        {
          id: activity.id,
          description: activity.description,
          time: "Just now",
        },
        ...current,
      ]);
      setNewActivity("");
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

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#17202a]">
      {error ? (
        <div className="fixed right-5 top-5 z-10 rounded-xl bg-[#9f2d3d] px-4 py-3 text-sm font-medium text-white shadow-lg">
          {error}
          <button className="ml-3 underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      ) : null}
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
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
            <a className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#68727d] hover:bg-[#f4f5f7]" href="#activity">
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
          <header className="mb-10 flex items-start justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[#7b8490]">{formatDate(new Date(2026, 9, 3))}</p>
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
                    Start with the roadmap review, then protect time for the update.
                  </h2>
                </div>
                <span className="rounded-full bg-[#2d3945] px-3 py-1 text-xs font-semibold text-[#cbd2d8]">2h 15m planned</span>
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
                <span className="rounded-full bg-[#f0f2ff] px-3 py-1 text-xs font-semibold text-[#5364d5]">{orderedTasks.length} tasks</span>
              </div>
              <div className="space-y-2">
                {orderedTasks.map((task, index) => (
                  <button key={task.id} className="group flex w-full items-center gap-4 rounded-2xl px-3 py-4 text-left transition hover:bg-[#f8f9fb]" onClick={() => void toggleTask(task)}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${index === 0 ? "border-[#4255d4] bg-[#4255d4] text-white" : "border-[#d8dde2] text-transparent group-hover:border-[#9aa7f0]"}`}>✓</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#27323d]">{task.title}</span>
                      <span className="mt-1 block text-xs text-[#8b949d]">{task.estimate} <span className="mx-1">·</span> {task.priority} priority</span>
                    </span>
                    <span className="text-xs font-medium text-[#8b949d]">{index === 0 ? "Now" : "Later"}</span>
                  </button>
                ))}
              </div>
              <form className="mt-5 flex gap-2 border-t border-[#eef0f2] pt-5" onSubmit={addTask}>
                <input className="min-w-0 flex-1 rounded-xl border border-[#e0e4e8] px-4 py-3 text-sm outline-none placeholder:text-[#a0a8b0] focus:border-[#7685ec]" placeholder="Add a task..." value={newTask} onChange={(event) => setNewTask(event.target.value)} />
                <button className="rounded-xl border border-[#dfe3e8] px-4 py-3 text-sm font-semibold text-[#53606c] hover:bg-[#f8f9fa]" type="submit">Add</button>
              </form>
            </section>

            <section id="activity" className="rounded-3xl border border-[#e7eaee] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,42,0.03)] sm:p-8">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#7b8490]">Your day so far</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Activity</h2>
                </div>
                <span className="text-sm font-semibold text-[#4255d4]">Today</span>
              </div>
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div className="relative flex gap-4" key={activity.id}>
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#a8b3ff] ring-4 ring-[#f0f2ff]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-5 text-[#35404b]">{activity.description}</p>
                      <p className="mt-1 text-xs text-[#9aa3ac]">{activity.time}{activity.duration ? ` · ${activity.duration}` : ""}</p>
                    </div>
                    {isLoading ? <p className="text-sm text-[#9aa3ac]">Loading your activity...</p> : null}
                    {!isLoading && activities.length === 0 ? <p className="text-sm text-[#9aa3ac]">No activity logged yet today.</p> : null}
                  </div>
                ))}
              </div>
              <button className="mt-8 w-full rounded-xl border border-[#e0e4e8] py-3 text-sm font-semibold text-[#53606c] hover:bg-[#f8f9fa]">View full history</button>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
