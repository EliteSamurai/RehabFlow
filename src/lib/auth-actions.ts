"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/server/supabase";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validations/auth";
import { env } from "@/env";

export async function loginAction(formData: LoginInput) {
  // Validate the form data
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: "Invalid form data",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        error: "Login failed",
      };
    }

    // Successful login - redirect will happen in the component
    return {
      success: true,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function signupAction(
  formData: SignupInput & { firstName?: string; lastName?: string }
) {
  // Validate the form data
  const validatedFields = signupSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: "Invalid form data",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/signup&continue_onboarding=true`,
        data: {
          email_confirm: true,
          first_name: formData.firstName || "",
          last_name: formData.lastName || "",
        },
      },
    });

    if (error) {
      return {
        error: error.message,
      };
    }

    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      return {
        success: true,
        needsEmailConfirmation: true,
        message:
          "Please check your email and click the confirmation link to complete your registration.",
      };
    }

    return {
      success: true,
      needsEmailConfirmation: false,
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function logoutAction() {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  redirect("/login");
}
