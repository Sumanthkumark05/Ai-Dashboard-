/**
 * files-api.ts
 * File and folder management via the FastAPI backend.
 */

import { apiClient, tokenStorage, contextStorage } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────────────────

export type FileStatus = "active" | "processing" | "failed" | "deleted";
export type StorageProvider = "local" | "s3" | "gcs" | "azure";

export interface StoredFile {
  id: string;
  name: string;
  original_name: string;
  stored_name: string;
  filename?: string;
  original_filename?: string;
  file_type: string;
  mime_type: string;
  content_type?: string;
  extension: string;
  size: number;
  size_bytes: number;
  storage_provider: StorageProvider;
  storage_path: string;
  public_url?: string;
  thumbnail_url?: string;
  checksum: string;
  version: number;
  is_public: boolean;
  is_deleted: boolean;
  status?: string;
  folder_id?: string;
  workspace_id: string;
  owner_id?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface FilesResponse {
  items: StoredFile[];
  total_items: number;
  total?: number;
  page?: number;
  page_size?: number;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  workspace_id: string;
  file_count: number;
  created_at: string;
}

export interface FoldersResponse {
  items: Folder[];
  total: number;
}

export interface UploadFilePayload {
  file: File;
  folder_id?: string;
  workspace_id?: string;
  tags?: string[];
}

// ── API calls ──────────────────────────────────────────────────────────────

export const filesApi = {
  /**
   * GET /api/v1/files?workspace_id=...&folder_id=...&limit=50&offset=0
   */
  async list(
    workspaceId?: string,
    folderId?: string,
    limit = 50,
    offset = 0
  ): Promise<FilesResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (workspaceId) params.set("workspace_id", workspaceId);
    if (folderId) params.set("folder_id", folderId);
    return apiClient.get<FilesResponse>(`/files?${params}`);
  },

  /**
   * GET /api/v1/files/:id
   */
  async get(id: string): Promise<StoredFile> {
    return apiClient.get<StoredFile>(`/files/${id}`);
  },

  /**
   * POST /api/v1/files/upload (multipart/form-data)
   */
  async upload(payload: UploadFilePayload): Promise<StoredFile> {
    const formData = new FormData();
    formData.append("file", payload.file);

    const params = new URLSearchParams();
    if (payload.folder_id) params.set("folder_id", payload.folder_id);

    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Always send workspace and org context so files land in the correct workspace.
    // Without these headers the backend defaults to user_workspaces[0] which may
    // differ from the currently selected workspace in the UI.
    const workspaceId = payload.workspace_id ?? contextStorage.getWorkspaceId();
    const organizationId = contextStorage.getOrganizationId();
    if (workspaceId) headers["X-Workspace-ID"] = workspaceId;
    if (organizationId) headers["X-Organization-ID"] = organizationId;

    const url = params.toString() ? `/api/v1/files/upload?${params}` : "/api/v1/files/upload";

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!resp.ok) {
      let msg = `Upload failed: ${resp.status} ${resp.statusText}`;
      try {
        const errJson = await resp.json();
        if (errJson.message) msg = errJson.message;
        else if (errJson.detail) {
          msg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // fallback
      }
      throw new Error(msg);
    }
    return resp.json() as Promise<StoredFile>;
  },

  async uploadFile(formData: FormData, workspaceId?: string, folderId?: string): Promise<StoredFile> {
    const params = new URLSearchParams();
    if (folderId) params.set("folder_id", folderId);

    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (workspaceId) headers["X-Workspace-ID"] = workspaceId;

    const url = params.toString() ? `/api/v1/files/upload?${params}` : "/api/v1/files/upload";
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!resp.ok) {
      let msg = `Upload failed: ${resp.status}`;
      try {
        const errJson = await resp.json();
        if (errJson.detail) {
          msg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // fallback
      }
      throw new Error(msg);
    }
    return resp.json() as Promise<StoredFile>;
  },

  /**
   * GET /api/v1/files/:id/download
   * Triggers authenticated browser blob download.
   */
  async downloadFile(fileId: string, filename: string, workspaceId?: string): Promise<void> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (workspaceId) headers["X-Workspace-ID"] = workspaceId;

    const resp = await fetch(`/api/v1/files/${fileId}/download`, {
      method: "GET",
      headers,
    });

    if (!resp.ok) {
      let msg = `Download failed: ${resp.status} ${resp.statusText}`;
      try {
        const errJson = await resp.json();
        if (errJson.detail) {
          msg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // fallback
      }
      throw new Error(msg);
    }

    const blob = await resp.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename || "downloaded-file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * DELETE /api/v1/files/:id
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/files/${id}`);
  },

  /**
   * GET /api/v1/folders?workspace_id=...
   */
  async listFolders(workspaceId?: string): Promise<FoldersResponse> {
    const params = new URLSearchParams();
    if (workspaceId) params.set("workspace_id", workspaceId);
    return apiClient.get<FoldersResponse>(`/folders?${params}`);
  },

  /**
   * POST /api/v1/folders
   */
  async createFolder(
    name: string,
    workspaceId: string,
    parentId?: string
  ): Promise<Folder> {
    return apiClient.post<Folder>("/folders", {
      name,
      workspace_id: workspaceId,
      parent_id: parentId,
    });
  },
};
