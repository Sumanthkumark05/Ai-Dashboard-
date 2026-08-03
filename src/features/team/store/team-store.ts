import { create } from "zustand";
import { TeamMember, UserRole } from "../types";
import { teamApi } from "@/services/team-api";

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

  fetchMembers: () => Promise<void>;
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
  updateMemberRole: (id: string, role: UserRole) => Promise<void>;
  inviteMember: (email: string, role: UserRole, workspaceId: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  searchQuery: "",
  roleFilter: "all",
  departmentFilter: "all",
  statusFilter: "all",
  selectedMember: null,
  isProfileOpen: false,
  isInviteOpen: false,
  isLoading: false,

  fetchMembers: async () => {
    set({ isLoading: true });
    try {
      const teamsRes = await teamApi.listTeams(undefined, 1, 0);
      const firstTeam = teamsRes.items?.[0];
      if (firstTeam) {
        const membersRes = await teamApi.listMembers(firstTeam.id, 50, 0);
        const mappedMembers: TeamMember[] = (membersRes.items || []).map((m) => ({
          id: m.id,
          name: m.full_name || m.email,
          email: m.email,
          role: (m.role as UserRole) || "Member",
          department: "Engineering",
          status: m.status === "active" ? "online" : "offline",
          joinedDate: m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "Recently",
          lastActive: m.last_active_at ? new Date(m.last_active_at).toLocaleDateString() : "Active recently",
          avatarUrl: m.avatar_url,
          phone: "+1 (555) 000-0000",
          location: "Remote",
          skills: ["Engineering", "SaaS"],
          bio: "Workspace team member.",
          projects: ["NeuroDesk Platform"],
        }));
        set({ members: mappedMembers });
      } else {
        set({ members: [] });
      }
    } catch {
      set({ members: [] });
    } finally {
      set({ isLoading: false });
    }
  },

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

  updateMemberRole: async (id, role) => {
    try {
      await teamApi.updateMemberRole(id, role.toLowerCase() as "owner" | "admin" | "member" | "viewer");
      set((state) => ({
        members: state.members.map((m) => (m.id === id ? { ...m, role } : m)),
        selectedMember: state.selectedMember?.id === id ? { ...state.selectedMember, role } : state.selectedMember,
      }));
    } catch {
      // update local fallback
    }
  },

  inviteMember: async (email, role, workspaceId) => {
    await teamApi.inviteMember({
      email,
      role: role.toLowerCase() as "owner" | "admin" | "member" | "viewer",
      workspace_id: workspaceId,
    });
    await get().fetchMembers();
  },

  removeMember: async (id) => {
    try {
      await teamApi.removeMember(id);
    } catch {
      // handle error
    }
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
      selectedMember: state.selectedMember?.id === id ? null : state.selectedMember,
      isProfileOpen: state.selectedMember?.id === id ? false : state.isProfileOpen,
    }));
  },
}));
