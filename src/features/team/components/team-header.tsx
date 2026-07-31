"use client";

import * as React from "react";
import { UserPlus, Users } from "lucide-react";
import { useTeamStore } from "@/stores/team-store";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function TeamHeader() {
  const { openInviteDialog } = useTeamStore();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 select-none">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Team Workspace & Access Control
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          Manage workspace members, assign RBAC security roles, track live availability, and inspect collaboration activity logs.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Users className="h-4 w-4" />}
          onClick={() =>
            toast.info("Create Team Workspace", {
              description: "Team workspace creation modal preview.",
            })
          }
        >
          Create Team
        </Button>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={openInviteDialog}
        >
          Invite Member
        </Button>
      </div>
    </div>
  );
}
