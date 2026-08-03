import { tokenStorage } from "@/lib/api-client";

export interface DatasetItem {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  dataset_type: string;
  file_name: string;
  original_file_name: string;
  file_size: number;
  record_count: number;
  column_count: number;
  status: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface DatasetListResponse {
  items: DatasetItem[];
  total_items: number;
  page: number;
  page_size: number;
}

export interface DatasetUploadResponse {
  success: boolean;
  message: string;
  dataset: DatasetItem;
}

export const datasetsApi = {
  listDatasets: async (workspaceId?: string): Promise<DatasetListResponse> => {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (workspaceId) headers["X-Workspace-ID"] = workspaceId;

    const resp = await fetch("/api/v1/datasets", { method: "GET", headers });
    if (!resp.ok) return { items: [], total_items: 0, page: 1, page_size: 100 };
    return resp.json();
  },

  uploadDataset: async (
    file: File,
    description?: string,
    tags?: string[],
    workspaceId?: string
  ): Promise<DatasetItem> => {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (workspaceId) headers["X-Workspace-ID"] = workspaceId;

    const formData = new FormData();
    formData.append("file", file);
    if (description) formData.append("description", description);
    if (tags && tags.length > 0) formData.append("tags", tags.join(","));

    const resp = await fetch("/api/v1/datasets/upload", {
      method: "POST",
      headers,
      body: formData,
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || `Upload failed with status ${resp.status}`);
    }

    const data: DatasetUploadResponse = await resp.json();
    return data.dataset || (data as unknown as DatasetItem);
  },

  deleteDataset: async (id: string, workspaceId?: string): Promise<void> => {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (workspaceId) headers["X-Workspace-ID"] = workspaceId;

    const resp = await fetch(`/api/v1/datasets/${id}`, { method: "DELETE", headers });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || `Failed to delete dataset`);
    }
  },
};
