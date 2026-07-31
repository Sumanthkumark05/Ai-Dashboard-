"use client";

import * as React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";

export function FilterBar() {
  const { selectedMetric, setSelectedMetric, selectedProject, setSelectedProject } = useAnalyticsStore();

  const handleReset = () => {
    setSelectedMetric("all");
    setSelectedProject("all");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/60 mb-6 select-none">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Filter className="h-4 w-4 text-primary" />
        <span>Telemetry Filters:</span>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Metric Selector */}
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="All Metrics" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Metrics</SelectItem>
            <SelectItem value="users">Active Users</SelectItem>
            <SelectItem value="ai">AI Requests</SelectItem>
            <SelectItem value="files">File Storage</SelectItem>
          </SelectContent>
        </Select>

        {/* Project Scope Selector */}
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="All Workspaces" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Workspaces</SelectItem>
            <SelectItem value="prod">NeuroDesk Core Prod</SelectItem>
            <SelectItem value="agent">AGY Agents Cluster</SelectItem>
            <SelectItem value="staging">Staging Environment</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        <Button
          variant="ghost"
          size="xs"
          onClick={handleReset}
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
}
