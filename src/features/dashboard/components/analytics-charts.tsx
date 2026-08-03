"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "./section-header";
import { dashboardApi } from "@/services/dashboard-api";
import { Activity, ArrowRight } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface StorageCategoryItem {
  name: string;
  value: number;
  color: string;
}

const COLORS = ["#2563eb", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#64748b"];

export function AnalyticsCharts() {
  const [mounted, setMounted] = React.useState(false);
  const [storageDist, setStorageDist] = React.useState<StorageCategoryItem[]>([]);
  const [fileCategories, setFileCategories] = React.useState<Array<{ category: string; count: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const analytics = await dashboardApi.getFilesAnalytics();
        if (cancelled) return;

        if (analytics?.by_type) {
          const dist: StorageCategoryItem[] = [];
          const catList: Array<{ category: string; count: number }> = [];
          let idx = 0;

          Object.entries(analytics.by_type).forEach(([type, data]) => {
            dist.push({
              name: type.toUpperCase(),
              value: data.size_bytes || 0,
              color: COLORS[idx % COLORS.length],
            });
            catList.push({
              category: type,
              count: data.count || 0,
            });
            idx++;
          });

          setStorageDist(dist);
          setFileCategories(catList);
        }
      } catch {
        if (!cancelled) {
          setStorageDist([]);
          setFileCategories([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted) return null;

  const hasData = storageDist.length > 0 || fileCategories.length > 0;

  return (
    <div className="space-y-4 select-none">
      <SectionHeader
        title="Analytics & Data Telemetry"
        description="Real-time storage volume distribution and asset category metrics"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie Chart: Storage Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-2"
        >
          <Link href="/dashboard/files">
            <Card className="p-4 h-full flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Storage Volume Distribution
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-foreground font-semibold mt-0.5">Bytes stored by MIME type category</p>
                </div>
                <span className="text-[10px] text-primary font-medium hover:underline">View Files →</span>
              </div>
              {isLoading ? (
                <div className="h-60 w-full flex items-center justify-center rounded-lg bg-muted/40 skeleton" />
              ) : !hasData ? (
                <div className="h-60 w-full flex flex-col items-center justify-center text-center">
                  <Activity className="h-7 w-7 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">No storage telemetry available</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Upload files to view volume distribution.</p>
                </div>
              ) : (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {storageDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "10px",
                          fontSize: "11px",
                          boxShadow: "var(--shadow-md)",
                        }}
                        formatter={(val: number) => [formatBytes(val), "Size"]}
                      />
                      <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Link>
        </motion.div>

        {/* Bar Chart: File Categories Count */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Link href="/dashboard/analytics">
            <Card className="p-4 h-full flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Asset Count
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-foreground font-semibold mt-0.5">Files by category</p>
                </div>
                <span className="text-[10px] text-primary font-medium hover:underline">Analytics →</span>
              </div>
              {isLoading ? (
                <div className="h-60 w-full flex items-center justify-center rounded-lg bg-muted/40 skeleton" />
              ) : !hasData ? (
                <div className="h-60 w-full flex flex-col items-center justify-center text-center">
                  <Activity className="h-7 w-7 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">No asset count telemetry</p>
                </div>
              ) : (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fileCategories} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#888888" tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="#888888" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "10px",
                          fontSize: "11px",
                          boxShadow: "var(--shadow-md)",
                        }}
                      />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="File Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
