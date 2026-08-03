"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Columns, Calendar as CalendarIcon, List } from "lucide-react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";

export function CalendarNavigation() {
  const {
    currentView,
    setView,
    prevMonth,
    nextMonth,
    setToday,
    currentMonth,
    currentYear,
  } = useCalendarStore();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 10 }, (_, i) => 2022 + i);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 select-none">
      {/* Month Navigation & Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
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

        <Button variant="outline" size="xs" onClick={setToday} className="h-8 px-2.5 text-xs font-medium">
          Today
        </Button>

        {/* Month Selector */}
        <Select
          value={String(currentMonth)}
          onValueChange={(val) => {
            useCalendarStore.setState({ currentMonth: parseInt(val, 10) });
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((name, idx) => (
              <SelectItem key={idx} value={String(idx)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year Selector */}
        <Select
          value={String(currentYear)}
          onValueChange={(val) => {
            useCalendarStore.setState({ currentYear: parseInt(val, 10) });
          }}
        >
          <SelectTrigger className="h-8 w-24 text-xs font-mono">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View Selector (Month, Week, Day, Agenda) */}
      <div className="flex items-center rounded-lg border border-input p-0.5 bg-muted/40 self-start sm:self-auto">
        <Button
          variant={currentView === "month" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setView("month")}
          className="h-7 text-xs font-semibold gap-1.5 px-2.5"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Month</span>
        </Button>

        <Button
          variant={currentView === "week" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setView("week")}
          className="h-7 text-xs font-semibold gap-1.5 px-2.5"
        >
          <Columns className="h-3.5 w-3.5" />
          <span>Week</span>
        </Button>

        <Button
          variant={currentView === "day" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setView("day")}
          className="h-7 text-xs font-semibold gap-1.5 px-2.5"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>Day</span>
        </Button>

        <Button
          variant={currentView === "agenda" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setView("agenda")}
          className="h-7 text-xs font-semibold gap-1.5 px-2.5"
        >
          <List className="h-3.5 w-3.5" />
          <span>Agenda</span>
        </Button>
      </div>
    </div>
  );
}
