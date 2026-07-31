export type DateRangeOption = "7d" | "30d" | "90d" | "1y";

export interface SparklinePoint {
  day: string;
  value: number;
}

export interface KPIMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconName: string;
  sparklineData: SparklinePoint[];
}

export interface DailyActiveUsersData {
  day: string;
  users: number;
  sessions: number;
}

export interface AIRequestsOverTimeData {
  day: string;
  requests: number;
  tokens: number;
}

export interface WeeklyUsageData {
  day: string;
  code: number;
  text: number;
  vision: number;
}

export interface StorageDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface ActivityVsRequestsData {
  day: string;
  activeUsers: number;
  aiRequests: number;
}

export interface TrafficSource {
  source: string;
  percentage: number;
  users: number;
  color: string;
}

export interface DeviceData {
  device: string;
  percentage: number;
  users: number;
  color: string;
}

export interface GeoLocation {
  country: string;
  code: string;
  users: number;
  percentage: number;
}

export interface AnalyticsActivity {
  id: string;
  timestamp: string;
  user: string;
  avatarUrl?: string;
  action: string;
  module: string;
  status: "Success" | "Pending" | "Failed";
}

export interface AIUsageStats {
  promptsSent: number;
  avgResponseTimeMs: number;
  tokensUsedMillions: number;
  successRatePercent: number;
  failedRequests: number;
  topCategories: { category: string; count: number }[];
}

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  type: "positive" | "info" | "warning";
  impact: string;
}

export interface SummaryHighlight {
  title: string;
  value: string;
  subtitle: string;
  iconName: string;
}
