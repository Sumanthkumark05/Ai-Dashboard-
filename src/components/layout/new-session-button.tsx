"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "@/components/feedback/toast";

export function NewSessionButton() {
  return (
    <button
      type="button"
      onClick={() =>
        toast.success("New Session", {
          description: "Initializing new AI intelligence session...",
        })
      }
      aria-label="Create new session"
      className="relative hidden sm:inline-flex h-10 items-center justify-center gap-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Plus className="h-4 w-4 shrink-0" />
      <span>New Session</span>
    </button>
  );
}

