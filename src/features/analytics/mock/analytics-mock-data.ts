import {
  KPIMetric,
  DailyActiveUsersData,
  AIRequestsOverTimeData,
  WeeklyUsageData,
  StorageDistributionData,
  ActivityVsRequestsData,
  TrafficSource,
  DeviceData,
  GeoLocation,
  AnalyticsActivity,
  AIUsageStats,
  InsightItem,
  SummaryHighlight,
} from "../types";

export const kpiMetricsData: KPIMetric[] = [
  {
    id: "total_users",
    title: "Total Registered Users",
    value: "12,840",
    change: "+14.2%",
    isPositive: true,
    iconName: "Users",
    sparklineData: [
      { day: "Mon", value: 11200 },
      { day: "Tue", value: 11500 },
      { day: "Wed", value: 11900 },
      { day: "Thu", value: 12100 },
      { day: "Fri", value: 12400 },
      { day: "Sat", value: 12650 },
      { day: "Sun", value: 12840 },
    ],
  },
  {
    id: "active_users",
    title: "Daily Active Users (DAU)",
    value: "3,420",
    change: "+8.6%",
    isPositive: true,
    iconName: "UserCheck",
    sparklineData: [
      { day: "Mon", value: 2800 },
      { day: "Tue", value: 3100 },
      { day: "Wed", value: 3350 },
      { day: "Thu", value: 3200 },
      { day: "Fri", value: 3400 },
      { day: "Sat", value: 2900 },
      { day: "Sun", value: 3420 },
    ],
  },
  {
    id: "ai_requests",
    title: "AI API Requests",
    value: "1,248,500",
    change: "+24.8%",
    isPositive: true,
    iconName: "Bot",
    sparklineData: [
      { day: "Mon", value: 850000 },
      { day: "Tue", value: 940000 },
      { day: "Wed", value: 1050000 },
      { day: "Thu", value: 1120000 },
      { day: "Fri", value: 1180000 },
      { day: "Sat", value: 1210000 },
      { day: "Sun", value: 1248500 },
    ],
  },
  {
    id: "files_uploaded",
    title: "Files Uploaded",
    value: "4,850",
    change: "+12.1%",
    isPositive: true,
    iconName: "FileText",
    sparklineData: [
      { day: "Mon", value: 3900 },
      { day: "Tue", value: 4100 },
      { day: "Wed", value: 4350 },
      { day: "Thu", value: 4500 },
      { day: "Fri", value: 4680 },
      { day: "Sat", value: 4750 },
      { day: "Sun", value: 4850 },
    ],
  },
  {
    id: "storage_used",
    title: "Storage Usage",
    value: "78.4 GB",
    change: "+3.1%",
    isPositive: true,
    iconName: "HardDrive",
    sparklineData: [
      { day: "Mon", value: 72 },
      { day: "Tue", value: 73.5 },
      { day: "Wed", value: 74.8 },
      { day: "Thu", value: 76.0 },
      { day: "Fri", value: 77.2 },
      { day: "Sat", value: 78.0 },
      { day: "Sun", value: 78.4 },
    ],
  },
  {
    id: "workspace_pages",
    title: "Workspace Pages",
    value: "342",
    change: "+18.4%",
    isPositive: true,
    iconName: "BookOpen",
    sparklineData: [
      { day: "Mon", value: 280 },
      { day: "Tue", value: 295 },
      { day: "Wed", value: 310 },
      { day: "Thu", value: 320 },
      { day: "Fri", value: 330 },
      { day: "Sat", value: 338 },
      { day: "Sun", value: 342 },
    ],
  },
];

export const dailyActiveUsersData: DailyActiveUsersData[] = [
  { day: "Jul 16", users: 2400, sessions: 4200 },
  { day: "Jul 18", users: 2650, sessions: 4800 },
  { day: "Jul 20", users: 2900, sessions: 5300 },
  { day: "Jul 22", users: 3100, sessions: 5800 },
  { day: "Jul 24", users: 3250, sessions: 6100 },
  { day: "Jul 26", users: 3300, sessions: 6400 },
  { day: "Jul 28", users: 3420, sessions: 6900 },
];

export const aiRequestsOverTimeData: AIRequestsOverTimeData[] = [
  { day: "Mon", requests: 120000, tokens: 4.2 },
  { day: "Tue", requests: 145000, tokens: 5.1 },
  { day: "Wed", requests: 180000, tokens: 6.8 },
  { day: "Thu", requests: 210000, tokens: 7.9 },
  { day: "Fri", requests: 240000, tokens: 9.2 },
  { day: "Sat", requests: 195000, tokens: 7.1 },
  { day: "Sun", requests: 260000, tokens: 10.4 },
];

export const weeklyUsageData: WeeklyUsageData[] = [
  { day: "Mon", code: 450, text: 320, vision: 140 },
  { day: "Tue", code: 520, text: 380, vision: 180 },
  { day: "Wed", code: 680, text: 450, vision: 220 },
  { day: "Thu", code: 740, text: 490, vision: 260 },
  { day: "Fri", code: 810, text: 540, vision: 310 },
  { day: "Sat", code: 620, text: 410, vision: 210 },
  { day: "Sun", code: 890, text: 610, vision: 340 },
];

