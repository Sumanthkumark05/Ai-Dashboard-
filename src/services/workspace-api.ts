import { apiClient } from "@/lib/api-client";

export type WorkspaceVisibility = "private" | "team" | "internal";
export type WorkspaceStatus = "active" | "archived" | "suspended";

export interface Workspace {
  id: string;
  organization_id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: WorkspaceVisibility;
  status?: WorkspaceStatus;
  created_by?: string;
  storage_used?: number;
  storage_limit?: number;
  dataset_count?: number;
  document_count?: number;
  chat_count?: number;
  member_count?: number;
  default_model?: string;
  role?: string;
  project_type?: "internal" | "client";
  client_name?: string;
  project_name?: string;
  start_date?: string;
  end_date?: string;
  client_demo_date?: string;
  internal_review_date?: string;
  final_delivery_date?: string;
  reminder_before_demo?: string;
  reminder_before_deadline?: string;
  meeting_duration?: number;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  last_activity?: string;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  theme_color?: string;
  visibility?: WorkspaceVisibility;
  slug?: string;
  project_type?: "internal" | "client";
  client_name?: string;
  project_name?: string;
  start_date?: string;
  end_date?: string;
  client_demo_date?: string;
  internal_review_date?: string;
  final_delivery_date?: string;
  reminder_before_demo?: string;
  reminder_before_deadline?: string;
  meeting_duration?: number;
  priority?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: WorkspaceVisibility;
  default_model?: string;
  storage_limit?: number;
  status?: WorkspaceStatus;
  project_type?: "internal" | "client";
  client_name?: string;
  project_name?: string;
  start_date?: string;
  end_date?: string;
  client_demo_date?: string;
  internal_review_date?: string;
  final_delivery_date?: string;
  reminder_before_demo?: string;
  reminder_before_deadline?: string;
  meeting_duration?: number;
  priority?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "MEMBER" | "VIEWER";
  status: string;
  joined_at?: string;
}

export const workspaceApi = {
  /**
   * GET /api/v1/workspaces
   */
  async list(): Promise<Workspace[]> {
    return apiClient.get<Workspace[]>("/workspaces");
  },

  /**
   * GET /api/v1/workspaces/:id
   */
  async get(id: string): Promise<Workspace> {
    return apiClient.get<Workspace>(`/workspaces/${id}`);
  },

  /**
   * POST /api/v1/workspaces
   */
  async create(payload: CreateWorkspacePayload): Promise<Workspace> {
    return apiClient.post<Workspace>("/workspaces", payload);
  },

  /**
   * PATCH /api/v1/workspaces/:id
   */
  async update(id: string, payload: UpdateWorkspacePayload): Promise<Workspace> {
    return apiClient.patch<Workspace>(`/workspaces/${id}`, payload);
  },

  /**
   * DELETE /api/v1/workspaces/:id
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/workspaces/${id}`);
  },

  /**
   * POST /api/v1/workspaces/switch
   */
  async switchWorkspace(workspace_id: string): Promise<Workspace> {
    return apiClient.post<Workspace>("/workspaces/switch", { workspace_id });
  },

  /**
   * GET /api/v1/workspaces/:id/members
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
  },

  /**
   * POST /api/v1/workspaces/:id/members
   */
  async addMember(
    workspaceId: string,
    payload: { user_id?: string; email?: string; role: string }
  ): Promise<WorkspaceMember> {
    return apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, payload);
  },

  /**
   * DELETE /api/v1/workspaces/:id/members/:memberId
   */
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    return apiClient.delete<void>(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  /**
   * GET /api/v1/workspaces/:id/storage
   */
  async getStorage(workspaceId?: string): Promise<WorkspaceStorageResponse> {
    const endpoint = workspaceId ? `/workspaces/${workspaceId}/storage` : "/workspaces/storage";
    return apiClient.get<WorkspaceStorageResponse>(endpoint);
  },
};

export interface WorkspaceStorageResponse {
  workspaceId: string;
  totalFiles: number;
  usedBytes: number;
  usedKB?: number;
  usedMB: number;
  capacityMB: number;
  remainingMB: number;
  percentageUsed: number;
  usedFormatted?: string;
  remainingFormatted?: string;
  capacityFormatted?: string;
}
