"use client";

import * as React from "react";
import { FileCode, Plus } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function WorkspaceEmptyState() {
  const { createPage, setSearchQuery } = useWorkspaceStore();

  const handleReset = () => {
    setSearchQuery("");
  };

  return (
    <EmptyState
      icon={<FileCode className="h-10 w-10 text-muted-foreground/60" />}
      title="No documents found"
      description="No workspace documents matched your filter query. Create a new document or clear your search."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Clear Search
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => createPage("Untitled Note")}>
            Create Document
          </Button>
        </div>
      }
      className="my-8 py-12"
    />
  );
}
