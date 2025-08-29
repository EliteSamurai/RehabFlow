// src/server/supabase.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";

export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(
          name: string,
          value: string,
          options: {
            path?: string;
            maxAge?: number;
            httpOnly?: boolean;
            secure?: boolean;
            sameSite?: string;
          } = {}
        ) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // In some contexts (e.g. Server Components), setting may not be allowed
          }
        },
        remove(
          name: string,
          options: {
            path?: string;
            maxAge?: number;
            httpOnly?: boolean;
            secure?: boolean;
            sameSite?: string;
          } = {}
        ) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ignore errors when cookies can't be mutated
          }
        },
      },
    }
  );
}
