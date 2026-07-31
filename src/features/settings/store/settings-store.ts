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
import {
  initialProfileData,
  initialAppearanceData,
  initialNotificationData,
  initialWorkspaceData,
  initialAccessibilityData,
} from "../mock/settings-mock-data";

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
      profile: initialProfileData,
      appearance: initialAppearanceData,
      notifications: initialNotificationData,
      workspace: initialWorkspaceData,
      accessibility: initialAccessibilityData,
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
          profile: initialProfileData,
          appearance: initialAppearanceData,
          notifications: initialNotificationData,
          workspace: initialWorkspaceData,
          accessibility: initialAccessibilityData,
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
