"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { toast } from "@/components/feedback/toast";

export function ExportDialog() {
  const { isExportOpen, closeExportDialog } = useAnalyticsStore();
  const [format, setFormat] = React.useState("csv");
  const [isExporting, setIsExporting] = React.useState(false);

  if (!isExportOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      closeExportDialog();
      toast.success("Report exported", {
        description: `Analytics report generated in ${format.toUpperCase()} format.`,
      });
    }, 1000);
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
              <h3 className="text-base font-bold text-foreground">Export Analytics Data</h3>
            </div>
            <Button variant="ghost" size="xs" onClick={closeExportDialog} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Select your preferred data export format and timeframe scope for executive reporting.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Export Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV Spreadsheet (.csv)</SelectItem>
                  <SelectItem value="excel">Microsoft Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">Adobe PDF Report (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={closeExportDialog}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              isLoading={isExporting}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
