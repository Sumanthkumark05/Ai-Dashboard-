"use client";

import * as React from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { CalendarEvent } from "../types";
import { DayCell } from "./day-cell";
import { EventCard } from "./event-card";

export interface CalendarGridProps {
  events: CalendarEvent[];
}

export function CalendarGrid({ events }: CalendarGridProps) {
  const { currentView, selectedDate } = useCalendarStore();

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper to check if event matches date string YYYY-MM-DD
  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.date === dateStr);
  };

  // Render Month View (July 2026 7x5 Matrix)
  if (currentView === "month") {
    // Fixed days matrix for July 2026
    const daysInMonth = 31;
    const startDayOffset = 3; // July 1 2026 is Wednesday (index 3)

    const totalCells = 35;
    const monthCells: { dateNum: number; dateStr: string; isCurrentMonth: boolean; isWeekend: boolean }[] = [];

    // Prev month padding (June 28, 29, 30)
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dayNum = 30 - i;
      monthCells.push({
        dateNum: dayNum,
        dateStr: `2026-06-${dayNum < 10 ? "0" + dayNum : dayNum}`,
        isCurrentMonth: false,
        isWeekend: (startDayOffset - 1 - i) % 7 === 0 || (startDayOffset - 1 - i) % 7 === 6,
      });
    }

    // Current month (July 1 - 31)
    for (let i = 1; i <= daysInMonth; i++) {
      const dayIdx = (startDayOffset + i - 1) % 7;
      monthCells.push({
        dateNum: i,
        dateStr: `2026-07-${i < 10 ? "0" + i : i}`,
        isCurrentMonth: true,
        isWeekend: dayIdx === 0 || dayIdx === 6,
      });
    }

    // Next month padding (August 1)
    const remaining = totalCells - monthCells.length;
    for (let i = 1; i <= remaining; i++) {
      monthCells.push({
        dateNum: i,
        dateStr: `2026-08-0${i}`,
        isCurrentMonth: false,
        isWeekend: (monthCells.length % 7 === 0 || monthCells.length % 7 === 6),
      });
    }

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground select-none">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2.5">
              {day}
            </div>
          ))}
        </div>

        {/* 7x5 Matrix */}
        <div className="grid grid-cols-7">
          {monthCells.map((cell, idx) => (
            <DayCell
              key={idx}
              dateNum={cell.dateNum}
              dateStr={cell.dateStr}
              isCurrentMonth={cell.isCurrentMonth}
              isToday={cell.dateStr === "2026-07-29"}
              isWeekend={cell.isWeekend}
              events={getEventsForDate(cell.dateStr)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Render Week View (July 26 - Aug 1)
  if (currentView === "week") {
    const weekDates = [
      { day: "Sun", dateStr: "2026-07-26", dateNum: 26 },
      { day: "Mon", dateStr: "2026-07-27", dateNum: 27 },
      { day: "Tue", dateStr: "2026-07-28", dateNum: 28 },
      { day: "Wed", dateStr: "2026-07-29", dateNum: 29 },
      { day: "Thu", dateStr: "2026-07-30", dateNum: 30 },
      { day: "Fri", dateStr: "2026-07-31", dateNum: 31 },
      { day: "Sat", dateStr: "2026-08-01", dateNum: 1 },
    ];

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground select-none">
          {weekDates.map((w) => (
            <div key={w.dateStr} className="py-2.5">
              <span>{w.day} </span>
              <span className={w.dateStr === "2026-07-29" ? "text-primary font-bold" : ""}>{w.dateNum}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDates.map((w) => {
            const dayEvents = getEventsForDate(w.dateStr);
            return (
              <div key={w.dateStr} className="p-2 border-r border-border space-y-2 last:border-r-0">
                {dayEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Day View
  const dayEvents = getEventsForDate(selectedDate);

  return (
    <div className="rounded-xl border border-border bg-card p-6 min-h-[400px] shadow-xs space-y-4">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground">Schedule for {selectedDate}</h3>
        <p className="text-xs text-muted-foreground">{dayEvents.length} events planned</p>
      </div>

      {dayEvents.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-8 text-center">No events scheduled for this day.</p>
      ) : (
        <div className="space-y-3">
          {dayEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}
