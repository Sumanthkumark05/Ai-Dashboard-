import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { TeamMember, UserRole } from "../types";
import { initialTeamMembers } from "../mock/team-mock-data";

interface TeamState {
  members: TeamMember[];
  searchQuery: string;
  roleFilter: string;
  departmentFilter: string;
  statusFilter: string;
  selectedMember: TeamMember | null;
  isProfileOpen: boolean;
  isInviteOpen: boolean;
  isLoading: boolean;

  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: string) => void;
  setDepartmentFilter: (department: string) => void;
  setStatusFilter: (status: string) => void;
  selectMember: (member: TeamMember) => void;
  clearSelectedMember: () => void;
  openProfileDrawer: (member: TeamMember) => void;
  closeProfileDrawer: () => void;
  openInviteDialog: () => void;
  closeInviteDialog: () => void;
  updateMemberRole: (id: string, role: UserRole) => void;
  addTeamMember: (memberData: Omit<TeamMember, "id" | "joinedDate" | "lastActive" | "status" | "phone" | "location" | "skills" | "bio" | "projects">) => void;
  removeMember: (id: string) => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      members: initialTeamMembers,
      searchQuery: "",
      roleFilter: "all",
      departmentFilter: "all",
      statusFilter: "all",
      selectedMember: null,
      isProfileOpen: false,
      isInviteOpen: false,
      isLoading: false,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setRoleFilter: (role) => set({ roleFilter: role }),
      setDepartmentFilter: (department) => set({ departmentFilter: department }),
      setStatusFilter: (status) => set({ statusFilter: status }),

      selectMember: (member) => set({ selectedMember: member }),
      clearSelectedMember: () => set({ selectedMember: null }),

      openProfileDrawer: (member) => set({ selectedMember: member, isProfileOpen: true }),
      closeProfileDrawer: () => set({ isProfileOpen: false }),

      openInviteDialog: () => set({ isInviteOpen: true }),
      closeInviteDialog: () => set({ isInviteOpen: false }),

      updateMemberRole: (id, role) =>
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, role } : m)),
          selectedMember: state.selectedMember?.id === id ? { ...state.selectedMember, role } : state.selectedMember,
        })),

      addTeamMember: (memberData) => {
        const newMember: TeamMember = {
          ...memberData,
          id: `mem_${Date.now()}`,
          status: "online",
          phone: "+1 (555) 000-1122",
          location: "Remote",
          skills: ["Collaboration", "Agile"],
          bio: "Recently invited workspace team member.",
          joinedDate: "Just now",
          lastActive: "Just now",
          projects: ["AGY Multi-Agent Orchestration"],
        };

        set((state) => ({
          members: [newMember, ...state.members],
        }));
      },

      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
          selectedMember: state.selectedMember?.id === id ? null : state.selectedMember,
          isProfileOpen: state.selectedMember?.id === id ? false : state.isProfileOpen,
        })),
    }),
    {
      name: "neurodesk_team_manager_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ roleFilter: state.roleFilter, departmentFilter: state.departmentFilter }),
    }
  )
);
