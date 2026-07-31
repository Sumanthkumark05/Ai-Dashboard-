"use client";

import * as React from "react";
import { trafficSourcesData } from "../mock/analytics-mock-data";
import { TrafficSource } from "../types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/feedback/progress";

export function TrafficSourcesCard() {
  return (
    <Card className="p-5 h-full">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">Traffic Channels & Sources</h4>
        <p className="text-xs text-muted-foreground">Inbound acquisition distribution</p>
      </div>

      <div className="space-y-4">
        {trafficSourcesData.map((item: TrafficSource, index: number) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{item.source}</span>
              <span className="text-muted-foreground font-mono">
                {item.percentage}% ({item.users.toLocaleString()} users)
              </span>
            </div>
            <Progress value={item.percentage} className="h-2" />
          </div>
        ))}
      </div>
    </Card>
  );
}
