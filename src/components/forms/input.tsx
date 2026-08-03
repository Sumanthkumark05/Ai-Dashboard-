import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
  success?: string | boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-muted-foreground z-10 shrink-0">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              // Base styles
              "flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-all duration-150",
              "placeholder:text-muted-foreground/60",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              // Focus
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring",
              // Disabled
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
              // Icons
              leftIcon && "pl-9",
              rightIcon && "pr-10",
              // Validation
              hasError && "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive",
              hasSuccess && "border-success focus-visible:ring-success/30 focus-visible:border-success",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={helperText || typeof error === "string" ? helperId : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground z-10 shrink-0">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Validation Messages */}
        {typeof error === "string" && (
          <p id={helperId} className="text-xs text-destructive font-medium flex items-center gap-1">
            {error}
          </p>
        )}
        {typeof success === "string" && !hasError && (
          <p id={helperId} className="text-xs text-success font-medium">
            {success}
          </p>
        )}
        {helperText && !error && !success && (
          <p id={helperId} className="text-xs text-muted-foreground leading-relaxed">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
