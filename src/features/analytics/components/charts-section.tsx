"use client";

import * as React from "react";
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
  LineChart,
  Line,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { Activity } from "lucide-react";

export function ChartsSection() {
  const [mounted, setMounted] = React.useState(false);
  const { telemetry, isLoading } = useAnalyticsStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const storageDist = telemetry?.charts.storage_distribution || [];
  const categoryDist = telemetry?.charts.category_distribution || [];
  const workspaceActivity = telemetry?.charts.workspace_activity || [];

  const hasStorageData = storageDist.some((item) => item.size_bytes > 0 || item.count > 0);
  const hasCategoryData = categoryDist.some((item) => item.count > 0 || item.size_bytes > 0);

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Storage Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="p-5 h-full flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">Storage Distribution by File Type</h4>
              <p className="text-xs text-muted-foreground">Volume breakdown (PDF, DOCX, CSV, Images, ZIP, JSON, Other)</p>
            </div>
            {isLoading ? (
              <div className="h-64 w-full flex items-center justify-center animate-pulse bg-muted/20 rounded-lg" />
            ) : !hasStorageData ? (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center">
                <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No files uploaded in current workspace yet.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={storageDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="size_bytes"
                      nameKey="name"
                    >
                      {storageDist.map((entry, index) => (
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
                      formatter={(val: number, name: string, props: any) => [
                        `${props.payload?.formatted_size || val} (${props.payload?.percentage || 0}%)`,
                        name,
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Bar Chart: Category Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="p-5 h-full flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">Category Distribution</h4>
              <p className="text-xs text-muted-foreground">Total items in Documents, Datasets, Files, and Reports</p>
            </div>
            {isLoading ? (
              <div className="h-64 w-full flex items-center justify-center animate-pulse bg-muted/20 rounded-lg" />
            ) : !hasCategoryData ? (
              <div className="h-64 w-full flex flex-col items-center justify-center text-center">
                <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No telemetry recorded across categories.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: number, name: string, props: any) => [
                        `${val} items (${props.payload?.formatted_size || ""})`,
                        "Total Count",
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" name="Item Count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Line Chart: Workspace Activity Over Time */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card className="p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-foreground">Workspace Activity Over Time</h4>
            <p className="text-xs text-muted-foreground">Daily throughput for Files, Documents, and Reports</p>
          </div>
          {isLoading ? (
            <div className="h-64 w-full flex items-center justify-center animate-pulse bg-muted/20 rounded-lg" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={workspaceActivity} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="files" name="Files Uploaded" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="documents" name="Documents Uploaded" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="reports" name="Reports Submitted" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
