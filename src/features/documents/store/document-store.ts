import { create } from "zustand";
import { documentsApi, DocumentItem, DocumentStorageStats } from "@/services/documents-api";
import { useFileStore } from "@/stores/file-store";

interface DocumentState {
  documents: DocumentItem[];
  totalDocuments: number;
  storageStats: DocumentStorageStats | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  searchQuery: string;
  selectedCategory: string;
  selectedStatus: string;
  isUploadOpen: boolean;
  selectedDocument: DocumentItem | null;

  fetchDocuments: (workspaceId?: string) => Promise<void>;
  fetchStorageStats: (workspaceId?: string) => Promise<void>;
  uploadDocument: (
    file: File,
    metadata?: { title?: string; description?: string; category?: string; visibility?: string },
    workspaceId?: string
  ) => Promise<DocumentItem>;
  deleteDocument: (id: string, workspaceId?: string) => Promise<void>;
  renameDocument: (id: string, title: string) => Promise<void>;
  downloadDocument: (id: string, filename: string, workspaceId?: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedStatus: (status: string) => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  selectDocument: (doc: DocumentItem | null) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  totalDocuments: 0,
  storageStats: null,
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  searchQuery: "",
  selectedCategory: "all",
  selectedStatus: "all",
  isUploadOpen: false,
  selectedDocument: null,

  fetchStorageStats: async (workspaceId?: string) => {
    try {
      const { contextStorage } = await import("@/lib/api-client");
      const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;
      const stats = await documentsApi.getStorageSummary(resolvedWsId);
      set({ storageStats: stats });

      // Also refresh file store stats and dashboard store stats for global widgets
      useFileStore.getState().fetchStorageStats(resolvedWsId);
      const { useDashboardStore } = await import("@/stores/dashboard-store");
      useDashboardStore.getState().fetchSummary(resolvedWsId);
    } catch {
      // Keep existing state if error
    }
  },


  fetchDocuments: async (workspaceId?: string) => {
    set({ isLoading: true });
    try {
      const { contextStorage } = await import("@/lib/api-client");
      const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;

      const { searchQuery, selectedCategory, selectedStatus } = get();
      const res = await documentsApi.list(
        resolvedWsId,
        1,
        100,
        searchQuery,
        selectedCategory,
        selectedStatus
      );

      set({
        documents: res.items || [],
        totalDocuments: res.total_items || 0,
        isLoading: false,
      });

      // Fetch fresh storage stats from backend
      await get().fetchStorageStats(resolvedWsId);
    } catch {
      set({ documents: [], totalDocuments: 0, isLoading: false });
    }
  },

  uploadDocument: async (file, metadata = {}, workspaceId) => {
    set({ isUploading: true, uploadProgress: 25 });
    try {
      const { contextStorage } = await import("@/lib/api-client");
      const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;

      set({ uploadProgress: 60 });
      const created = await documentsApi.upload({
        file,
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        visibility: metadata.visibility,
        workspaceId: resolvedWsId,
      });

      set({ uploadProgress: 100, isUploading: false, isUploadOpen: false });

      // Refresh list & storage stats after upload
      await get().fetchDocuments(resolvedWsId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("neurodesk:data_changed"));
      }
      return created;
    } catch (err) {
      set({ isUploading: false, uploadProgress: 0 });
      throw err;
    }
  },

  deleteDocument: async (id, workspaceId) => {
    const { contextStorage } = await import("@/lib/api-client");
    const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;

    try {
      await documentsApi.delete(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        totalDocuments: Math.max(0, state.totalDocuments - 1),
        selectedDocument: state.selectedDocument?.id === id ? null : state.selectedDocument,
      }));
    } catch (err) {
      throw err;
    }
    await get().fetchDocuments(resolvedWsId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("neurodesk:data_changed"));
    }
  },

  renameDocument: async (id, title) => {
    try {
      const updated = await documentsApi.update(id, { title });
      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? { ...d, title: updated.title } : d)),
        selectedDocument: state.selectedDocument?.id === id ? { ...state.selectedDocument, title: updated.title } : state.selectedDocument,
      }));
    } catch (err) {
      throw err;
    }
  },

  downloadDocument: async (id, filename, workspaceId) => {
    const { contextStorage } = await import("@/lib/api-client");
    const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;
    await documentsApi.download(id, filename, resolvedWsId);
  },

  toggleFavorite: async (id) => {
    try {
      const updated = await documentsApi.toggleFavorite(id);
      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? { ...d, is_favorite: updated.is_favorite } : d)),
      }));
    } catch {
      // fallback toggle
      set((state) => ({
        documents: state.documents.map((d) => (d.id === id ? { ...d, is_favorite: !d.is_favorite } : d)),
      }));
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  openUploadModal: () => set({ isUploadOpen: true }),
  closeUploadModal: () => set({ isUploadOpen: false, isUploading: false, uploadProgress: 0 }),
  selectDocument: (doc) => set({ selectedDocument: doc }),
}));
