export type FileType = "pdf" | "code" | "doc" | "image" | "video" | "archive" | "folder";

export type ViewMode = "grid" | "list";

export type SortField = "name" | "modifiedDate" | "size" | "type";

export type SortOrder = "asc" | "desc";

export type FileTypeFilter = "all" | "folder" | "document" | "pdf" | "image" | "video" | "code";

export interface FileOwner {
  name: string;
  avatarUrl?: string;
  email?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  extension: string;
  size: string;
  sizeBytes: number;
  owner: FileOwner;
  createdDate: string;
  modifiedDate: string;
  isFavorite: boolean;
  isShared: boolean;
  status: "Synced" | "Processing" | "Archived";
  tags: string[];
  description?: string;
}

export interface StorageSummaryData {
  usedGB: number;
  totalGB: number;
  percentage: number;
  documentsGB: number;
  mediaGB: number;
  codeGB: number;
  backupsGB: number;
}
