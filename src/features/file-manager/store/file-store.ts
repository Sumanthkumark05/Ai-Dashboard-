import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { FileItem, ViewMode, SortField, SortOrder, FileTypeFilter } from "../types";
import { initialMockFiles } from "../mock/file-mock-data";

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
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  duplicateFile: (id: string) => void;
  addMockUploadedFile: (name: string, sizeBytes: number) => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      files: initialMockFiles,
      viewMode: "grid",
      searchQuery: "",
      filterType: "all",
      sortField: "modifiedDate",
      sortOrder: "desc",
      selectedFile: null,
      isPreviewOpen: false,
      isUploadOpen: false,
      isLoading: false,

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

      deleteFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
          selectedFile: state.selectedFile?.id === id ? null : state.selectedFile,
          isPreviewOpen: state.selectedFile?.id === id ? false : state.isPreviewOpen,
        })),

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

      addMockUploadedFile: (name, sizeBytes) => {
        const ext = name.split(".").pop() || "txt";
        let type: FileItem["type"] = "doc";
        if (["pdf"].includes(ext)) type = "pdf";
        if (["ts", "tsx", "js", "py", "json", "css", "html"].includes(ext)) type = "code";
        if (["png", "jpg", "jpeg", "svg"].includes(ext)) type = "image";
        if (["mp4", "mov", "webm"].includes(ext)) type = "video";
        if (["zip", "tar", "gz"].includes(ext)) type = "archive";

        const formattedSize =
          sizeBytes > 1048576
            ? `${(sizeBytes / 1048576).toFixed(1)} MB`
            : `${(sizeBytes / 1024).toFixed(0)} KB`;

        const newFile: FileItem = {
          id: `file_${Date.now()}`,
          name,
          type,
          extension: ext,
          size: formattedSize,
          sizeBytes,
          owner: {
            name: "Alex Vance",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          },
          createdDate: "Just now",
          modifiedDate: "Just now",
          isFavorite: false,
          isShared: false,
          status: "Synced",
          tags: ["Uploaded"],
          description: "Recently uploaded workspace file.",
        };

        set((state) => ({
          files: [newFile, ...state.files],
        }));
      },
    }),
    {
      name: "neurodesk_file_manager_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ viewMode: state.viewMode, sortField: state.sortField, sortOrder: state.sortOrder }),
    }
  )
);
