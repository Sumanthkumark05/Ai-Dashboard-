import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Workspace, CreateWorkspacePayload, UpdateWorkspacePayload, workspaceApi } from "@/services/workspace-api";

interface WorkspaceContextState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isCreateModalOpen: boolean;
  isLoading: boolean;
  error: string | null;

  setCreateModalOpen: (open: boolean) => void;
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (payload: CreateWorkspacePayload) => Promise<Workspace>;
  updateWorkspace: (id: string, payload: UpdateWorkspacePayload) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceContextStore = create<WorkspaceContextState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      isCreateModalOpen: false,
      isLoading: false,
      error: null,

      setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const list = await workspaceApi.list();
          const rawWorkspaces = Array.isArray(list) ? list : [];
          // Deduplicate workspaces by unique ID
          const workspaces = Array.from(new Map(rawWorkspaces.map((w) => [w.id, w])).values());

          const current = get().currentWorkspace;
          let activeWs: Workspace | null = null;

          if (workspaces.length > 0) {
            if (current && workspaces.some((w) => w.id === current.id)) {
              activeWs = workspaces.find((w) => w.id === current.id) || workspaces[0];
            } else {
              activeWs = workspaces[0];
            }
          }

          set({ workspaces, currentWorkspace: activeWs, isLoading: false });

          if (activeWs && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("neurodesk:workspace_changed", { detail: { workspace: activeWs } }));
          }
        } catch (err: unknown) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load workspaces",
          });
        }
      },

      setCurrentWorkspace: async (workspaceId: string) => {
        const { workspaces } = get();
        const target = workspaces.find((w) => w.id === workspaceId);
        if (target) {
          set({ currentWorkspace: target });
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("neurodesk:workspace_changed", { detail: { workspace: target } }));
          }
          try {
            await workspaceApi.switchWorkspace(workspaceId);
          } catch {
            // Ignore offline fallback
          }
        }
      },

      createWorkspace: async (payload: CreateWorkspacePayload) => {
        set({ isLoading: true });
        try {
          const created = await workspaceApi.create(payload);
          const updatedList = [created, ...get().workspaces.filter((w) => w.id !== created.id)];
          set({
            workspaces: updatedList,
            currentWorkspace: created,
            isLoading: false,
          });

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("neurodesk:workspace_changed", { detail: { workspace: created } }));
          }

          import("@/stores/dashboard-store").then(({ useDashboardStore }) => {
            useDashboardStore.getState().fetchSummary(created.id);
          }).catch(() => {});

          return created;
        } catch (err: unknown) {
          set({ isLoading: false });
          throw err;
        }
      },

      updateWorkspace: async (id: string, payload: UpdateWorkspacePayload) => {
        set({ isLoading: true });
        try {
          const updated = await workspaceApi.update(id, payload);
          const newWorkspaces = get().workspaces.map((w) => (w.id === id ? updated : w));
          const current = get().currentWorkspace;
          set({
            workspaces: newWorkspaces,
            currentWorkspace: current?.id === id ? updated : current,
            isLoading: false,
          });
          return updated;
        } catch (err: unknown) {
          set({ isLoading: false });
          throw err;
        }
      },

      deleteWorkspace: async (id: string) => {
        set({ isLoading: true });
        try {
          await workspaceApi.delete(id);
          const newWorkspaces = get().workspaces.filter((w) => w.id !== id);
          const current = get().currentWorkspace;
          const nextActive = current?.id === id ? newWorkspaces[0] || null : current;
          set({
            workspaces: newWorkspaces,
            currentWorkspace: nextActive,
            isLoading: false,
          });
          import("@/stores/dashboard-store").then(({ useDashboardStore }) => {
            useDashboardStore.getState().fetchSummary(nextActive?.id);
          }).catch(() => {});
        } catch (err: unknown) {
          set({ isLoading: false });
          throw err;
        }
      },

    }),
    {
      name: "neurodesk_active_workspace_context",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
