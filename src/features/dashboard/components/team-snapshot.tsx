"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { teamMembersData } from "../mock/dashboard-mock-data";
import { TeamMember } from "../types";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";
import { getInitials } from "@/constants";

export function TeamSnapshot() {
  const onlineCount = teamMembersData.filter((m) => m.status === "online").length;

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Team Snapshot</h4>
            <p className="text-xs text-muted-foreground">{onlineCount} members currently active online</p>
          </div>
          <Badge variant="success" size="sm">
            {onlineCount} Online
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          {teamMembersData.map((member: TeamMember) => {
            const initials = getInitials(member.name);

            return (
              <div key={member.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm" status={member.status}>
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground leading-tight">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground capitalize">{member.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        leftIcon={<UserPlus className="h-3.5 w-3.5" />}
        onClick={() =>
          toast.info("Invite Teammate", {
            description: "Workspace invitation modal preview.",
          })
        }
      >
        Invite New Member
      </Button>
    </Card>
  );
}
