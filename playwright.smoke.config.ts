import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Load environment variables for the entire test process
config({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests",
  testMatch: "smoke-tests.spec.ts", // Only run smoke tests
  workers: 1,
  fullyParallel: false,
  retries: 0,

  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "local-chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      TEST_MODE: "1",
      E2E: "1",
    },
  },
});
