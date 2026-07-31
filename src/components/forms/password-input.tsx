"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input, type InputProps } from "./input";
import { Button } from "@/components/ui/button";

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon = <Lock className="h-4 w-4" />, ...props }, ref) => {
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
            size="xs"
            className="h-6 w-6 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
