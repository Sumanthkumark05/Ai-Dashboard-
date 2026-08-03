"use client";

import * as React from "react";
import { Calendar, Clock } from "lucide-react";
import { CalendarEvent } from "../types";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UpcomingEvents() {
  const { events, openDrawer } = useCalendarStore();
  const todayStr = new Date().toISOString().split("T")[0];

  const todayEvents = events.filter((e) => e.date === todayStr || e.start_date === todayStr);
  const upcomingEvents = events.filter((e) => e.date !== todayStr && e.start_date !== todayStr);

  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Upcoming Schedule Agenda</h4>
          <p className="text-xs text-muted-foreground">Today&apos;s &amp; upcoming workspace events</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Today Section */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Today ({todayStr})
          </span>

          <div className="space-y-2">
            {todayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No meetings scheduled today.</p>
            ) : (
              todayEvents.map((evt: CalendarEvent) => (
                <div
                  key={evt.id}
                  onClick={() => openDrawer(evt)}
                  className="rounded-lg border border-border bg-muted/20 p-3 hover:bg-accent/40 transition-colors cursor-pointer"
                  style={{ borderLeftColor: evt.color || "#3b82f6", borderLeftWidth: "3px" }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground truncate">{evt.title}</span>
                    <Badge variant="outline" size="sm" className="text-[10px] shrink-0 uppercase">
                      {evt.event_type || evt.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{evt.time || evt.startTime || "09:00 AM"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Section */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Upcoming Activity
          </span>

          <div className="space-y-2">
            {upcomingEvents.map((evt: CalendarEvent) => (
              <div
                key={evt.id}
                onClick={() => openDrawer(evt)}
                className="rounded-lg border border-border bg-muted/20 p-3 hover:bg-accent/40 transition-colors cursor-pointer"
                style={{ borderLeftColor: evt.color || "#3b82f6", borderLeftWidth: "3px" }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground truncate">{evt.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{evt.date || evt.start_date}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{evt.time || evt.startTime || "09:00 AM"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
