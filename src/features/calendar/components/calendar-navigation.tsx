"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Columns, Calendar as CalendarIcon } from "lucide-react";
import { useCalendarStore } from "@/stores/calendar-store";
import { Button } from "@/components/ui/button";

export function CalendarNavigation() {
  const { currentView, setView, prevMonth, nextMonth } = useCalendarStore();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 select-none">
      {/* Month Navigation Arrows */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="xs"
          onClick={prevMonth}
          className="h-8 w-8 p-0"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="xs"
          onClick={nextMonth}
          className="h-8 w-8 p-0"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* View Selector (Month, Week, Day) */}
      <div className="flex items-center rounded-lg border border-input p-0.5 bg-muted/40 self-start sm:self-auto">
        <Button
          variant={currentView === "month" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setView("month")}
          className="h-7 text-xs font-semibold gap-1.5 px-3"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Month</span>
        </Button>

        <Button
          variant={currentView === "week" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setView("week")}
          className="h-7 text-xs font-semibold gap-1.5 px-3"
        >
          <Columns className="h-3.5 w-3.5" />
          <span>Week</span>
        </Button>

        <Button
          variant={currentView === "day" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setView("day")}
          className="h-7 text-xs font-semibold gap-1.5 px-3"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>Day</span>
        </Button>
      </div>
    </div>
  );
}
