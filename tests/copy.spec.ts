import { expect, test } from "@playwright/test";

// Helper: assert clipboard content is plain text (no HTML)
function expectPlainString(text: string) {
  expect(text).toBeTruthy();
  expect(text.length).toBeGreaterThan(0);
  expect(text).not.toMatch(/<[^>]+>/);
}

test.describe("Copy functionality", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("CopyButton on today page: click copies to clipboard and content is plain string", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 10000 });

    const copyButton = page.getByRole("button", { name: /copy prompt/i });
    await expect(copyButton).toBeVisible({ timeout: 10000 });
    await copyButton.click();

    await expect(page.getByText("Copied!")).toBeVisible({ timeout: 5000 });

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expectPlainString(clipboardText);
    expect(clipboardText.trim().length).toBeGreaterThan(0);
  });

  test("CopyButton on today page: success UI then reset", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 10000 });

    const copyButton = page.getByRole("button", { name: /copy prompt/i });
    await expect(copyButton).toBeVisible({ timeout: 10000 });
    await copyButton.click();

    await expect(page.getByText("Copied!")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Copied!")).not.toBeVisible({ timeout: 3000 });
  });

  test("CopyIconButton on library page: click copies to clipboard and content is plain string", async ({
    page,
  }) => {
    await page.goto("/library", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: /question library/i })
    ).toBeVisible({ timeout: 10000 });

    // Copy icon is revealed on card hover; find first question card and hover to show the copy button
    const firstCard = page.locator('[class*="border-l-accent"]').first();
    await firstCard.hover();
    await page.waitForTimeout(400);

    const copyButtonInCard = firstCard.getByRole("button");
    await expect(copyButtonInCard).toBeVisible({ timeout: 5000 });
    await copyButtonInCard.click();

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expectPlainString(clipboardText);
    expect(clipboardText.trim().length).toBeGreaterThan(0);
  });

  test("clipboard content has no HTML tags", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 10000 });

    const copyButton = page.getByRole("button", { name: /copy prompt/i });
    await expect(copyButton).toBeVisible({ timeout: 10000 });
    await copyButton.click();

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).not.toMatch(/<[^>]+>/);
    expect(typeof clipboardText).toBe("string");
  });
});
