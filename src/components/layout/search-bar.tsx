"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { toast } from "@/components/feedback/toast";

export function SearchBar() {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toast.info("Command Palette", {
          description: "Global command search palette preview (⌘K).",
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        toast.info("Global Search", {
          description: "Global command search palette preview.",
        })
      }
      aria-label="Search workspace and commands"
      className="relative flex h-10 w-full max-w-xs sm:max-w-md lg:max-w-lg items-center justify-between rounded-xl border border-input bg-card/50 px-3.5 text-xs text-muted-foreground shadow-xs transition-colors hover:bg-accent/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring select-none cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">Search workspace, agents, models...</span>
      </div>
      <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-md border border-border bg-muted px-2 font-mono text-[10px] font-medium opacity-100 shrink-0">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}


