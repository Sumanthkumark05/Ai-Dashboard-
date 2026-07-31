"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X, AlertTriangle } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function ResetDialog() {
  const { isResetOpen, closeResetModal, resetToDefaults } = useSettingsStore();

  if (!isResetOpen) return null;

  const handleConfirm = () => {
    resetToDefaults();
    toast.success("Settings reset", {
      description: "Restored all preferences to system default values.",
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeResetModal}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs"
        />

        {/* Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-foreground">Reset All Preferences?</h3>
            </div>
            <Button variant="ghost" size="xs" onClick={closeResetModal} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to restore all workspace preferences, notification toggles, theme settings, and accessibility options to factory defaults?
          </p>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={closeResetModal}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={handleConfirm}
            >
              Reset to Defaults
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
