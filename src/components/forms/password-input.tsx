"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input, type InputProps } from "./input";
import { Button } from "@/components/ui/button";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon = <Lock className="h-4 w-4 shrink-0" />, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <Input
        type={showPassword ? "text" : "password"}
        className={className}
        ref={ref}
        leftIcon={leftIcon}
        rightIcon={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 min-h-[40px] min-w-[40px] p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer inline-flex items-center justify-center shrink-0 select-none"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 shrink-0 stroke-[1.8]" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5 shrink-0 stroke-[1.8]" aria-hidden="true" />
            )}
          </Button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
