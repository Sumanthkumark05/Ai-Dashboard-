"use client";

import * as React from "react";
import { FileText, CheckSquare, Calendar, BookOpen, LucideIcon } from "lucide-react";
import { workspaceOverviewData } from "../mock/dashboard-mock-data";
import { WorkspaceMetric } from "../types";
import { Card } from "@/components/ui/card";

const iconMap: Record<string, LucideIcon> = {
  FileText,
  CheckSquare,
  Calendar,
  BookOpen,
};

export function WorkspaceOverview() {
  return (
    <Card className="p-5 h-full">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">Workspace Overview</h4>
        <p className="text-xs text-muted-foreground">Active documentation and task metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {workspaceOverviewData.map((item: WorkspaceMetric, index: number) => {
          const IconComponent = iconMap[item.iconName] || FileText;

          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-muted/30 p-3.5 flex flex-col justify-between hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{item.title}</span>
                <IconComponent className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">{item.count}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.change}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
