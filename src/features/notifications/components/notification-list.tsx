"use client";

import * as React from "react";
import { NotificationItem as NotificationItemType } from "../types";
import { NotificationItem } from "./notification-item";

export interface NotificationListProps {
  notifications: NotificationItemType[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const groups: NotificationItemType["group"][] = ["Today", "Yesterday", "This Week", "Earlier"];

  return (
    <div className="space-y-6">
      {groups.map((groupName) => {
        const groupItems = notifications.filter((n) => n.group === groupName);
        if (groupItems.length === 0) return null;

        return (
          <div key={groupName} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {groupName}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              {groupItems.map((item) => (
                <NotificationItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
