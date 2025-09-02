"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  basicSignupSchema,
  type BasicSignupData,
} from "@/lib/validations/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, CheckIcon, XIcon, MailIcon } from "lucide-react";
import { signupAction } from "@/lib/auth-actions";
import { supabaseClient } from "@/lib/supabase-client";
import { toast } from "sonner";

interface Step1Props {
  data?: BasicSignupData;
  onNext: (data: BasicSignupData) => void;
}

const passwordRequirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[A-Z]/, text: "One uppercase letter" },
  { regex: /[a-z]/, text: "One lowercase letter" },
  { regex: /\d/, text: "One number" },
  { regex: /[^A-Za-z0-9]/, text: "One special character" },
];

export default function Step1BasicSignup({ data, onNext }: Step1Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDataToPreFill, setUserDataToPreFill] =
    useState<BasicSignupData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BasicSignupData>({
    resolver: zodResolver(basicSignupSchema),
    defaultValues: data || {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  // Check if user is already authenticated (coming back from email confirmation)
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = supabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);

        // Only auto-advance if we have URL parameters indicating email confirmation
        // AND we're coming from auth callback
        const urlParams = new URLSearchParams(window.location.search);
        const emailConfirmed = urlParams.get("email_confirmed") === "true";
        const comingFromCallback = document.referrer.includes("/auth/callback");

        console.log("Step1 auth check:", {
          emailConfirmed,
          comingFromCallback,
          referrer: document.referrer,
          urlParams: window.location.search,
        });

        // Both conditions must be true for auto-advance
        if (emailConfirmed && comingFromCallback) {
          // Auto-fill form with user data and proceed
          const userData: BasicSignupData = {
            firstName: user.user_metadata?.first_name || "",
            lastName: user.user_metadata?.last_name || "",
            email: user.email || "",
            password: "", // Don't show password for confirmed users
          };

          // Show success message and proceed
          toast.success("Email confirmed! Continuing with setup...");
          setTimeout(() => {
            onNext(userData);
          }, 1000);
        } else {
          // Just set the data to pre-fill later (no toast message)
          const userData: BasicSignupData = {
            firstName: user.user_metadata?.first_name || "",
            lastName: user.user_metadata?.last_name || "",
            email: user.email || "",
            password: "",
          };
          setUserDataToPreFill(userData);
          console.log(
            "Pre-filling form for authenticated user (direct navigation)"
          );
        }
      }
    };
    checkAuth();
  }, [onNext]);

  // Pre-fill form when userDataToPreFill is set and form is ready
  useEffect(() => {
    if (userDataToPreFill && setValue) {
      setValue("firstName", userDataToPreFill.firstName);
      setValue("lastName", userDataToPreFill.lastName);
      setValue("email", userDataToPreFill.email);
      setUserDataToPreFill(null); // Clear after setting
    }
  }, [userDataToPreFill, setValue]);

  const watchedPassword = watch("password", "");

  const onSubmit = async (formData: BasicSignupData) => {
    setIsLoading(true);

    try {
      // First create the Supabase account
      const result = await signupAction({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.needsEmailConfirmation) {
        setEmailSent(true);
        toast.success("Please check your email to confirm your account");
        return;
      }

      // If no email confirmation needed, continue to next step
      toast.success("Account created successfully!");
      onNext(formData);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    const passedRequirements = passwordRequirements.filter((req) =>
      req.regex.test(pwd)
    );
    return passedRequirements.length;
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  const strength = getPasswordStrength(watchedPassword);

  // Show loading state ONLY for legitimate email confirmation (not direct navigation)
  if (isAuthenticated) {
    const urlParams = new URLSearchParams(window.location.search);
    const emailConfirmed = urlParams.get("email_confirmed") === "true";
    const comingFromCallback = document.referrer.includes("/auth/callback");

    // Only show the "Email Confirmed" loading state if this is a legitimate confirmation
    if (emailConfirmed && comingFromCallback) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <CheckIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">
              Email Confirmed!
            </h2>
            <p className="mt-2 text-gray-600">Continuing with your setup...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      );
    }
    // For direct navigation, fall through to show the normal form (pre-filled)
  }

  // Show email confirmation message if email was sent
  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <MailIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="mt-2 text-gray-600">
            We&apos;ve sent a confirmation link to your email address. Please
            click the link to verify your account and continue with the setup.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">What&apos;s next?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the confirmation link in the email</li>
              <li>You&apos;ll be redirected back to complete your setup</li>
            </ol>
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setEmailSent(false)}
            className="mr-4"
          >
            Try Different Email
          </Button>
          <Button
            onClick={() =>
              onNext({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
              })
            }
          >
            Continue Without Email Confirmation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Start Your Free Trial
        </h2>
        <p className="mt-2 text-gray-600">
          Create your RehabFlow account to begin improving patient
          communication.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              {...register("firstName")}
              type="text"
              autoComplete="given-name"
              className={errors.firstName ? "border-red-300" : ""}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              {...register("lastName")}
              type="text"
              autoComplete="family-name"
              className={errors.lastName ? "border-red-300" : ""}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            {...register("email")}
            type="email"
            autoComplete="email"
            className={errors.email ? "border-red-300" : ""}
            placeholder="you@clinic.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={errors.password ? "border-red-300 pr-10" : "pr-10"}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {watchedPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">
                  Password strength:
                </span>
                <span
                  className={`text-sm font-medium ${
                    strength <= 2
                      ? "text-red-600"
                      : strength <= 3
                        ? "text-yellow-600"
                        : strength <= 4
                          ? "text-blue-600"
                          : "text-green-600"
                  }`}
                >
                  {getStrengthText(strength)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Password Requirements */}
          {watchedPassword && (
            <div className="mt-3 space-y-1">
              {passwordRequirements.map((req, index) => {
                const passes = req.regex.test(watchedPassword);
                return (
                  <div key={index} className="flex items-center text-sm">
                    {passes ? (
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <XIcon className="w-4 h-4 text-gray-300 mr-2" />
                    )}
                    <span
                      className={passes ? "text-green-700" : "text-gray-500"}
                    >
                      {req.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Continue"}
          </Button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-indigo-600 hover:text-indigo-500">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-indigo-600 hover:text-indigo-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
