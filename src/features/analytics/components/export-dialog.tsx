"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, AlertCircle, FileText, Table, FileSpreadsheet } from "lucide-react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { analyticsExportService } from "@/services/analytics-export-service";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { toast } from "@/components/feedback/toast";

export function ExportDialog() {
  const {
    isExportOpen,
    closeExportDialog,
    telemetry,
    dateRange,
    selectedWorkspace,
    selectedCategory,
    selectedOwner,
    fetchTelemetry,
  } = useAnalyticsStore();

  const { currentWorkspace } = useWorkspaceContextStore();
  const { user } = useAuthStore();

  const [format, setFormat] = React.useState<"pdf" | "csv" | "excel">("pdf");
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  if (!isExportOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      // 1. Ensure telemetry data is fresh
      let data = telemetry;
      if (!data) {
        await fetchTelemetry();
        data = useAnalyticsStore.getState().telemetry;
      }

      if (!data) {
        throw new Error("Unable to retrieve live telemetry metrics from database.");
      }

      const activeFilters = {
        dateRange,
        selectedWorkspace,
        selectedCategory,
        selectedOwner,
      };

      const wsName = currentWorkspace?.name || "NeuroDesk Workspace";
      const userName = user?.name || user?.email || "Workspace Member";

      // 2. Perform export & trigger browser download
      await analyticsExportService.exportReport(
        format,
        data,
        activeFilters,
        wsName,
        userName
      );

      toast.success("Report Generated & Exported", {
        description: `Analytics report successfully downloaded in ${format.toUpperCase()} format.`,
      });

      closeExportDialog();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export report. Please try again.";
      console.error("[Export Error]: Report generation failed.", err);
      setExportError(msg);
      toast.error("Export Failed", {
        description: msg,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeExportDialog}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Download className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Export Analytics Report</h3>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeExportDialog}
              disabled={isExporting}
              className="rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Generate an executive analytics report containing live database metrics, workspace storage distribution, asset statistics, and telemetry.
          </p>

          {exportError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Select Export Format
              </label>
              <Select value={format} onValueChange={(val) => setFormat(val as "pdf" | "csv" | "excel")}>
                <SelectTrigger className="w-full text-xs" disabled={isExporting}>
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-rose-500" />
                      <span>PDF Document (.pdf)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Table className="h-3.5 w-3.5 text-emerald-500" />
                      <span>CSV Spreadsheet (.csv)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
                      <span>Microsoft Excel (.xlsx)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Active Scope:</span>
                <span className="font-semibold text-foreground">{dateRange}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Workspace:</span>
                <span className="font-semibold text-foreground truncate max-w-[180px]">
                  {currentWorkspace?.name || "All Workspaces"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={closeExportDialog}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              isLoading={isExporting}
              disabled={isExporting}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {isExporting ? "Generating..." : "Export Report"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
