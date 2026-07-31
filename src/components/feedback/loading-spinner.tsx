import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export interface LoadingSpinnerProps extends React.HTMLAttributes<SVGElement> {
  size?: keyof typeof sizeMap;
}

export function LoadingSpinner({ size = "md", className, ...props }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeMap[size], className)}
      aria-label="Loading..."
      {...props}
    />
  );
}
