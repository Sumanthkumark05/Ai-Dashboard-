"use client";

import * as React from "react";
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

export default function AnalyticsDashboardPage() {
  const { isRefreshing } = useAnalyticsStore();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <AnalyticsHeader />

      {/* Filter Bar Controls */}
      <FilterBar />

      {isRefreshing ? (
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
