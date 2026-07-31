"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { GoogleButton } from "@/features/auth/components/google-button";
import { PasswordStrengthIndicator } from "@/features/auth/components/password-strength-indicator";
import { registerSchema, type RegisterSchemaType } from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/forms/input";
import { PasswordInput } from "@/components/forms/password-input";
import { Checkbox } from "@/components/forms/checkbox";
import { Label } from "@/components/forms/label";
import { Alert, AlertDescription } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, register: registerAccount, isLoading, error, clearError } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [mounted, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false as unknown as true,
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: RegisterSchemaType) => {
    clearError();
    try {
      await registerAccount(data);
      toast.success("Account created successfully!", {
        description: "Welcome to NeuroDesk AI. Redirecting to workspace...",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during account creation.";
      toast.error("Registration failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start deploying autonomous AI agents and enterprise dashboards in seconds"
    >
      <div className="space-y-6">
        {/* Error Alert Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" required>
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Alex Vance"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.name?.message}
              disabled={isLoading}
              {...register("name")}
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email" required>
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              disabled={isLoading}
              {...register("email")}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" required>
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Create strong password"
              error={errors.password?.message}
              disabled={isLoading}
              {...register("password")}
            />
            {/* Password Strength Meter */}
            <PasswordStrengthIndicator password={passwordValue} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" required>
              Confirm password
            </Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              {...register("confirmPassword")}
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="space-y-1 pt-1">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="termsAccepted"
                disabled={isLoading}
                {...register("termsAccepted")}
              />
              <Label
                htmlFor="termsAccepted"
                className="text-xs font-normal text-muted-foreground leading-snug cursor-pointer"
              >
                I agree to the{" "}
                <Link href="#" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.termsAccepted?.message && (
              <p className="text-xs font-medium text-destructive">
                {errors.termsAccepted.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <Separator className="w-full" />
          <span className="absolute bg-card px-2 text-xs text-muted-foreground select-none">
            Or sign up with
          </span>
        </div>

        {/* Google SSO */}
        <GoogleButton
          disabled={isLoading}
          onClick={() =>
            toast.info("Google Sign Up", {
              description: "Google OAuth registration is in UI preview mode.",
            })
          }
        >
          Sign up with Google
        </GoogleButton>

        {/* Login Link */}
        <div className="text-center text-xs text-muted-foreground pt-2">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
