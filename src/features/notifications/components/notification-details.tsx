"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Bell,
  Clock,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/feedback/toast";

export function NotificationDetails() {
  const {
    selectedNotification,
    isDetailsOpen,
    closeDetailsPanel,
    markAsUnread,
    archiveNotification,
    deleteNotification,
  } = useNotificationStore();

  if (!selectedNotification) {
    return (
      <Card className="p-6 h-full flex flex-col items-center justify-center text-center text-muted-foreground select-none border-dashed">
        <Bell className="h-10 w-10 mb-3 opacity-40" />
        <h4 className="text-sm font-semibold text-foreground">No Notification Selected</h4>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          Select any notification from the inbox stream to view full details and action links.
        </p>
      </Card>
    );
  }

  const item = selectedNotification;

  const content = (
    <Card className="p-6 h-full flex flex-col justify-between select-none">
      <div>
        {/* Header Metadata */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase text-[10px]">
              {item.category}
            </Badge>
            <Badge
              variant={item.priority === "High" ? "destructive" : item.priority === "Medium" ? "warning" : "secondary"}
              size="sm"
              className="text-[10px]"
            >
              {item.priority} Priority
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={closeDetailsPanel}
            className="h-7 w-7 p-0 lg:hidden"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Title & Timestamp */}
        <h3 className="text-base font-bold text-foreground leading-snug mb-2">{item.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>{item.timestamp}</span>
        </div>

        {/* Related User Header */}
        {item.relatedUser && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/20 mb-4 text-xs">
            <Avatar size="xs">
              <AvatarImage src={item.avatarUrl} alt={item.relatedUser} />
              <AvatarFallback>{item.relatedUser[0]}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-foreground block">{item.relatedUser}</span>
              <span className="text-[10px] text-muted-foreground">Activity Creator</span>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Full Details Content */}
        <div className="space-y-3 text-xs leading-relaxed text-foreground">
          <h4 className="font-semibold text-foreground text-sm">Full Telemetry Context</h4>
          <p className="bg-muted/30 p-3.5 rounded-lg border border-border text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {item.fullDetails || item.description}
          </p>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-4 border-t border-border space-y-2">
        {item.actionUrl && (
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-between"
            rightIcon={<ExternalLink className="h-4 w-4" />}
            onClick={() =>
              toast.info("Navigating to target resource", {
                description: `Opening ${item.actionUrl}`,
              })
            }
          >
            View Target Resource
          </Button>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              markAsUnread(item.id);
              toast.info("Marked as unread");
            }}
          >
            Mark Unread
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              archiveNotification(item.id);
              toast.info("Notification archived");
            }}
          >
            Archive
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => {
              deleteNotification(item.id);
              toast.info("Notification deleted");
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      {/* Desktop Split Pane View */}
      <div className="hidden lg:block h-full">{content}</div>

      {/* Mobile Slide-over Drawer View */}
      <AnimatePresence>
        {isDetailsOpen && (
          <div className="fixed inset-0 z-50 lg:hidden select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetailsPanel}
              className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-card p-4 shadow-2xl overflow-y-auto"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
