"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { initialTeamActivities } from "../mock/team-mock-data";
import { TeamActivity } from "../types";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { getInitials } from "@/constants";

export function ActivityFeed() {
  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Team Collaboration Feed</h4>
          <p className="text-xs text-muted-foreground">Recent member activities and workspace updates</p>
        </div>
      </div>

      <div className="space-y-4">
        {initialTeamActivities.map((act: TeamActivity, index: number) => {
          const initials = getInitials(act.user);

          return (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <Avatar size="xs" className="shrink-0 mt-0.5">
                <AvatarImage src={act.avatarUrl} alt={act.user} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-xs">
                <p className="text-foreground leading-normal">
                  <span className="font-semibold">{act.user}</span> {act.description}
                </p>
                <span className="text-[10px] text-muted-foreground block mt-0.5">{act.timestamp}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
