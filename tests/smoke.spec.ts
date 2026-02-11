import { test, expect } from "@playwright/test";

test.describe("Introspection MVP Smoke Tests", () => {
  test("homepage loads and displays today's question", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for hero question to load
    await page.waitForSelector("h1", { timeout: 10000 });

    // Check that a question is displayed (should be large text)
    const questionText = await page.locator("h1").textContent();
    expect(questionText).toBeTruthy();
    expect(questionText!.length).toBeGreaterThan(10);

    // Wait for and check condensed LLM selector is present
    const llmSelector = page.getByText(/Optimize for:/i);
    await expect(llmSelector).toBeVisible({ timeout: 10000 });

    // Check copy button is present
    const copyButton = page.getByRole("button", { name: /copy prompt/i });
    await expect(copyButton).toBeVisible({ timeout: 10000 });
  });

  test("LLM selection works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for page to fully load
    await page.waitForSelector("h1", { timeout: 10000 });

    // Wait for LLM selector to appear (has 400ms delay)
    await page.waitForTimeout(500);

    // Click condensed selector to expand it
    const llmSelector = page.getByText(/Optimize for:/i);
    await expect(llmSelector).toBeVisible({ timeout: 10000 });
    await llmSelector.click();

    // Wait for expansion animation and title to appear
    await page.waitForTimeout(400);
    await expect(page.getByText(/Choose export target/i)).toBeVisible();

    // Click ChatGPT card
    const chatgptCard = page.getByRole("button").filter({ hasText: "ChatGPT" });
    await chatgptCard.click();

    // Wait for collapse animation
    await page.waitForTimeout(600);

    // Verify ChatGPT is now shown in condensed selector
    await expect(page.getByText("ChatGPT")).toBeVisible();
  });

  test("copy button shows success state", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for page to fully load
    await page.waitForSelector("h1", { timeout: 10000 });

    // Click copy button
    const copyButton = page.getByRole("button", { name: /copy prompt/i });
    await expect(copyButton).toBeVisible({ timeout: 10000 });
    await copyButton.click();

    // Check for "Copied!" text
    await expect(page.getByText("Copied!")).toBeVisible({ timeout: 5000 });

    // Wait for it to disappear (should reset after ~1.5s)
    await expect(page.getByText("Copied!")).not.toBeVisible({ timeout: 3000 });
  });

  test("library page loads and displays questions", async ({ page }) => {
    await page.goto("/library", { waitUntil: "networkidle" });

    // Check header
    await expect(page.getByRole("heading", { name: /question library/i })).toBeVisible({ timeout: 10000 });

    // Check that categories are visible
    await expect(page.getByRole("button", { name: /all/i })).toBeVisible({ timeout: 10000 });

    // Check that at least one question card is visible
    const questionCards = page.locator('[class*="border"]').filter({ hasText: /What/ });
    await expect(questionCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("speech-friendly toggle works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for page to fully load
    await page.waitForSelector("h1", { timeout: 10000 });

    // Find and toggle speech-friendly switch
    const speechToggle = page.getByRole("switch", {
      name: /include speech-friendly version/i,
    });
    await expect(speechToggle).toBeVisible({ timeout: 10000 });

    // Toggle it on
    await speechToggle.click();

    // Verify it's checked
    await expect(speechToggle).toBeChecked({ timeout: 5000 });

    // Toggle it off
    await speechToggle.click();

    // Verify it's unchecked
    await expect(speechToggle).not.toBeChecked({ timeout: 5000 });
  });
});
