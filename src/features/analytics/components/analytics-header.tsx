"use client";

import * as React from "react";
import { RefreshCw, Download, Calendar } from "lucide-react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { DateRangeOption } from "../types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { toast } from "@/components/feedback/toast";

export function AnalyticsHeader() {
  const { dateRange, setDateRange, isRefreshing, triggerRefresh, openExportDialog } = useAnalyticsStore();

  const handleRefresh = () => {
    triggerRefresh();
    toast.success("Analytics refreshed", { description: "Updated real-time telemetry metrics." });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 select-none">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Analytics & Data Telemetry
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          Monitor user engagement, AI model requests, storage distribution, and active system throughput.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
        {/* Date Range Selector */}
        <Select value={dateRange} onValueChange={(val) => setDateRange(val as DateRangeOption)}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <Calendar className="mr-2 h-3.5 w-3.5 text-primary" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Past Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>

        {/* Export Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={openExportDialog}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export Report
        </Button>
      </div>
    </div>
  );
}
