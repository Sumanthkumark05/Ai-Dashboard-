"use client";

import * as React from "react";
import { Info, Calendar, Clock, Tag, BookOpen, Activity, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { initialWorkspaceActivities } from "../mock/workspace-mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function InfoPanel() {
  const { pages, selectedPageId, isInfoPanelOpen, toggleInfoPanel } = useWorkspaceStore();

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  if (!isInfoPanelOpen || !selectedPage) return null;

  return (
    <Card className="p-4 h-full flex flex-col justify-between select-none border-l border-border bg-card">
      <div className="space-y-4">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Document Details</h4>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={toggleInfoPanel}
            className="h-7 w-7 p-0"
            aria-label="Close info panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted/20 text-xs">
          <Avatar size="xs">
            <AvatarFallback>{selectedPage.createdBy[0]}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-semibold text-foreground block">{selectedPage.createdBy}</span>
            <span className="text-[10px] text-muted-foreground">Document Author</span>
          </div>
        </div>

        <Separator />

        {/* Document Stats */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Created
            </span>
            <span className="font-mono text-foreground">{selectedPage.createdDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Updated
            </span>
            <span className="font-mono text-foreground">{selectedPage.updatedDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Word Count
            </span>
            <span className="font-mono font-semibold text-foreground">{selectedPage.wordCount} words</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Reading Time
            </span>
            <span className="font-mono text-foreground">{selectedPage.readingTime}</span>
          </div>
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedPage.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" size="sm" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Activity Timeline */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Recent Activity
          </span>

          <div className="space-y-2 text-[11px]">
            {initialWorkspaceActivities.map((act) => (
              <div key={act.id} className="p-2 rounded-md border border-border bg-muted/10 space-y-0.5">
                <p className="text-foreground">
                  <span className="font-semibold">{act.user}</span> {act.action}
                </p>
                <span className="text-[10px] text-muted-foreground block font-mono">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
