"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InsightsPanel() {
  const insights = [
    {
      id: "ins_1",
      title: "Real-time Telemetry Active",
      impact: "Optimal",
      description: "Database connection and FastAPI middleware monitoring active system traffic.",
    },
    {
      id: "ins_2",
      title: "Storage Analytics Synced",
      impact: "Synced",
      description: "Asset distribution and upload metadata calculated live from PostgreSQL tables.",
    },
    {
      id: "ins_3",
      title: "Audit Log Tracking",
      impact: "Security High",
      description: "All endpoint calls automatically record request IDs and client telemetry.",
    },
  ];

  return (
    <Card className="p-5 h-full border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">AI System Insights</h4>
          <p className="text-xs text-muted-foreground">Automated platform recommendations</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-muted/20 p-3 hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-foreground">{item.title}</span>
              <Badge variant="success" size="sm" className="text-[10px] font-mono">
                {item.impact}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
