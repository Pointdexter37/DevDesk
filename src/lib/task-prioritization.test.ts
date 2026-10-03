import { describe, expect, it } from "vitest";
import {
  getTaskScore,
  getTaskRecommendation,
  prioritizeTasks,
  type PrioritizableTask,
} from "./task-prioritization";

const today = "2026-10-03";

function task(
  overrides: Partial<PrioritizableTask>,
): PrioritizableTask {
  return {
    priority: "medium",
    dueDate: null,
    status: "todo",
    ...overrides,
  };
}

describe("getTaskScore", () => {
  it("prioritizes overdue tasks above tasks due today", () => {
    expect(getTaskScore(task({ dueDate: "2026-10-02" }), today)).toBeGreaterThan(
      getTaskScore(task({ dueDate: today }), today),
    );
  });

  it("adds weight for an active task", () => {
    expect(
      getTaskScore(task({ status: "in_progress" }), today),
    ).toBeGreaterThan(getTaskScore(task({ status: "todo" }), today));
  });
});

describe("prioritizeTasks", () => {
  it("does not mutate the source list", () => {
    const tasks = [
      task({ priority: "low" }),
      task({ priority: "high" }),
    ];

    const result = prioritizeTasks(tasks, today);

    expect(result[0].priority).toBe("high");
    expect(tasks[0].priority).toBe("low");
  });

  describe("getTaskRecommendation", () => {
    it("explains why an overdue task is recommended", () => {
      expect(
        getTaskRecommendation(
          {
            ...task({ dueDate: "2026-10-02" }),
            title: "Send the update",
            estimatedMinutes: 20,
          },
          today,
        ),
      ).toContain("overdue");
    });

    it("uses high priority when there is no due date", () => {
      expect(
        getTaskRecommendation(
          {
            ...task({ priority: "high" }),
            title: "Plan the sprint",
          },
          today,
        ),
      ).toContain("high priority");
    });
  });

  it("orders by urgency, date, and priority", () => {
    const tasks = [
      task({ priority: "high", dueDate: null }),
      task({ priority: "low", dueDate: today }),
      task({ priority: "medium", dueDate: "2026-10-02" }),
    ];

    expect(prioritizeTasks(tasks, today).map((item) => item.dueDate)).toEqual([
      "2026-10-02",
      today,
      null,
    ]);
  });
});
