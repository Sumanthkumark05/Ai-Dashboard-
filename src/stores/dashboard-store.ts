import { create } from "zustand";
import { dashboardApi, DashboardSummaryResponse } from "@/services/dashboard-api";

interface DashboardState {
  summary: DashboardSummaryResponse | null;
  isLoading: boolean;
  error: string | null;

  fetchSummary: (workspaceId?: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  fetchSummary: async (workspaceId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { contextStorage } = await import("@/lib/api-client");
      const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;
      const data = await dashboardApi.getSummary(resolvedWsId);
      set({ summary: data, isLoading: false, error: null });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load dashboard metrics";
      set({ isLoading: false, error: errorMsg });
    }
  },
}));
