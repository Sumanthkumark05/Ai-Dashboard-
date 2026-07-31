import * as React from "react";
import { Skeleton } from "@/components/feedback/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 min-h-[500px]">
      <div className="col-span-3 border-r border-border p-3 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-full" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
      <div className="col-span-9 p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
