import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

/**
 * Service role Supabase client for admin operations
 * This bypasses RLS and can access all data across tenants
 * Use with extreme caution and only for system operations
 */
let supabaseServiceInstance: ReturnType<typeof createClient> | null = null;

export function supabaseService() {
  if (!supabaseServiceInstance) {
    supabaseServiceInstance = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            "X-Client-Info": "rehabflow-service-role",
          },
        },
      }
    );
  }

  return supabaseServiceInstance;
}

/**
 * Safe wrapper for service role operations
 * Ensures proper logging and error handling
 */
export async function withServiceRole<T>(
  operation: (supabase: ReturnType<typeof createClient>) => Promise<T>,
  context: string
): Promise<T> {
  const startTime = Date.now();
  console.log(`🔧 Service role operation: ${context}`);

  try {
    const supabase = supabaseService();
    const result = await operation(supabase);

    const duration = Date.now() - startTime;
    console.log(
      `✅ Service role operation completed: ${context} (${duration}ms)`
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ Service role operation failed: ${context} (${duration}ms)`,
      error
    );
    throw error;
  }
}
