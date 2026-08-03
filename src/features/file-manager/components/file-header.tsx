"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { useFileStore } from "@/stores/file-store";
import { Button } from "@/components/ui/button";

export function FileHeader() {
  const { openUploadDialog } = useFileStore();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 select-none">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          File Manager & Cloud Knowledge Base
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          Manage, search, organize, and inspect your enterprise workspace assets and AI vector datasets.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={openUploadDialog}
        >
          Upload File
        </Button>
      </div>
    </div>
  );
}
