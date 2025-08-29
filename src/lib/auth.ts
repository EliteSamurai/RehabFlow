import { supabaseServer } from "@/server/supabase";
import type { User } from "@supabase/supabase-js";

export async function getUser(): Promise<User | null> {
  try {
    const supabase = await supabaseServer();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error in getUser:", error);
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user;
}

// Server-side user hook - can only be used in Server Components
export async function useUser() {
  return await getUser();
}
