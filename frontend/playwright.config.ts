import { defineConfig, devices } from "@playwright/test";

// E2E drives the real UI against an intercepted stream route, so no backend is
// needed. The dev server is started for the run and reused locally.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Run against the production build: no HMR websocket, clean and fast
  // hydration, and it exercises the bundle that actually ships.
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
