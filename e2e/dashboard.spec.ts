import { expect, test } from "@playwright/test";

const task = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Plan the sprint",
  description: null,
  status: "todo",
  priority: "high",
  dueDate: "2026-10-05",
  estimatedMinutes: 30,
  completedAt: null,
  createdAt: "2026-10-05T08:00:00.000Z",
  updatedAt: "2026-10-05T08:00:00.000Z",
};

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.error(`PAGE_ERROR: ${error.message}`));
  await page.route(/\/api\/dashboard(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ tasks: [task], activities: [] }),
    });
  });
  await page.route(/\/api\/reviews(?:\?.*)?$/, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ date: "2026-10-05", reflection: "" }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ date: "2026-10-05", reflection: "Good progress." }),
    });
  });
});

test("creates and completes a task", async ({ page }) => {
  await page.route(/\/api\/tasks$/, async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ...task,
          id: "22222222-2222-4222-8222-222222222222",
          title: "Write release notes",
        }),
      });
      return;
    }

    if (request.method() === "PATCH") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ ...task, status: "done", completedAt: "2026-10-05T10:00:00.000Z" }),
      });
      return;
    }

    await route.continue();
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Good morning, there." })).toBeVisible();
  await expect(page.locator("#tasks").getByText("Plan the sprint", { exact: true })).toBeVisible();

  await page.getByPlaceholder("Add a task...").fill("Write release notes");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.locator("#tasks").getByText("Write release notes", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Complete Plan the sprint" }).click();
  await expect(page.getByText("Completed today")).toBeVisible();
});

test("saves settings and the daily review", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByPlaceholder("Your name").fill("Sam");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("heading", { name: "Good morning, Sam." })).toBeVisible();

  await page.getByPlaceholder("What went well? What should carry into tomorrow?").fill("Good progress.");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByRole("button", { name: "Save review" })).toBeEnabled();
});
