"use client";

import * as React from "react";
import { useSettingsStore as useLocalSettingsStore } from "@/stores/settings-store";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/forms/switch";
import { Label } from "@/components/forms/label";
import { toast } from "@/components/feedback/toast";

export function NotificationSettings() {
  const { notifications, updateNotifications } = useLocalSettingsStore();

  const toggleItems: { key: keyof typeof notifications; label: string; description: string }[] = [
    { key: "emailNotifications", label: "Email Notifications Digest", description: "Receive daily summary email reports" },
    { key: "desktopNotifications", label: "Desktop Push Notifications", description: "Show browser push notifications for mentions & alerts" },
    { key: "aiUpdates", label: "AI Engine Telemetry Updates", description: "Alerts when token throughput or memory thresholds exceed limits" },
    { key: "workspaceActivity", label: "Workspace Document Activity", description: "Notifications when team members update shared notes" },
    { key: "teamActivity", label: "Team Member Joins & Roles", description: "Updates when new members join or roles are changed" },
    { key: "calendarReminders", label: "Calendar Event Reminders", description: "Reminders 15 minutes before scheduled meetings" },
    { key: "securityAlerts", label: "Security & Login Alerts", description: "Instant notification for new session logins" },
    { key: "marketingEmails", label: "Platform Feature Announcements", description: "Monthly newsletter highlighting new AI capabilities" },
  ];

  return (
    <Card className="p-6 space-y-6 select-none">
      <div className="border-b border-border pb-4">
        <h3 className="text-base font-bold text-foreground">Notification Preferences</h3>
        <p className="text-xs text-muted-foreground">Manage push notification channels and email digest frequencies</p>
      </div>

      <div className="space-y-4">
        {toggleItems.map((item, idx) => (
          <div key={item.key} className={`flex items-center justify-between ${idx > 0 ? "pt-3 border-t border-border" : ""}`}>
            <div>
              <Label className="font-semibold text-xs">{item.label}</Label>
              <p className="text-[11px] text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={!!notifications[item.key]}
              onCheckedChange={(checked) => {
                updateNotifications({ [item.key]: checked });
                toast.info(`${item.label} ${checked ? "enabled" : "disabled"}`);
              }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
