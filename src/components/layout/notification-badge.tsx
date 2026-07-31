"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { toast } from "@/components/feedback/toast";

export function NotificationBadge() {
  const [unreadCount] = React.useState(3);

  return (
    <button
      type="button"
      onClick={() =>
        toast.info("Notifications", {
          description: `You have ${unreadCount} unread system notifications.`,
        })
      }
      aria-label={`Notifications (${unreadCount} unread)`}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
    >
      <Bell className="h-4 w-4 shrink-0" />
      {unreadCount > 0 && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      )}
    </button>
  );
}


