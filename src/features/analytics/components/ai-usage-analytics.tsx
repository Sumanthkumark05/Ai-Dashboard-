"use client";

import * as React from "react";
import { Bot, Zap, Cpu, CheckCircle2 } from "lucide-react";
import { aiUsageStatsData } from "../mock/analytics-mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AIUsageAnalytics() {
  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">AI Intelligence & Token Usage</h4>
          <p className="text-xs text-muted-foreground">Model throughput and execution reliability</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Prompts Sent</span>
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">{aiUsageStatsData.promptsSent.toLocaleString()}</span>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Avg Latency</span>
            <Zap className="h-3.5 w-3.5 text-warning" />
          </div>
          <span className="text-lg font-bold text-foreground">{aiUsageStatsData.avgResponseTimeMs} ms</span>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Tokens Used</span>
            <Cpu className="h-3.5 w-3.5 text-info" />
          </div>
          <span className="text-lg font-bold text-foreground">{aiUsageStatsData.tokensUsedMillions}M</span>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs">Success Rate</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          </div>
          <span className="text-lg font-bold text-success">{aiUsageStatsData.successRatePercent}%</span>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div>
        <span className="text-xs font-semibold text-foreground block mb-2">Top Prompt Categories</span>
        <div className="space-y-2">
          {aiUsageStatsData.topCategories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{cat.category}</span>
              <Badge variant="outline" size="sm" className="font-mono">
                {cat.count.toLocaleString()} calls
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
