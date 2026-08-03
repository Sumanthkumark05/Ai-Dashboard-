"use client";

import * as React from "react";
import { CalendarPlus, CalendarCheck, RefreshCw } from "lucide-react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function CalendarHeader() {
  const { currentMonth, currentYear, setToday, openDialog, syncWorkspaceDates } = useCalendarStore();
  const { currentWorkspace } = useWorkspaceContextStore();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleSyncWorkspace = async () => {
    if (!currentWorkspace?.id) {
      toast.info("Select Workspace", { description: "Select a workspace to sync dates with Calendar." });
      return;
    }

    setIsSyncing(true);
    try {
      await syncWorkspaceDates(currentWorkspace.id);
      toast.success("Workspace Calendar Synced", {
        description: `Successfully synchronized Client Demo, Review Meetings, and Deadlines for ${currentWorkspace.name}.`,
      });
    } catch {
      toast.error("Sync Failed", { description: "Unable to sync workspace dates." });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 select-none">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          Central project timeline &bull; Auto-syncing Client Demos, Deadlines, Review Meetings, and Weekly Reports.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          isLoading={isSyncing}
          leftIcon={<RefreshCw className="h-4 w-4 text-emerald-500" />}
          onClick={handleSyncWorkspace}
        >
          Sync Workspace
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<CalendarCheck className="h-4 w-4 text-primary" />}
          onClick={setToday}
        >
          Today
        </Button>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<CalendarPlus className="h-4 w-4" />}
          onClick={openDialog}
        >
          Create Event
        </Button>
      </div>
    </div>
  );
}
