"use client";

import * as React from "react";
import { geoLocationsData } from "../mock/analytics-mock-data";
import { GeoLocation } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/feedback/progress";

export function GeoAnalytics() {
  return (
    <Card className="p-5 h-full">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">Geographic Active Distribution</h4>
        <p className="text-xs text-muted-foreground">Top user regions by country volume</p>
      </div>

      <div className="space-y-3.5">
        {geoLocationsData.map((item: GeoLocation, index: number) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm" className="font-mono text-[10px] uppercase w-7 justify-center">
                  {item.code}
                </Badge>
                <span className="font-semibold text-foreground">{item.country}</span>
              </div>
              <span className="text-muted-foreground font-mono">
                {item.users.toLocaleString()} users ({item.percentage}%)
              </span>
            </div>
            <Progress value={item.percentage * 2} className="h-1.5" />
          </div>
        ))}
      </div>
    </Card>
  );
}
