"use client";

import * as React from "react";
import { HardDrive, LogOut, Trash2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/feedback/progress";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function AccountSettings() {
  return (
    <div className="space-y-6 select-none">
      {/* Account Info Card */}
      <Card className="p-6 space-y-4">
        <div className="border-b border-border pb-4">
          <h3 className="text-base font-bold text-foreground">Account & Subscription Overview</h3>
          <p className="text-xs text-muted-foreground">Manage your workspace tier and storage capacity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-border bg-muted/20">
            <span className="text-muted-foreground block mb-1">Account ID</span>
            <span className="font-mono font-bold text-foreground">usr_9847201948</span>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/20">
            <span className="text-muted-foreground block mb-1">Member Since</span>
            <span className="font-mono font-semibold text-foreground">January 15, 2024</span>
          </div>
        </div>

        {/* Subscription Plan Box */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <span className="font-bold text-sm text-foreground">Enterprise Plan</span>
                <span className="text-xs text-muted-foreground block">Unlimited AI tokens & multi-agent telemetry</span>
              </div>
            </div>
            <Badge variant="success">Active Plan</Badge>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-primary/20">
            <span className="text-muted-foreground">Renews on August 15, 2026</span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => toast.info("Manage Subscription modal preview")}
            >
              Manage Subscription
            </Button>
          </div>
        </div>

        {/* Storage Usage Progress */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-primary" />
              Workspace Storage Usage
            </span>
            <span className="font-mono text-muted-foreground">45.2 GB / 100.0 GB (45%)</span>
          </div>
          <Progress value={45} className="h-2" />
        </div>
      </Card>

      {/* Danger Zone Card */}
      <Card className="p-6 border-destructive/30 bg-destructive/5 space-y-4">
        <div className="border-b border-destructive/20 pb-3">
          <h4 className="text-sm font-bold text-destructive">Danger Zone</h4>
          <p className="text-xs text-muted-foreground">Irreversible workspace account actions</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div>
            <span className="font-semibold text-xs text-foreground block">Sign Out of Workspace Session</span>
            <span className="text-[11px] text-muted-foreground">End active authentication session on this device</span>
          </div>
          <Button
            variant="outline"
            size="xs"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => toast.info("Sign out session preview")}
          >
            Sign Out
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-destructive/20">
          <div>
            <span className="font-semibold text-xs text-destructive block">Delete Workspace Account</span>
            <span className="text-[11px] text-muted-foreground">Permanently remove all notes, files, and telemetry</span>
          </div>
          <Button
            variant="destructive"
            size="xs"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => toast.error("Delete account modal preview")}
          >
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
