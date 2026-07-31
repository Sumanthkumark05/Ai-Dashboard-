"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";
import { NotificationFilter, NotificationSort } from "../types";
import { SearchInput } from "@/components/forms/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { cn } from "@/lib/utils";

export function NotificationFilters() {
  const { searchQuery, setSearchQuery, filter, setFilter, sortBy, setSortBy } = useNotificationStore();

  const filterBadges: { id: NotificationFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "read", label: "Read" },
    { id: "mentions", label: "Mentions" },
    { id: "ai", label: "AI" },
    { id: "files", label: "Files" },
    { id: "workspace", label: "Workspace" },
    { id: "system", label: "System" },
  ];

  return (
    <div className="flex flex-col gap-3 mb-6 select-none">
      {/* Top Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search notification title, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-semibold">Sort:</span>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as NotificationSort)}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-primary" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="priority">High Priority</SelectItem>
              <SelectItem value="unread">Unread First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category & Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {filterBadges.map((badge) => {
          const isActive = filter === badge.id;

          return (
            <button
              key={badge.id}
              onClick={() => setFilter(badge.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all shrink-0 cursor-pointer border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
              )}
            >
              {badge.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
