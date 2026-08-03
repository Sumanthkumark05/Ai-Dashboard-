"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const deviceData = [
  { device: "Desktop Web", percentage: 80, color: "#3b82f6" },
  { device: "Mobile Browser", percentage: 15, color: "#10b981" },
  { device: "API Client", percentage: 5, color: "#8b5cf6" },
];

export function DeviceAnalytics() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-foreground">Device Platform Analytics</h4>
          <p className="text-xs text-muted-foreground">Operating environment distribution</p>
        </div>

        {mounted && (
          <div className="h-44 w-full flex items-center justify-center mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="percentage"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {deviceData.map((d, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-foreground font-medium">{d.device}</span>
            </div>
            <Badge variant="outline" size="sm" className="font-mono">
              {d.percentage}%
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
