"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";
import Sidebar from "./Sidebar";
import type { User } from "@supabase/supabase-js";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = supabaseClient();

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        // Handle redirects based on auth state
        // Allow unauthenticated access to login page only
        if (!user && pathname !== "/login") {
          // Don't redirect, just set user to null and show content
          setUser(null);
        } else if (user && pathname === "/login") {
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Don't redirect on auth errors, just set user to null
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      // Only redirect on explicit sign in/out events, not on page load
      if (event === "SIGNED_IN" && pathname === "/login") {
        router.push("/dashboard");
      }
      // Don't redirect on sign out - let users stay on current page
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If on login or signup page, render without sidebar
  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }

  // Allow access to all pages, but show sidebar only when authenticated

  // Render with sidebar only for authenticated users
  if (user) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  // Render without sidebar for unauthenticated users
  return <>{children}</>;
}
