export type NotificationCategory =
  | "AI"
  | "Workspace"
  | "Files"
  | "Calendar"
  | "Team"
  | "System"
  | "Security"
  | "General";

export type NotificationPriority = "High" | "Medium" | "Low";

export type NotificationFilter =
  | "all"
  | "unread"
  | "read"
  | "mentions"
  | "system"
  | "files"
  | "workspace"
  | "ai"
  | "team"
  | "calendar";

export type NotificationSort = "newest" | "oldest" | "priority" | "unread";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  fullDetails?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  isPinned: boolean;
  isArchived: boolean;
  timestamp: string;
  group: "Today" | "Yesterday" | "This Week" | "Earlier";
  avatarUrl?: string;
  relatedUser?: string;
  actionUrl?: string;
}

export interface SummaryMetric {
  title: string;
  count: number;
  change: string;
  iconName: string;
}
