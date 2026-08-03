"use client";

import * as React from "react";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { useDocumentStore } from "@/stores/document-store";
import { DocumentHeader } from "@/features/documents/components/document-header";
import { DocumentToolbar } from "@/features/documents/components/document-toolbar";
import { DocumentGridView } from "@/features/documents/components/document-grid-view";
import { DocumentListView } from "@/features/documents/components/document-list-view";
import { DocumentEmptyState } from "@/features/documents/components/document-empty-state";
import { DocumentSkeletonLoader } from "@/features/documents/components/document-skeleton-loader";
import { DocumentUploadModal } from "@/features/documents/components/document-upload-modal";
import { DocumentStorageSummary } from "@/features/documents/components/document-storage-summary";

export default function DocumentsPage() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const {
    documents,
    isLoading,
    searchQuery,
    selectedCategory,
    selectedStatus,
    fetchDocuments,
  } = useDocumentStore();

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  React.useEffect(() => {
    fetchDocuments(currentWorkspace?.id);
  }, [fetchDocuments, currentWorkspace?.id, searchQuery, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* Page Header */}
      <DocumentHeader />

      {/* Workspace Storage Summary Capacity Widget */}
      <DocumentStorageSummary />

      {/* Toolbar Controls: Search, Category Filter, Status Filter, View Toggle */}
      <DocumentToolbar viewMode={viewMode} setViewMode={setViewMode} />

      {/* Document Content List / Grid Area */}
      {isLoading ? (
        <DocumentSkeletonLoader />
      ) : documents.length === 0 ? (
        <DocumentEmptyState />
      ) : viewMode === "grid" ? (
        <DocumentGridView documents={documents} />
      ) : (
        <DocumentListView documents={documents} />
      )}

      {/* Upload Document Modal Dialog */}
      <DocumentUploadModal />
    </div>
  );
}
