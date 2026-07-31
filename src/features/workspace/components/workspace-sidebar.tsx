"use client";

import * as React from "react";
import { Plus, FolderPlus, Layers } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { PageTree } from "./page-tree";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/forms/search-input";

export function WorkspaceSidebar() {
  const {
    folders,
    pages,
    searchQuery,
    setSearchQuery,
    createPage,
    createFolder,
  } = useWorkspaceStore();

  const filteredPages = React.useMemo(() => {
    if (!searchQuery) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter((p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)));
  }, [pages, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 bg-card border-r border-border select-none">
      <div className="space-y-4">
        {/* Workspace Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-foreground">NeuroDesk Workspace</span>
          </div>
        </div>

        {/* Quick Search */}
        <SearchInput
          placeholder="Filter workspace pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          className="h-8 text-xs"
        />

        {/* Creation Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="xs"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => createPage("New Document")}
            className="w-full justify-start text-xs"
          >
            New Page
          </Button>

          <Button
            variant="ghost"
            size="xs"
            leftIcon={<FolderPlus className="h-3.5 w-3.5" />}
            onClick={() => createFolder("New Folder")}
            className="w-full justify-start text-xs"
          >
            New Folder
          </Button>
        </div>

        {/* Nested Page Tree */}
        <PageTree folders={folders} pages={filteredPages} />
      </div>
    </div>
  );
}
