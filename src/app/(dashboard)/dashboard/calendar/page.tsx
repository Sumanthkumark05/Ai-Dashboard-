"use client";

import * as React from "react";
import { useCalendarStore } from "@/stores/calendar-store";
import { CalendarEvent } from "@/features/calendar/types";
import { CalendarHeader } from "@/features/calendar/components/calendar-header";
import { CalendarNavigation } from "@/features/calendar/components/calendar-navigation";
import { CalendarSearchFilters } from "@/features/calendar/components/calendar-search-filters";
import { CalendarGrid } from "@/features/calendar/components/calendar-grid";
import { UpcomingEvents } from "@/features/calendar/components/upcoming-events";
import { EventDrawer } from "@/features/calendar/components/event-drawer";
import { EventDialog } from "@/features/calendar/components/event-dialog";
import { CalendarEmptyState } from "@/features/calendar/components/calendar-empty-state";
import { CalendarSkeleton } from "@/features/calendar/components/calendar-skeleton";

export default function CalendarPage() {
  const { events, searchQuery, categoryFilter, isLoading } = useCalendarStore();

  // Client-side Filter logic
  const filteredEvents = React.useMemo(() => {
    return events.filter((evt: CalendarEvent) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        evt.title.toLowerCase().includes(query) ||
        evt.description.toLowerCase().includes(query) ||
        (evt.location && evt.location.toLowerCase().includes(query));

      const matchesCategory = categoryFilter === "all" || evt.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <CalendarHeader />

      {/* Navigation Controls (Month/Week/Day view selectors & Month switcher) */}
      <CalendarNavigation />

      {/* Search & Category Filter Bar */}
      <CalendarSearchFilters />

      {/* Main Grid & Side Agenda Layout */}
      {isLoading ? (
        <CalendarSkeleton />
      ) : filteredEvents.length === 0 ? (
        <CalendarEmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Main Grid Pane */}
          <div className="lg:col-span-8">
            <CalendarGrid events={filteredEvents} />
          </div>

          {/* Upcoming Events Agenda Pane */}
          <div className="lg:col-span-4">
            <UpcomingEvents />
          </div>
        </div>
      )}

      {/* Event Details Slide-over Drawer */}
      <EventDrawer />

      {/* Create Event Modal Dialog */}
      <EventDialog />
    </div>
  );
}
