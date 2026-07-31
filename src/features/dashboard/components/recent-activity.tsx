"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, FolderPlus, CheckCircle, Bot, UserPlus, LucideIcon } from "lucide-react";
import { recentActivityData } from "../mock/dashboard-mock-data";
import { ActivityEvent } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const typeIconMap: Record<string, LucideIcon> = {
  file: FileText,
  workspace: FolderPlus,
  task: CheckCircle,
  ai: Bot,
  member: UserPlus,
};

export function RecentActivity() {
  return (
    <Card className="p-5 h-full">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
        <p className="text-xs text-muted-foreground">Latest events across team workspace</p>
      </div>

      <div className="space-y-4">
        {recentActivityData.map((event: ActivityEvent, index: number) => {
          const IconComponent = typeIconMap[event.type] || FileText;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-foreground">
                <IconComponent className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-normal">
                  <span className="font-semibold">{event.user}</span> {event.action}{" "}
                  <span className="font-semibold text-primary">{event.target}</span>
                </p>
                <span className="text-[10px] text-muted-foreground">{event.timestamp}</span>
              </div>
              <Badge variant="outline" size="sm" className="text-[10px] uppercase">
                {event.type}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
