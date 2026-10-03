"use client";

import { FormEvent, type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";

type Activity = {
  id: string;
  description: string;
  durationMinutes: number | null;
  occurredAt: string;
  taskId: string | null;
  taskTitle: string | null;
};

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function ActivityHistoryPage() {
  const [date, setDate] = useState(todayKey);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");

  async function loadActivities(selectedDate: string) {
    try {
      const response = await fetch(`/api/activities?date=${selectedDate}`);
      if (!response.ok) throw new Error("Unable to load activity history.");
      setActivities(await response.json());
    } catch (loadError) {
      console.error(loadError);
      setError("We couldn't load activity history.");
    }
  }

  useEffect(() => {
    async function loadSelectedDate() {
      await loadActivities(date);
    }

    void loadSelectedDate();
  }, [date]);

  function startEditing(activity: Activity) {
    setEditingId(activity.id);
    setDescription(activity.description);
    setDuration(activity.durationMinutes?.toString() ?? "");
  }

  async function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !description.trim()) return;

    try {
      const response = await fetch("/api/activities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          description: description.trim(),
          durationMinutes: duration ? Number(duration) : null,
          taskId:
            activities.find((activity) => activity.id === editingId)?.taskId ??
            null,
        }),
      });
      if (!response.ok) throw new Error("Unable to update activity.");
      const updated = await response.json();
      setActivities((current) =>
        current.map((activity) =>
          activity.id === updated.id ? updated : activity,
        ),
      );
      setEditingId(null);
    } catch (saveError) {
      console.error(saveError);
      setError("We couldn't update that activity.");
    }
  }

  async function deleteActivity(activity: Activity) {
    if (!window.confirm(`Delete "${activity.description}"?`)) return;

    try {
      const response = await fetch("/api/activities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activity.id }),
      });
      if (!response.ok) throw new Error("Unable to delete activity.");
      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      );
    } catch (deleteError) {
      console.error(deleteError);
      setError("We couldn't delete that activity.");
    }
  }

  const totalMinutes = activities.reduce(
    (total, activity) => total + (activity.durationMinutes ?? 0),
    0,
  );

  return (
    <main className="havu-shell min-h-screen bg-[#f7f8fa] px-5 py-8 text-[#17202a] sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <Link className="text-sm font-semibold text-[#4255d4]" href="/">← Back to Today</Link>
        <header className="mt-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-[#7b8490]">Your day in review</p>
            <h1 className="text-4xl font-bold tracking-[-0.04em]">Activity history</h1>
          </div>
          <label className="text-sm font-medium text-[#68727d]">
            Date
            <input className="ml-3 rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm text-[#35404b]" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </header>

        {error ? (
          <div className="mt-6 rounded-xl bg-[#9f2d3d] px-4 py-3 text-sm font-medium text-white">
            {error} <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button>
          </div>
        ) : null}

        <section className="mt-8 rounded-3xl border border-[#e7eaee] bg-white p-6 shadow-[0_8px_30px_rgba(23,32,42,0.03)] sm:p-8">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#7b8490]">Logged time</p>
              <p className="mt-1 text-3xl font-bold tracking-[-0.04em]">{totalMinutes} min</p>
            </div>
            <span className="rounded-full bg-[#f0f2ff] px-3 py-1 text-xs font-semibold text-[#5364d5]">{activities.length} entries</span>
          </div>
          <div className="space-y-3">
            {activities.map((activity, index) =>
              editingId === activity.id ? (
                <form className="havu-reveal rounded-2xl bg-[#f8f9fb] p-4" key={activity.id} style={{ "--reveal-delay": `${index * 65}ms` } as CSSProperties} onSubmit={(event) => void saveActivity(event)}>
                  <input className="w-full rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Activity description" />
                  <div className="mt-2 flex gap-2">
                    <input className="w-24 rounded-xl border border-[#e0e4e8] bg-white px-3 py-2 text-sm" type="number" min="1" max="1440" placeholder="Minutes" value={duration} onChange={(event) => setDuration(event.target.value)} aria-label="Activity duration" />
                    <button className="rounded-xl bg-[#4255d4] px-3 py-2 text-xs font-semibold text-white" type="submit">Save</button>
                    <button className="rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#53606c]" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="havu-reveal group flex items-center gap-4 rounded-2xl border border-[#eef0f2] px-4 py-4" key={activity.id} style={{ "--reveal-delay": `${index * 65}ms` } as CSSProperties}>
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#a8b3ff] ring-4 ring-[#f0f2ff]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#35404b]">{activity.description}</p>
                    <p className="mt-1 text-xs text-[#9aa3ac]">
                      {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(activity.occurredAt))}
                      {activity.durationMinutes ? ` · ${activity.durationMinutes} min` : ""}
                    </p>
                    {activity.taskTitle ? <p className="mt-1 text-xs font-medium text-[#5364d5]">Task: {activity.taskTitle}</p> : null}
                  </div>
                  <button className="text-xs font-semibold text-[#5364d5]" onClick={() => startEditing(activity)}>Edit</button>
                  <button className="text-xs font-semibold text-[#9f2d3d]" onClick={() => void deleteActivity(activity)}>Delete</button>
                </div>
              ),
            )}
          </div>
          {activities.length === 0 ? <p className="py-10 text-center text-sm text-[#9aa3ac]">No activity logged for this date.</p> : null}
        </section>
      </div>
    </main>
  );
}
