export type SettingsSection =
  | "profile"
  | "account"
  | "appearance"
  | "notifications"
  | "workspace"
  | "security"
  | "accessibility"
  | "about";

export interface UserProfileSettings {
  avatarUrl: string;
  fullName: string;
  email: string;
  jobTitle: string;
  company: string;
  phone: string;
  location: string;
  bio: string;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  compactLayout: boolean;
  reducedMotion: boolean;
  sidebarDefaultState: "expanded" | "collapsed";
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  aiUpdates: boolean;
  workspaceActivity: boolean;
  teamActivity: boolean;
  calendarReminders: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

export interface WorkspacePreferences {
  defaultView: "tree" | "list" | "grid";
  startPage: "dashboard" | "workspace" | "ai-assistant";
  recentFilesLimit: number;
  autoSave: boolean;
  showLineNumbers: boolean;
  documentFontSize: number;
  documentWidth: "narrow" | "default" | "full";
}

export interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  keyboardShortcuts: boolean;
  focusHighlight: boolean;
  screenReaderOptimisations: boolean;
  reducedMotion: boolean;
}
