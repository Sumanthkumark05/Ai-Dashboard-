"use client";

import * as React from "react";
import { Calendar, Clock, Code, TrendingUp, LucideIcon } from "lucide-react";
import { summaryHighlightsData } from "../mock/analytics-mock-data";
import { SummaryHighlight } from "../types";
import { Card } from "@/components/ui/card";

const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Clock,
  Code,
  TrendingUp,
};

export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
      {summaryHighlightsData.map((item: SummaryHighlight, index: number) => {
        const IconComponent = iconMap[item.iconName] || TrendingUp;

        return (
          <Card key={index} className="p-4 flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground">{item.title}</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
                <IconComponent className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div>
              <span className="text-lg font-extrabold text-foreground">{item.value}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
