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
      className="relative flex h-9 w-full max-w-sm sm:max-w-md lg:max-w-lg items-center justify-between rounded-full border border-border bg-muted/40 px-3.5 text-xs text-muted-foreground transition-all duration-150 hover:bg-muted/80 hover:text-foreground hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-ring/30 select-none cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate text-xs font-normal">Search workspace, documents, datasets...</span>
      </div>
      <kbd className="pointer-events-none hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded-full border border-border bg-background px-2 font-mono text-[10px] font-medium text-muted-foreground shrink-0 shadow-2xs">
        <span className="text-[10px]">⌘</span>K
      </kbd>
    </button>
  );
}
