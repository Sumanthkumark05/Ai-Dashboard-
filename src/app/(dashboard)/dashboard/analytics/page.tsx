"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { AnalyticsHeader } from "@/features/analytics/components/analytics-header";
import { FilterBar } from "@/features/analytics/components/filter-bar";
import { SummaryCards } from "@/features/analytics/components/summary-cards";
import { KPICards } from "@/features/analytics/components/kpi-cards";
import { ChartsSection } from "@/features/analytics/components/charts-section";
import { TrafficSourcesCard } from "@/features/analytics/components/traffic-sources-card";
import { DeviceAnalytics } from "@/features/analytics/components/device-analytics";
import { GeoAnalytics } from "@/features/analytics/components/geo-analytics";
import { AIUsageAnalytics } from "@/features/analytics/components/ai-usage-analytics";
import { InsightsPanel } from "@/features/analytics/components/insights-panel";
import { ActivityTable } from "@/features/analytics/components/activity-table";
import { ExportDialog } from "@/features/analytics/components/export-dialog";
import { AnalyticsSkeleton } from "@/features/analytics/components/analytics-skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnalyticsDashboardPage() {
  const { isLoading, isRefreshing, error, fetchTelemetry, triggerRefresh } = useAnalyticsStore();

  React.useEffect(() => {
    fetchTelemetry();

    const handleDataChange = () => {
      fetchTelemetry();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("neurodesk:data_changed", handleDataChange);
      window.addEventListener("neurodesk:workspace_changed", handleDataChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("neurodesk:data_changed", handleDataChange);
        window.removeEventListener("neurodesk:workspace_changed", handleDataChange);
      }
    };
  }, [fetchTelemetry]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <AnalyticsHeader />

      {/* Filter Bar Controls */}
      <FilterBar />

      {error ? (
        <Card className="p-6 bg-destructive/10 border-destructive/20 text-destructive flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
          <div>
            <h3 className="text-base font-bold">Unable to load analytics.</h3>
            <p className="text-xs text-destructive/80 mt-1">
              Could not establish connection to database or system telemetry endpoint.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerRefresh}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 mt-2"
          >
            Retry Connection
          </Button>
        </Card>
      ) : isLoading || isRefreshing ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* Executive Summary Highlights Grid */}
          <SummaryCards />

          {/* KPI Sparkline Metric Cards */}
          <KPICards />

          {/* Main Visual Recharts Section */}
          <ChartsSection />

          {/* AI Usage & Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIUsageAnalytics />
            <InsightsPanel />
          </div>

          {/* Traffic, Devices & Geography Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrafficSourcesCard />
            <DeviceAnalytics />
            <GeoAnalytics />
          </div>

          {/* Activity Logs Table */}
          <ActivityTable />
        </>
      )}

      {/* Export Report Modal */}
      <ExportDialog />
    </div>
  );
}
