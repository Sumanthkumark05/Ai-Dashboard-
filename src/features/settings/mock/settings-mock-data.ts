import {
  UserProfileSettings,
  AppearanceSettings,
  NotificationPreferences,
  WorkspacePreferences,
  SecuritySession,
  AccessibilitySettings,
} from "../types";

export const initialProfileData: UserProfileSettings = {
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  fullName: "Alex Vance",
  email: "alex.vance@neurodesk.ai",
  jobTitle: "Principal Frontend Engineer",
  company: "NeuroDesk AI Inc.",
  phone: "+1 (555) 234-5678",
  location: "San Francisco, CA",
  bio: "Building enterprise autonomous AI agent dashboards and high-performance design systems.",
};

export const initialAppearanceData: AppearanceSettings = {
  theme: "dark",
  compactLayout: false,
  reducedMotion: false,
  sidebarDefaultState: "expanded",
};

export const initialNotificationData: NotificationPreferences = {
  emailNotifications: true,
  desktopNotifications: true,
  aiUpdates: true,
  workspaceActivity: true,
  teamActivity: true,
  calendarReminders: true,
  securityAlerts: true,
  marketingEmails: false,
};

export const initialWorkspaceData: WorkspacePreferences = {
  defaultView: "tree",
  startPage: "dashboard",
  recentFilesLimit: 10,
  autoSave: true,
  showLineNumbers: true,
  documentFontSize: 14,
  documentWidth: "default",
};

export const initialSecuritySessions: SecuritySession[] = [
  {
    id: "sess_1",
    device: "MacBook Pro 16\"",
    browser: "Chrome 128.0 (MacOS)",
    location: "San Francisco, CA, USA",
    ipAddress: "192.168.1.100",
    lastActive: "Active now",
    isCurrent: true,
  },
  {
    id: "sess_2",
    device: "iPhone 15 Pro",
    browser: "Mobile Safari 17.5 (iOS)",
    location: "San Francisco, CA, USA",
    ipAddress: "192.168.1.105",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
];

export const initialAccessibilityData: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  keyboardShortcuts: true,
  focusHighlight: true,
  screenReaderOptimisations: false,
  reducedMotion: false,
};
