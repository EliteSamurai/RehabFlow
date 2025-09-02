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

        // Remove conflicting redirect logic - let individual pages handle their own redirects
        // The login page will handle redirecting to dashboard on successful login
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up auth state listener - only for updating user state, not redirects
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Remove redirect logic from here - let pages handle their own redirects
    });

    return () => subscription.unsubscribe();
  }, [router]); // Remove pathname dependency to prevent re-runs

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

  // Define protected routes that should show sidebar for authenticated users
  const protectedRoutes = [
    "/dashboard",
    "/patients",
    "/appointments",
    "/billing",
    "/settings",
    "/campaigns",
    "/analytics",
    "/admin",
    "/templates", // Add templates route
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Show sidebar only for authenticated users on protected routes
  if (user && isProtectedRoute) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  // Render without sidebar for:
  // - Unauthenticated users
  // - Authenticated users on public pages (like home page)
  return <>{children}</>;
}
