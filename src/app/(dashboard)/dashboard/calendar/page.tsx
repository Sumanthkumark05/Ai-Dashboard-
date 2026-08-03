"use client";

import * as React from "react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
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
  const {
    events,
    searchQuery,
    categoryFilter,
    statusFilter,
    workspaceFilter,
    isLoading,
    fetchEvents,
  } = useCalendarStore();

  const { currentWorkspace } = useWorkspaceContextStore();

  // Initial fetch and subscribe to real-time events
  React.useEffect(() => {
    fetchEvents(currentWorkspace?.id);

    const handleDataChanged = () => {
      fetchEvents(currentWorkspace?.id);
    };

    window.addEventListener("neurodesk:data_changed", handleDataChanged);
    window.addEventListener("neurodesk:workspace_changed", handleDataChanged);
    window.addEventListener("neurodesk:calendar_changed", handleDataChanged);

    return () => {
      window.removeEventListener("neurodesk:data_changed", handleDataChanged);
      window.removeEventListener("neurodesk:workspace_changed", handleDataChanged);
      window.removeEventListener("neurodesk:calendar_changed", handleDataChanged);
    };
  }, [currentWorkspace?.id, fetchEvents]);

  // Client-side Filter logic
  const filteredEvents = React.useMemo(() => {
    return events.filter((evt: CalendarEvent) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        evt.title.toLowerCase().includes(query) ||
        (evt.description && evt.description.toLowerCase().includes(query)) ||
        (evt.client_name && evt.client_name.toLowerCase().includes(query)) ||
        (evt.project_name && evt.project_name.toLowerCase().includes(query)) ||
        (evt.location && evt.location.toLowerCase().includes(query));

      const matchesCategory =
        categoryFilter === "all" ||
        evt.event_type === categoryFilter ||
        evt.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || evt.status === statusFilter;

      const matchesWorkspace =
        workspaceFilter === "all" ||
        !evt.workspace_id ||
        evt.workspace_id === workspaceFilter ||
        evt.workspace_id === currentWorkspace?.id;

      return matchesSearch && matchesCategory && matchesStatus && matchesWorkspace;
    });
  }, [events, searchQuery, categoryFilter, statusFilter, workspaceFilter, currentWorkspace?.id]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <CalendarHeader />

      {/* Navigation Controls (Month/Week/Day/Agenda view selectors & Month/Year switchers) */}
      <CalendarNavigation />

      {/* Search & Category / Status Filter Bar */}
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
