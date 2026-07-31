"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, X } from "lucide-react";

import { useCalendarStore } from "@/stores/calendar-store";
import { CalendarCategory } from "../types";
import { Label } from "@/components/forms/label";
import { Input } from "@/components/forms/input";
import { Textarea } from "@/components/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
  date: z.string().min(1, "Date is required."),
  startTime: z.string().min(1, "Start time is required."),
  endTime: z.string().min(1, "End time is required."),
  category: z.enum(["Meeting", "AI Session", "Workspace", "Task", "Reminder", "Personal", "System"]),
  location: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function EventDialog() {
  const { isDialogOpen, closeDialog, addEvent } = useCalendarStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      date: "2026-07-29",
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      category: "Meeting",
      location: "Google Meet",
    },
  });

  const selectedCategory = watch("category");

  if (!isDialogOpen) return null;

  const onSubmit = (data: EventFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      addEvent({
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        category: data.category as CalendarCategory,
        status: "Upcoming",
        location: data.location,
        participants: [{ name: "Alex Vance" }],
      });

      setIsSubmitting(false);
      reset();
      closeDialog();

      toast.success("Event created", {
        description: `${data.title} scheduled for ${data.date}.`,
      });
    }, 600);
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
          className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <CalendarPlus className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Schedule Workspace Event</h3>
            </div>
            <Button variant="ghost" size="xs" onClick={closeDialog} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            {/* Title */}
            <div className="space-y-1">
              <Label required>Event Title</Label>
              <Input {...register("title")} placeholder="e.g. Architecture Review" className="h-9 text-xs" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label required>Description</Label>
              <Textarea {...register("description")} placeholder="Agenda & meeting notes..." rows={2} className="text-xs" />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            {/* Date & Category Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Date (YYYY-MM-DD)</Label>
                <Input {...register("date")} placeholder="2026-07-29" className="h-9 text-xs font-mono" />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-1">
                <Label required>Category</Label>
                <Select value={selectedCategory} onValueChange={(val) => setValue("category", val as CalendarCategory)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="AI Session">AI Session</SelectItem>
                    <SelectItem value="Workspace">Workspace</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Reminder">Reminder</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* Location */}
            <div className="space-y-1">
              <Label>Location / Room</Label>
              <Input {...register("location")} placeholder="e.g. Google Meet / Room 4A" className="h-9 text-xs" />
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
