"use client";

import * as React from "react";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Paperclip,
  Eye,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/forms/input";
import { toast } from "@/components/feedback/toast";
import { Report, ReportAnalytics, reportApi } from "@/services/report-api";
import { SubmitReportModal } from "@/components/workspace/submit-report-modal";
import { ReportDetailsModal } from "@/components/workspace/report-details-modal";

interface WorkspaceReportsTabProps {
  workspaceId: string;
}

const CATEGORIES = ["All", "Daily Update", "Weekly Report", "Bug Report", "Feature Progress", "Research", "Meeting Summary", "General"];

export function WorkspaceReportsTab({ workspaceId }: WorkspaceReportsTabProps) {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [analytics, setAnalytics] = React.useState<ReportAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [activeReportId, setActiveReportId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, stats] = await Promise.all([
        reportApi.listWorkspaceReports(workspaceId, {
          category: selectedCategory === "All" ? undefined : selectedCategory,
          status: selectedStatus === "All" ? undefined : selectedStatus.toLowerCase(),
          search: searchQuery.trim() || undefined,
        }),
        reportApi.getWorkspaceReportAnalytics(workspaceId),
      ]);
      setReports(list);
      setAnalytics(stats);
    } catch (err: unknown) {
      toast.error("Failed to load reports", {
        description: err instanceof Error ? err.message : "Error fetching workspace reports.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, selectedCategory, selectedStatus, searchQuery]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveQuick = async (reportId: string, title: string) => {
    try {
      await reportApi.updateReportStatus(reportId, { status: "approved" });
      toast.success("Report Approved", { description: `'${title}' has been approved.` });
      loadData();
    } catch (err: unknown) {
      toast.error("Approval Failed", {
        description: err instanceof Error ? err.message : "Error approving report.",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Reports</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{analytics?.total_reports || 0}</div>
          <div className="text-[10px] text-muted-foreground font-mono">Workspace submissions</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-foreground">{analytics?.pending_review || 0}</div>
          <div className="text-[10px] text-warning font-semibold">Requires manager action</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Approved Reports</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-foreground">{analytics?.approved || 0}</div>
          <div className="text-[10px] text-success font-semibold">Completed milestones</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Completion Rate</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{analytics?.completion_rate || 0}%</div>
          <div className="text-[10px] text-muted-foreground font-mono">Approval efficiency</div>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title or content..."
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="needs_changes">Needs Changes</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="rounded-xl shadow-xs"
            >
              Submit Report
            </Button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">Loading workspace reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-foreground">No reports found</h3>
              <p className="text-xs text-muted-foreground">Be the first to submit a team update or project report.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Submit Report
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Report Title</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {reports.map((r) => {
                  const statusVariant = {
                    draft: "secondary",
                    submitted: "warning",
                    under_review: "info",
                    approved: "success",
                    rejected: "destructive",
                    needs_changes: "warning",
                    completed: "success",
                  }[r.status] as "secondary" | "warning" | "info" | "success" | "destructive";

                  return (
                    <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <div
                              onClick={() => setActiveReportId(r.id)}
                              className="font-bold text-foreground hover:text-primary cursor-pointer line-clamp-1"
                            >
                              {r.title}
                            </div>
                            {r.attachment_count > 0 && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Paperclip className="h-3 w-3" />
                                {r.attachment_count} attachment(s)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground truncate max-w-[140px]">
                        {r.author_name}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                          {r.category}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={statusVariant} size="sm">
                          {r.status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setActiveReportId(r.id)}
                            title="View Report Details"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {r.status === "submitted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveQuick(r.id, r.title)}
                              className="text-xs text-success border-success/30 hover:bg-success/10"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Report Modal */}
      <SubmitReportModal
        workspaceId={workspaceId}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Report Details & Review Modal */}
      <ReportDetailsModal
        reportId={activeReportId}
        isOpen={Boolean(activeReportId)}
        onClose={() => setActiveReportId(null)}
        onRefresh={loadData}
      />
    </div>
  );
}
