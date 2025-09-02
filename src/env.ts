import { z } from "zod";

// Client-side environment variables (available in browser)
const ClientEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1), // Changed from SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
});

// Server-side environment variables (only available on server)
const ServerEnv = z.object({
  SUPABASE_URL: z.string().min(1), // Keep this for server-side
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_MESSAGING_SERVICE_SID: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  ENABLE_REAL_SMS: z.enum(["true", "false"]).default("false"),
  CRON_SECRET: z.string().min(1),
});

// Full environment (for server-side use)
const FullEnv = ClientEnv.merge(ServerEnv);

let env: z.infer<typeof FullEnv>;

// Check if we're on the client side
const isClient = typeof window !== "undefined";

// E2E test mode detection
const isE2E = process.env.TEST_MODE === "1" || process.env.E2E === "1";

try {
  if (isClient) {
    // On client side, only validate client environment variables
    const clientOnlyEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    const clientEnv = ClientEnv.parse(clientOnlyEnv);
    env = clientEnv as z.infer<typeof FullEnv>;
  } else {
    // On server side, validate all environment variables
    env = FullEnv.parse(process.env);
  }
} catch (error) {
  console.error("Environment validation failed:", error);
  throw new Error("Invalid environment configuration");
}

export { env, isE2E };
