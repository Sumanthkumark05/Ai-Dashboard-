"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Clock, Video, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CalendarWidget() {
  const { events, openDrawer } = useCalendarStore();
  const todayStr = new Date().toISOString().split("T")[0];

  const todayEvents = events.filter((e) => e.date === todayStr || e.start_date === todayStr);
  const upcomingMeetings = events.filter((e) => ["Client Meeting", "Internal Meeting", "Client Demo"].includes(e.event_type as string) && e.status !== "Completed");
  const upcomingDeadlines = events.filter((e) => e.event_type === "Project Deadline" && e.status !== "Completed");

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Calendar className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">Project Calendar &amp; Schedule</CardTitle>
          </div>
          <Link href="/dashboard/calendar">
            <Button variant="ghost" size="xs" className="gap-1 text-xs text-primary font-medium">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg border border-border bg-muted/20">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Today</span>
              <span className="text-base font-extrabold text-foreground">{todayEvents.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Meetings</span>
              <span className="text-base font-extrabold text-blue-500">{upcomingMeetings.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Deadlines</span>
              <span className="text-base font-extrabold text-rose-500">{upcomingDeadlines.length}</span>
            </div>
          </div>

          {/* Today's Events List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground block">Today&apos;s Schedule</span>

            {todayEvents.length === 0 ? (
              <div className="p-3 rounded-lg border border-border bg-muted/10 text-xs text-muted-foreground italic text-center">
                No events scheduled for today.
              </div>
            ) : (
              todayEvents.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => openDrawer(evt)}
                  className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between"
                  style={{ borderLeftColor: evt.color || "#3b82f6", borderLeftWidth: "3px" }}
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-foreground truncate">{evt.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                      <Clock className="h-3 w-3 text-primary" />
                      <span>{evt.time || evt.startTime || "09:00 AM"}</span>
                      {evt.client_name && <span>&bull; {evt.client_name}</span>}
                    </div>
                  </div>

                  <Badge variant="outline" size="sm" className="text-[9px] uppercase shrink-0">
                    {evt.event_type || evt.category}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
