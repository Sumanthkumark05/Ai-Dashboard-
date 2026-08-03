import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  SettingsSection,
  UserProfileSettings,
  AppearanceSettings,
  NotificationPreferences,
  WorkspacePreferences,
  AccessibilitySettings,
} from "../types";

const defaultProfile: UserProfileSettings = {
  avatarUrl: "",
  fullName: "Workspace User",
  email: "user@neurodesk.ai",
  jobTitle: "Software Engineer",
  company: "NeuroDesk",
  phone: "+1 (555) 000-0000",
  location: "San Francisco, CA",
  bio: "AI SaaS Workspace User",
};

const defaultAppearance: AppearanceSettings = {
  theme: "dark",
  compactLayout: false,
  reducedMotion: false,
  sidebarDefaultState: "expanded",
};

const defaultNotifications: NotificationPreferences = {
  emailNotifications: true,
  desktopNotifications: true,
  aiUpdates: true,
  workspaceActivity: true,
  teamActivity: true,
  calendarReminders: true,
  securityAlerts: true,
  marketingEmails: false,
};

const defaultWorkspace: WorkspacePreferences = {
  defaultView: "tree",
  startPage: "dashboard",
  recentFilesLimit: 10,
  autoSave: true,
  showLineNumbers: true,
  documentFontSize: 14,
  documentWidth: "default",
};

const defaultAccessibility: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  keyboardShortcuts: true,
  focusHighlight: true,
  screenReaderOptimisations: false,
  reducedMotion: false,
};

interface SettingsState {
  activeSection: SettingsSection;
  profile: UserProfileSettings;
  appearance: AppearanceSettings;
  notifications: NotificationPreferences;
  workspace: WorkspacePreferences;
  accessibility: AccessibilitySettings;
  searchQuery: string;
  isDirty: boolean;
  isResetOpen: boolean;
  isLoading: boolean;

  setActiveSection: (section: SettingsSection) => void;
  setSearchQuery: (query: string) => void;
  updateProfile: (data: Partial<UserProfileSettings>) => void;
  updateAppearance: (data: Partial<AppearanceSettings>) => void;
  updateNotifications: (data: Partial<NotificationPreferences>) => void;
  updateWorkspace: (data: Partial<WorkspacePreferences>) => void;
  updateAccessibility: (data: Partial<AccessibilitySettings>) => void;
  resetToDefaults: () => void;
  openResetModal: () => void;
  closeResetModal: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activeSection: "profile",
      profile: defaultProfile,
      appearance: defaultAppearance,
      notifications: defaultNotifications,
      workspace: defaultWorkspace,
      accessibility: defaultAccessibility,
      searchQuery: "",
      isDirty: false,
      isResetOpen: false,
      isLoading: false,

      setActiveSection: (section) => set({ activeSection: section }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      updateProfile: (data) =>
        set((state) => ({
          profile: { ...state.profile, ...data },
          isDirty: true,
        })),

      updateAppearance: (data) =>
        set((state) => ({
          appearance: { ...state.appearance, ...data },
          isDirty: true,
        })),

      updateNotifications: (data) =>
        set((state) => ({
          notifications: { ...state.notifications, ...data },
          isDirty: true,
        })),

      updateWorkspace: (data) =>
        set((state) => ({
          workspace: { ...state.workspace, ...data },
          isDirty: true,
        })),

      updateAccessibility: (data) =>
        set((state) => ({
          accessibility: { ...state.accessibility, ...data },
          isDirty: true,
        })),

      resetToDefaults: () =>
        set({
          profile: defaultProfile,
          appearance: defaultAppearance,
          notifications: defaultNotifications,
          workspace: defaultWorkspace,
          accessibility: defaultAccessibility,
          isDirty: false,
          isResetOpen: false,
        }),

      openResetModal: () => set({ isResetOpen: true }),
      closeResetModal: () => set({ isResetOpen: false }),
    }),
    {
      name: "neurodesk_settings_local_storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
