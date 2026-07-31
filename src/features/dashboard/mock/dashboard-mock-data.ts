import {
  StatItem,
  QuickActionItem,
  AIInsight,
  WeeklyActivityPoint,
  AIUsageCategory,
  StorageSlice,
  ActivityEvent,
  RecentFile,
  WorkspaceMetric,
  StorageData,
  TeamMember,
  Announcement,
} from "../types";

export const statsData: StatItem[] = [
  {
    id: "stat_1",
    title: "Total Users",
    value: "12,840",
    change: "+12.5%",
    isPositive: true,
    iconName: "Users",
    description: "Active platform users",
  },
  {
    id: "stat_2",
    title: "Revenue",
    value: "$48,250",
    change: "+8.2%",
    isPositive: true,
    iconName: "DollarSign",
    description: "Monthly recurring revenue",
  },
  {
    id: "stat_3",
    title: "AI Requests",
    value: "1.2M",
    change: "+24.8%",
    isPositive: true,
    iconName: "Zap",
    description: "Total token calls processed",
  },
  {
    id: "stat_4",
    title: "Storage Used",
    value: "78.4 GB",
    change: "+3.1%",
    isPositive: false,
    iconName: "HardDrive",
    description: "Of 100 GB capacity limit",
  },
];

export const quickActions: QuickActionItem[] = [
  {
    id: "qa_1",
    title: "New AI Chat",
    description: "Launch autonomous agent assistant session",
    iconName: "Bot",
    actionText: "Start Session",
  },
  {
    id: "qa_2",
    title: "Upload Dataset",
    description: "Import files into vector knowledge base",
    iconName: "Upload",
    actionText: "Upload File",
  },
  {
    id: "qa_3",
    title: "Create Workspace Page",
    description: "Document new system architecture",
    iconName: "PlusSquare",
    actionText: "New Page",
  },
  {
    id: "qa_4",
    title: "Invite Teammate",
    description: "Grant workspace access to collaborators",
    iconName: "UserPlus",
    actionText: "Send Invite",
  },
  {
    id: "qa_5",
    title: "View Analytics",
    description: "Analyze token consumption telemetry",
    iconName: "BarChart",
    actionText: "Open Report",
  },
];

export const aiInsights: AIInsight = {
  title: "Today's Intelligence Summary",
  summary: "Your team's AI productivity increased by 18% this week.",
  metric: "18% Productivity Gain",
  highlights: [
    "Average AI query response time decreased to 140ms.",
    "Code completion accuracy reached 96.4% across repositories.",
    "3.4 hours saved per developer through automated reports.",
  ],
};

export const weeklyActivityData: WeeklyActivityPoint[] = [
  { day: "Mon", requests: 12400, tokens: 420000 },
  { day: "Tue", requests: 15800, tokens: 510000 },
  { day: "Wed", requests: 18200, tokens: 680000 },
  { day: "Thu", requests: 16900, tokens: 590000 },
  { day: "Fri", requests: 21400, tokens: 820000 },
  { day: "Sat", requests: 9800, tokens: 310000 },
  { day: "Sun", requests: 11200, tokens: 360000 },
];

export const aiUsageData: AIUsageCategory[] = [
  { category: "Code Assist", count: 45000 },
  { category: "Text Generation", count: 32000 },
  { category: "Vision Analysis", count: 18000 },
  { category: "Embeddings", count: 28000 },
  { category: "Reasoning", count: 15000 },
  { category: "Audio Speech", count: 8500 },
];

export const storageDistributionData: StorageSlice[] = [
  { name: "Documents", value: 32, color: "#3b82f6" },
  { name: "Media & Images", value: 24, color: "#10b981" },
  { name: "Code & Vector DB", value: 20, color: "#8b5cf6" },
  { name: "AI Models", value: 14, color: "#f59e0b" },
  { name: "Backups", value: 10, color: "#64748b" },
];

