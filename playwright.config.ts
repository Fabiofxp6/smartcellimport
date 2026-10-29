import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:3111",
    trace: "retain-on-failure",
    channel: "chrome",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "npx tsx tests/e2e/server.ts",
    url: "http://127.0.0.1:3111",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
