import { create } from "zustand";
import { FileItem, ViewMode, SortField, SortOrder, FileTypeFilter } from "../types";
import { filesApi } from "@/services/files-api";
import { workspaceApi, WorkspaceStorageResponse } from "@/services/workspace-api";
import { formatBytes } from "@/lib/utils";

interface FileState {
  files: FileItem[];
  viewMode: ViewMode;
  searchQuery: string;
  filterType: FileTypeFilter;
  sortField: SortField;
  sortOrder: SortOrder;
  selectedFile: FileItem | null;
  isPreviewOpen: boolean;
  isUploadOpen: boolean;
  isLoading: boolean;
  storageStats: WorkspaceStorageResponse | null;
  fetchFiles: (workspaceId?: string) => Promise<void>;
  fetchStorageStats: (workspaceId?: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (filter: FileTypeFilter) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  selectFile: (file: FileItem) => void;
  clearSelectedFile: () => void;
  openPreviewDrawer: (file: FileItem) => void;
  closePreviewDrawer: () => void;
  openUploadDialog: () => void;
  closeUploadDialog: () => void;
  toggleFavoriteFile: (id: string) => void;
  deleteFile: (id: string, workspaceId?: string) => Promise<void>;
  renameFile: (id: string, newName: string) => void;
  duplicateFile: (id: string) => void;
  uploadFile: (fileObj: File, workspaceId?: string) => Promise<void>;
  downloadFile: (id: string, name: string) => Promise<void>;
}

function mapContentTypeToType(contentType: string, name: string): FileItem["type"] {
  const ext = name.split(".").pop() || "";
  if (contentType.includes("pdf") || ext === "pdf") return "pdf";
  if (contentType.includes("image") || ["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) return "image";
  if (contentType.includes("video") || ["mp4", "mov", "webm"].includes(ext)) return "video";
  if (contentType.includes("json") || contentType.includes("javascript") || ["ts", "tsx", "js", "py", "json"].includes(ext)) return "code";
  if (contentType.includes("zip") || contentType.includes("tar") || ["zip", "tar", "gz"].includes(ext)) return "archive";
  return "doc";
}

function formatSize(bytes: number): string {
  return formatBytes(bytes);
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  viewMode: "grid",
  searchQuery: "",
  filterType: "all",
  sortField: "modifiedDate",
  sortOrder: "desc",
  selectedFile: null,
  isPreviewOpen: false,
  isUploadOpen: false,
  isLoading: false,
  storageStats: null,

  fetchStorageStats: async (workspaceId?: string) => {
    try {
      const { contextStorage } = await import("@/lib/api-client");
      const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;
      const stats = await workspaceApi.getStorage(resolvedWsId);
      set({ storageStats: stats });
    } catch {
      // fallback — keep existing stats if network error
    }
  },

  fetchFiles: async (workspaceId?: string) => {
    set({ isLoading: true });
    try {
      // Resolve workspace: prefer explicit arg, then contextStorage (localStorage persisted)
      const { contextStorage } = await import("@/lib/api-client");
      const resolvedWsId = workspaceId ?? contextStorage.getWorkspaceId() ?? undefined;

      const res = await filesApi.list(resolvedWsId, undefined, 100, 0);
      const mapped: FileItem[] = (res.items || []).map((f) => {
        const fileName = f.name || f.original_name || f.stored_name || f.filename || f.original_filename || "Unnamed File";
        const ext = f.extension || fileName.split(".").pop() || "";
        const sizeInBytes = typeof f.size === "number" ? f.size : typeof f.size_bytes === "number" ? f.size_bytes : 0;
        const mime = f.mime_type || f.content_type || "";

        return {
          id: f.id,
          name: fileName,
          type: mapContentTypeToType(mime, fileName),
          extension: ext,
          size: formatSize(sizeInBytes),
          sizeBytes: sizeInBytes,
          owner: {
            name: "Workspace Member",
          },
          createdDate: f.created_at ? new Date(f.created_at).toLocaleDateString() : "Recently",
          modifiedDate: f.updated_at ? new Date(f.updated_at).toLocaleDateString() : "Recently",
          isFavorite: false,
          isShared: Boolean(f.is_public),
          status: "Synced" as const,
          tags: f.tags || [],
          description: `Uploaded file (${mime || ext}).`,
        };
      });
      set({ files: mapped });
      await get().fetchStorageStats(resolvedWsId);
    } catch {
      set({ files: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (filter) => set({ filterType: filter }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSortOrder: () => set((state) => ({ sortOrder: state.sortOrder === "asc" ? "desc" : "asc" })),

  selectFile: (file) => set({ selectedFile: file }),
  clearSelectedFile: () => set({ selectedFile: null }),

  openPreviewDrawer: (file) => set({ selectedFile: file, isPreviewOpen: true }),
  closePreviewDrawer: () => set({ isPreviewOpen: false }),

  openUploadDialog: () => set({ isUploadOpen: true }),
  closeUploadDialog: () => set({ isUploadOpen: false }),

  toggleFavoriteFile: (id) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, isFavorite: !f.isFavorite } : f)),
      selectedFile: state.selectedFile?.id === id ? { ...state.selectedFile, isFavorite: !state.selectedFile.isFavorite } : state.selectedFile,
    })),

  deleteFile: async (id: string, workspaceId?: string) => {
    try {
      await filesApi.delete(id);
    } catch {
      // API call failure fallback
    }
    set((state) => {
      const remainingFiles = state.files.filter((f) => f.id !== id);
      const targetFile = state.files.find((f) => f.id === id);
      const deletedBytes = targetFile?.sizeBytes || 0;

      const currentStats = state.storageStats;
      const updatedTotalFiles = Math.max(0, (currentStats?.totalFiles ?? remainingFiles.length + 1) - 1);
      const updatedUsedBytes = Math.max(0, (currentStats?.usedBytes ?? 0) - deletedBytes);
      const capacityMB = currentStats?.capacityMB ?? 10240;
      const capacityBytes = capacityMB * 1024 * 1024;
      const updatedRemainingMB = Math.max(0, (capacityBytes - updatedUsedBytes) / (1024 * 1024));
      const updatedPercentage = Math.min(100, (updatedUsedBytes / capacityBytes) * 100);

      const updatedStats: WorkspaceStorageResponse = {
        workspaceId: workspaceId || currentStats?.workspaceId || "",
        totalFiles: updatedTotalFiles,
        usedBytes: updatedUsedBytes,
        usedKB: updatedUsedBytes / 1024,
        usedMB: updatedUsedBytes / (1024 * 1024),
        capacityMB: capacityMB,
        remainingMB: updatedRemainingMB,
        percentageUsed: updatedPercentage,
        usedFormatted: formatBytes(updatedUsedBytes),
        remainingFormatted: formatBytes(capacityBytes - updatedUsedBytes),
        capacityFormatted: formatBytes(capacityBytes),
      };

      return {
        files: remainingFiles,
        selectedFile: state.selectedFile?.id === id ? null : state.selectedFile,
        isPreviewOpen: state.selectedFile?.id === id ? false : state.isPreviewOpen,
        storageStats: updatedStats,
      };
    });
    await get().fetchStorageStats(workspaceId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("neurodesk:data_changed"));
    }
    try {
      const { useDashboardStore } = await import("@/stores/dashboard-store");
      useDashboardStore.getState().fetchSummary(workspaceId);
    } catch {
      // ignore
    }
  },

  renameFile: (id, newName) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, name: newName } : f)),
      selectedFile: state.selectedFile?.id === id ? { ...state.selectedFile, name: newName } : state.selectedFile,
    })),

  duplicateFile: (id) =>
    set((state) => {
      const target = state.files.find((f) => f.id === id);
      if (!target) return state;
      const copy: FileItem = {
        ...target,
        id: `file_${Date.now()}`,
        name: `Copy of ${target.name}`,
        createdDate: "Just now",
        modifiedDate: "Just now",
      };
      return { files: [copy, ...state.files] };
    }),

  uploadFile: async (fileObj: File, workspaceId?: string) => {
    await filesApi.upload({
      file: fileObj,
      workspace_id: workspaceId,
    });
    await get().fetchFiles(workspaceId);
    await get().fetchStorageStats(workspaceId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("neurodesk:data_changed"));
    }
    try {
      const { useDashboardStore } = await import("@/stores/dashboard-store");
      useDashboardStore.getState().fetchSummary(workspaceId);
    } catch {
      // ignore
    }
  },

  downloadFile: async (id: string, name: string) => {
    await filesApi.downloadFile(id, name);
  },
}));

