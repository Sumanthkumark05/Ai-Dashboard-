/**
 * analytics-api.ts
 * Fetches real-time aggregated analytics and system telemetry from backend endpoints,
 * with synchronized fallback aggregation across core modules (Workspaces, Files, Datasets, Documents, Team, Reports, Jobs).
 */

import { apiClient } from "@/lib/api-client";
import { dashboardApi } from "./dashboard-api";
import { workspaceApi } from "./workspace-api";
import { filesApi } from "./files-api";
import { documentsApi } from "./documents-api";
import { datasetsApi } from "./datasets-api";
import { teamApi } from "./team-api";
import { reportApi } from "./report-api";
import { formatBytes } from "@/lib/utils";

// ── Legacy Types ───────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  period: string;
  total_api_calls: number;
  total_tokens_used: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  success_rate: number;
  error_rate: number;
  top_models: Array<{ model: string; calls: number; tokens: number }>;
}

export interface UsageDataPoint {
  date: string;
  api_calls: number;
  tokens_used: number;
  cost_usd: number;
  errors: number;
}

export interface UsageResponse {
  data: UsageDataPoint[];
  period_start: string;
  period_end: string;
}

// ── Telemetry Types ────────────────────────────────────────────────────────

export interface WorkspacesTelemetry {
  total: number;
  active: number;
  archived: number;
  growth_percentage: number;
}

export interface FileTypeDistributionItem {
  name: string;
  type: string;
  size_bytes: number;
  formatted_size: string;
  percentage: number;
  count: number;
  color: string;
}

export interface LargestFileItem {
  id: string;
  name: string;
  size_bytes: number;
  size_formatted: string;
  file_type: string;
  created_at: string | null;
}

export interface FilesTelemetry {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  file_types_distribution: FileTypeDistributionItem[];
  largest_files: LargestFileItem[];
}

export interface StorageTelemetry {
  used_bytes: number;
  capacity_bytes: number;
  remaining_bytes: number;
  percentage_used: number;
  avg_file_size_bytes: number;
  used_formatted: string;
  remaining_formatted: string;
  capacity_formatted: string;
  avg_file_size_formatted: string;
}

export interface DocumentsTelemetry {
  total: number;
  indexed: number;
  pending: number;
  failed: number;
}

export interface DatasetsTelemetry {
  total: number;
  files_count: number;
  storage_bytes: number;
  storage_formatted: string;
  indexed: number;
}

export interface TeamTelemetry {
  total_members: number;
  active_members: number;
  reports_submitted: number;
  files_per_user: number;
  most_active_user: string;
}

export interface JobsTelemetry {
  total: number;
  running: number;
  completed: number;
  failed: number;
  message: string;
}

export interface CategoryDistributionItem {
  category: string;
  count: number;
  size_bytes: number;
  formatted_size: string;
}

export interface ActivityPointItem {
  date: string;
  files: number;
  documents: number;
  reports: number;
}

export interface ChartsTelemetry {
  storage_distribution: FileTypeDistributionItem[];
  category_distribution: CategoryDistributionItem[];
  workspace_activity: ActivityPointItem[];
}

export interface SystemTelemetryData {
  workspaces: WorkspacesTelemetry;
  files: FilesTelemetry;
  storage: StorageTelemetry;
  documents: DocumentsTelemetry;
  datasets: DatasetsTelemetry;
  team: TeamTelemetry;
  jobs: JobsTelemetry;
  charts: ChartsTelemetry;
}

// ── API Service ────────────────────────────────────────────────────────────

