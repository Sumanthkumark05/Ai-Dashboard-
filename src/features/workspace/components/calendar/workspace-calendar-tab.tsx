"use client";

import * as React from "react";
import { Calendar, CalendarPlus, RefreshCw, Clock, Video, User, CheckCircle2 } from "lucide-react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/feedback/toast";

export function WorkspaceCalendarTab({ workspaceId }: { workspaceId: string }) {
  const { events, fetchEvents, syncWorkspaceDates, openDialog, openDrawer, markEventStatus } = useCalendarStore();
  const { currentWorkspace } = useWorkspaceContextStore();
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    fetchEvents(workspaceId);
  }, [workspaceId, fetchEvents]);

  const workspaceEvents = React.useMemo(() => {
    return events.filter(
      (e) => !e.workspace_id || e.workspace_id === workspaceId || e.workspace_id === currentWorkspace?.id
    );
  }, [events, workspaceId, currentWorkspace?.id]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWorkspaceDates(workspaceId);
      toast.success("Calendar Synced", {
        description: `Client Demo, Review Meetings, and Deadlines synced for ${currentWorkspace?.name || "Workspace"}.`,
      });
    } catch {
      toast.error("Sync Failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Calendar className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-foreground">Workspace Project Schedule &amp; Timeline</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Automated calendar synchronization for Client Demos, Deadlines, Code Reviews, and Weekly Reports.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            isLoading={isSyncing}
            leftIcon={<RefreshCw className="h-4 w-4 text-emerald-500" />}
            onClick={handleSync}
          >
            Sync Dates
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<CalendarPlus className="h-4 w-4" />}
            onClick={openDialog}
          >
            Add Event
          </Button>
        </div>
      </div>

      {/* Dates Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-blue-500/5 border-l-4 border-l-blue-500 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground block">Client Demo Date</span>
          <span className="text-sm font-bold text-foreground font-mono">
            {currentWorkspace?.client_demo_date || "Aug 15, 2026"}
          </span>
          <span className="text-[11px] text-muted-foreground block">Client: {currentWorkspace?.client_name || "ABC Technologies"}</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-amber-500/5 border-l-4 border-l-amber-500 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground block">Internal Review Date</span>
          <span className="text-sm font-bold text-foreground font-mono">
            {currentWorkspace?.internal_review_date || "Aug 18, 2026"}
          </span>
          <span className="text-[11px] text-muted-foreground block">Architecture &amp; Code Review</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-rose-500/5 border-l-4 border-l-rose-500 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground block">Final Project Deadline</span>
          <span className="text-sm font-bold text-foreground font-mono">
            {currentWorkspace?.final_delivery_date || currentWorkspace?.end_date || "Aug 20, 2026"}
          </span>
          <span className="text-[11px] text-muted-foreground block">Final client submission</span>
        </div>
      </div>

      {/* Scheduled Events List */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-foreground">Timeline Events ({workspaceEvents.length})</h4>

        {workspaceEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center">
            No events scheduled for this workspace yet. Click &quot;Sync Dates&quot; or &quot;Add Event&quot; above.
          </p>
        ) : (
          <div className="space-y-3">
            {workspaceEvents.map((evt) => (
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
                      <h5 className="text-sm font-bold text-foreground">{evt.title}</h5>
                      <Badge variant="outline" className="text-[10px] uppercase">{evt.event_type || evt.category}</Badge>
                      <Badge
                        variant={evt.status === "Completed" ? "success" : "secondary"}
                        size="sm"
                        className="text-[10px]"
                      >
                        {evt.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">{evt.description || "Workspace scheduled event."}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {evt.date || evt.start_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {evt.time || evt.startTime || "09:00 AM"}
                      </span>
                      {evt.client_name && (
                        <span className="font-semibold text-foreground font-sans">
                          <User className="h-3.5 w-3.5 inline mr-1 text-primary" />
                          {evt.client_name}
                        </span>
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
    </div>
  );
}
