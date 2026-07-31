import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DateRangeOption } from "../types";

interface AnalyticsState {
  dateRange: DateRangeOption;
  selectedMetric: string;
  selectedProject: string;
  isRefreshing: boolean;
  isExportOpen: boolean;

  setDateRange: (range: DateRangeOption) => void;
  setSelectedMetric: (metric: string) => void;
  setSelectedProject: (project: string) => void;
  triggerRefresh: () => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      dateRange: "7d",
      selectedMetric: "all",
      selectedProject: "all",
      isRefreshing: false,
      isExportOpen: false,

      setDateRange: (range) => set({ dateRange: range }),
      setSelectedMetric: (metric) => set({ selectedMetric: metric }),
      setSelectedProject: (project) => set({ selectedProject: project }),

      triggerRefresh: () => {
        set({ isRefreshing: true });
        setTimeout(() => set({ isRefreshing: false }), 800);
      },

      openExportDialog: () => set({ isExportOpen: true }),
      closeExportDialog: () => set({ isExportOpen: false }),
    }),
    {
      name: "neurodesk_analytics_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ dateRange: state.dateRange, selectedMetric: state.selectedMetric }),
    }
  )
);
