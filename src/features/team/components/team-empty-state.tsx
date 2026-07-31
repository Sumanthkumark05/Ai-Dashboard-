"use client";

import * as React from "react";
import { Users, UserPlus } from "lucide-react";
import { useTeamStore } from "@/stores/team-store";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function TeamEmptyState() {
  const { openInviteDialog, setSearchQuery, setRoleFilter, setDepartmentFilter, setStatusFilter } = useTeamStore();

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  return (
    <EmptyState
      icon={<Users className="h-10 w-10 text-muted-foreground/60" />}
      title="No team members found"
      description="No team members matched your search query or role filter. Try clearing your filters or invite a new member."
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Clear Filters
          </Button>
          <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={openInviteDialog}>
            Invite Member
          </Button>
        </div>
      }
      className="my-8 py-12"
    />
  );
}
