export type WorkspaceViewMode = "tree" | "list" | "grid";

export interface WorkspaceFolder {
  id: string;
  name: string;
  icon?: string;
  parentId?: string;
  isExpanded?: boolean;
}

export interface WorkspacePage {
  id: string;
  title: string;
  icon: string;
  folderId?: string;
  content: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  tags: string[];
  isFavourite: boolean;
  isPinned: boolean;
  wordCount: number;
  readingTime: string;
}

export interface WorkspaceActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  pageTitle: string;
}
