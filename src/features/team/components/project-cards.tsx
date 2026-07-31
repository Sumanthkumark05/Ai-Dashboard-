"use client";

import * as React from "react";
import { FolderKanban, Users, Calendar } from "lucide-react";
import { initialAssignedProjects } from "../mock/team-mock-data";
import { AssignedProject } from "../types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/feedback/progress";
import { Badge } from "@/components/ui/badge";

export function ProjectCards() {
  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <FolderKanban className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Assigned Workspace Projects</h4>
          <p className="text-xs text-muted-foreground">Active milestone progress and deadlines</p>
        </div>
      </div>

      <div className="space-y-4">
        {initialAssignedProjects.map((proj: AssignedProject) => (
          <div
            key={proj.id}
            className="rounded-lg border border-border bg-muted/20 p-3.5 hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-foreground truncate">{proj.name}</span>
              <Badge
                variant={
                  proj.status === "Completed"
                    ? "success"
                    : proj.status === "In Progress"
                    ? "info"
                    : "secondary"
                }
                size="sm"
                className="text-[10px]"
              >
                {proj.status}
              </Badge>
            </div>

            <Progress value={proj.progress} className="h-1.5 mb-2.5" />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-primary" />
                <span>{proj.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{proj.deadline}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
