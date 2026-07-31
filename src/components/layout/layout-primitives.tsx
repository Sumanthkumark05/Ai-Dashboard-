import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({ size = "lg", className, ...props }: ContainerProps) {
  const sizeMap = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}
      {...props}
    />
  );
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 4 | 8 | 12 | 16 | 20 | 24 | 32;
}

export function Grid({ cols = 1, gap = 16, className, ...props }: GridProps) {
  const colMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    12: "grid-cols-12",
  };

  const gapMap = {
    4: "gap-1",
    8: "gap-2",
    12: "gap-3",
    16: "gap-4",
    20: "gap-5",
    24: "gap-6",
    32: "gap-8",
  };

  return (
    <div className={cn("grid", colMap[cols], gapMap[gap], className)} {...props} />
  );
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  spacing?: 4 | 8 | 12 | 16 | 20 | 24 | 32;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
}

export function Stack({
  direction = "column",
  spacing = 16,
  align = "stretch",
  justify = "start",
  className,
  ...props
}: StackProps) {
  const spacingMap = {
    4: "gap-1",
    8: "gap-2",
    12: "gap-3",
    16: "gap-4",
    20: "gap-5",
    24: "gap-6",
    32: "gap-8",
  };

  const alignMap = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  const justifyMap = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        spacingMap[spacing],
        alignMap[align],
        justifyMap[justify],
        className
      )}
      {...props}
    />
  );
}
