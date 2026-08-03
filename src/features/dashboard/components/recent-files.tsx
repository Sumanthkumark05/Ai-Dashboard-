"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCode, FileText, Image as ImageIcon, Archive, File, FolderOpen, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/display/table";
import { Badge } from "@/components/ui/badge";
import { filesApi, StoredFile } from "@/services/files-api";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";

const fileIconMap: Record<string, React.ReactNode> = {
  "application/pdf": <FileText className="h-4 w-4 text-danger" />,
  "text/plain": <FileText className="h-4 w-4 text-primary" />,
  "image/png": <ImageIcon className="h-4 w-4 text-success" />,
  "image/jpeg": <ImageIcon className="h-4 w-4 text-success" />,
  "image/gif": <ImageIcon className="h-4 w-4 text-success" />,
  "text/javascript": <FileCode className="h-4 w-4 text-info" />,
  "application/json": <FileCode className="h-4 w-4 text-info" />,
  "application/zip": <Archive className="h-4 w-4 text-warning" />,
};

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center animate-pulse py-2 px-3 border-b border-border">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-3 bg-muted rounded flex-1" />
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-5 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function RecentFiles() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceContextStore();
  const [files, setFiles] = React.useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    filesApi.list(currentWorkspace?.id, undefined, 8, 0)
      .then((res) => {
        if (!cancelled) setFiles(res.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentWorkspace?.id]);

  const handleRowClick = () => {
    router.push("/dashboard/files");
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Recent Files</h4>
          <p className="text-xs text-muted-foreground">Latest uploaded files in your workspace</p>
        </div>
        <Link href="/dashboard/files" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          <span>File Manager</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-border rounded-xl bg-muted/10">
          <FolderOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No files uploaded yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Upload files to your workspace to view them here.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file: StoredFile) => {
              const mime = file.mime_type || file.content_type || "";
              const icon = fileIconMap[mime] ?? <File className="h-4 w-4 text-muted-foreground" />;
              const statusMap: Record<string, "success" | "warning" | "secondary"> = {
                active: "success",
                processing: "warning",
                failed: "secondary",
              };
              const fileStatus = file.status || "active";

              return (
                <TableRow
                  key={file.id}
                  onClick={handleRowClick}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5">
                      {icon}
                      <span className="truncate max-w-[200px] sm:max-w-[280px]">
                        {file.name || file.original_name || file.original_filename || file.stored_name || file.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatSize(file.size || file.size_bytes)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(file.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusMap[fileStatus] ?? "secondary"} size="sm">
                      {fileStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
