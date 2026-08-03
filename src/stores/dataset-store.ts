import { create } from "zustand";
import { DatasetItem, datasetsApi } from "@/services/datasets-api";

interface DatasetState {
  datasets: DatasetItem[];
  totalDatasets: number;
  totalRecords: number;
  totalStorageBytes: number;
  isLoading: boolean;
  searchQuery: string;
  selectedFormat: string;
  viewMode: "grid" | "list";
  isUploadModalOpen: boolean;

  setSearchQuery: (query: string) => void;
  setSelectedFormat: (format: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setUploadModalOpen: (isOpen: boolean) => void;

  setDatasets: (items: DatasetItem[]) => void;
  fetchDatasets: (workspaceId?: string) => Promise<void>;
  addDataset: (dataset: DatasetItem) => void;
  removeDataset: (id: string) => void;
}

export const useDatasetStore = create<DatasetState>((set) => ({
  datasets: [],
  totalDatasets: 0,
  totalRecords: 0,
  totalStorageBytes: 0,
  isLoading: false,
  searchQuery: "",
  selectedFormat: "all",
  viewMode: "grid",
  isUploadModalOpen: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),

  setDatasets: (items) => {
    const totalBytes = items.reduce((acc, d) => acc + (d.file_size || 0), 0);
    const totalRecs = items.reduce((acc, d) => acc + (d.record_count || 0), 0);
    set({
      datasets: items,
      totalDatasets: items.length,
      totalRecords: totalRecs,
      totalStorageBytes: totalBytes,
    });
  },

  fetchDatasets: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const res = await datasetsApi.listDatasets(workspaceId);
      const items = res.items || [];
      const totalBytes = items.reduce((acc, d) => acc + (d.file_size || 0), 0);
      const totalRecs = items.reduce((acc, d) => acc + (d.record_count || 0), 0);
      set({
        datasets: items,
        totalDatasets: res.total_items ?? items.length,
        totalRecords: totalRecs,
        totalStorageBytes: totalBytes,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addDataset: (newDs) => {
    set((state) => {
      const exists = state.datasets.some((d) => d.id === newDs.id);
      const updated = exists ? state.datasets.map((d) => (d.id === newDs.id ? newDs : d)) : [newDs, ...state.datasets];
      const totalBytes = updated.reduce((acc, d) => acc + (d.file_size || 0), 0);
      const totalRecs = updated.reduce((acc, d) => acc + (d.record_count || 0), 0);
      return {
        datasets: updated,
        totalDatasets: updated.length,
        totalRecords: totalRecs,
        totalStorageBytes: totalBytes,
      };
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("neurodesk:data_changed"));
    }
    import("@/stores/dashboard-store").then(({ useDashboardStore }) => {
      useDashboardStore.getState().fetchSummary();
    }).catch(() => {});
  },

  removeDataset: (id) => {
    set((state) => {
      const updated = state.datasets.filter((d) => d.id !== id);
      const totalBytes = updated.reduce((acc, d) => acc + (d.file_size || 0), 0);
      const totalRecs = updated.reduce((acc, d) => acc + (d.record_count || 0), 0);
      return {
        datasets: updated,
        totalDatasets: updated.length,
        totalRecords: totalRecs,
        totalStorageBytes: totalBytes,
      };
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("neurodesk:data_changed"));
    }
    import("@/stores/dashboard-store").then(({ useDashboardStore }) => {
      useDashboardStore.getState().fetchSummary();
    }).catch(() => {});
  },
}));

