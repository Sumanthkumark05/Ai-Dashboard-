"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, Bell, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notificationsApi, Notification } from "@/services/notifications-api";

export function AnnouncementsCard() {
  const [items, setItems] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;
    notificationsApi.list(3, 0, false)
      .then((res) => {
        if (!cancelled) setItems(res.items || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="p-4 sm:p-5 h-full flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Updates & Notifications</h4>
              <p className="text-[11px] text-muted-foreground">Latest system activity & alerts</p>
            </div>
          </div>
          <Link href="/dashboard/notifications" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 animate-pulse">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-2.5 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bell className="h-7 w-7 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No recent notifications</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <Link key={item.id} href="/dashboard/notifications">
                <div className="rounded-lg border border-border bg-muted/20 p-2.5 hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</span>
                    <Badge
                      variant={
                        item.type === "error"
                          ? "destructive"
                          : item.type === "warning"
                          ? "warning"
                          : item.type === "success"
                          ? "success"
                          : "info"
                      }
                      size="xs"
                      className="text-[9px] py-0 shrink-0 uppercase"
                    >
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.message}</p>
                  <span className="text-[10px] text-muted-foreground/70 block mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
