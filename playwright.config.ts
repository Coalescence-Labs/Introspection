import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    permissions: ["clipboard-read", "clipboard-write"],
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "iPhone 13", use: { ...devices["iPhone 13"] } },
    { name: "iPhone 14", use: { ...devices["iPhone 14"] } },
    { name: "iPhone 15", use: { ...devices["iPhone 15"] } },
    { name: "iPhone 15 Pro", use: { ...devices["iPhone 15 Pro"] } },
    { name: "Pixel 5", use: { ...devices["Pixel 5"] } },
    { name: "Pixel 7", use: { ...devices["Pixel 7"] } },
    { name: "Galaxy S24", use: { ...devices["Galaxy S24"] } },
    { name: "iPad Pro 11", use: { ...devices["iPad Pro 11"] } },
    { name: "iPad gen 7", use: { ...devices["iPad (gen 7)"] } },
  ],

  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
