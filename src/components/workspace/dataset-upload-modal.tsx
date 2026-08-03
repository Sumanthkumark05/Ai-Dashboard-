"use client";

import * as React from "react";
import { Upload, X, FileSpreadsheet, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { toast } from "@/components/feedback/toast";
import { datasetsApi } from "@/services/datasets-api";
import { useDatasetStore } from "@/stores/dataset-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";

export function DatasetUploadModal() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContextStore();
  const { isUploadModalOpen, setUploadModalOpen, addDataset } = useDatasetStore();

  const [file, setFile] = React.useState<File | null>(null);
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setDescription("");
    setTags("");
    setIsUploading(false);
  };

  const handleClose = () => {
    handleReset();
    setUploadModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("No file selected", { description: "Please choose a file to upload." });
      return;
    }

    setIsUploading(true);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const newDataset = await datasetsApi.uploadDataset(
        file,
        description.trim() || undefined,
        tagList.length > 0 ? tagList : undefined,
        currentWorkspace?.id
      );

      // 1. Immediately update Zustand Store
      addDataset(newDataset);

      // 2. Invalidate React Query Caches
      await queryClient.invalidateQueries({ queryKey: ["datasets"] });
      await queryClient.invalidateQueries({ queryKey: ["workspace-storage"] });
      await queryClient.invalidateQueries({ queryKey: ["dataset-stats"] });

      // 3. User Feedback
      toast.success("Dataset Uploaded Successfully", {
        description: `'${newDataset.name}' is now active in workspace '${currentWorkspace?.name || "Active Workspace"}'.`,
      });

      handleClose();
    } catch (err: unknown) {
      toast.error("Upload Failed", {
        description: err instanceof Error ? err.message : "Failed to upload dataset to database.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isUploadModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Upload Workspace Dataset</h2>
              <p className="text-xs text-muted-foreground">
                Workspace /{currentWorkspace?.slug || "default"} • CSV, JSON, Parquet, PDF, DOCX, XLSX, ZIP
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Dropzone */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".csv,.json,.parquet,.sql,.txt,.pdf,.docx,.xlsx,.zip,.png"
            />
            {file ? (
              <div className="space-y-1">
                <FileSpreadsheet className="h-8 w-8 text-primary mx-auto" />
                <p className="text-xs font-bold text-foreground truncate max-w-xs mx-auto">{file.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB • {file.type || "binary payload"}
                </p>
                <p className="text-[10px] text-primary font-semibold pt-1">Click or drag another file to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-xs font-bold text-foreground">Click or Drag & Drop dataset file</p>
                  <p className="text-[11px] text-muted-foreground">Supports CSV, JSON, Parquet, PDF, DOCX, XLSX, ZIP, PNG</p>
                </div>
              </div>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Q3 Customer Churn & Segmentation dataset..."
              className="text-xs"
              disabled={isUploading}
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tags (Optional, comma-separated)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., finance, churn, production"
              className="text-xs"
              disabled={isUploading}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!file || isUploading}
              className="rounded-xl text-xs shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading to DB & Storage...
                </>
              ) : (
                "Upload Dataset"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
