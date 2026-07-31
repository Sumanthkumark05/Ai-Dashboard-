"use client";

import * as React from "react";
import { CalendarOff, CalendarPlus } from "lucide-react";
import { useCalendarStore } from "@/stores/calendar-store";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function CalendarEmptyState() {
  const { openDialog, setSearchQuery, setCategoryFilter } = useCalendarStore();

  const handleReset = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  return (
    <EmptyState
      icon={<CalendarOff className="h-10 w-10 text-muted-foreground/60" />}
      title="No events scheduled"
      description="No calendar events matched your search query or category filter. Try clearing filters or create a new event."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Clear Filters
          </Button>
          <Button variant="primary" size="sm" leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={openDialog}>
            Create Event
          </Button>
        </div>
      }
      className="my-8 py-12"
    />
  );
}
