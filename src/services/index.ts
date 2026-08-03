// API services & data clients exports

export { dashboardApi } from "./dashboard-api";
export { notificationsApi } from "./notifications-api";
export { workspaceApi } from "./workspace-api";
export { analyticsApi } from "./analytics-api";
export { teamApi } from "./team-api";
export { filesApi } from "./files-api";
export { chatApi } from "./chat-api";
export { reportApi } from "./report-api";
export { documentsApi } from "./documents-api";

// Type re-exports for convenience
export type { DashboardStats, ActivityItem, ActivityResponse } from "./dashboard-api";
export type { Notification, NotificationsResponse, NotificationType } from "./notifications-api";
export type { Workspace, CreateWorkspacePayload } from "./workspace-api";
export type { AnalyticsOverview, UsageDataPoint, UsageResponse } from "./analytics-api";
export type { Team, TeamMember, TeamsResponse, MembersResponse, MemberRole } from "./team-api";
export type { StoredFile, FilesResponse, Folder, UploadFilePayload } from "./files-api";
export type { Report, ReportAnalytics, ReportAttachment, ReportComment } from "./report-api";
export type { DocumentItem, DocumentsResponse, UploadDocumentPayload } from "./documents-api";

