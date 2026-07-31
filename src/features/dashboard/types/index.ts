export interface StatItem {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconName: string;
  description: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  actionText: string;
  variant?: "default" | "outline" | "secondary";
}

export interface AIInsight {
  title: string;
  summary: string;
  metric: string;
  highlights: string[];
}

export interface WeeklyActivityPoint {
  day: string;
  requests: number;
  tokens: number;
}

export interface AIUsageCategory {
  category: string;
  count: number;
}

export interface StorageSlice {
  name: string;
  value: number;
  color: string;
}

export interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: "file" | "workspace" | "task" | "ai" | "member";
}

export interface RecentFile {
  id: string;
  name: string;
  type: "pdf" | "code" | "doc" | "image" | "archive";
  owner: {
    name: string;
    avatarUrl?: string;
  };
  size: string;
  lastModified: string;
  status: "Synced" | "Processing" | "Archived";
}

export interface WorkspaceMetric {
  title: string;
  count: number;
  change: string;
  iconName: string;
}

export interface StorageData {
  usedGB: number;
  totalGB: number;
  percentage: number;
  breakdown: {
    category: string;
    sizeGB: number;
  }[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away" | "busy";
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  tag: "Update" | "Notice" | "Tip";
  content: string;
}
