/**
 * dashboard-api.ts
 * Maps real backend endpoints to dashboard statistics and activity telemetry.
 */

import { apiClient, contextStorage } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface DashboardSummaryResponse {
  workspaces: number;
  files: number;
  documents: number;
  datasets: number;
  teamMembers: number;
  storageUsedBytes: number;
  storageRemainingBytes: number;
  capacityBytes: number;
  storageUsedFormatted: string;
  storageRemainingFormatted: string;
  capacityFormatted: string;
  recentUploads: number;
  intelligenceSummary: string;
}

export type DashboardStats = DashboardSummaryResponse;


export interface ActivityItem {
  id: string;
  user_id?: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  ip_address?: string;
}

export interface ActivityResponse {
  items: ActivityItem[];
  total: number;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const dashboardApi = {
  /**
   * GET /api/v1/dashboard/summary
   * Unified endpoint returning real-time metrics for workspaces, files, documents, datasets,
   * storage used/remaining, team members, and intelligence summary.
   */
  async getSummary(workspaceId?: string): Promise<DashboardSummaryResponse> {
    const headers: Record<string, string> = {};
    const wsId = workspaceId ?? contextStorage.getWorkspaceId();
    if (wsId) headers["X-Workspace-ID"] = wsId;
    return apiClient.get<DashboardSummaryResponse>("/dashboard/summary", headers);
  },

  /**
   * GET /api/v1/workspaces?limit=1
   */
  async getWorkspaceStats(): Promise<{ total: number }> {
    const res = await apiClient.get<{ items: unknown[]; total: number }>(
      "/workspaces?limit=1"
    );
    return { total: res.total ?? 0 };
  },

  /**
   * GET /api/v1/files?limit=1
   */
  async getFilesStats(): Promise<{ total: number }> {
    const res = await apiClient.get<{ items: unknown[]; total: number }>(
      "/files?limit=1"
    );
    return { total: res.total ?? 0 };
  },

  /**
   * GET /api/v1/files/analytics
   */
  async getFilesAnalytics(): Promise<{
    total_files: number;
    total_size_bytes: number;
    by_type: Record<string, { count: number; size_bytes: number }>;
  }> {
    return apiClient.get("/files/analytics");
  },

  /**
   * GET /api/v1/documents?limit=1
   */
  async getDocumentsStats(): Promise<{ total: number }> {
    const res = await apiClient.get<{ items: unknown[]; total: number }>(
      "/documents?limit=1"
    );
    return { total: res.total ?? 0 };
  },

  /**
   * GET /api/v1/datasets?limit=1
   */
  async getDatasetsStats(): Promise<{ total: number }> {
    const res = await apiClient.get<{ items: unknown[]; total: number }>(
      "/datasets?limit=1"
    );
    return { total: res.total ?? 0 };
  },

  /**
   * GET /api/v1/jobs/statistics
   */
  async getJobsStats(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    return apiClient.get("/jobs/statistics");
  },

  /**
   * GET /api/v1/activity?limit=N&offset=0
   */
  async getActivity(limit = 10, offset = 0): Promise<ActivityResponse> {
    return apiClient.get<ActivityResponse>(
      `/activity?limit=${limit}&offset=${offset}`
    );
  },
};
