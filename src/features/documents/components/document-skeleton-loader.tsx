"use client";

import * as React from "react";

export function DocumentSkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 bg-muted rounded-xl" />
            <div className="h-4 w-4 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
          <div className="pt-3 border-t border-border flex justify-between">
            <div className="h-3 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
