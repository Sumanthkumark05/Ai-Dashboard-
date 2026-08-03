"use client";

import * as React from "react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { CalendarEvent } from "../types";
import { DayCell } from "./day-cell";
import { EventCard } from "./event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Video } from "lucide-react";

export interface CalendarGridProps {
  events: CalendarEvent[];
}

export function CalendarGrid({ events }: CalendarGridProps) {
  const {
    currentView,
    selectedDate,
    currentMonth,
    currentYear,
    openDrawer,
    markEventStatus,
  } = useCalendarStore();

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = new Date().toISOString().split("T")[0];

  // Filter events matching search query and category filters
  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.date === dateStr || e.start_date === dateStr);
  };

  // ── Month View ────────────────────────────────────────────────────────────
  if (currentView === "month") {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOffset = firstDay.getDay(); // 0 = Sunday

    const monthCells: { dateNum: number; dateStr: string; isCurrentMonth: boolean; isWeekend: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mStr = String(prevM + 1).padStart(2, "0");
      const dStr = String(dayNum).padStart(2, "0");
      monthCells.push({
        dateNum: dayNum,
        dateStr: `${prevY}-${mStr}-${dStr}`,
        isCurrentMonth: false,
        isWeekend: (startDayOffset - 1 - i) % 7 === 0 || (startDayOffset - 1 - i) % 7 === 6,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayIdx = (startDayOffset + i - 1) % 7;
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(i).padStart(2, "0");
      monthCells.push({
        dateNum: i,
        dateStr: `${currentYear}-${mStr}-${dStr}`,
        isCurrentMonth: true,
        isWeekend: dayIdx === 0 || dayIdx === 6,
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remaining = (7 - (monthCells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mStr = String(nextM + 1).padStart(2, "0");
      const dStr = String(i).padStart(2, "0");
      monthCells.push({
        dateNum: i,
        dateStr: `${nextY}-${mStr}-${dStr}`,
        isCurrentMonth: false,
        isWeekend: monthCells.length % 7 === 0 || monthCells.length % 7 === 6,
      });
    }

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs select-none">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2.5">
              {day}
            </div>
          ))}
        </div>

        {/* Month Cells Grid */}
        <div className="grid grid-cols-7">
          {monthCells.map((cell, idx) => (
            <DayCell
              key={idx}
              dateNum={cell.dateNum}
              dateStr={cell.dateStr}
              isCurrentMonth={cell.isCurrentMonth}
              isToday={cell.dateStr === todayStr}
              isWeekend={cell.isWeekend}
              events={getEventsForDate(cell.dateStr)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Week View ─────────────────────────────────────────────────────────────
  if (currentView === "week") {
    const selDate = new Date(selectedDate);
    const dayOfWeek = selDate.getDay();
    const sundayDate = new Date(selDate);
    sundayDate.setDate(selDate.getDate() - dayOfWeek);

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sundayDate);
      d.setDate(sundayDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return {
        dayName: daysOfWeek[i],
        dateNum: d.getDate(),
        dateStr,
        isToday: dateStr === todayStr,
      };
    });

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs select-none">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
          {weekDates.map((w) => (
            <div key={w.dateStr} className="py-2.5">
              <span>{w.dayName} </span>
              <span className={w.isToday ? "text-primary font-bold" : ""}>{w.dateNum}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[420px]">
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

  // ── Day View ──────────────────────────────────────────────────────────────
  if (currentView === "day") {
    const dayEvents = getEventsForDate(selectedDate);
    return (
      <div className="rounded-xl border border-border bg-card p-6 min-h-[420px] shadow-xs space-y-4">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Schedule for {selectedDate}</h3>
            <p className="text-xs text-muted-foreground">{dayEvents.length} events scheduled</p>
          </div>
          {selectedDate === todayStr && (
            <Badge variant="default" size="sm">Today</Badge>
          )}
        </div>

        {dayEvents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs italic">
            No events scheduled for this date. Click &quot;Create Event&quot; to add a meeting or deadline.
          </div>
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

  // ── Agenda / List View ────────────────────────────────────────────────────
  const sortedEvents = [...events].sort((a, b) => (a.date || a.start_date || "").localeCompare(b.date || b.start_date || ""));

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
      <div className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Agenda &amp; Timeline List</h3>
          <p className="text-xs text-muted-foreground">{sortedEvents.length} total scheduled activities across workspaces</p>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-xs italic">
          No scheduled events match current search and category filters.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => openDrawer(evt)}
              className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: evt.color || "#3b82f6" }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{evt.title}</h4>
                    <Badge variant="outline" className="text-[10px] uppercase">{evt.event_type || evt.category}</Badge>
                    <Badge
                      variant={evt.status === "Completed" ? "success" : evt.status === "Upcoming" ? "info" : "secondary"}
                      size="sm"
                      className="text-[10px]"
                    >
                      {evt.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{evt.description || "No description."}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1 font-mono">
                      <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                      {evt.date || evt.start_date}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {evt.time || evt.startTime || "09:00 AM"}
                    </span>
                    {evt.client_name && (
                      <span className="font-semibold text-foreground">Client: {evt.client_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                {evt.meeting_link && (
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<Video className="h-3.5 w-3.5 text-primary" />}
                    onClick={() => window.open(evt.meeting_link, "_blank")}
                  >
                    Join
                  </Button>
                )}
                <Button
                  variant={evt.status === "Completed" ? "outline" : "secondary"}
                  size="xs"
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => markEventStatus(evt.id, evt.status === "Completed" ? "Scheduled" : "Completed")}
                >
                  {evt.status === "Completed" ? "Completed" : "Complete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
