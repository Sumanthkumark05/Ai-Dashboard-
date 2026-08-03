"use client";

import * as React from "react";
import { FolderOpen, FileText, Database, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { useDashboardStore } from "@/stores/dashboard-store";

export function SummaryCards() {
  const { telemetry, isLoading: isAnalyticsLoading } = useAnalyticsStore();
  const { summary, fetchSummary } = useDashboardStore();

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Synchronized values between telemetry and dashboard summary
  const totalWorkspaces = telemetry?.workspaces.total ?? summary?.workspaces ?? 0;
  const totalFiles = telemetry?.files.total ?? summary?.files ?? 0;
  const totalDatasets = telemetry?.datasets.total ?? summary?.datasets ?? 0;
  const storageUsedFormatted = telemetry?.storage.used_formatted ?? summary?.storageUsedFormatted ?? "0 B";
  const percentageUsed = telemetry?.storage.percentage_used ?? 0;

  const metrics = [
    {
      title: "Workspaces",
      value: String(totalWorkspaces),
      subtitle: `${telemetry?.workspaces.active ?? totalWorkspaces} Active spaces`,
      icon: FolderOpen,
    },
    {
      title: "Files Stored",
      value: String(totalFiles),
      subtitle: `${telemetry?.files.today ?? 0} Uploaded today`,
      icon: FileText,
    },
    {
      title: "Datasets",
      value: String(totalDatasets),
      subtitle: `${telemetry?.datasets.indexed ?? totalDatasets} Indexed sets`,
      icon: Database,
    },
    {
      title: "Storage Used",
      value: storageUsedFormatted,
      subtitle: totalFiles > 0 ? `${percentageUsed}% of capacity used` : "No files stored",
      icon: HardDrive,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
      {metrics.map((item, index) => {
        const IconComponent = item.icon;

        return (
          <Card key={index} className="p-4 flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground">{item.title}</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
                <IconComponent className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div>
              <span className="text-lg font-extrabold text-foreground">
                {isAnalyticsLoading && !telemetry && !summary ? "..." : item.value}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
