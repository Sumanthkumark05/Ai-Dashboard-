"use client";

import * as React from "react";
import { useFileStore } from "@/stores/file-store";
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
  const {
    files,
    viewMode,
    searchQuery,
    filterType,
    sortField,
    sortOrder,
    isLoading,
  } = useFileStore();

  // Client-side Filter logic
  const filteredFiles = React.useMemo(() => {
    return files.filter((file: FileItem) => {
      // Search Query filter (matches name, type, extension, owner)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        file.name.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query) ||
        file.extension.toLowerCase().includes(query) ||
        file.owner.name.toLowerCase().includes(query);

      // Category filter
      let matchesCategory = true;
      if (filterType === "folder") matchesCategory = file.type === "folder";
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
      let compA: string | number = a.name.toLowerCase();
      let compB: string | number = b.name.toLowerCase();

      if (sortField === "modifiedDate") {
        compA = new Date(a.modifiedDate).getTime() || 0;
        compB = new Date(b.modifiedDate).getTime() || 0;
      } else if (sortField === "size") {
        compA = a.sizeBytes;
        compB = b.sizeBytes;
      } else if (sortField === "type") {
        compA = a.type;
        compB = b.type;
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
