import { test, expect } from "@playwright/test";

test.describe("Introspection MVP Smoke Tests", () => {
  test("homepage loads and displays today's question", async ({ page }) => {
    await page.goto("/");

    // Wait for question to load
    await page.waitForSelector("h1");

    // Check that a question is displayed (should be large text)
    const questionText = await page.locator("h1").textContent();
    expect(questionText).toBeTruthy();
    expect(questionText!.length).toBeGreaterThan(10);

    // Check LLM selector cards are present
    const claudeCard = page.getByText("Claude");
    await expect(claudeCard).toBeVisible();

    const chatgptCard = page.getByText("ChatGPT");
    await expect(chatgptCard).toBeVisible();

    // Check copy button is present
    const copyButton = page.getByRole("button", { name: /copy prompt/i });
    await expect(copyButton).toBeVisible();
  });

  test("LLM selection works", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForSelector("h1");

    // Click ChatGPT card
    await page.getByText("ChatGPT").click();

    // Verify it's selected (should have accent styling)
    // We can check if the card has the selected state by looking for the indicator
    const selectedIndicator = page.locator('[class*="bg-accent"]').first();
    await expect(selectedIndicator).toBeVisible();
  });

  test("copy button shows success state", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForSelector("h1");

    // Click copy button
    const copyButton = page.getByRole("button", { name: /copy prompt/i });
    await copyButton.click();

    // Check for "Copied!" text
    await expect(page.getByText("Copied!")).toBeVisible();

    // Wait for it to disappear (should reset after ~1.5s)
    await expect(page.getByText("Copied!")).not.toBeVisible({ timeout: 3000 });
  });

  test("library page loads and displays questions", async ({ page }) => {
    await page.goto("/library");

    // Check header
    await expect(page.getByRole("heading", { name: /question library/i })).toBeVisible();

    // Check that categories are visible
    await expect(page.getByRole("button", { name: /all/i })).toBeVisible();

    // Check that at least one question card is visible
    const questionCards = page.locator('[class*="Card"]');
    await expect(questionCards.first()).toBeVisible();
  });

  test("speech-friendly toggle works", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForSelector("h1");

    // Find and toggle speech-friendly switch
    const speechToggle = page.getByRole("switch", {
      name: /include speech-friendly version/i,
    });
    await expect(speechToggle).toBeVisible();

    // Toggle it on
    await speechToggle.click();

    // Verify it's checked
    await expect(speechToggle).toBeChecked();

    // Toggle it off
    await speechToggle.click();

    // Verify it's unchecked
    await expect(speechToggle).not.toBeChecked();
  });
});
