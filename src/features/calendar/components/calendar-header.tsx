"use client";

import * as React from "react";
import { CalendarPlus, CalendarCheck } from "lucide-react";
import { useCalendarStore } from "@/stores/calendar-store";
import { Button } from "@/components/ui/button";

export function CalendarHeader() {
  const { currentMonth, currentYear, setToday, openDialog } = useCalendarStore();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 select-none">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          Manage workspace schedules, AI tuning sessions, team standups, and milestone deadlines.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<CalendarCheck className="h-4 w-4 text-primary" />}
          onClick={setToday}
        >
          Today
        </Button>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<CalendarPlus className="h-4 w-4" />}
          onClick={openDialog}
        >
          Create Event
        </Button>
      </div>
    </div>
  );
}
