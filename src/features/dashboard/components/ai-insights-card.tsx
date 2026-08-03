"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";

export function AIInsightsCard() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { summary, fetchSummary } = useDashboardStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    fetchSummary(currentWorkspace?.id);
  }, [fetchSummary, currentWorkspace?.id]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRefreshing(true);
    await fetchSummary(currentWorkspace?.id);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("AI Intelligence Refreshed", {
        description: "Re-analyzed workspace telemetry from real backend database.",
      });
    }, 300);
  };

  const wsCount = summary?.workspaces ?? 0;
  const filesCount = summary?.files ?? 0;
  const docsCount = summary?.documents ?? 0;
  const datasetsCount = summary?.datasets ?? 0;
  const storageUsed = summary?.storageUsedFormatted ?? "0 B";

  const intelSummary = summary?.intelligenceSummary || "System telemetry and workspace monitoring active.";

  const highlights = [
    `${wsCount} active workspace${wsCount !== 1 ? "s" : ""} configured in organization.`,
    `${filesCount} file${filesCount !== 1 ? "s" : ""} and ${docsCount} document${docsCount !== 1 ? "s" : ""} indexed.`,
    `${datasetsCount} knowledge dataset${datasetsCount !== 1 ? "s" : ""} active (${storageUsed} storage).`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link href="/dashboard/analytics">
        <Card className="relative overflow-hidden p-4 sm:p-5 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs select-none hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
          {/* Top Header */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  Today&apos;s Intelligence Summary
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-[11px] text-muted-foreground">Generated from live database telemetry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="xs" className="font-semibold">
                Live Telemetry
              </Badge>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Refresh AI insights"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Highlight Summary Box */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 mb-3 group-hover:border-primary/30 transition-colors">
            <p className="text-xs font-semibold text-foreground leading-relaxed">
              &ldquo;{intelSummary}&rdquo;
            </p>
          </div>

          {/* Insights Bullets */}
          <div className="space-y-1.5">
            {highlights.map((highlight: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                <span className="leading-normal">{highlight}</span>
              </div>
            ))}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
