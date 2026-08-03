"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Clock,
  Send,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/feedback/toast";
import { Report, reportApi } from "@/services/report-api";

interface ReportDetailsModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function ReportDetailsModal({ reportId, isOpen, onClose, onRefresh }: ReportDetailsModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [report, setReport] = React.useState<Report | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const [commentText, setCommentText] = React.useState("");
  const [feedbackText, setFeedbackText] = React.useState("");
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const loadReport = React.useCallback(async () => {
    if (!reportId) return;
    setIsLoading(true);
    try {
      const details = await reportApi.getReportDetails(reportId);
      setReport(details);
    } catch (err: unknown) {
      toast.error("Failed to load report", {
        description: err instanceof Error ? err.message : "Error fetching details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  React.useEffect(() => {
    if (isOpen && reportId) {
      loadReport();
      setCommentText("");
      setFeedbackText("");
    }
  }, [isOpen, reportId, loadReport]);

  if (!mounted || !isOpen || !reportId) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await reportApi.updateReportStatus(reportId, {
        status: newStatus,
        feedback: feedbackText.trim() || undefined,
      });

      toast.success("Report Status Updated", {
        description: `Report marked as '${newStatus.replace("_", " ")}'.`,
      });

      setFeedbackText("");
      await loadReport();
      onRefresh();
    } catch (err: unknown) {
      toast.error("Status Update Failed", {
        description: err instanceof Error ? err.message : "Could not update status.",
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await reportApi.addComment(reportId, { content: commentText.trim() });
      toast.success("Comment Added");
      setCommentText("");
      await loadReport();
    } catch (err: unknown) {
      toast.error("Comment Failed", {
        description: err instanceof Error ? err.message : "Could not post comment.",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await reportApi.generateAISummary(reportId);
      setReport((prev) => (prev ? { ...prev, ai_summary: res.ai_summary } : null));
      toast.success("AI Summary Generated!", {
        description: "Executive summary created using Groq flagship AI model.",
      });
    } catch (err: unknown) {
      toast.error("AI Summary Failed", {
        description: err instanceof Error ? err.message : "Error running LLM analysis.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const statusBadgeVariant = {
    draft: "secondary",
    submitted: "warning",
    under_review: "info",
    approved: "success",
    rejected: "destructive",
    needs_changes: "warning",
    completed: "success",
  }[report?.status || "submitted"] as "secondary" | "warning" | "info" | "success" | "destructive";

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
        className="relative w-full max-w-3xl max-h-[90vh] my-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary text-xl shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground leading-snug truncate">
                  {report?.title || "Report Details"}
                </h2>
                {report && <Badge variant={statusBadgeVariant}>{report.status.replace("_", " ")}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Submitted by {report?.author_name || "Workspace Member"} • {report?.category}
              </p>
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading report details...</div>
          ) : report ? (
            <>
              {/* Report Metadata Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-border bg-muted/10 text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Category</div>
                  <div className="font-semibold text-foreground">{report.category}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Author</div>
                  <div className="font-semibold text-foreground truncate">{report.author_name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Submitted Date</div>
                  <div className="font-mono text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Reviewer</div>
                  <div className="font-semibold text-foreground truncate">{report.reviewer_name || "Pending Review"}</div>
                </div>
              </div>

              {/* AI Executive Summary Generator Banner */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Executive Summary (Groq openai/gpt-oss-120b)</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAISummary}
                    isLoading={isGeneratingAI}
                    disabled={isGeneratingAI}
                    leftIcon={!isGeneratingAI && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    className="text-xs rounded-lg"
                  >
                    {report.ai_summary ? "Regenerate Summary" : "Generate Summary"}
                  </Button>
                </div>

                {report.ai_summary ? (
                  <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans bg-background/60 p-3 rounded-lg border border-border">
                    {report.ai_summary}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Click above to automatically extract key achievements, risks, and recommended actions using the Groq flagship LLM.
                  </p>
                )}
              </div>

              {/* Main Report Content */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Report Description</h3>
                <div
                  className="p-4 rounded-xl border border-border bg-card text-xs text-foreground leading-relaxed whitespace-pre-wrap space-y-2"
                  dangerouslySetInnerHTML={{ __html: report.content }}
                />
              </div>

              {/* Attachments Section */}
              {report.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-primary" />
                    <span>Attachments ({report.attachments.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {report.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{att.file_name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {(att.file_size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <a
                          href={att.file_path}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
                          title="Download attachment"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager Review Controls */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Manager Review Actions</h3>
                
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Optional review feedback or request for changes..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus("approved")}
                    leftIcon={<CheckCircle2 className="h-4 w-4 text-success" />}
                  >
                    Approve Report
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus("needs_changes")}
                    leftIcon={<AlertCircle className="h-4 w-4 text-warning" />}
                  >
                    Request Changes
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdateStatus("rejected")}
                    className="text-destructive hover:bg-destructive/10"
                    leftIcon={<XCircle className="h-4 w-4 text-destructive" />}
                  >
                    Reject Report
                  </Button>
                </div>
              </div>

              {/* Comments Thread Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span>Discussion Comments ({report.comments.length})</span>
                </h3>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment or mention a colleague..."
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    isLoading={isSubmittingComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    leftIcon={!isSubmittingComment && <Send className="h-3.5 w-3.5" />}
                  >
                    Comment
                  </Button>
                </form>

                <div className="space-y-2">
                  {report.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{c.author_name || "Workspace Member"}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Timeline Log */}
              {report.activities.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Activity Audit Trail</span>
                  </h3>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {report.activities.map((act) => (
                      <div key={act.id} className="text-[11px] text-muted-foreground flex items-center justify-between py-1 border-b border-border/50">
                        <span>{act.message}</span>
                        <span className="font-mono text-[10px] opacity-70">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