export const storageDistributionData: StorageDistributionData[] = [
  { name: "Documents & Specs", value: 36.8, color: "#3b82f6" },
  { name: "Media Assets", value: 28.4, color: "#10b981" },
  { name: "Code Repositories", value: 17.0, color: "#8b5cf6" },
  { name: "Vector Model Weights", value: 16.2, color: "#f59e0b" },
];

export const activityVsRequestsData: ActivityVsRequestsData[] = [
  { day: "Mon", activeUsers: 2800, aiRequests: 120000 },
  { day: "Tue", activeUsers: 3100, aiRequests: 145000 },
  { day: "Wed", activeUsers: 3350, aiRequests: 180000 },
  { day: "Thu", activeUsers: 3200, aiRequests: 210000 },
  { day: "Fri", activeUsers: 3400, aiRequests: 240000 },
  { day: "Sat", activeUsers: 2900, aiRequests: 195000 },
  { day: "Sun", activeUsers: 3420, aiRequests: 260000 },
];

export const trafficSourcesData: TrafficSource[] = [
  { source: "Direct Workspace Visits", percentage: 42, users: 5392, color: "#3b82f6" },
  { source: "Search Engine Referrals", percentage: 28, users: 3595, color: "#10b981" },
  { source: "External Partner Links", percentage: 16, users: 2054, color: "#8b5cf6" },
  { source: "Social & Community", percentage: 9, users: 1155, color: "#f59e0b" },
  { source: "Email Campaigns", percentage: 5, users: 644, color: "#ec4899" },
];

export const deviceData: DeviceData[] = [
  { device: "Desktop (Mac/Win)", percentage: 64, users: 8217, color: "#3b82f6" },
  { device: "Mobile (iOS/Android)", percentage: 28, users: 3595, color: "#10b981" },
  { device: "Tablet Browsers", percentage: 8, users: 1028, color: "#f59e0b" },
];

export const geoLocationsData: GeoLocation[] = [
  { country: "United States", code: "US", users: 5392, percentage: 42 },
  { country: "Germany", code: "DE", users: 1926, percentage: 15 },
  { country: "United Kingdom", code: "UK", users: 1540, percentage: 12 },
  { country: "Japan", code: "JP", users: 1155, percentage: 9 },
  { country: "India", code: "IN", users: 1027, percentage: 8 },
  { country: "Canada", code: "CA", users: 770, percentage: 6 },
];

export const analyticsActivitiesData: AnalyticsActivity[] = [
  {
    id: "act_1",
    timestamp: "2 mins ago",
    user: "Alex Vance",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    action: "Generated Code Solution",
    module: "AI Assistant",
    status: "Success",
  },
  {
    id: "act_2",
    timestamp: "14 mins ago",
    user: "Sarah Chen",
    action: "Uploaded Dataset file",
    module: "File Manager",
    status: "Success",
  },
  {
    id: "act_3",
    timestamp: "32 mins ago",
    user: "Marcus Brody",
    action: "Invited New Team Member",
    module: "Team Workspace",
    status: "Success",
  },
  {
    id: "act_4",
    timestamp: "1 hour ago",
    user: "Elena Rostova",
    action: "Exported Analytics PDF",
    module: "Analytics",
    status: "Success",
  },
  {
    id: "act_5",
    timestamp: "2 hours ago",
    user: "System Daemon",
    action: "Vector Index Refresh",
    module: "Core Engine",
    status: "Pending",
  },
];

export const aiUsageStatsData: AIUsageStats = {
  promptsSent: 45210,
  avgResponseTimeMs: 380,
  tokensUsedMillions: 14.2,
  successRatePercent: 99.4,
  failedRequests: 27,
  topCategories: [
    { category: "Code Generation", count: 18400 },
    { category: "Document Summarization", count: 12100 },
    { category: "Data Analysis & Logic", count: 8900 },
    { category: "Vision & OCR", count: 5810 },
  ],
};

export const productivityInsightsData: InsightItem[] = [
  {
    id: "ins_1",
    title: "AI Usage Spike Detected",
    description: "AI prompt requests increased by 24.8% this week compared to last week.",
    type: "positive",
    impact: "+24.8%",
  },
  {
    id: "ins_2",
    title: "Peak Engineering Activity",
    description: "Most active developer period occurred between 10 AM and 12 PM EST.",
    type: "info",
    impact: "11 AM Peak",
  },
  {
    id: "ins_3",
    title: "Document Workflow Efficiency",
    description: "Workspace activity surged 30 minutes following dataset file uploads.",
    type: "positive",
    impact: "3.2x Engagement",
  },
  {
    id: "ins_4",
    title: "Sub-400ms Response Latency",
    description: "Model token generation response times averaged 380ms across all models.",
    type: "positive",
    impact: "380ms Latency",
  },
];

export const summaryHighlightsData: SummaryHighlight[] = [
  {
    title: "Best Performing Day",
    value: "Wednesday",
    subtitle: "260,000 API Requests logged",
    iconName: "Calendar",
  },
  {
    title: "Peak Usage Hour",
    value: "11:00 AM EST",
    subtitle: "Highest concurrent active sessions",
    iconName: "Clock",
  },
  {
    title: "Most Used Feature",
    value: "AI Code Generator",
    subtitle: "18,400 prompts processed",
    iconName: "Code",
  },
  {
    title: "Fastest Growth Metric",
    value: "Agent Workflows",
    subtitle: "+28.4% WoW adoption",
    iconName: "TrendingUp",
  },
];
