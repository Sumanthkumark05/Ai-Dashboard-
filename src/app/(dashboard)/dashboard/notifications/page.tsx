"use client";

import * as React from "react";
import { useNotificationStore } from "@/stores/notification-store";
import { NotificationItem as NotificationItemType } from "@/features/notifications/types";
import { NotificationHeader } from "@/features/notifications/components/notification-header";
import { SummaryCards } from "@/features/notifications/components/summary-cards";
import { NotificationFilters } from "@/features/notifications/components/notification-filters";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { NotificationDetails } from "@/features/notifications/components/notification-details";
import { NotificationEmptyState } from "@/features/notifications/components/notification-empty-state";
import { NotificationSkeleton } from "@/features/notifications/components/notification-skeleton";

export default function NotificationsPage() {
  const {
    notifications,
    searchQuery,
    filter,
    sortBy,
    isLoading,
  } = useNotificationStore();

  // Client-side Filter logic
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((item: NotificationItemType) => {
      if (item.isArchived) return false;

      // Search Query filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.relatedUser && item.relatedUser.toLowerCase().includes(query));

      // Category & Status filter
      let matchesFilter = true;
      if (filter === "unread") matchesFilter = !item.isRead;
      if (filter === "read") matchesFilter = item.isRead;
      if (filter === "mentions") matchesFilter = item.category === "Workspace" || item.category === "Team";
      if (filter === "ai") matchesFilter = item.category === "AI";
      if (filter === "files") matchesFilter = item.category === "Files";
      if (filter === "workspace") matchesFilter = item.category === "Workspace";
      if (filter === "system") matchesFilter = item.category === "System";

      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, filter]);

  // Client-side Sort logic
  const sortedNotifications = React.useMemo(() => {
    return [...filteredNotifications].sort((a, b) => {
      if (sortBy === "unread") {
        if (!a.isRead && b.isRead) return -1;
        if (a.isRead && !b.isRead) return 1;
      }
      if (sortBy === "priority") {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === "oldest") {
        return a.id.localeCompare(b.id);
      }
      // default: newest first (pinned items float to top)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.id.localeCompare(a.id);
    });
  }, [filteredNotifications, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <NotificationHeader />

      {/* Overview Cards */}
      <SummaryCards />

      {/* Search & Filter Bar */}
      <NotificationFilters />

      {/* Main Notification Stream & Split Details Pane */}
      {isLoading ? (
        <NotificationSkeleton />
      ) : sortedNotifications.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Notification Inbox List */}
          <div className="lg:col-span-7">
            <NotificationList notifications={sortedNotifications} />
          </div>

          {/* Notification Details Split Pane (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-20 h-[calc(100vh-7rem)]">
            <NotificationDetails />
          </div>
        </div>
      )}

      {/* Mobile Drawer Notification Details */}
      <div className="lg:hidden">
        <NotificationDetails />
      </div>
    </div>
  );
}
