import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
  success?: string | boolean;
  helperText?: string;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      success,
      helperText,
      maxLength,
      value,
      onChange,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const helperId = `${textareaId}-helper`;
    
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full space-y-1.5">
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-destructive focus-visible:ring-destructive",
            hasSuccess && "border-success focus-visible:ring-success",
            className
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={helperText || typeof error === "string" ? helperId : undefined}
          {...props}
        />
        <div className="flex items-center justify-between text-xs">
          <div>
            {typeof error === "string" && (
              <p id={helperId} className="text-destructive font-medium">
                {error}
              </p>
            )}
            {typeof success === "string" && !hasError && (
              <p id={helperId} className="text-success font-medium">
                {success}
              </p>
            )}
            {helperText && !error && !success && (
              <p id={helperId} className="text-muted-foreground">
                {helperText}
              </p>
            )}
          </div>
          {maxLength && (
            <span className="text-muted-foreground select-none">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
