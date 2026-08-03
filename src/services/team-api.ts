/**
 * team-api.ts
 * Team and member management via the FastAPI backend.
 */

import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────────────────

export type MemberRole = "owner" | "admin" | "member" | "viewer";
export type MemberStatus = "active" | "pending" | "suspended";

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  avatar_url?: string;
  joined_at: string;
  last_active_at?: string;
}

export interface Team {
  id: string;
  name: string;
  workspace_id: string;
  description?: string;
  member_count: number;
  created_at: string;
}

export interface TeamsResponse {
  items: Team[];
  total: number;
}

export interface MembersResponse {
  items: TeamMember[];
  total: number;
}

export interface InviteMemberPayload {
  email: string;
  role: MemberRole;
  workspace_id: string;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const teamApi = {
  /**
   * GET /api/v1/teams?workspace_id=...&limit=20&offset=0
   */
  async listTeams(workspaceId?: string, limit = 20, offset = 0): Promise<TeamsResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (workspaceId) params.set("workspace_id", workspaceId);
    return apiClient.get<TeamsResponse>(`/teams?${params}`);
  },

  /**
   * GET /api/v1/teams/:id/members?limit=50&offset=0
   */
  async listMembers(teamId: string, limit = 50, offset = 0): Promise<MembersResponse> {
    return apiClient.get<MembersResponse>(
      `/teams/${teamId}/members?limit=${limit}&offset=${offset}`
    );
  },

  /**
   * POST /api/v1/teams/invite
   * Invite a user to a workspace by email.
   */
  async inviteMember(payload: InviteMemberPayload): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/teams/invite", payload);
  },

  /**
   * PATCH /api/v1/teams/members/:memberId/role
   * Update a member's role.
   */
  async updateMemberRole(
    memberId: string,
    role: MemberRole
  ): Promise<TeamMember> {
    return apiClient.patch<TeamMember>(`/teams/members/${memberId}/role`, {
      role,
    });
  },

  /**
   * DELETE /api/v1/teams/members/:memberId
   * Remove a member from a team/workspace.
   */
  async removeMember(memberId: string): Promise<void> {
    return apiClient.delete<void>(`/teams/members/${memberId}`);
  },
};
