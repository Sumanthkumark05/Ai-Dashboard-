"use client";

import * as React from "react";
import { CalendarEvent } from "../types";
import { useCalendarStore } from "@/stores/calendar-store";
import { EventCard } from "./event-card";
import { cn } from "@/lib/utils";

export interface DayCellProps {
  dateNum: number;
  dateStr: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

export function DayCell({
  dateNum,
  dateStr,
  isCurrentMonth,
  isToday,
  isWeekend,
  events,
}: DayCellProps) {
  const { selectedDate, setSelectedDate } = useCalendarStore();
  const isSelected = selectedDate === dateStr;

  const maxVisible = 2;
  const overflowCount = events.length > maxVisible ? events.length - maxVisible : 0;

  return (
    <div
      onClick={() => setSelectedDate(dateStr)}
      className={cn(
        "min-h-[110px] p-1.5 border border-border flex flex-col justify-between transition-colors cursor-pointer select-none",
        !isCurrentMonth && "bg-muted/20 text-muted-foreground/40",
        isWeekend && isCurrentMonth && "bg-muted/10",
        isToday && "bg-primary/5",
        isSelected && "ring-1 ring-primary bg-accent/30"
      )}
    >
      {/* Date Header */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "text-xs font-semibold h-6 w-6 rounded-full flex items-center justify-center",
            isToday
              ? "bg-primary text-primary-foreground font-bold"
              : isCurrentMonth
              ? "text-foreground"
              : "text-muted-foreground/50"
          )}
        >
          {dateNum}
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-1 flex-1 overflow-hidden">
        {events.slice(0, maxVisible).map((evt) => (
          <EventCard key={evt.id} event={evt} compact />
        ))}
      </div>

      {/* Overflow Indicator */}
      {overflowCount > 0 && (
        <span className="text-[10px] font-semibold text-primary block mt-1">
          +{overflowCount} more
        </span>
      )}
    </div>
  );
}
