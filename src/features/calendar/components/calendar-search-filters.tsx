"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { useCalendarStore } from "@/stores/calendar-store";
import { SearchInput } from "@/components/forms/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";

export function CalendarSearchFilters() {
  const { searchQuery, setSearchQuery, categoryFilter, setCategoryFilter } = useCalendarStore();

  const handleReset = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 select-none">
      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Search event title, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Meeting">Meeting</SelectItem>
            <SelectItem value="AI Session">AI Session</SelectItem>
            <SelectItem value="Workspace">Workspace</SelectItem>
            <SelectItem value="Task">Task</SelectItem>
            <SelectItem value="Reminder">Reminder</SelectItem>
            <SelectItem value="System">System</SelectItem>
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