export const recentActivityData: ActivityEvent[] = [
  {
    id: "act_1",
    user: "Alex Vance",
    action: "uploaded new dataset",
    target: "q3_financial_model.csv",
    timestamp: "12 mins ago",
    type: "file",
  },
  {
    id: "act_2",
    user: "Sarah Chen",
    action: "created workspace page",
    target: "AGY SDK Integration Spec",
    timestamp: "45 mins ago",
    type: "workspace",
  },
  {
    id: "act_3",
    user: "Marcus Brody",
    action: "completed sprint task",
    target: "Fix hydration mismatch in layout",
    timestamp: "2 hours ago",
    type: "task",
  },
  {
    id: "act_4",
    user: "NeuroDesk Bot",
    action: "generated automated summary",
    target: "Weekly Executive Briefing",
    timestamp: "4 hours ago",
    type: "ai",
  },
  {
    id: "act_5",
    user: "Elena Rostova",
    action: "joined the workspace",
    target: "Engineering Team",
    timestamp: "1 day ago",
    type: "member",
  },
];

export const recentFilesData: RecentFile[] = [
  {
    id: "file_1",
    name: "neurodesk_architecture_v2.pdf",
    type: "pdf",
    owner: {
      name: "Alex Vance",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    size: "4.2 MB",
    lastModified: "Today, 2:15 PM",
    status: "Synced",
  },
  {
    id: "file_2",
    name: "ai_token_telemetry.ts",
    type: "code",
    owner: {
      name: "Sarah Chen",
    },
    size: "128 KB",
    lastModified: "Yesterday, 6:40 PM",
    status: "Synced",
  },
  {
    id: "file_3",
    name: "product_roadmap_2026.docx",
    type: "doc",
    owner: {
      name: "Marcus Brody",
    },
    size: "1.8 MB",
    lastModified: "Jul 28, 2026",
    status: "Synced",
  },
  {
    id: "file_4",
    name: "dashboard_hero_mockup.png",
    type: "image",
    owner: {
      name: "Elena Rostova",
    },
    size: "8.4 MB",
    lastModified: "Jul 26, 2026",
    status: "Processing",
  },
  {
    id: "file_5",
    name: "vector_embeddings_backup.zip",
    type: "archive",
    owner: {
      name: "Alex Vance",
    },
    size: "64.0 MB",
    lastModified: "Jul 24, 2026",
    status: "Archived",
  },
];

export const workspaceOverviewData: WorkspaceMetric[] = [
  {
    title: "Pages Created",
    count: 42,
    change: "+6 this week",
    iconName: "FileText",
  },
  {
    title: "Tasks Completed",
    count: 128,
    change: "+19 this week",
    iconName: "CheckSquare",
  },
  {
    title: "Upcoming Meetings",
    count: 5,
    change: "Next at 3:00 PM",
    iconName: "Calendar",
  },
  {
    title: "Recent Notes",
    count: 14,
    change: "Updated 1h ago",
    iconName: "BookOpen",
  },
];

export const storageData: StorageData = {
  usedGB: 78.4,
  totalGB: 100,
  percentage: 78.4,
  breakdown: [
    { category: "Documents", sizeGB: 32 },
    { category: "Media & Images", sizeGB: 24 },
    { category: "Code & Vector DB", sizeGB: 20 },
    { category: "AI Models", sizeGB: 14 },
    { category: "Backups", sizeGB: 10 },
  ],
};

export const teamMembersData: TeamMember[] = [
  {
    id: "team_1",
    name: "Alex Vance",
    role: "Lead Architect",
    email: "alex@neurodesk.ai",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "online",
  },
  {
    id: "team_2",
    name: "Sarah Chen",
    role: "AI Engineer",
    email: "sarah@neurodesk.ai",
    status: "online",
  },
  {
    id: "team_3",
    name: "Marcus Brody",
    role: "Frontend Lead",
    email: "marcus@neurodesk.ai",
    status: "away",
  },
  {
    id: "team_4",
    name: "Elena Rostova",
    role: "Product Designer",
    email: "elena@neurodesk.ai",
    status: "offline",
  },
];

export const announcementsData: Announcement[] = [
  {
    id: "ann_1",
    title: "NeuroDesk Engine v2.4 Released",
    date: "Jul 29, 2026",
    tag: "Update",
    content: "Up to 3x faster response times on long-context reasoning tasks.",
  },
  {
    id: "ann_2",
    title: "Scheduled Maintenance Window",
    date: "Aug 02, 2026",
    tag: "Notice",
    content: "Vector database indexing optimization scheduled for 02:00 UTC.",
  },
  {
    id: "ann_3",
    title: "Tip: Keyboard Shortcuts ⌘K",
    date: "Jul 25, 2026",
    tag: "Tip",
    content: "Press ⌘K anytime to open global command search palette.",
  },
];
