"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  maxWidth = "lg",
  children,
  footer,
  className,
}: DialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Body Scroll Lock & ESC Key Listener
  React.useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg sm:max-w-xl md:max-w-[640px] lg:max-w-[700px]",
    xl: "max-w-xl sm:max-w-2xl lg:max-w-[800px]",
    "2xl": "max-w-2xl sm:max-w-4xl",
    "3xl": "max-w-3xl sm:max-w-5xl",
    "4xl": "max-w-4xl sm:max-w-6xl",
  }[maxWidth];

  const modalContent = (
    <div
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "relative w-full rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto transition-all",
          maxWidthClass,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - Fixed at top */}
        {(title || description || icon) && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary text-xl shadow-xs">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && <h2 className="text-base font-bold text-foreground leading-snug truncate">{title}</h2>}
                {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg shrink-0 ml-2"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Dialog Main Content - Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[calc(90vh-130px)]">
          {children}
        </div>

        {/* Footer Actions - Fixed at bottom */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
