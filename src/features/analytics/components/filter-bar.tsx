"use client";

import * as React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";

export function FilterBar() {
  const {
    selectedWorkspace,
    setSelectedWorkspace,
    selectedCategory,
    setSelectedCategory,
    selectedOwner,
    setSelectedOwner,
    selectedMetric,
    setSelectedMetric,
  } = useAnalyticsStore();

  const { workspaces, fetchWorkspaces } = useWorkspaceContextStore();

  React.useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleReset = () => {
    setSelectedWorkspace("all");
    setSelectedCategory("all");
    setSelectedOwner("all");
    setSelectedMetric("all");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/60 mb-6 select-none">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground shrink-0">
        <Filter className="h-4 w-4 text-primary" />
        <span>Telemetry Filters:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Workspace Filter */}
        <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Workspace Filter" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Workspaces</SelectItem>
            {workspaces.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Category Filter" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="datasets">Datasets</SelectItem>
            <SelectItem value="files">Files</SelectItem>
            <SelectItem value="reports">Reports</SelectItem>
          </SelectContent>
        </Select>

        {/* Owner Filter */}
        <Select value={selectedOwner} onValueChange={setSelectedOwner}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Owner Filter" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Owners</SelectItem>
            <SelectItem value="current_user">Me (Current User)</SelectItem>
            <SelectItem value="team_members">Team Members</SelectItem>
          </SelectContent>
        </Select>

        {/* Metric Scope Selector */}
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All Metrics" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Metrics</SelectItem>
            <SelectItem value="workspaces">Workspaces</SelectItem>
            <SelectItem value="files">Files Stored</SelectItem>
            <SelectItem value="storage">Storage Used</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="datasets">Datasets</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        <Button
          variant="ghost"
          size="xs"
          onClick={handleReset}
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
}
