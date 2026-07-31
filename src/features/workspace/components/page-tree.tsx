"use client";

import * as React from "react";
import { ChevronRight, ChevronDown, Star, Plus, Trash2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { WorkspaceFolder, WorkspacePage } from "../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PageTreeProps {
  folders: WorkspaceFolder[];
  pages: WorkspacePage[];
}

export function PageTree({ folders, pages }: PageTreeProps) {
  const {
    selectedPageId,
    selectPage,
    expandedFolders,
    toggleFolderExpand,
    createPage,
    deletePage,
  } = useWorkspaceStore();

  const favouritePages = pages.filter((p) => p.isFavourite);
  const rootPages = pages.filter((p) => !p.folderId);

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Favourites Section */}
      {favouritePages.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block">
            Favourites
          </span>
          {favouritePages.map((page) => (
            <button
              key={page.id}
              onClick={() => selectPage(page.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                selectedPageId === page.id
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="truncate flex-1">{page.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Folders & Pages Hierarchy */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block">
          Workspace Directory
        </span>

        {folders.map((folder) => {
          const isExpanded = !!expandedFolders[folder.id];
          const folderPages = pages.filter((p) => p.folderId === folder.id);

          return (
            <div key={folder.id} className="space-y-0.5">
              {/* Folder Header */}
              <div
                onClick={() => toggleFolderExpand(folder.id)}
                className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent/60 cursor-pointer text-foreground"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-sm">{folder.icon || "📁"}</span>
                  <span className="font-semibold truncate">{folder.name}</span>
                </div>

                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    createPage("Untitled Note", folder.id);
                  }}
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Add page to folder"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Folder Nested Pages */}
              {isExpanded && (
                <div className="pl-5 space-y-0.5 border-l border-border/50 ml-3">
                  {folderPages.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic px-2 py-1">Empty folder</p>
                  ) : (
                    folderPages.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => selectPage(page.id)}
                        className={cn(
                          "group flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer",
                          selectedPageId === page.id
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs">{page.icon || "📄"}</span>
                          <span className="truncate">{page.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(page.id);
                          }}
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized Root Pages */}
        {rootPages.map((page) => (
          <div
            key={page.id}
            onClick={() => selectPage(page.id)}
            className={cn(
              "group flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer",
              selectedPageId === page.id
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-xs">{page.icon || "📄"}</span>
              <span className="truncate">{page.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
