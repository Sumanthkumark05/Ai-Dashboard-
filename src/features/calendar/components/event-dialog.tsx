"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, X } from "lucide-react";

import { useCalendarStore } from "@/features/calendar/store/calendar-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { CalendarEventType, EventPriority, EventStatus } from "../types";
import { Label } from "@/components/forms/label";
import { Input } from "@/components/forms/input";
import { Textarea } from "@/components/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required."),
  end_date: z.string().optional(),
  startTime: z.string().min(1, "Start time is required."),
  endTime: z.string().min(1, "End time is required."),
  event_type: z.string().min(1, "Event type is required."),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["Scheduled", "Upcoming", "Completed", "Cancelled", "Missed", "Overdue"]),
  client_name: z.string().optional(),
  project_name: z.string().optional(),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  notes: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function EventDialog() {
  const { isDialogOpen, closeDialog, addEvent } = useCalendarStore();
  const { currentWorkspace } = useWorkspaceContextStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: todayStr,
      end_date: todayStr,
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      event_type: "Client Demo",
      priority: "medium",
      status: "Scheduled",
      client_name: "",
      project_name: currentWorkspace?.name || "AI Dashboard",
      location: "Google Meet",
      meeting_link: "",
      notes: "",
    },
  });

  const selectedEventType = watch("event_type");
  const selectedPriority = watch("priority");
  const selectedStatus = watch("status");

  if (!isDialogOpen) return null;

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      await addEvent({
        title: data.title,
        description: data.description || "",
        date: data.date,
        start_date: data.date,
        end_date: data.end_date || data.date,
        time: data.startTime,
        startTime: data.startTime,
        endTime: data.endTime,
        event_type: data.event_type as CalendarEventType,
        category: data.event_type as any,
        priority: data.priority as EventPriority,
        status: data.status as EventStatus,
        location: data.location || "",
        meeting_link: data.meeting_link || "",
        client_name: data.client_name || "",
        project_name: data.project_name || currentWorkspace?.name || "",
        workspace_id: currentWorkspace?.id,
        workspaceName: currentWorkspace?.name || "Active Workspace",
        notes: data.notes || "",
        createdBy: "Workspace Member",
      });

      setIsSubmitting(false);
      reset();
      closeDialog();

      toast.success("Event Created", {
        description: `${data.title} scheduled for ${data.date}.`,
      });
    } catch {
      setIsSubmitting(false);
      toast.error("Failed to Create Event");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDialog}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <CalendarPlus className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Schedule Workspace Event</h3>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={closeDialog} className="rounded-lg">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            {/* Title */}
            <div className="space-y-1">
              <Label required>Event Title</Label>
              <Input {...register("title")} placeholder="e.g. Client Demo - AI Dashboard" className="h-9 text-xs" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea {...register("description")} placeholder="Agenda, demo goals, or review points..." rows={2} className="text-xs" />
            </div>

            {/* Event Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Event Type</Label>
                <Select value={selectedEventType} onValueChange={(val) => setValue("event_type", val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Client Demo">Client Demo (Blue)</SelectItem>
                    <SelectItem value="Client Meeting">Client Meeting (Green)</SelectItem>
                    <SelectItem value="Internal Meeting">Internal Meeting (Emerald)</SelectItem>
                    <SelectItem value="Project Deadline">Project Deadline (Red)</SelectItem>
                    <SelectItem value="Code Review">Code Review (Orange)</SelectItem>
                    <SelectItem value="Testing">Testing (Amber)</SelectItem>
                    <SelectItem value="Deployment">Deployment (Purple)</SelectItem>
                    <SelectItem value="Report Submission">Report Submission (Indigo)</SelectItem>
                    <SelectItem value="Dataset Review">Dataset Review (Cyan)</SelectItem>
                    <SelectItem value="Document Review">Document Review (Teal)</SelectItem>
                    <SelectItem value="Custom Event">Custom Event (Slate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label required>Priority</Label>
                <Select value={selectedPriority} onValueChange={(val) => setValue("priority", val as EventPriority)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & End Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Start Date (YYYY-MM-DD)</Label>
                <Input {...register("date")} placeholder="2026-08-15" className="h-9 text-xs font-mono" />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>End Date (YYYY-MM-DD)</Label>
                <Input {...register("end_date")} placeholder="2026-08-15" className="h-9 text-xs font-mono" />
              </div>
            </div>

            {/* Start & End Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Start Time</Label>
                <Input {...register("startTime")} placeholder="10:00 AM" className="h-9 text-xs font-mono" />
              </div>

              <div className="space-y-1">
                <Label required>End Time</Label>
                <Input {...register("endTime")} placeholder="11:00 AM" className="h-9 text-xs font-mono" />
              </div>
            </div>

            {/* Client Name & Meeting Link Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Client Name</Label>
                <Input {...register("client_name")} placeholder="e.g. ABC Technologies" className="h-9 text-xs" />
              </div>

              <div className="space-y-1">
                <Label>Meeting Link</Label>
                <Input {...register("meeting_link")} placeholder="https://meet.google.com/..." className="h-9 text-xs font-mono" />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label>Location / Room</Label>
              <Input {...register("location")} placeholder="e.g. Room 4A / Google Meet" className="h-9 text-xs" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<CalendarPlus className="h-4 w-4" />}>
                Create Event
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
