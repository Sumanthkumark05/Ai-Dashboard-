"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, FolderPlus, CheckCircle, Bot, UserPlus, Activity, LucideIcon, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardApi, ActivityItem } from "@/services/dashboard-api";

const entityIconMap: Record<string, LucideIcon> = {
  file: FileText,
  folder: FolderPlus,
  workspace: FolderPlus,
  task: CheckCircle,
  ai: Bot,
  user: UserPlus,
  document: FileText,
  dataset: CheckCircle,
};

function getEntityRoute(entityType?: string): string {
  const type = entityType?.toLowerCase() || "";
  if (type === "document") return "/dashboard/documents";
  if (type === "dataset") return "/dashboard/datasets";
  if (type === "workspace") return "/dashboard/workspace-manager";
  if (type === "user" || type === "team" || type === "member") return "/dashboard/team";
  if (type === "report") return "/dashboard/workspace";
  return "/dashboard/files";
}

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return "";
  }
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-2.5 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivity() {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    dashboardApi.getActivity(8).then((res) => {
      if (!cancelled) setItems(res.items ?? []);
    }).catch(() => {
      if (!cancelled) setItems([]);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
            <p className="text-xs text-muted-foreground">Latest events across your workspace</p>
          </div>
          <Link href="/dashboard/analytics" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <ActivitySkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start using the platform to see events here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((event, index) => {
              const IconComponent = entityIconMap[event.entity_type?.toLowerCase()] ?? FileText;
              const label = event.description ?? `${event.action} ${event.entity_type ?? "resource"}`;
              const route = getEntityRoute(event.entity_type);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <Link href={route} className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-muted/40 transition-colors group">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-foreground group-hover:border-primary/40 transition-colors">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-normal line-clamp-2 group-hover:text-primary transition-colors font-medium">{label}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(event.created_at)}
                      </span>
                    </div>
                    <Badge variant="outline" size="xs" className="text-[10px] uppercase shrink-0">
                      {event.entity_type ?? "event"}
                    </Badge>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
