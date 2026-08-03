"use client";

import * as React from "react";
import Link from "next/link";
import { HardDrive, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/feedback/progress";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { formatBytes, formatStoragePercentage } from "@/lib/utils";

export function StorageUsageCard() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { summary, fetchSummary } = useDashboardStore();

  React.useEffect(() => {
    fetchSummary(currentWorkspace?.id);
  }, [fetchSummary, currentWorkspace?.id]);

  const usedBytes = summary?.storageUsedBytes ?? 0;
  const capacityBytes = summary?.capacityBytes ?? 10 * 1024 * 1024 * 1024;
  const remainingBytes = summary?.storageRemainingBytes ?? Math.max(0, capacityBytes - usedBytes);

  const percentage = capacityBytes > 0 ? Math.min(100, (usedBytes / capacityBytes) * 100) : 0;

  // Visual minimum: 0.15% floor ensures progress bar is visible when usage exists
  const progressBarValue = usedBytes > 0 ? Math.max(0.15, percentage) : 0;

  const usedFormatted = summary?.storageUsedFormatted || formatBytes(usedBytes);
  const capacityFormatted = summary?.capacityFormatted || formatBytes(capacityBytes);
  const remainingFormatted = summary?.storageRemainingFormatted || formatBytes(remainingBytes);

  return (
    <Card className="p-4 h-full flex flex-col justify-between select-none">
      <Link href="/dashboard/files" className="group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Workspace Storage Capacity</h4>
                <p className="text-[11px] text-muted-foreground">Aggregated files, docs, & datasets</p>
              </div>
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              {usedFormatted} / {capacityFormatted}
            </span>
          </div>

          <Progress value={progressBarValue} className="h-2 mb-3" />

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <span>{formatStoragePercentage(percentage)} Capacity Used</span>
            <span className="font-semibold text-foreground">{remainingFormatted} Remaining</span>
          </div>
        </div>
      </Link>

      <Link href="/dashboard/settings">
        <Button
          variant="outline"
          size="xs"
          className="w-full justify-between"
          rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
        >
          <span>Manage Storage Tier</span>
        </Button>
      </Link>
    </Card>
  );
}
