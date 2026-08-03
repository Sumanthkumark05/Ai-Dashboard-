"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { GoogleButton } from "@/features/auth/components/google-button";
import { loginSchema, type LoginSchemaType } from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/forms/input";
import { PasswordInput } from "@/components/forms/password-input";
import { Label } from "@/components/forms/label";
import { Alert, AlertDescription } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, isLoading, error, clearError } = useAuthStore();
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
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    clearError();
    try {
      await login(data);
      toast.success("Welcome back!", {
        description: "Successfully authenticated with NeuroDesk AI.",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Invalid credentials provided.";
      toast.error("Authentication failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your credentials to access your intelligence workspace"
    >
      <div className="space-y-6">
        {/* Error Alert Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isLoading}
              {...register("password")}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full pt-1"
            isLoading={isLoading}
          >
            Sign in
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <Separator className="w-full" />
          <span className="absolute bg-card px-2 text-xs text-muted-foreground select-none">
            Or continue with
          </span>
        </div>

        {/* Google SSO */}
        <GoogleButton
          disabled={isLoading}
          onClick={() =>
            toast.info("Google Authentication", {
              description: "Google OAuth integration is in UI preview mode.",
            })
          }
        >
          Sign in with Google
        </GoogleButton>

        {/* Sign Up Link */}
        <div className="text-center text-xs text-muted-foreground pt-2">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
          >
            Create an account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
