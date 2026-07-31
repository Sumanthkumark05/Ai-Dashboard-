"use client";

import * as React from "react";
import { CheckCheck, Settings } from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function NotificationHeader() {
  const { markAllAsRead } = useNotificationStore();

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All marked as read", {
      description: "Cleared unread notification indicators.",
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 select-none">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Notification Inbox & Activity Stream
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          Stay informed on AI engine telemetry, team mentions, document uploads, and security events.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<CheckCheck className="h-4 w-4 text-primary" />}
          onClick={handleMarkAllRead}
        >
          Mark All as Read
        </Button>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Settings className="h-4 w-4" />}
          onClick={() =>
            toast.info("Notification Settings", {
              description: "Notification preferences modal preview.",
            })
          }
        >
          Settings
        </Button>
      </div>
    </div>
  );
}
