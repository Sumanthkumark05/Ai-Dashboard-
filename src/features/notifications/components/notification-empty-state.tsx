"use client";

import * as React from "react";
import { BellOff, RotateCcw } from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function NotificationEmptyState() {
  const { setSearchQuery, setFilter } = useNotificationStore();

  const handleReset = () => {
    setSearchQuery("");
    setFilter("all");
  };

  return (
    <EmptyState
      icon={<BellOff className="h-10 w-10 text-muted-foreground/60" />}
      title="No notifications found"
      description="No inbox items matched your search query or category filter. Try resetting filters."
      action={
        <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleReset}>
          Reset Filters
        </Button>
      }
      className="my-8 py-12"
    />
  );
}
