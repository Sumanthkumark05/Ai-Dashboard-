"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrengthIndicator({ password = "" }: PasswordStrengthProps) {
  const requirements = [
    { label: "At least 8 characters long", met: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$%^&*)", met: /[^a-zA-Z0-9]/.test(password) },
  ];

  const score = requirements.filter((r) => r.met).length;

  const getStrengthLabel = () => {
    if (score === 0) return { label: "", color: "bg-border", text: "" };
    if (score <= 1) return { label: "Too Weak", color: "bg-destructive", text: "text-destructive" };
    if (score === 2) return { label: "Fair", color: "bg-warning", text: "text-warning" };
    if (score === 3) return { label: "Good", color: "bg-info", text: "text-info" };
    return { label: "Strong", color: "bg-success", text: "text-success" };
  };

  const strength = getStrengthLabel();

  if (!password) return null;

  return (
    <div className="space-y-2 text-xs pt-1">
      {/* Strength Bar */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground font-medium">Password Strength:</span>
        <span className={cn("font-semibold", strength.text)}>{strength.label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              level <= score ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Requirement Checklist */}
      <ul className="space-y-1 pt-1">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              req.met ? "text-success font-medium" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <X className="h-3 w-3 shrink-0 opacity-40" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
