"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Bot, FileText, HardDrive, BookOpen, ArrowUpRight, LucideIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { kpiMetricsData } from "../mock/analytics-mock-data";
import { KPIMetric } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  Bot,
  FileText,
  HardDrive,
  BookOpen,
};

export function KPICards() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {kpiMetricsData.map((kpi: KPIMetric, index: number) => {
        const IconComponent = iconMap[kpi.iconName] || Users;

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
          >
            <Card className="p-4 flex flex-col justify-between hover:border-primary/40 transition-all select-none h-full">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-2xl font-extrabold tracking-tight text-foreground">{kpi.value}</span>
                  <Badge variant="success" size="sm" className="gap-0.5 text-[10px]">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>{kpi.change}</span>
                  </Badge>
                </div>
              </div>

              {/* Mini Sparkline Chart */}
              {mounted && (
                <div className="h-10 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpi.sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
