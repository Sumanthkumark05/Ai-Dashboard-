"use client";

import * as React from "react";
import { FolderOpen, Upload } from "lucide-react";
import { useFileStore } from "@/stores/file-store";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function FileEmptyState() {
  const { openUploadDialog, setSearchQuery, setFilterType } = useFileStore();

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
  };

  return (
    <EmptyState
      icon={<FolderOpen className="h-10 w-10 text-muted-foreground/60" />}
      title="No workspace files found"
      description="No assets matched your search query or category filter. Try clearing filters or upload a new file."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Clear Filters
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={openUploadDialog}>
            Upload File
          </Button>
        </div>
      }
      className="my-8 py-12"
    />
  );
}
