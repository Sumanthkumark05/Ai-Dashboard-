"use client";

import * as React from "react";
import { Megaphone } from "lucide-react";
import { announcementsData } from "../mock/dashboard-mock-data";
import { Announcement } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AnnouncementsCard() {
  return (
    <Card className="p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Megaphone className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Product Updates & Notices</h4>
          <p className="text-xs text-muted-foreground">Latest NeuroDesk platform announcements</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {announcementsData.map((item: Announcement) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-muted/20 p-3 hover:bg-accent/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
              <Badge
                variant={
                  item.tag === "Update"
                    ? "success"
                    : item.tag === "Notice"
                    ? "warning"
                    : "info"
                }
                size="sm"
                className="text-[10px] py-0 h-4 shrink-0"
              >
                {item.tag}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.content}</p>
            <span className="text-[10px] text-muted-foreground/70 block mt-1.5">{item.date}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
