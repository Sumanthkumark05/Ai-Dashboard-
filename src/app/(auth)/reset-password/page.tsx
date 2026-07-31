"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { PasswordStrengthIndicator } from "@/features/auth/components/password-strength-indicator";
import { resetPasswordSchema, type ResetPasswordSchemaType } from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/forms/password-input";
import { Label } from "@/components/forms/label";
import { Alert, AlertDescription } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";

export default function ResetPasswordPage() {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: ResetPasswordSchemaType) => {
    clearError();
    const success = await resetPassword(data.password);
    if (success) {
      setIsSuccess(true);
      toast.success("Password reset successful!", {
        description: "You can now log in with your new credentials.",
      });
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Set a strong, unique password to secure your NeuroDesk AI workspace"
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSuccess ? (
          /* Success State View */
          <div className="space-y-6 text-center animate-in fade-in-50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Password Changed Successfully</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your account password has been updated. You may now sign in using your new credentials.
              </p>
            </div>

            <Link href="/login">
              <Button variant="primary" size="md" className="w-full">
                Proceed to Sign in
              </Button>
            </Link>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" required>
                New password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Enter new password"
                error={errors.password?.message}
                disabled={isLoading}
                {...register("password")}
              />
              <PasswordStrengthIndicator password={passwordValue} />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" required>
                Confirm new password
              </Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Repeat new password"
                error={errors.confirmPassword?.message}
                disabled={isLoading}
                {...register("confirmPassword")}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Reset Password
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
