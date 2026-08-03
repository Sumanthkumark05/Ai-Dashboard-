"use client";

import * as React from "react";
import { CalendarOff, CalendarPlus } from "lucide-react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
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
      title="No upcoming events."
      description="No calendar events found for the active workspace. Create a new event or add scheduling dates to your workspace."
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
