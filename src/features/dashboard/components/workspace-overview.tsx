"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Database, Briefcase, FileCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";

export function WorkspaceOverview() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { summary, isLoading, fetchSummary } = useDashboardStore();

  React.useEffect(() => {
    fetchSummary(currentWorkspace?.id);
  }, [fetchSummary, currentWorkspace?.id]);

  const metrics = [
    {
      title: "Documents",
      count: summary?.documents ?? 0,
      label: "Knowledge Repository",
      icon: FileText,
      href: "/dashboard/documents",
    },
    {
      title: "Datasets",
      count: summary?.datasets ?? 0,
      label: "Knowledge Sets",
      icon: Database,
      href: "/dashboard/datasets",
    },
    {
      title: "Workspaces",
      count: summary?.workspaces ?? 0,
      label: "Active Spaces",
      icon: Briefcase,
      href: "/dashboard/workspace-manager",
    },
    {
      title: "Files",
      count: summary?.files ?? 0,
      label: "Managed Storage",
      icon: FileCode,
      href: "/dashboard/files",
    },
  ];

  return (
    <Card className="p-4 h-full flex flex-col justify-between select-none">
      <div>
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-foreground">Workspace Resource Overview</h4>
          <p className="text-xs text-muted-foreground">Active documentation, knowledge sets, & asset metrics</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metrics.map((item, index) => {
            const IconComponent = item.icon;

            return (
              <Link key={index} href={item.href}>
                <div className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col justify-between hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                    <IconComponent className="h-4 w-4 text-primary shrink-0" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {isLoading && !summary ? "..." : item.count.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
