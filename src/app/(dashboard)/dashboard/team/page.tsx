"use client";

import * as React from "react";
import { useTeamStore } from "@/stores/team-store";
import { TeamMember } from "@/features/team/types";
import { TeamHeader } from "@/features/team/components/team-header";
import { OverviewCards } from "@/features/team/components/overview-cards";
import { SearchFilters } from "@/features/team/components/search-filters";
import { MembersTable } from "@/features/team/components/members-table";
import { ProfileDrawer } from "@/features/team/components/profile-drawer";
import { InviteDialog } from "@/features/team/components/invite-dialog";
import { ActivityFeed } from "@/features/team/components/activity-feed";
import { ProjectCards } from "@/features/team/components/project-cards";
import { TeamEmptyState } from "@/features/team/components/team-empty-state";
import { TeamSkeleton } from "@/features/team/components/team-skeleton";

export default function TeamManagementPage() {
  const { members, searchQuery, roleFilter, departmentFilter, statusFilter, isLoading } = useTeamStore();

  // Client-side Filter logic
  const filteredMembers = React.useMemo(() => {
    return members.filter((member: TeamMember) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query);

      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesDepartment = departmentFilter === "all" || member.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, departmentFilter, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <TeamHeader />

      {/* KPI Overview Cards */}
      <OverviewCards />

      {/* Search & Filter Bar */}
      <SearchFilters />

      {/* Main Members Table or Empty State */}
      {isLoading ? (
        <TeamSkeleton />
      ) : filteredMembers.length === 0 ? (
        <TeamEmptyState />
      ) : (
        <MembersTable members={filteredMembers} />
      )}

      {/* Collaboration Feed & Assigned Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <ProjectCards />
      </div>

      {/* Slide-over Profile Drawer */}
      <ProfileDrawer />

      {/* Invite Member Dialog */}
      <InviteDialog />
    </div>
  );
}
