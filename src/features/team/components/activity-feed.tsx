"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dashboardApi, ActivityItem } from "@/services/dashboard-api";

export function ActivityFeed() {
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    dashboardApi.getActivity(6, 0)
      .then((res) => {
        if (!cancelled) setActivities(res.items || []);
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
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
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Team Collaboration Feed</h4>
          <p className="text-xs text-muted-foreground">Recent member activities and workspace updates</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No recent activity logs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act, index) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {(act.entity_type || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="text-foreground leading-normal">
                  <span className="font-semibold">{act.action}</span> {act.description || act.entity_type}
                </p>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {new Date(act.created_at).toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
