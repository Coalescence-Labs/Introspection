import { expect, test } from "@playwright/test";

test.describe("Organic handoff sandbox", () => {
  test("sandbox route loads beta UI", async ({ page }) => {
    await page.goto("/sandbox-organic-llm", { waitUntil: "networkidle" });

    await expect(page.getByText(/Beta — Organic LLM handoff sandbox/i)).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(/Optimize for:/i)).toBeVisible();
  });

  test("handoff button triggers navigation when API mocked", async ({ page }) => {
    await page.route("**/api/organic/handoff", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "http://localhost:9999/introspection/start?p=intro%3Av1%3Atest",
        }),
      });
    });

    await page.goto("/sandbox-organic-llm", { waitUntil: "networkidle" });

    const button = page.getByRole("button", { name: /Open in Organic LLM/i });
    await expect(button).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/localhost:9999\/introspection\/start/),
      button.click(),
    ]);
  });
});
