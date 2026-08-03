import { apiClient } from "./api";

export interface ReportAttachment {
  id: string;
  report_id: string;
  workspace_id: string;
  uploader_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface ReportComment {
  id: string;
  report_id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReportActivity {
  id: string;
  report_id: string;
  workspace_id: string;
  actor_id: string;
  actor_name?: string;
  activity_type: string;
  message: string;
  created_at: string;
}

export interface Report {
  id: string;
  workspace_id: string;
  author_id: string;
  author_name?: string;
  author_email?: string;
  author_avatar?: string;
  reviewer_id?: string;
  reviewer_name?: string;

  title: string;
  category: string;
  content: string;
  status: string;
  deadline?: string;
  reviewed_at?: string;
  reviewer_feedback?: string;
  ai_summary?: string;

  created_at: string;
  updated_at: string;

  attachment_count: number;
  comment_count: number;

  attachments: ReportAttachment[];
  comments: ReportComment[];
  activities: ReportActivity[];
}

export interface CreateReportPayload {
  title: string;
  category: string;
  content: string;
  deadline?: string;
  status?: string;
}

export interface UpdateReportStatusPayload {
  status: string;
  feedback?: string;
}

export interface ReportAnalytics {
  total_reports: number;
  pending_review: number;
  approved: number;
  rejected: number;
  needs_changes: number;
  completion_rate: number;
  category_counts: Record<string, number>;
}

export const reportApi = {
  createReport: async (workspaceId: string, payload: CreateReportPayload): Promise<Report> => {
    return apiClient.post<Report>(`/workspaces/${workspaceId}/reports`, payload);
  },

  listWorkspaceReports: async (
    workspaceId: string,
    params?: { category?: string; status?: string; search?: string }
  ): Promise<Report[]> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);

    const queryStr = searchParams.toString();
    const endpoint = `/workspaces/${workspaceId}/reports${queryStr ? `?${queryStr}` : ""}`;
    return apiClient.get<Report[]>(endpoint);
  },

  getWorkspaceReportAnalytics: async (workspaceId: string): Promise<ReportAnalytics> => {
    return apiClient.get<ReportAnalytics>(`/workspaces/${workspaceId}/reports/analytics`);
  },

  getReportDetails: async (reportId: string): Promise<Report> => {
    return apiClient.get<Report>(`/reports/${reportId}`);
  },

  updateReportStatus: async (reportId: string, payload: UpdateReportStatusPayload): Promise<Report> => {
    return apiClient.patch<Report>(`/reports/${reportId}/status`, payload);
  },

  addAttachment: async (
    reportId: string,
    payload: { file_name: string; file_path: string; file_size: number; file_type: string }
  ): Promise<ReportAttachment> => {
    return apiClient.post<ReportAttachment>(`/reports/${reportId}/attachments`, payload);
  },

  addComment: async (reportId: string, payload: { content: string; parent_id?: string }): Promise<ReportComment> => {
    return apiClient.post<ReportComment>(`/reports/${reportId}/comments`, payload);
  },

  generateAISummary: async (reportId: string): Promise<{ report_id: string; ai_summary: string }> => {
    return apiClient.post<{ report_id: string; ai_summary: string }>(`/reports/${reportId}/summarize`);
  },
};
