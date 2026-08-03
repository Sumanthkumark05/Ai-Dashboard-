"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { SearchInput } from "@/components/forms/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";

export function CalendarSearchFilters() {
  const {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
  } = useCalendarStore();

  const handleReset = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 select-none">
      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Search event, client, workspace..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Event Type Filter */}
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Event Types</SelectItem>
            <SelectItem value="Client Demo">Client Demo (Blue)</SelectItem>
            <SelectItem value="Client Meeting">Client Meeting (Green)</SelectItem>
            <SelectItem value="Internal Meeting">Internal Meeting (Emerald)</SelectItem>
            <SelectItem value="Project Deadline">Project Deadline (Red)</SelectItem>
            <SelectItem value="Code Review">Code Review (Orange)</SelectItem>
            <SelectItem value="Testing">Testing (Amber)</SelectItem>
            <SelectItem value="Deployment">Deployment (Purple)</SelectItem>
            <SelectItem value="Report Submission">Report Submission (Indigo)</SelectItem>
            <SelectItem value="Dataset Review">Dataset Review (Cyan)</SelectItem>
            <SelectItem value="Document Review">Document Review (Teal)</SelectItem>
            <SelectItem value="Custom Event">Custom Event (Slate)</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Missed">Missed / Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="xs"
          onClick={handleReset}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Reset filters"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