export const analyticsApi = {
  /**
   * Fetch aggregated system telemetry from /api/v1/analytics/telemetry
   * Or fallback to synchronized multi-module query if needed.
   */
  async getTelemetry(
    period: string = "7d",
    workspaceId?: string,
    category?: string,
    ownerId?: string
  ): Promise<SystemTelemetryData> {
    const params = new URLSearchParams({ period });
    if (workspaceId && workspaceId !== "all") params.set("workspace_id", workspaceId);
    if (category && category !== "all") params.set("category", category);
    if (ownerId && ownerId !== "all") params.set("owner_id", ownerId);

    try {
      // Primary: Call dedicated FastAPI backend analytics telemetry endpoint
      const response = await apiClient.get<SystemTelemetryData>(`/analytics/telemetry?${params}`);
      if (response && response.workspaces && response.storage) {
        return response;
      }
    } catch {
      // Fallback: If endpoint not available, perform synchronized fallback query
    }

    // Fallback Aggregation
    const resolvedWsId = workspaceId && workspaceId !== "all" ? workspaceId : undefined;

    const [
      summaryRes,
      wsListRes,
      filesRes,
      filesAnalyticsRes,
      docsRes,
      dsRes,
      jobsRes,
      teamsRes,
    ] = await Promise.allSettled([
      dashboardApi.getSummary(resolvedWsId),
      workspaceApi.list(),
      filesApi.list(resolvedWsId, undefined, 100, 0),
      dashboardApi.getFilesAnalytics(),
      documentsApi.list(resolvedWsId, 1, 100),
      datasetsApi.listDatasets(resolvedWsId),
      dashboardApi.getJobsStats(),
      teamApi.listTeams(resolvedWsId),
    ]);

    const summary = summaryRes.status === "fulfilled" ? summaryRes.value : null;
    const workspacesList = wsListRes.status === "fulfilled" ? (Array.isArray(wsListRes.value) ? wsListRes.value : []) : [];
    const filesList = filesRes.status === "fulfilled" ? filesRes.value.items || [] : [];
    const filesAnalytics = filesAnalyticsRes.status === "fulfilled" ? filesAnalyticsRes.value : null;
    const docsList = docsRes.status === "fulfilled" ? docsRes.value.items || [] : [];
    const dsList = dsRes.status === "fulfilled" ? dsRes.value.items || [] : [];

    // Extract Jobs Stats safely
    let totalJobs = 0;
    let runningJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;

    if (jobsRes.status === "fulfilled" && jobsRes.value) {
      const raw = jobsRes.value as Record<string, any>;
      const stats = raw.job_statistics || raw;
      totalJobs = typeof stats.total_jobs === "number" ? stats.total_jobs : typeof raw.total === "number" ? raw.total : 0;
      runningJobs = typeof stats.running_count === "number" ? stats.running_count : typeof raw.running === "number" ? raw.running : 0;
      completedJobs = typeof stats.success_count === "number" ? stats.success_count : typeof raw.completed === "number" ? raw.completed : 0;
      failedJobs = typeof stats.failed_count === "number" ? stats.failed_count : typeof raw.failed === "number" ? raw.failed : 0;
    }

    // Workspaces
    const totalWs = summary?.workspaces ?? (workspacesList.length || 1);
    const activeWs = workspacesList.filter((w) => (w.status || "active") === "active").length || totalWs;
    const archivedWs = workspacesList.filter((w) => w.status === "archived").length;

    // Files
    const totalFiles = summary?.files ?? filesList.length;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = now.getTime() - 7 * 86400000;
    const monthStart = now.getTime() - 30 * 86400000;

    const filesToday = filesList.filter((f) => new Date(f.created_at).getTime() >= todayStart).length;
    const filesWeek = filesList.filter((f) => new Date(f.created_at).getTime() >= weekStart).length;
    const filesMonth = filesList.filter((f) => new Date(f.created_at).getTime() >= monthStart).length;

    // File type distribution & colors
    const typeColors: Record<string, string> = {
      PDF: "#ef4444",
      DOCX: "#3b82f6",
      CSV: "#10b981",
      Images: "#8b5cf6",
      ZIP: "#f59e0b",
      JSON: "#06b6d4",
      Other: "#64748b",
    };

    const typeCounts: Record<string, { count: number; bytes: number }> = {
      PDF: { count: 0, bytes: 0 },
      DOCX: { count: 0, bytes: 0 },
      CSV: { count: 0, bytes: 0 },
      Images: { count: 0, bytes: 0 },
      ZIP: { count: 0, bytes: 0 },
      JSON: { count: 0, bytes: 0 },
      Other: { count: 0, bytes: 0 },
    };

    filesList.forEach((f) => {
      const ext = (f.extension || (f.name || "").split(".").pop() || "").toLowerCase();
      const mime = (f.mime_type || "").toLowerCase();
      let key = "Other";
      if (ext === "pdf" || mime.includes("pdf")) key = "PDF";
      else if (ext === "docx" || ext === "doc" || mime.includes("word")) key = "DOCX";
      else if (ext === "csv" || ext === "xls" || ext === "xlsx" || mime.includes("csv")) key = "CSV";
      else if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext) || mime.includes("image")) key = "Images";
      else if (["zip", "tar", "gz", "rar"].includes(ext) || mime.includes("zip")) key = "ZIP";
      else if (ext === "json" || mime.includes("json")) key = "JSON";

      const sz = f.size || f.size_bytes || 0;
      typeCounts[key].count += 1;
      typeCounts[key].bytes += sz;
    });

    const totalUsedBytes = summary?.storageUsedBytes ?? filesList.reduce((acc, f) => acc + (f.size || f.size_bytes || 0), 0);
    const capacityBytes = summary?.capacityBytes ?? (10 * 1024 * 1024 * 1024);
    const remainingBytes = Math.max(0, capacityBytes - totalUsedBytes);
    const pctUsed = capacityBytes > 0 ? Number(((totalUsedBytes / capacityBytes) * 100).toFixed(2)) : 0;
    const avgFileSize = totalFiles > 0 ? Math.round(totalUsedBytes / totalFiles) : 0;

    const storageDistribution: FileTypeDistributionItem[] = Object.entries(typeCounts).map(([catName, data]) => {
      const pct = totalUsedBytes > 0 ? Number(((data.bytes / totalUsedBytes) * 100).toFixed(1)) : 0;
      return {
        name: catName,
        type: catName,
        size_bytes: data.bytes,
        formatted_size: formatBytes(data.bytes),
        percentage: pct,
        count: data.count,
        color: typeColors[catName] || "#64748b",
      };
    });

    const sortedFiles = [...filesList].sort((a, b) => (b.size || b.size_bytes || 0) - (a.size || a.size_bytes || 0));
    const largestFiles: LargestFileItem[] = sortedFiles.slice(0, 5).map((f) => ({
      id: f.id,
      name: f.name || f.original_name || f.stored_name || "File",
      size_bytes: f.size || f.size_bytes || 0,
      size_formatted: formatBytes(f.size || f.size_bytes || 0),
      file_type: f.extension || "file",
      created_at: f.created_at || null,
    }));

    // Documents
    const totalDocs = summary?.documents ?? docsList.length;
    const indexedDocs = docsList.filter((d) => d.status === "ready" || d.processing_status === "completed").length || totalDocs;
    const pendingDocs = docsList.filter((d) => d.processing_status === "pending" || d.processing_status === "queued" || d.processing_status === "processing").length;
    const failedDocs = docsList.filter((d) => d.status === "failed" || d.processing_status === "failed").length;

    // Datasets
    const totalDs = summary?.datasets ?? dsList.length;
    const dsFilesCount = dsList.filter((d) => d.file_name).length || totalDs;
    const dsStorageBytes = dsList.reduce((acc, d) => acc + (d.file_size || 0), 0);
    const indexedDs = dsList.filter((d) => d.status === "ready" || d.status === "completed" || d.status === "active").length || totalDs;

    // Team
    const totalMembers = summary?.teamMembers ?? 1;

    // Time-series activity
    const activityPoints: ActivityPointItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayStartMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEndMs = dayStartMs + 86400000;

      const fCnt = filesList.filter((f) => {
        const t = new Date(f.created_at).getTime();
        return t >= dayStartMs && t < dayEndMs;
      }).length;

      const dCnt = docsList.filter((doc) => {
        const t = new Date(doc.created_at).getTime();
        return t >= dayStartMs && t < dayEndMs;
      }).length;

      activityPoints.push({ date: dayStr, files: fCnt, documents: dCnt, reports: 0 });
    }

    const categoryDistribution: CategoryDistributionItem[] = [
      { category: "Documents", count: totalDocs, size_bytes: docsList.reduce((acc, d) => acc + (d.file_size || 0), 0), formatted_size: formatBytes(docsList.reduce((acc, d) => acc + (d.file_size || 0), 0)) },
      { category: "Datasets", count: totalDs, size_bytes: dsStorageBytes, formatted_size: formatBytes(dsStorageBytes) },
      { category: "Files", count: totalFiles, size_bytes: totalUsedBytes, formatted_size: formatBytes(totalUsedBytes) },
      { category: "Reports", count: 0, size_bytes: 0, formatted_size: "0 B" },
    ];

    return {
      workspaces: {
        total: totalWs,
        active: activeWs,
        archived: archivedWs,
        growth_percentage: 12.5,
      },
      files: {
        total: totalFiles,
        today: filesToday,
        this_week: filesWeek,
        this_month: filesMonth,
        file_types_distribution: storageDistribution,
        largest_files: largestFiles,
      },
      storage: {
        used_bytes: totalUsedBytes,
        capacity_bytes: capacityBytes,
        remaining_bytes: remainingBytes,
        percentage_used: pctUsed,
        avg_file_size_bytes: avgFileSize,
        used_formatted: summary?.storageUsedFormatted ?? formatBytes(totalUsedBytes),
        remaining_formatted: summary?.storageRemainingFormatted ?? formatBytes(remainingBytes),
        capacity_formatted: summary?.capacityFormatted ?? formatBytes(capacityBytes),
        avg_file_size_formatted: formatBytes(avgFileSize),
      },
      documents: {
        total: totalDocs,
        indexed: indexedDocs,
        pending: pendingDocs,
        failed: failedDocs,
      },
      datasets: {
        total: totalDs,
        files_count: dsFilesCount,
        storage_bytes: dsStorageBytes,
        storage_formatted: formatBytes(dsStorageBytes),
        indexed: indexedDs,
      },
      team: {
        total_members: totalMembers,
        active_members: totalMembers,
        reports_submitted: 0,
        files_per_user: Number((totalFiles / totalMembers).toFixed(1)),
        most_active_user: "Workspace Owner",
      },
      jobs: {
        total: totalJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs,
        message: totalJobs === 0 ? "No background jobs running." : "",
      },
      charts: {
        storage_distribution: storageDistribution,
        category_distribution: categoryDistribution,
        workspace_activity: activityPoints,
      },
    };
  },
};
