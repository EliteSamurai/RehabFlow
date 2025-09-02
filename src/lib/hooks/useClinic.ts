"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase-client";

interface ClinicInfo {
  id: string;
  name: string;
  role: string;
}

export function useClinic() {
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinicInfo() {
      try {
        const supabase = supabaseClient();

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        // Get clinic info from clinic_users table
        const { data: clinicUser, error: clinicError } = await supabase
          .from("clinic_users")
          .select(
            `
            clinic_id,
            role,
            clinics!inner (
              name
            )
          `
          )
          .eq("user_id", user.id)
          .single();

        console.log("Clinic query result:", { clinicUser, clinicError });

        if (clinicError) {
          // Provide specific error message based on the database error
          if (clinicError.code === "PGRST116") {
            throw new Error(
              "User is not associated with any clinic. Please contact your administrator."
            );
          }
          throw new Error(
            `Database error: ${clinicError.message} (${clinicError.code})`
          );
        }

        if (!clinicUser) {
          throw new Error("No clinic association found");
        }

        setClinic({
          id: clinicUser.clinic_id,
          name:
            (clinicUser.clinics as { name: string }[])?.[0]?.name ||
            "Unknown Clinic",
          role: clinicUser.role,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error fetching clinic info:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClinicInfo();
  }, []);

  return { clinic, loading, error };
}
