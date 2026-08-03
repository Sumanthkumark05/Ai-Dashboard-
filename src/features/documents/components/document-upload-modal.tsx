"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileUp, Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Alert, AlertDescription } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { useDocumentStore } from "@/stores/document-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { useQueryClient } from "@tanstack/react-query";

const ALLOWED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".txt", ".csv",
  ".xls", ".xlsx", ".ppt", ".pptx", ".json", ".md"
];

export function DocumentUploadModal() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContextStore();
  const { isUploadOpen, closeUploadModal, uploadDocument, isUploading, uploadProgress } = useDocumentStore();

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("documentation");
  const [visibility, setVisibility] = React.useState("workspace");
  const [dragActive, setDragActive] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isUploadOpen) return null;

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    setUploadSuccess(false);

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Allowed formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX, JSON, MD.`);
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of 50 MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    setErrorMsg(null);
    setUploadSuccess(false);

    try {
      const createdDoc = await uploadDocument(
        selectedFile,
        {
          title: title || selectedFile.name,
          description,
          category,
          visibility,
        },
        currentWorkspace?.id
      );

      await queryClient.invalidateQueries({ queryKey: ["workspace-storage"] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["files"] });

      setUploadSuccess(true);
      toast.success("Document Uploaded", {
        description: `'${createdDoc.title}' added to Knowledge Repository & vector-indexed.`,
      });

      setTimeout(() => {
        closeUploadModal();
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setUploadSuccess(false);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMsg(msg);
      toast.error("Upload Error", { description: msg });
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
          onClick={() => !isUploading && closeUploadModal()}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Upload Knowledge Document</h3>
                <p className="text-xs text-muted-foreground">Add files to Knowledge Repository & vector AI index</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => !isUploading && closeUploadModal()}
              disabled={isUploading}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.json,.md"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              className="hidden"
            />

            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-primary bg-primary/10"
                  : selectedFile
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/40"
              }`}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {selectedFile ? <FileText className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-foreground truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">
                    Drag & drop your file here, or <span className="text-primary underline">browse</span>
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    PDF, DOCX, TXT, CSV, XLSX, PPTX, JSON, MD (Max 50 MB)
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Document Title</label>
                <Input
                  placeholder="e.g. Q3 Financial Audit Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isUploading}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="documentation">Documentation</option>
                    <option value="research">Research & Specs</option>
                    <option value="financial">Financial Reports</option>
                    <option value="legal">Legal & Contracts</option>
                    <option value="technical">Technical Guides</option>
                    <option value="uncategorized">Uncategorized</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={isUploading}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="workspace">Workspace Shared</option>
                    <option value="private">Private (Only Me)</option>
                    <option value="organization">Organization Wide</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Upload Progress Indicator */}
            {isUploading && (
              <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    Uploading & Indexing...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs font-semibold">{errorMsg}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {uploadSuccess && (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs font-semibold">
                  Document saved & indexed successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={closeUploadModal}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedFile || isUploading}
                leftIcon={isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
