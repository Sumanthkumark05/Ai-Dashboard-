// src/services/api.ts
// Central re-export for all API services - single import point

export { apiClient, tokenStorage } from "@/lib/api-client";
export { dashboardApi } from "./dashboard-api";
export { notificationsApi } from "./notifications-api";
export { workspaceApi } from "./workspace-api";
export { analyticsApi } from "./analytics-api";
export { teamApi } from "./team-api";
export { filesApi } from "./files-api";
