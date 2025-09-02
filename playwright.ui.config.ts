import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Load env into the **test workers**
dotenv.config({ path: ".env.local" }); // or ".env.test" if you prefer

export default defineConfig({
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "local-chromium", use: { ...devices["Desktop Chrome"] } }],

  // This launches `npm run dev` and waits for the URL to respond before running tests
  webServer: {
    command: "npm run dev",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 180_000,
    // These env vars are passed to the **Next.js dev server process**:
    env: {
      NODE_ENV: "development",
      TEST_MODE: "1",
      E2E: "1",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ENABLE_REAL_SMS: "false",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_x",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "whsec_x",
      CRON_SECRET: process.env.CRON_SECRET || "changeme",
      // If your app reads NEXT_PUBLIC_APP_URL, set it too:
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
  },
});
