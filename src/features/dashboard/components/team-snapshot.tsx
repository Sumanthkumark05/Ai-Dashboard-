"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus, Users, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/constants";
import { teamApi, TeamMember as RealTeamMember } from "@/services/team-api";

export function TeamSnapshot() {
  const [members, setMembers] = React.useState<RealTeamMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function loadTeam() {
      try {
        const teamsRes = await teamApi.listTeams(undefined, 1, 0);
        if (cancelled) return;
        const firstTeam = teamsRes.items?.[0];
        if (firstTeam) {
          const membersRes = await teamApi.listMembers(firstTeam.id, 5, 0);
          if (!cancelled) {
            setMembers(membersRes.items || []);
          }
        }
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadTeam();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <Card className="p-4 sm:p-5 h-full flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-semibold text-foreground">Team Snapshot</h4>
            <p className="text-[11px] text-muted-foreground">{activeCount} active members</p>
          </div>
          <Link href="/dashboard/team" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <Badge variant="success" size="xs">
              {activeCount} Active
            </Badge>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2.5 mb-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-2 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="h-7 w-7 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No team members found</p>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            {members.slice(0, 4).map((member) => {
              const displayName = member.full_name || member.email || "Member";
              const initials = getInitials(displayName);

              return (
                <Link key={member.id} href="/dashboard/team">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="xs">
                        <AvatarImage src={member.avatar_url} alt={displayName} />
                        <AvatarFallback className="text-[9px] font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors text-[11px]">{displayName}</p>
                        <p className="text-[9px] text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground capitalize">{member.status}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link href="/dashboard/team">
        <Button
          variant="outline"
          size="xs"
          className="w-full justify-between"
          leftIcon={<UserPlus className="h-3.5 w-3.5" />}
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
        >
          <span>Manage Team</span>
        </Button>
      </Link>
    </Card>
  );
}
