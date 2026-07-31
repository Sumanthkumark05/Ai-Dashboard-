"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  dailyActiveUsersData,
  aiRequestsOverTimeData,
  weeklyUsageData,
  storageDistributionData,
  activityVsRequestsData,
} from "../mock/analytics-mock-data";
import { Card } from "@/components/ui/card";

export function ChartsSection() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6 mb-6">
      {/* ROW 1: Daily Active Users (Line) & AI Requests (Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Daily Active Users */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="p-5 h-full">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">Daily Active Users & Sessions</h4>
              <p className="text-xs text-muted-foreground">Unique user sessions tracked across 14-day window</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyActiveUsersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} name="Active Users" />
                  <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} name="Total Sessions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Area Chart: AI Requests Over Time */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="p-5 h-full">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">AI API Requests Over Time</h4>
              <p className="text-xs text-muted-foreground">Volume throughput and token consumption</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aiRequestsOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                    name="Requests"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ROW 2: Bar Chart (Weekly Usage), Pie Chart (Storage), Composed Chart (Activity vs Requests) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Weekly Usage */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="p-5 h-full">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">Weekly Categorized Usage</h4>
              <p className="text-xs text-muted-foreground">Code vs Text vs Vision requests</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="code" fill="#3b82f6" name="Code" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="text" fill="#10b981" name="Text" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Pie Chart: Storage Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="p-5 h-full">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">Storage Asset Distribution</h4>
              <p className="text-xs text-muted-foreground">Asset categories stored on cloud</p>
            </div>
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storageDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {storageDistributionData.map((entry, index) => (
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
                  <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Composed Chart: User Activity vs AI Requests */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="p-5 h-full">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">User Activity vs AI Calls</h4>
              <p className="text-xs text-muted-foreground">Composed bar & trend correlation</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activityVsRequestsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="activeUsers" fill="#3b82f6" opacity={0.7} name="Active Users" />
                  <Line type="monotone" dataKey="aiRequests" stroke="#f59e0b" strokeWidth={2} name="AI Requests" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
