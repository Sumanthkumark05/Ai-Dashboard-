"use client";

import * as React from "react";
import { FileText, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/stores/document-store";

export function DocumentEmptyState() {
  const { openUploadModal } = useDocumentStore();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card/50 space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
        <FileText className="h-7 w-7" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-foreground">Knowledge Repository Empty</h3>
        <p className="text-xs text-muted-foreground">
          Upload PDF, DOCX, TXT, CSV, XLSX, PPTX, JSON, or Markdown documents to automatically chunk and embed them for your AI agents and search workflows.
        </p>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={openUploadModal}>
          <Plus className="h-4 w-4 mr-1.5" /> Upload First Document
        </Button>
      </div>
    </div>
  );
}
