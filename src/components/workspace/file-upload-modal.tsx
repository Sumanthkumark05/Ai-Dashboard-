"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Upload, Folder, CheckCircle2, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";
import { filesApi } from "@/services/files-api";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string;
  onSuccess?: () => void;
}

export function FileUploadModal({ isOpen, onClose, folderId, onSuccess }: FileUploadModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const { currentWorkspace } = useWorkspaceContextStore();
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadProgress(20);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        if (folderId) {
          formData.append("folder_id", folderId);
        }

        await filesApi.uploadFile(formData, currentWorkspace?.id, folderId);
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      toast.success("Files Uploaded Successfully!", {
        description: `${selectedFiles.length} file(s) uploaded to workspace '${currentWorkspace?.name || "Active Workspace"}'.`,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("neurodesk:files_updated"));
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error("File Upload Failed", {
        description: err instanceof Error ? err.message : "Error uploading files. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const modalContent = (
    <div
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] my-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary text-xl shadow-xs">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-snug">Upload Files</h2>
              <p className="text-xs text-muted-foreground">Upload documents, datasets, media, or archives to your workspace.</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[calc(90vh-140px)]">
          {/* Target Workspace & Folder Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">{currentWorkspace?.icon || "💼"}</span>
              <div>
                <div className="font-bold text-foreground">{currentWorkspace?.name || "Active Workspace"}</div>
                <div className="text-[10px] text-muted-foreground font-mono">/{currentWorkspace?.slug || "default"}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Folder className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{folderId ? "Selected Folder" : "Root Workspace"}</span>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div className="relative border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-6 text-center transition-colors bg-muted/10 cursor-pointer">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto mb-3 shadow-xs">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Click or Drag & Drop files to upload</h3>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, PNG, JPG, CSV, XLSX, ZIP, MP4, JSON (Up to 100 MB)</p>
          </div>

          {/* Selected File Queue */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span>File Queue ({selectedFiles.length})</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{f.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {(f.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFile(idx)}
                      disabled={isUploading}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">Uploading files to PostgreSQL & Storage...</span>
                <span className="text-primary font-mono">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleUploadSubmit}
            isLoading={isUploading}
            disabled={selectedFiles.length === 0 || isUploading}
            leftIcon={!isUploading && <CheckCircle2 className="h-4 w-4" />}
          >
            Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
