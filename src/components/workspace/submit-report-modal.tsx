"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, FileText, Upload, Bold, Italic, List, Code, Table, Paperclip, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { toast } from "@/components/feedback/toast";
import { reportApi } from "@/services/report-api";

interface SubmitReportModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Daily Update",
  "Weekly Report",
  "Bug Report",
  "Feature Progress",
  "Research",
  "Meeting Summary",
  "General",
];

export function SubmitReportModal({ workspaceId, isOpen, onClose, onSuccess }: SubmitReportModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Weekly Report");
  const [content, setContent] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [attachments, setAttachments] = React.useState<{ name: string; size: number; type: string }[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setTitle("");
      setCategory("Weekly Report");
      setContent("");
      setDeadline("");
      setAttachments([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const isFormValid = title.trim().length >= 3 && content.trim().length >= 5;

  const handleInsertMarkdown = (syntax: string) => {
    setContent((prev) => `${prev}\n${syntax}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
      }));
      setAttachments((prev) => [...prev, ...filesArray]);
      toast.success("Attachment Added", { description: `${filesArray.length} file(s) attached.` });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (submitStatus: "draft" | "submitted") => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const report = await reportApi.createReport(workspaceId, {
        title: title.trim(),
        category,
        content: content.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        status: submitStatus,
      });

      // Upload attachments if any
      for (const att of attachments) {
        await reportApi.addAttachment(report.id, {
          file_name: att.name,
          file_path: `/uploads/${att.name}`,
          file_size: att.size,
          file_type: att.type,
        });
      }

      toast.success(submitStatus === "submitted" ? "Report Submitted!" : "Draft Saved!", {
        description: `'${report.title}' has been successfully ${submitStatus === "submitted" ? "submitted for manager review" : "saved to drafts"}.`,
      });

      onClose();
      onSuccess();
    } catch (err: unknown) {
      toast.error("Submission Failed", {
        description: err instanceof Error ? err.message : "Could not submit report.",
      });
    } finally {
      setIsSubmitting(false);
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
        className="relative w-full max-w-2xl max-h-[90vh] my-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary text-xl shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-snug">Submit Team Report</h2>
              <p className="text-xs text-muted-foreground">Share project progress, milestones, or daily updates with your manager.</p>
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

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[calc(90vh-140px)]">
          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Report Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Sprint 4 Development Progress"
                autoFocus
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rich Text Editor Toolbar & Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Report Content / Key Updates <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">Supports Markdown & HTML</span>
            </div>

            <div className="rounded-xl border border-input bg-background overflow-hidden">
              {/* Rich Text Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/20">
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown("**Bold Text**")}
                  className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown("*Italic Text*")}
                  className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Italic"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown("- List item 1\n- List item 2")}
                  className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Bullet List"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown("```typescript\n// Code snippet\n```")}
                  className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Code Block"
                >
                  <Code className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown("| Metric | Value |\n|---|---|\n| Progress | 100% |")}
                  className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Table"
                >
                  <Table className="h-3.5 w-3.5" />
                </button>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write detailed progress updates, completed items, risks, and next steps..."
                rows={6}
                className="w-full bg-transparent px-3.5 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-y min-h-[140px]"
              />
            </div>
          </div>

          {/* Attachments Dropzone & List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              <span>Attachments (PDF, DOCX, TXT, CSV, XLSX, Images, ZIP)</span>
            </label>

            <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 text-center transition-colors bg-muted/10 cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-semibold text-foreground">Click or Drag & Drop files here</p>
              <p className="text-[10px] text-muted-foreground">Up to 50 MB per file attachment</p>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs"
                  >
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[140px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Completion Deadline */}
          <div className="space-y-1.5 sm:w-1/2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Completion Target / Deadline (Optional)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit("draft")}
            isLoading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
          >
            Save Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSubmit("submitted")}
            isLoading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            leftIcon={!isSubmitting && <Send className="h-4 w-4" />}
          >
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
