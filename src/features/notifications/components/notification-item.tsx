"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Folder,
  FileText,
  Calendar,
  Users,
  HardDrive,
  ShieldAlert,
  Bell,
  Pin,
  Check,
  Archive,
  Trash2,
} from "lucide-react";

import { NotificationItem as NotificationItemType } from "../types";
import { useNotificationStore } from "@/stores/notification-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/feedback/tooltip";
import { toast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import { getInitials } from "@/constants";

const categoryIconMap: Record<string, React.ReactNode> = {
  AI: <Bot className="h-4 w-4 text-primary" />,
  Workspace: <Folder className="h-4 w-4 text-amber-500" />,
  Files: <FileText className="h-4 w-4 text-info" />,
  Calendar: <Calendar className="h-4 w-4 text-purple-500" />,
  Team: <Users className="h-4 w-4 text-success" />,
  System: <HardDrive className="h-4 w-4 text-muted-foreground" />,
  Security: <ShieldAlert className="h-4 w-4 text-danger" />,
  General: <Bell className="h-4 w-4 text-muted-foreground" />,
};

export interface NotificationItemProps {
  item: NotificationItemType;
}

export function NotificationItem({ item }: NotificationItemProps) {
  const {
    selectedNotification,
    selectNotification,
    openDetailsPanel,
    markAsRead,
    markAsUnread,
    togglePinNotification,
    archiveNotification,
    deleteNotification,
  } = useNotificationStore();

  const isSelected = selectedNotification?.id === item.id;
  const icon = categoryIconMap[item.category] || <Bell className="h-4 w-4 text-muted-foreground" />;

  const handleItemClick = () => {
    selectNotification(item);
    openDetailsPanel(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={handleItemClick}
        className={cn(
          "p-4 transition-all cursor-pointer select-none group relative border-l-4",
          !item.isRead ? "border-l-primary bg-primary/5 font-medium" : "border-l-transparent bg-card",
          isSelected && "ring-1 ring-primary shadow-xs"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Avatar or Category Icon */}
            {item.avatarUrl ? (
              <Avatar size="sm" className="shrink-0 mt-0.5">
                <AvatarImage src={item.avatarUrl} alt={item.relatedUser || "User"} />
                <AvatarFallback>
                  {getInitials(item.relatedUser, "U")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border border-border shrink-0 mt-0.5">
                {icon}
              </div>
            )}

            {/* Notification Title & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn("text-xs leading-snug truncate", !item.isRead ? "font-bold text-foreground" : "font-semibold text-foreground/90")}>
                  {item.title}
                </h4>

                {/* Read Dot Indicator */}
                {!item.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Unread notification" />
                )}
                {item.isPinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500/20 shrink-0" />}
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                {item.description}
              </p>

              {/* Metadata Badges & Timestamp */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                <Badge variant="outline" size="sm" className="text-[10px] py-0 h-4">
                  {item.category}
                </Badge>
                <Badge
                  variant={item.priority === "High" ? "destructive" : item.priority === "Medium" ? "warning" : "secondary"}
                  size="sm"
                  className="text-[10px] py-0 h-4"
                >
                  {item.priority}
                </Badge>
                <span>•</span>
                <span className="font-mono">{item.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar (Hover state) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider delayDuration={200}>
              {/* Mark Read/Unread */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      if (item.isRead) {
                        markAsUnread(item.id);
                        toast.info("Marked as unread");
                      } else {
                        markAsRead(item.id);
                        toast.success("Marked as read");
                      }
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Check className={cn("h-3.5 w-3.5", item.isRead && "text-primary")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{item.isRead ? "Mark unread" : "Mark read"}</TooltipContent>
              </Tooltip>

              {/* Pin */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => togglePinNotification(item.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-500"
                  >
                    <Pin className={cn("h-3.5 w-3.5", item.isPinned && "text-amber-500 fill-amber-500")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{item.isPinned ? "Unpin" : "Pin thread"}</TooltipContent>
              </Tooltip>

              {/* Archive */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      archiveNotification(item.id);
                      toast.info("Notification archived");
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Archive</TooltipContent>
              </Tooltip>

              {/* Delete */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      deleteNotification(item.id);
                      toast.info("Notification deleted");
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
