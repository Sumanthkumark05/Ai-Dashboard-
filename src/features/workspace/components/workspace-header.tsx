"use client";

import * as React from "react";
import { Star, Share2, PanelRight, ChevronRight } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function WorkspaceHeader() {
  const {
    pages,
    folders,
    selectedPageId,
    toggleFavouritePage,
    toggleInfoPanel,
    renamePage,
  } = useWorkspaceStore();

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  if (!selectedPage) return null;

  const folder = folders.find((f) => f.id === selectedPage.folderId);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border mb-4 select-none">
      {/* Breadcrumb Path & Page Title */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <span>Workspace</span>
          <ChevronRight className="h-3 w-3" />
          {folder && (
            <>
              <span>{folder.name}</span>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="font-semibold text-foreground truncate">{selectedPage.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedPage.icon || "📄"}</span>
          <input
            type="text"
            value={selectedPage.title}
            onChange={(e) => renamePage(selectedPage.id, e.target.value)}
            className="text-lg font-bold text-foreground bg-transparent border-none focus:outline-hidden focus:ring-1 focus:ring-primary rounded px-1 -ml-1 transition-all w-full max-w-xl"
          />
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground hidden md:inline font-mono">
          Edited {selectedPage.updatedDate}
        </span>

        {/* Favorite Button */}
        <Button
          variant="outline"
          size="xs"
          onClick={() => toggleFavouritePage(selectedPage.id)}
          aria-label="Favorite page"
        >
          <Star
            className={`h-4 w-4 ${
              selectedPage.isFavourite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
            }`}
          />
        </Button>

        {/* Share Button */}
        <Button
          variant="outline"
          size="xs"
          leftIcon={<Share2 className="h-3.5 w-3.5" />}
          onClick={() =>
            toast.success("Link copied to clipboard", {
              description: `Sharable link for "${selectedPage.title}" generated.`,
            })
          }
        >
          Share
        </Button>

        {/* Info Panel Toggle */}
        <Button
          variant="ghost"
          size="xs"
          onClick={toggleInfoPanel}
          className="h-8 w-8 p-0"
          aria-label="Toggle info panel"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
