import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { analyticsApi, SystemTelemetryData } from "@/services/analytics-api";
import { DateRangeOption } from "../types";

interface AnalyticsState {
  dateRange: DateRangeOption;
  selectedWorkspace: string;
  selectedCategory: string;
  selectedOwner: string;
  selectedMetric: string;
  selectedProject: string;

  telemetry: SystemTelemetryData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isExportOpen: boolean;

  setDateRange: (range: DateRangeOption) => void;
  setSelectedWorkspace: (wsId: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedOwner: (ownerId: string) => void;
  setSelectedMetric: (metric: string) => void;
  setSelectedProject: (project: string) => void;

  fetchTelemetry: () => Promise<void>;
  triggerRefresh: () => Promise<void>;
  openExportDialog: () => void;
  closeExportDialog: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      dateRange: "7d",
      selectedWorkspace: "all",
      selectedCategory: "all",
      selectedOwner: "all",
      selectedMetric: "all",
      selectedProject: "all",

      telemetry: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      isExportOpen: false,

      setDateRange: (range) => {
        set({ dateRange: range });
        get().fetchTelemetry();
      },

      setSelectedWorkspace: (wsId) => {
        set({ selectedWorkspace: wsId });
        get().fetchTelemetry();
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
        get().fetchTelemetry();
      },

      setSelectedOwner: (ownerId) => {
        set({ selectedOwner: ownerId });
        get().fetchTelemetry();
      },

      setSelectedMetric: (metric) => set({ selectedMetric: metric }),

      setSelectedProject: (project) => {
        set({ selectedProject: project });
        if (project !== "all" && project !== "prod" && project !== "agent" && project !== "staging") {
          set({ selectedWorkspace: project });
        } else if (project === "all") {
          set({ selectedWorkspace: "all" });
        }
        get().fetchTelemetry();
      },

      fetchTelemetry: async () => {
        const { dateRange, selectedWorkspace, selectedCategory, selectedOwner, telemetry } = get();
        if (!telemetry) {
          set({ isLoading: true, error: null });
        }

        try {
          const { contextStorage } = await import("@/lib/api-client");
          const activeWsId = selectedWorkspace !== "all" ? selectedWorkspace : contextStorage.getWorkspaceId() || undefined;

          const data = await analyticsApi.getTelemetry(
            dateRange,
            activeWsId,
            selectedCategory,
            selectedOwner
          );

          set({ telemetry: data, isLoading: false, isRefreshing: false, error: null });
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : "Unable to load analytics.";
          set({
            isLoading: false,
            isRefreshing: false,
            error: "Unable to load analytics.",
          });
        }
      },

      triggerRefresh: async () => {
        set({ isRefreshing: true, error: null });
        try {
          await get().fetchTelemetry();
        } finally {
          set({ isRefreshing: false });
        }
      },

      openExportDialog: () => set({ isExportOpen: true }),
      closeExportDialog: () => set({ isExportOpen: false }),
    }),
    {
      name: "neurodesk_analytics_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        dateRange: state.dateRange,
        selectedWorkspace: state.selectedWorkspace,
        selectedCategory: state.selectedCategory,
        selectedOwner: state.selectedOwner,
        selectedMetric: state.selectedMetric,
        selectedProject: state.selectedProject,
      }),
    }
  )
);
