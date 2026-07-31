"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { forgotPasswordSchema, type ForgotPasswordSchemaType } from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/forms/label";
import { Alert, AlertDescription } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchemaType) => {
    clearError();
    const success = await forgotPassword(data.email);
    if (success) {
      setIsSubmitted(true);
      toast.success("Reset link sent!", {
        description: `Check your inbox at ${data.email}`,
      });
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your verified email address and we'll dispatch a secure reset link"
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitted ? (
          /* Success State View */
          <div className="space-y-6 text-center animate-in fade-in-50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We sent a password recovery link to{" "}
                <span className="font-semibold text-foreground">{getValues("email")}</span>.
              </p>
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => setIsSubmitted(false)}
            >
              Didn&apos;t receive email? Resend
            </Button>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Sign in
              </Link>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-3">
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
