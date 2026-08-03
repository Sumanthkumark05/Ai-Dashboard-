"use client";

import * as React from "react";
import { FolderKanban, Users, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { teamApi, Team } from "@/services/team-api";

export function ProjectCards() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    teamApi.listTeams(undefined, 10, 0)
      .then((res) => {
        if (!cancelled) setTeams(res.items || []);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <FolderKanban className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Workspace Teams & Projects</h4>
          <p className="text-xs text-muted-foreground">Active team groups and member counts</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/20 p-3.5 animate-pulse">
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FolderKanban className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No active teams found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border bg-muted/20 p-3.5 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-foreground truncate">{t.name}</span>
                <Badge variant="success" size="sm" className="text-[10px]">
                  Active
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{t.description || "Workspace team group."}</p>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" />
                  <span>{t.member_count || 1} members</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
