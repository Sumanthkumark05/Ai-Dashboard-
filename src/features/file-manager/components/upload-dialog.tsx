"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle2, FileUp } from "lucide-react";
import { useFileStore } from "@/stores/file-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/feedback/progress";
import { Alert, AlertDescription } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";

export function UploadDialog() {
  const { isUploadOpen, closeUploadDialog, addMockUploadedFile } = useFileStore();
  const [dragActive, setDragActive] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [fileName, setFileName] = React.useState("ai_vector_dataset.json");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isUploadOpen) return null;

  const startSimulatedUpload = (name: string, sizeBytes: number = 2450000) => {
    setFileName(name);
    setUploading(true);
    setProgress(0);
    setUploadSuccess(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadSuccess(true);
          addMockUploadedFile(name, sizeBytes);
          toast.success("Upload complete", { description: `${name} has been indexed.` });
          return 100;
        }
        return prev + 25;
      });
    }, 250);
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
      startSimulatedUpload(file.name, file.size);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      startSimulatedUpload(file.name, file.size);
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
                <p className="text-xs text-muted-foreground">Import documents, code datasets, or AI weights</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={closeUploadDialog}
              className="h-8 w-8 p-0"
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
            onClick={() => fileInputRef.current?.click()}
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
              Drag & drop your files here, or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, CSV, TS, PY, JSON, PNG, MP4 (Max 500MB)
            </p>
          </div>

          {/* Progress Bar & Status */}
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground truncate max-w-[240px]">
                  Uploading {fileName}...
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div className="mt-4">
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-xs font-semibold">
                  File uploaded and indexed into knowledge base successfully!
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startSimulatedUpload("sample_dataset_model.json", 1850000)}
              disabled={uploading}
            >
              Simulate Sample Upload
            </Button>
            <Button variant="secondary" size="sm" onClick={closeUploadDialog}>
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
