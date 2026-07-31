"use client";

import * as React from "react";
import { WelcomeBanner } from "@/features/dashboard/components/welcome-banner";
import { StatCards } from "@/features/dashboard/components/stat-cards";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { AIInsightsCard } from "@/features/dashboard/components/ai-insights-card";
import { AnalyticsCharts } from "@/features/dashboard/components/analytics-charts";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { RecentFiles } from "@/features/dashboard/components/recent-files";
import { WorkspaceOverview } from "@/features/dashboard/components/workspace-overview";
import { StorageUsageCard } from "@/features/dashboard/components/storage-usage-card";
import { TeamSnapshot } from "@/features/dashboard/components/team-snapshot";
import { AnnouncementsCard } from "@/features/dashboard/components/announcements-card";

export default function DashboardHomePage() {
  return (
    <div className="space-y-8 pb-12">
      {/* SECTION 1: Welcome Banner */}
      <WelcomeBanner />

      {/* SECTION 2: Statistics Cards */}
      <StatCards />

      {/* SECTION 3: Quick Actions */}
      <QuickActions />

      {/* SECTION 4 & 5: AI Insights & Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <AIInsightsCard />
        </div>
      </div>

      <AnalyticsCharts />

      {/* SECTION 6 & 8: Activity & Workspace Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <WorkspaceOverview />
      </div>

      {/* SECTION 7: Recent Files */}
      <RecentFiles />

      {/* SECTION 9, 10 & 11: Storage, Team Snapshot & Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StorageUsageCard />
        <TeamSnapshot />
        <AnnouncementsCard />
      </div>
    </div>
  );
}
