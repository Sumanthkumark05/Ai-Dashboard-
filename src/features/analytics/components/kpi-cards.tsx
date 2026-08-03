"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FolderOpen, FileText, Database, HardDrive, Cpu, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { useDashboardStore } from "@/stores/dashboard-store";

export function KPICards() {
  const { telemetry, isLoading } = useAnalyticsStore();
  const { summary } = useDashboardStore();

  const ws = telemetry?.workspaces;
  const files = telemetry?.files;
  const docs = telemetry?.documents;
  const ds = telemetry?.datasets;
  const storage = telemetry?.storage;
  const jobs = telemetry?.jobs;

  // Storage computation safely formatted
  const storageUsed = storage?.used_formatted ?? summary?.storageUsedFormatted ?? "0 B";
  const storageRemaining = storage?.remaining_formatted ?? summary?.storageRemainingFormatted ?? "10 GB";
  const storageCapacity = storage?.capacity_formatted ?? summary?.capacityFormatted ?? "10 GB";
  const storagePercent = storage?.percentage_used ?? 0;
  const avgFileSize = storage?.avg_file_size_formatted ?? "0 B";

  // Jobs display formatting
  let jobsDisplay = "No background jobs running.";
  let jobsSubtext = "Queue empty";
  if (jobs && jobs.total > 0) {
    jobsDisplay = `${jobs.running} Running / ${jobs.completed} Done`;
    jobsSubtext = jobs.failed > 0 ? `${jobs.failed} Failed` : "All systems operational";
  } else if (jobs?.message) {
    jobsDisplay = jobs.message;
  }

  const kpis = [
    {
      id: "ws",
      title: "Workspaces Overview",
      value: String(ws?.total ?? summary?.workspaces ?? 0),
      subtitle: `${ws?.active ?? 0} Active • ${ws?.archived ?? 0} Archived`,
      badge: `${ws?.growth_percentage ?? 0}% Growth`,
      icon: FolderOpen,
    },
    {
      id: "files",
      title: "Files Uploaded",
      value: String(files?.total ?? summary?.files ?? 0),
      subtitle: `Today: ${files?.today ?? 0} • Week: ${files?.this_week ?? 0} • Month: ${files?.this_month ?? 0}`,
      badge: "Live Telemetry",
      icon: FileText,
    },
    {
      id: "docs",
      title: "Knowledge Documents",
      value: String(docs?.total ?? summary?.documents ?? 0),
      subtitle: `Indexed: ${docs?.indexed ?? 0} • Pending: ${docs?.pending ?? 0} • Failed: ${docs?.failed ?? 0}`,
      badge: "Synced",
      icon: FileText,
    },
    {
      id: "ds",
      title: "Datasets & Sets",
      value: String(ds?.total ?? summary?.datasets ?? 0),
      subtitle: `Files: ${ds?.files_count ?? 0} • Storage: ${ds?.storage_formatted ?? "0 B"}`,
      badge: `${ds?.indexed ?? 0} Ready`,
      icon: Database,
    },
    {
      id: "storage",
      title: "Storage Utilization",
      value: storageUsed,
      subtitle: (files?.total ?? 0) > 0 
        ? `Rem: ${storageRemaining} of ${storageCapacity} (${storagePercent}%) • Avg: ${avgFileSize}`
        : `Capacity: ${storageCapacity} • 0% Used`,
      badge: (files?.total ?? 0) > 0 ? `${storagePercent}% Used` : "Empty",
      icon: HardDrive,
    },
    {
      id: "jobs",
      title: "Background Jobs",
      value: jobsDisplay,
      subtitle: jobsSubtext,
      badge: (jobs?.running ?? 0) > 0 ? `${jobs?.running} Active` : "Idle",
      icon: Cpu,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
          >
            <Card className="p-4 flex flex-col justify-between hover:border-primary/40 transition-all select-none h-full">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground block truncate">
                    {isLoading && !telemetry ? "..." : kpi.value}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                  <span className="text-muted-foreground text-[11px] truncate mr-1">
                    {kpi.subtitle}
                  </span>
                  <Badge variant="success" size="sm" className="gap-0.5 text-[10px] shrink-0">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>{kpi.badge}</span>
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
