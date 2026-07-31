"use client";

import * as React from "react";
import { FolderTree, List, LayoutGrid } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";

export function WorkspaceSearchFilters() {
  const { viewMode, setViewMode } = useWorkspaceStore();

  return (
    <div className="flex items-center justify-between gap-3 mb-4 select-none">
      <div className="flex items-center rounded-lg border border-input p-0.5 bg-muted/40">
        <Button
          variant={viewMode === "tree" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setViewMode("tree")}
          className="h-7 text-xs font-semibold gap-1.5 px-3"
        >
          <FolderTree className="h-3.5 w-3.5" />
          <span>Tree View</span>
        </Button>

        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setViewMode("list")}
          className="h-7 text-xs font-semibold gap-1.5 px-3"
        >
          <List className="h-3.5 w-3.5" />
          <span>List View</span>
        </Button>

        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setViewMode("grid")}
          className="h-7 text-xs font-semibold gap-1.5 px-3"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Grid View</span>
        </Button>
      </div>
    </div>
  );
}
