"use client";

import * as React from "react";
import { Plus, Calendar as CalendarIcon, FileText, BarChart3, Mail } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import { WorkspacePage as WorkspacePageType } from "@/features/workspace/types";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import { TemplateGallery } from "@/features/workspace/components/template-gallery";
import { WorkspaceSearchFilters } from "@/features/workspace/components/workspace-search-filters";
import { DocumentEditor } from "@/features/workspace/components/document-editor";
import { InfoPanel } from "@/features/workspace/components/info-panel";
import { WorkspaceEmptyState } from "@/features/workspace/components/workspace-empty-state";
import { WorkspaceSkeleton } from "@/features/workspace/components/workspace-skeleton";
import { WorkspaceReportsTab } from "@/features/workspace/components/reports/workspace-reports-tab";
import { WorkspaceCalendarTab } from "@/features/workspace/components/calendar/workspace-calendar-tab";
import { WorkspaceMailTab } from "@/features/workspace/components/mail/workspace-mail-tab";

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

  const { setCreateModalOpen, currentWorkspace } = useWorkspaceContextStore();
  const [activeTab, setActiveTab] = React.useState<"documents" | "reports" | "calendar" | "mail">("documents");

  return (
    <div className="space-y-4 pb-12">
      {/* Prominent Header & Create Workspace Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-xs"
            style={{ backgroundColor: `${currentWorkspace?.color || "#3B82F6"}20` }}
          >
            {currentWorkspace?.icon || "💼"}
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {currentWorkspace?.name || "Workspace Environment"}
            </h2>
            <p className="text-xs text-muted-foreground">
              /{currentWorkspace?.slug || "default"} • {currentWorkspace?.storage_used || 0} MB used
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          className="rounded-xl shadow-sm"
        >
          Create Workspace
        </Button>
      </div>

      {/* Module Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "documents"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Documents &amp; Pages</span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "calendar"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>Calendar &amp; Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "reports"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Team Reports &amp; Milestones</span>
        </button>

        <button
          onClick={() => setActiveTab("mail")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "mail"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Mail &amp; Communication</span>
        </button>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === "mail" ? (
        <WorkspaceMailTab />
      ) : activeTab === "calendar" ? (
        <WorkspaceCalendarTab workspaceId={currentWorkspace?.id || "default"} />
      ) : activeTab === "reports" ? (
        <WorkspaceReportsTab workspaceId={currentWorkspace?.id || "default"} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
