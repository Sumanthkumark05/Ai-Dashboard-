import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { WorkspaceFolder, WorkspacePage, WorkspaceViewMode } from "../types";
import { initialWorkspaceFolders, initialWorkspacePages } from "../mock/workspace-mock-data";

interface WorkspaceState {
  folders: WorkspaceFolder[];
  pages: WorkspacePage[];
  selectedPageId: string;
  viewMode: WorkspaceViewMode;
  searchQuery: string;
  isSidebarOpen: boolean;
  isInfoPanelOpen: boolean;
  expandedFolders: Record<string, boolean>;
  isLoading: boolean;

  selectPage: (id: string) => void;
  setViewMode: (mode: WorkspaceViewMode) => void;
  setSearchQuery: (query: string) => void;
  toggleFolderExpand: (folderId: string) => void;
  toggleFavouritePage: (id: string) => void;
  toggleSidebar: () => void;
  toggleInfoPanel: () => void;
  updatePageContent: (id: string, content: string) => void;
  renamePage: (id: string, title: string) => void;
  deletePage: (id: string) => void;
  createPage: (title: string, folderId?: string, initialContent?: string) => void;
  createFolder: (name: string) => void;
  createFromTemplate: (templateName: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      folders: initialWorkspaceFolders,
      pages: initialWorkspacePages,
      selectedPageId: initialWorkspacePages[0].id,
      viewMode: "tree",
      searchQuery: "",
      isSidebarOpen: true,
      isInfoPanelOpen: true,
      expandedFolders: { fld_1: true, fld_2: true, fld_3: false },
      isLoading: false,

      selectPage: (id) => set({ selectedPageId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleFolderExpand: (folderId) =>
        set((state) => ({
          expandedFolders: {
            ...state.expandedFolders,
            [folderId]: !state.expandedFolders[folderId],
          },
        })),

      toggleFavouritePage: (id) =>
        set((state) => ({
          pages: state.pages.map((p) => (p.id === id ? { ...p, isFavourite: !p.isFavourite } : p)),
        })),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleInfoPanel: () => set((state) => ({ isInfoPanelOpen: !state.isInfoPanelOpen })),

      updatePageContent: (id, content) =>
        set((state) => {
          const plainText = content.replace(/<[^>]+>/g, " ");
          const words = plainText.trim().split(/\s+/).filter(Boolean).length;
          const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

          return {
            pages: state.pages.map((p) =>
              p.id === id
                ? {
                    ...p,
                    content,
                    wordCount: words,
                    readingTime: readTime,
                    updatedDate: "Just now",
                  }
                : p
            ),
          };
        }),

      renamePage: (id, title) =>
        set((state) => ({
          pages: state.pages.map((p) => (p.id === id ? { ...p, title, updatedDate: "Just now" } : p)),
        })),

      deletePage: (id) =>
        set((state) => {
          const remainingPages = state.pages.filter((p) => p.id !== id);
          return {
            pages: remainingPages,
            selectedPageId: state.selectedPageId === id && remainingPages.length > 0 ? remainingPages[0].id : state.selectedPageId,
          };
        }),

      createPage: (title, folderId, initialContent = "") => {
        const newId = `pg_${Date.now()}`;
        const newPage: WorkspacePage = {
          id: newId,
          title: title || "Untitled Document",
          icon: "📄",
          folderId,
          content: initialContent || `<h1>${title || "Untitled Document"}</h1><p>Start writing your notes...</p>`,
          createdBy: "Alex Vance",
          createdDate: "Today",
          updatedDate: "Just now",
          tags: ["Draft"],
          isFavourite: false,
          isPinned: false,
          wordCount: 10,
          readingTime: "1 min read",
        };

        set((state) => ({
          pages: [newPage, ...state.pages],
          selectedPageId: newId,
        }));
      },

      createFolder: (name) => {
        const newFolder: WorkspaceFolder = {
          id: `fld_${Date.now()}`,
          name: name || "New Folder",
          icon: "📁",
          isExpanded: true,
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
          expandedFolders: { ...state.expandedFolders, [newFolder.id]: true },
        }));
      },

      createFromTemplate: (templateName) => {
        const templates: Record<string, { title: string; content: string; icon: string }> = {
          "Meeting Notes": {
            title: "Weekly Engineering Standup Notes",
            icon: "📝",
            content: "<h1>Weekly Engineering Standup</h1><h2>Attendees</h2><ul><li>Alex Vance</li><li>Sarah Chen</li></ul><h2>Agenda</h2><ol><li>Review AGY SDK deployment</li><li>Address production token latency</li></ol>",
          },
          "Project Plan": {
            title: "Q3 AI SaaS Product Roadmap",
            icon: "🚀",
            content: "<h1>Q3 Product Roadmap Plan</h1><h2>Milestones</h2><ul><li>Module 12 Workspace Release</li><li>Recharts Telemetry Optimization</li></ul>",
          },
          "Research Notes": {
            title: "Vector DB Performance Analysis",
            icon: "🔬",
            content: "<h1>Vector Database Performance</h1><p>Benchmarking pgvector HNSW index queries against Qdrant cloud endpoints.</p>",
          },
          "Daily Journal": {
            title: "Daily Engineering Log",
            icon: "📔",
            content: "<h1>Daily Engineering Journal</h1><p>Today's completed tasks, blockers, and tomorrow's focus areas.</p>",
          },
          "Brainstorm": {
            title: "AI Feature Brainstorm Session",
            icon: "💡",
            content: "<h1>AI Feature Ideas</h1><ul><li>Automated code refactoring agent</li><li>Real-time token streaming visualization</li></ul>",
          },
        };

        const tpl = templates[templateName] || {
          title: templateName,
          icon: "📄",
          content: `<h1>${templateName}</h1><p>Document template notes...</p>`,
        };

        get().createPage(tpl.title, undefined, tpl.content);
      },
    }),
    {
      name: "neurodesk_workspace_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ selectedPageId: state.selectedPageId, viewMode: state.viewMode }),
    }
  )
);
