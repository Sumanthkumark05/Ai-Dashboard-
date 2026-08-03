"use client";

import * as React from "react";
import { useFileStore } from "@/stores/file-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { FileItem } from "@/features/file-manager/types";
import { FileHeader } from "@/features/file-manager/components/file-header";
import { StorageSummary } from "@/features/file-manager/components/storage-summary";
import { FileToolbar } from "@/features/file-manager/components/file-toolbar";
import { GridView } from "@/features/file-manager/components/grid-view";
import { ListView } from "@/features/file-manager/components/list-view";
import { FileEmptyState } from "@/features/file-manager/components/file-empty-state";
import { FilePreviewDrawer } from "@/features/file-manager/components/file-preview-drawer";
import { UploadDialog } from "@/features/file-manager/components/upload-dialog";
import { FileSkeletonLoader } from "@/features/file-manager/components/file-skeleton-loader";

export default function FileManagerPage() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const {
    files,
    viewMode,
    searchQuery,
    filterType,
    sortField,
    sortOrder,
    isLoading,
    fetchFiles,
  } = useFileStore();

  React.useEffect(() => {
    fetchFiles(currentWorkspace?.id);
  }, [fetchFiles, currentWorkspace?.id]);


  // Client-side Filter logic
  const filteredFiles = React.useMemo(() => {
    return (files || []).filter((file: FileItem) => {
      if (!file) return false;
      const fileName = (file.name || "").toLowerCase();
      const fileType = (file.type || "").toLowerCase();
      const fileExt = (file.extension || "").toLowerCase();
      const ownerName = (file.owner?.name || "").toLowerCase();

      // Search Query filter (matches name, type, extension, owner)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        fileName.includes(query) ||
        fileType.includes(query) ||
        fileExt.includes(query) ||
        ownerName.includes(query);

      // Category filter
      let matchesCategory = true;
      if (filterType === "document") matchesCategory = file.type === "doc";
      if (filterType === "pdf") matchesCategory = file.type === "pdf";
      if (filterType === "image") matchesCategory = file.type === "image";
      if (filterType === "video") matchesCategory = file.type === "video";
      if (filterType === "code") matchesCategory = file.type === "code";

      return matchesSearch && matchesCategory;
    });
  }, [files, searchQuery, filterType]);

  // Client-side Sort logic
  const sortedFiles = React.useMemo(() => {
    return [...filteredFiles].sort((a: FileItem, b: FileItem) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();

      let compA: string | number = nameA;
      let compB: string | number = nameB;

      if (sortField === "modifiedDate") {
        compA = a.modifiedDate ? new Date(a.modifiedDate).getTime() || 0 : 0;
        compB = b.modifiedDate ? new Date(b.modifiedDate).getTime() || 0 : 0;
      } else if (sortField === "size") {
        compA = typeof a.sizeBytes === "number" ? a.sizeBytes : 0;
        compB = typeof b.sizeBytes === "number" ? b.sizeBytes : 0;
      } else if (sortField === "type") {
        compA = (a.type || "").toLowerCase();
        compB = (b.type || "").toLowerCase();
      }

      if (compA < compB) return sortOrder === "asc" ? -1 : 1;
      if (compA > compB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredFiles, sortField, sortOrder]);

  return (
    <div className="space-y-4 pb-12">
      {/* Page Header */}
      <FileHeader />

      {/* Storage Capacity Summary */}
      <StorageSummary />

      {/* Toolbar Controls (Search, Sort, Filter, View Mode Toggle) */}
      <FileToolbar />

      {/* Main File Content Area */}
      {isLoading ? (
        <FileSkeletonLoader />
      ) : sortedFiles.length === 0 ? (
        <FileEmptyState />
      ) : viewMode === "grid" ? (
        <GridView files={sortedFiles} />
      ) : (
        <ListView files={sortedFiles} />
      )}

      {/* Slide-over Preview Drawer */}
      <FilePreviewDrawer />

      {/* Upload Modal Dialog */}
      <UploadDialog />
    </div>
  );
}
