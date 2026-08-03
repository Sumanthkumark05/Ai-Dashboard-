"use client";

import * as React from "react";
import { HardDrive, Database, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/feedback/progress";
import { useDocumentStore } from "@/stores/document-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { formatBytes, formatStoragePercentage } from "@/lib/utils";

export function DocumentStorageSummary() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { documents, storageStats, fetchStorageStats } = useDocumentStore();

  React.useEffect(() => {
    fetchStorageStats(currentWorkspace?.id);
  }, [fetchStorageStats, currentWorkspace?.id]);

  // Real backend bytes or sum of loaded documents as fallback
  const fallbackBytes = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
  const usedBytes = storageStats?.totalUsedBytes ?? fallbackBytes;
  const totalDocs = storageStats?.totalDocuments ?? documents.length;

  const capacityBytes = storageStats?.capacityBytes ?? 10 * 1024 * 1024 * 1024; // 10 GB default capacity
  const remainingBytes = storageStats?.remainingBytes ?? Math.max(0, capacityBytes - usedBytes);
  const rawPercentage = storageStats?.usagePercentage ?? (capacityBytes > 0 ? (usedBytes / capacityBytes) * 100 : 0);

  const usedFormatted = storageStats?.usedFormatted || formatBytes(usedBytes);
  const capacityFormatted = storageStats?.capacityFormatted || formatBytes(capacityBytes);
  const remainingFormatted = storageStats?.remainingFormatted || formatBytes(remainingBytes);

  // Visual minimum floor (0.15%) for progress bar when real usage exists
  const progressBarValue = usedBytes > 0 ? Math.max(0.15, rawPercentage) : 0;

  return (
    <Card className="p-4 bg-gradient-to-r from-card via-card to-primary/5 border-primary/20 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Knowledge Base Storage Capacity
            </h4>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{usedFormatted}</span> used across{" "}
              <span className="font-semibold text-foreground">{totalDocs}</span> total documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <span>{capacityFormatted} Capacity Limit</span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressBarValue} className="h-2 mb-2 transition-all duration-500" />

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatStoragePercentage(rawPercentage)} used</span>
        <span>
          <span className="font-semibold text-foreground">{remainingFormatted}</span> Remaining •{" "}
          <span className="font-semibold text-foreground">{totalDocs} Documents Stored</span>
        </span>
      </div>
    </Card>
  );
}
