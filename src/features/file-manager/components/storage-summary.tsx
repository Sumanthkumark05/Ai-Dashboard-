"use client";

import * as React from "react";
import { HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/feedback/progress";
import { useFileStore } from "@/stores/file-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { formatBytes, formatStoragePercentage } from "@/lib/utils";

export function StorageSummary() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { storageStats, fetchStorageStats } = useFileStore();

  React.useEffect(() => {
    fetchStorageStats(currentWorkspace?.id);
  }, [fetchStorageStats, currentWorkspace?.id]);

  const usedBytes = storageStats?.usedBytes ?? 0;
  const totalFiles = storageStats?.totalFiles ?? 0;
  const capacityMB = storageStats?.capacityMB ?? 10240;
  const capacityBytes = capacityMB * 1024 * 1024;
  const remainingBytes = Math.max(0, capacityBytes - usedBytes);

  // Real percentage in 0–100 range, full floating-point precision from backend
  const percentage = Math.min(
    100,
    storageStats?.percentageUsed ?? (usedBytes / capacityBytes) * 100
  );

  // Visual minimum: render a tiny sliver (0.15%) when there is real data so the
  // bar is not completely invisible. The text label always shows the real value.
  const progressBarValue = usedBytes > 0 ? Math.max(0.15, percentage) : 0;

  const usedFormatted = storageStats?.usedFormatted || formatBytes(usedBytes);
  const capacityFormatted = storageStats?.capacityFormatted || formatBytes(capacityBytes);
  const remainingFormatted = storageStats?.remainingFormatted || formatBytes(remainingBytes);

  return (
    <Card className="p-5 mb-6 bg-gradient-to-r from-card via-card to-primary/5 border-primary/20 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Workspace Storage Capacity</h4>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{usedFormatted}</span> used across{" "}
              <span className="font-semibold text-foreground">{totalFiles}</span> total files
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-foreground">
          <span>{capacityFormatted} Capacity Limit</span>
        </div>
      </div>

      <Progress value={progressBarValue} className="h-2 mb-2 transition-all duration-500" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatStoragePercentage(percentage)} used</span>
        <span>
          <span className="font-semibold text-foreground">{remainingFormatted}</span> Remaining •{" "}
          <span className="font-semibold text-foreground">{totalFiles} Files Stored</span>
        </span>
      </div>
    </Card>
  );
}
