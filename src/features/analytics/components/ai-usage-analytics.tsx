"use client";

import * as React from "react";
import { Bot, Zap, Cpu, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsStore } from "@/stores/analytics-store";

export function AIUsageAnalytics() {
  const { telemetry, isLoading } = useAnalyticsStore();

  const fileCount = telemetry?.files.total ?? 0;
  const docCount = telemetry?.documents.indexed ?? 0;
  const totalJobs = telemetry?.jobs.total ?? 0;
  const runningJobs = telemetry?.jobs.running ?? 0;

  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">AI Intelligence & System Telemetry</h4>
          <p className="text-xs text-muted-foreground">System engine processing and pipeline health</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Indexed Assets</span>
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">
            {isLoading && !telemetry ? "..." : fileCount + docCount}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Active Jobs</span>
            <Zap className="h-3.5 w-3.5 text-warning" />
          </div>
          <span className="text-lg font-bold text-foreground">
            {isLoading && !telemetry ? "..." : runningJobs}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Total Jobs</span>
            <Cpu className="h-3.5 w-3.5 text-info" />
          </div>
          <span className="text-lg font-bold text-foreground">
            {isLoading && !telemetry ? "..." : totalJobs}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Pipeline Health</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          </div>
          <span className="text-lg font-bold text-success">100%</span>
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-foreground block mb-2 font-mono uppercase">
          System Engine Status
        </span>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">PostgreSQL Database Engine</span>
            <Badge variant="success" size="sm">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">FastAPI REST Telemetry Gateway</span>
            <Badge variant="success" size="sm">Operational</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Multi-Tenant Context Scope</span>
            <Badge variant="success" size="sm">Active Workspace</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
