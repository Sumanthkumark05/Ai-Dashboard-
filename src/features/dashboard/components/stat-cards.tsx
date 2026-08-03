"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderOpen, FileText, Database, HardDrive, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";

function StatCardSkeleton() {
  return (
    <Card className="p-4 h-full flex flex-col justify-between select-none">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-muted rounded w-20 skeleton" />
        <div className="h-8 w-8 rounded-lg bg-muted skeleton" />
      </div>
      <div className="my-2 h-7 bg-muted rounded w-16 skeleton" />
      <div className="h-3 bg-muted rounded w-28 skeleton" />
    </Card>
  );
}

export function StatCards() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { summary, isLoading, error, fetchSummary } = useDashboardStore();

  React.useEffect(() => {
    fetchSummary(currentWorkspace?.id);
  }, [fetchSummary, currentWorkspace?.id]);

  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && !summary) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20 text-destructive flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load dashboard metrics: {error}</span>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={() => fetchSummary(currentWorkspace?.id)}
          className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1 shrink-0"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </Button>
      </Card>
    );
  }

  const statItems = [
    {
      id: "workspaces",
      title: "Workspaces",
      value: (summary?.workspaces ?? 0).toLocaleString(),
      description: "Active workspaces",
      icon: FolderOpen,
      bgTint: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      href: "/dashboard/workspace-manager",
    },
    {
      id: "files",
      title: "Files",
      value: (summary?.files ?? 0).toLocaleString(),
      description: "Uploaded assets",
      icon: FileText,
      bgTint: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/50 dark:border-purple-900/50",
      iconColor: "text-purple-600 dark:text-purple-400",
      href: "/dashboard/files",
    },
    {
      id: "datasets",
      title: "Datasets",
      value: (summary?.datasets ?? 0).toLocaleString(),
      description: "Knowledge datasets",
      icon: Database,
      bgTint: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      href: "/dashboard/datasets",
    },
    {
      id: "storage",
      title: "Storage Used",
      value: summary?.storageUsedFormatted ?? "0 B",
      description: "Total workspace storage",
      icon: HardDrive,
      bgTint: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      href: "/dashboard/files",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {statItems.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            whileHover={{ y: -2 }}
          >
            <Link href={stat.href}>
              <Card className="p-4 h-full flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
                    {stat.title}
                  </span>
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors group-hover:border-primary/40", stat.bgTint)}>
                    <IconComponent className={cn("h-4 w-4 shrink-0", stat.iconColor)} />
                  </div>
                </div>

                <div className="my-2">
                  <span className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {stat.value}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                  <Badge variant="success" size="xs" className="gap-1">
                    <TrendingUp className="h-3 w-3 shrink-0" />
                    <span>Live</span>
                  </Badge>
                  <span className="text-muted-foreground text-[11px] truncate">{stat.description}</span>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
