/**
 * documents-api.ts
 *
 * Frontend service for Knowledge Repository document management:
 * upload, list, search, download, favorite, update, and soft delete.
 */

import { apiClient, tokenStorage, contextStorage } from "@/lib/api-client";

export interface DocumentItem {
  id: string;
  workspace_id: string;
  organization_id: string;
  uploaded_by: string;
  title: string;
  description?: string;
  file_name: string;
  original_file_name: string;
  file_extension: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  checksum: string;
  language?: string;
  category: string;
  status: "uploading" | "processing" | "ready" | "failed" | "archived";
  visibility: "private" | "workspace" | "organization";
  processing_status: "pending" | "queued" | "processing" | "completed" | "failed";
  version: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentsResponse {
  items: DocumentItem[];
  total_items: number;
  page: number;
  page_size: number;
}

export interface UploadDocumentPayload {
  file: File;
  title?: string;
  description?: string;
  category?: string;
  visibility?: string;
  workspaceId?: string;
}

export interface DocumentStorageStats {
  workspaceId: string;
  totalDocuments: number;
  totalUsedBytes: number;
  remainingBytes: number;
  capacityBytes: number;
  usagePercentage: number;
  usedFormatted: string;
  remainingFormatted: string;
  capacityFormatted: string;
}

export const documentsApi = {
  /**
   * GET /api/v1/documents/storage/summary
   */
  async getStorageSummary(workspaceId?: string): Promise<DocumentStorageStats> {
    const headers: Record<string, string> = {};
    const wsId = workspaceId ?? contextStorage.getWorkspaceId();
    if (wsId) headers["X-Workspace-ID"] = wsId;
    return apiClient.get<DocumentStorageStats>("/documents/storage/summary", headers);
  },

  /**
   * GET /api/v1/documents?page=1&page_size=50&search=...&category=...
   */

  async list(
    workspaceId?: string,
    page = 1,
    pageSize = 50,
    search?: string,
    category?: string,
    status?: string
  ): Promise<DocumentsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (search) params.set("search", search);
    if (category && category !== "all") params.set("category", category);
    if (status && status !== "all") params.set("status", status);

    const headers: Record<string, string> = {};
    const wsId = workspaceId ?? contextStorage.getWorkspaceId();
    if (wsId) headers["X-Workspace-ID"] = wsId;

    return apiClient.get<DocumentsResponse>(`/documents?${params}`, headers);
  },

  /**
   * POST /api/v1/documents/upload (multipart/form-data)
   * Uploads real physical file to storage and registers metadata in PostgreSQL.
   */
  async upload(payload: UploadDocumentPayload): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.title) formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    if (payload.category) formData.append("category", payload.category);
    if (payload.visibility) formData.append("visibility", payload.visibility);

    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const wsId = payload.workspaceId ?? contextStorage.getWorkspaceId();
    const orgId = contextStorage.getOrganizationId();
    if (wsId) headers["X-Workspace-ID"] = wsId;
    if (orgId) headers["X-Organization-ID"] = orgId;

    const resp = await fetch("/api/v1/documents/upload", {
      method: "POST",
      headers,
      body: formData,
    });

    if (!resp.ok) {
      let msg = `Upload failed (${resp.status})`;
      try {
        const errJson = await resp.json();
        if (errJson.detail) {
          msg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        } else if (errJson.message) {
          msg = errJson.message;
        }
      } catch {
        // fallback
      }
      throw new Error(msg);
    }
    return resp.json() as Promise<DocumentItem>;
  },

  /**
   * GET /api/v1/documents/:id/download
   * Authenticated blob download.
   */
  async download(id: string, filename: string, workspaceId?: string): Promise<void> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const wsId = workspaceId ?? contextStorage.getWorkspaceId();
    if (wsId) headers["X-Workspace-ID"] = wsId;

    const resp = await fetch(`/api/v1/documents/${id}/download`, {
      method: "GET",
      headers,
    });

    if (!resp.ok) {
      throw new Error(`Download failed: ${resp.status}`);
    }

    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "downloaded-document";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * PATCH /api/v1/documents/:id
   */
  async update(
    id: string,
    data: { title?: string; description?: string; category?: string; visibility?: string }
  ): Promise<DocumentItem> {
    return apiClient.patch<DocumentItem>(`/documents/${id}`, data);
  },

  /**
   * POST /api/v1/documents/:id/favorite
   */
  async toggleFavorite(id: string): Promise<DocumentItem> {
    return apiClient.post<DocumentItem>(`/documents/${id}/favorite`);
  },

  /**
   * DELETE /api/v1/documents/:id
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/documents/${id}`);
  },
};
