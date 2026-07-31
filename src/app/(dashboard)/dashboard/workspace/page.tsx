"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { WorkspacePage as WorkspacePageType } from "@/features/workspace/types";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import { TemplateGallery } from "@/features/workspace/components/template-gallery";
import { WorkspaceSearchFilters } from "@/features/workspace/components/workspace-search-filters";
import { DocumentEditor } from "@/features/workspace/components/document-editor";
import { InfoPanel } from "@/features/workspace/components/info-panel";
import { WorkspaceEmptyState } from "@/features/workspace/components/workspace-empty-state";
import { WorkspaceSkeleton } from "@/features/workspace/components/workspace-skeleton";

export default function WorkspacePage() {
  const {
    pages,
    searchQuery,
    viewMode,
    isSidebarOpen,
    isInfoPanelOpen,
    isLoading,
    selectPage,
  } = useWorkspaceStore();

  const filteredPages = React.useMemo(() => {
    if (!searchQuery) return pages;
    const q = searchQuery.toLowerCase().trim();
    return pages.filter(
      (p: WorkspacePageType) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [pages, searchQuery]);

  return (
    <div className="space-y-4 pb-12">
      {/* Template Quick Actions Gallery Bar */}
      <TemplateGallery />

      {/* View Switcher Bar */}
      <WorkspaceSearchFilters />

      {/* Main 4-Panel Responsive Layout */}
      {isLoading ? (
        <WorkspaceSkeleton />
      ) : filteredPages.length === 0 ? (
        <WorkspaceEmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px] border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          {/* Panel 1: Left Nested Tree Sidebar */}
          {isSidebarOpen && (
            <div className="lg:col-span-3 border-r border-border min-h-[500px]">
              <WorkspaceSidebar />
            </div>
          )}

          {/* Panel 2 & 3: Main Workspace Header & Document Editor */}
          <div className={isSidebarOpen && isInfoPanelOpen ? "lg:col-span-6 p-6" : isSidebarOpen || isInfoPanelOpen ? "lg:col-span-9 p-6" : "lg:col-span-12 p-6"}>
            {/* List or Grid View Alternative Mode */}
            {viewMode === "list" ? (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground mb-3">All Workspace Pages (List View)</h3>
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => selectPage(page.id)}
                    className="p-3 rounded-lg border border-border bg-muted/10 hover:bg-accent/40 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{page.icon}</span>
                      <span className="font-semibold text-xs text-foreground">{page.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{page.updatedDate}</span>
                  </div>
                ))}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => selectPage(page.id)}
                    className="p-4 rounded-xl border border-border bg-muted/10 hover:bg-accent/40 cursor-pointer space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{page.icon}</span>
                      <span className="font-bold text-xs text-foreground truncate">{page.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {page.content.replace(/<[^>]+>/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* Tree View / Standard Document Editor Mode */
              <>
                <WorkspaceHeader />
                <DocumentEditor />
              </>
            )}
          </div>

          {/* Panel 4: Right Metadata Information Panel */}
          {isInfoPanelOpen && (
            <div className="lg:col-span-3 border-l border-border">
              <InfoPanel />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
