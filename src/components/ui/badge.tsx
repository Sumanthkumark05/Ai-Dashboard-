import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none gap-1 shrink-0 whitespace-nowrap border",
  {
    variants: {
      variant: {
        default:     "bg-primary border-primary text-primary-foreground",
        secondary:   "bg-secondary border-transparent text-secondary-foreground",
        outline:     "text-foreground border-border bg-transparent",
        destructive: "bg-destructive/10 border-destructive/20 text-destructive",
        success:     "bg-success/10 border-success/20 text-success",
        warning:     "bg-warning/10 border-warning/20 text-warning",
        info:        "bg-info/10 border-info/20 text-info",
        muted:       "bg-muted border-transparent text-muted-foreground",
      },
      size: {
        xs: "h-4   px-1.5 text-[9px]  font-semibold tracking-wide",
        sm: "h-5   px-2   text-[10px] font-semibold tracking-wide",
        md: "h-5.5 px-2.5 text-[11px] font-medium",
        lg: "h-6   px-3   text-xs     font-medium",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
