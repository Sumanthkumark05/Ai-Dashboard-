"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Bell, Trash2, CheckCircle2, Video, Building2, User } from "lucide-react";
import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/display/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/feedback/toast";

export function EventDrawer() {
  const { selectedEvent, isDrawerOpen, closeDrawer, deleteEvent, markEventStatus } = useCalendarStore();

  if (!selectedEvent) return null;

  const isCompleted = selectedEvent.status === "Completed";

  const handleToggleComplete = async () => {
    const nextStatus = isCompleted ? "Scheduled" : "Completed";
    await markEventStatus(selectedEvent.id, nextStatus);
    toast.success(nextStatus === "Completed" ? "Event Completed!" : "Event Rescheduled", {
      description: `${selectedEvent.title} status marked as ${nextStatus}.`,
    });
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md border-l border-border bg-card p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedEvent.color || "#3b82f6" }}
                  />
                  <Badge variant="outline" className="uppercase text-[10px] font-semibold">
                    {selectedEvent.event_type || selectedEvent.category}
                  </Badge>
                  <Badge
                    variant={isCompleted ? "success" : selectedEvent.status === "Upcoming" ? "info" : "secondary"}
                    size="sm"
                    className="text-[10px]"
                  >
                    {selectedEvent.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={closeDrawer}
                  className="h-8 w-8 p-0"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Event Title & Description */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-2">{selectedEvent.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedEvent.description || "No description provided."}
                </p>
              </div>

              <Separator className="my-4" />

              {/* Event Metadata List */}
              <div className="space-y-4 text-xs">
                {selectedEvent.client_name && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <span>Client: <strong className="text-foreground">{selectedEvent.client_name}</strong></span>
                  </div>
                )}

                {selectedEvent.workspaceName && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Workspace: <strong className="text-foreground">{selectedEvent.workspaceName}</strong></span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-semibold font-mono">{selectedEvent.date || selectedEvent.start_date}</span>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-semibold font-mono">
                    {selectedEvent.time || selectedEvent.startTime} {selectedEvent.endTime ? `- ${selectedEvent.endTime}` : ""}
                  </span>
                </div>

                {selectedEvent.meeting_link && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Video className="h-4 w-4 text-primary shrink-0" />
                    <a
                      href={selectedEvent.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline truncate max-w-[280px]"
                    >
                      {selectedEvent.meeting_link}
                    </a>
                  </div>
                )}

                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{selectedEvent.location}</span>
                  </div>
                )}

                {/* Assigned Members */}
                <div className="pt-2">
                  <span className="font-semibold text-foreground block mb-2">Assigned Team Members</span>
                  <div className="flex flex-wrap gap-2">
                    {["Rahul", "Krishna", "Sumanth"].map((name, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg border border-border bg-muted/20 text-xs">
                        <Avatar size="xs">
                          <AvatarFallback>{name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedEvent.notes && (
                  <div className="pt-2">
                    <span className="font-semibold text-foreground block mb-1">Notes</span>
                    <p className="text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md border border-border">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-6 border-t border-border flex items-center justify-between gap-2">
              <Button
                variant={isCompleted ? "outline" : "primary"}
                size="sm"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={handleToggleComplete}
              >
                {isCompleted ? "Mark Incomplete" : "Mark Complete"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => {
                  deleteEvent(selectedEvent.id);
                  toast.info("Event deleted");
                }}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
