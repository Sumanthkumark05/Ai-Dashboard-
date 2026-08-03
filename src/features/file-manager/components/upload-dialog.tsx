"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { useFileStore } from "@/stores/file-store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";

import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { useQueryClient } from "@tanstack/react-query";

export function UploadDialog() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContextStore();
  const { isUploadOpen, closeUploadDialog, uploadFile } = useFileStore();
  const [dragActive, setDragActive] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isUploadOpen) return null;

  const handleUploadFile = async (file: File) => {
    setFileName(file.name);
    setUploading(true);
    setErrorMsg(null);
    setUploadSuccess(false);

    try {
      await uploadFile(file, currentWorkspace?.id);
      await queryClient.invalidateQueries({ queryKey: ["workspace-storage"] });
      await queryClient.invalidateQueries({ queryKey: ["files"] });
      await queryClient.invalidateQueries({ queryKey: ["workspace-files"] });
      setUploading(false);
      setUploadSuccess(true);
      toast.success("Upload complete", { description: `${file.name} has been uploaded to database.` });
    } catch (err: unknown) {
      setUploading(false);
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMsg(msg);
      toast.error("Upload error", { description: msg });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleUploadFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleUploadFile(file);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeUploadDialog}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Upload Workspace File</h3>
                <p className="text-xs text-muted-foreground">Import real files into your PostgreSQL workspace storage</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeUploadDialog}
              className="rounded-lg"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag & Drop Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/40"
            }`}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileUp className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Drag & drop your file here, or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Supports any file format (PDF, DOCX, CSV, TS, PY, JSON, PNG, MP4, ZIP)
            </p>
          </div>

          {/* Progress Indicator */}
          {uploading && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-xs font-medium text-foreground truncate">
                Uploading {fileName}...
              </span>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertDescription className="text-xs font-semibold">
                  {errorMsg}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div className="mt-4">
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-xs font-semibold">
                  File uploaded and saved to workspace successfully!
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-6 mt-4 border-t border-border">
            <Button variant="secondary" size="sm" onClick={closeUploadDialog}>
              {uploadSuccess ? "Close" : "Cancel"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
