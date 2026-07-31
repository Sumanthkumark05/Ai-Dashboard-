"use client";

import * as React from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { SettingsSidebar } from "@/features/settings/components/settings-sidebar";
import { ProfileSettings } from "@/features/settings/components/profile-settings";
import { AccountSettings } from "@/features/settings/components/account-settings";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { WorkspaceSettings } from "@/features/settings/components/workspace-settings";
import { SecuritySettings } from "@/features/settings/components/security-settings";
import { AccessibilitySettings } from "@/features/settings/components/accessibility-settings";
import { AboutSection } from "@/features/settings/components/about-section";
import { ResetDialog } from "@/features/settings/components/reset-dialog";
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton";

export default function SettingsPage() {
  const { activeSection, isDirty, isLoading } = useSettingsStore();

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSettings />;
      case "account":
        return <AccountSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "workspace":
        return <WorkspaceSettings />;
      case "security":
        return <SecuritySettings />;
      case "accessibility":
        return <AccessibilitySettings />;
      case "about":
        return <AboutSection />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Sticky Unsaved Changes Alert Indicator */}
      {isDirty && (
        <div className="sticky top-16 z-30 flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/10 backdrop-blur-md shadow-xs select-none">
          <span className="text-xs font-semibold text-primary">
            You have unsaved settings changes. Changes are persisted automatically to local storage.
          </span>
        </div>
      )}

      {/* Main Settings Grid */}
      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-3 border-r border-border min-h-[500px]">
            <SettingsSidebar />
          </div>

          {/* Right Main Content Pane */}
          <div className="lg:col-span-9 p-6">
            {renderSection()}
          </div>
        </div>
      )}

      {/* Confirmation Reset Preferences Modal */}
      <ResetDialog />
    </div>
  );
}
