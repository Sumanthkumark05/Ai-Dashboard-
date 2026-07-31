"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { CalendarEvent } from "../types";
import { useCalendarStore } from "@/stores/calendar-store";
import { cn } from "@/lib/utils";

export interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const { selectedEvent, selectEvent, openDrawer } = useCalendarStore();
  const isSelected = selectedEvent?.id === event.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectEvent(event);
    openDrawer(event);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={handleClick}
      className={cn(
        "rounded-md p-1.5 text-xs transition-all cursor-pointer select-none border border-border/60 shadow-2xs group",
        isSelected ? "ring-1 ring-primary" : "bg-card hover:border-primary/40"
      )}
      style={{ borderLeftColor: event.color, borderLeftWidth: "3px" }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {event.title}
        </span>
      </div>

      {!compact && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="font-mono">{event.startTime}</span>
        </div>
      )}
    </motion.div>
  );
}
