"use client";

import * as React from "react";
import { FileText, Plus, Database, Sparkles, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentStore } from "@/stores/document-store";
import { useFileStore } from "@/stores/file-store";
import { formatBytes } from "@/lib/utils";

export function DocumentHeader() {
  const { totalDocuments, documents, storageStats, openUploadModal } = useDocumentStore();

  const fallbackBytes = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
  const usedBytes = storageStats?.totalUsedBytes ?? fallbackBytes;
  const usedFormatted = storageStats?.usedFormatted || formatBytes(usedBytes);
  const docCount = storageStats?.totalDocuments ?? totalDocuments;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Knowledge Repository
              </h1>
              <Badge variant="default" className="text-2xs font-semibold px-2 py-0.5">
                <Sparkles className="h-3 w-3 mr-1" /> Vector Indexed
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enterprise documentation library, RAG vector embeddings, and indexed agent context.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-primary" />
            <strong className="text-foreground">{docCount}</strong> Documents
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1">
            <HardDrive className="h-3.5 w-3.5 text-primary" />
            <strong className="text-foreground">{usedFormatted}</strong> Used
          </span>
        </div>

        <Button variant="primary" size="sm" onClick={openUploadModal} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> Upload Document
        </Button>
      </div>
    </div>
  );
}

