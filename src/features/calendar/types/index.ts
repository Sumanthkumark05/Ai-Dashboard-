export type CalendarCategory =
  | "Meeting"
  | "AI Session"
  | "Workspace"
  | "Task"
  | "Reminder"
  | "Personal"
  | "System";

export type CalendarView = "month" | "week" | "day";

export type EventStatus = "In Progress" | "Upcoming" | "Completed" | "Cancelled";

export interface Participant {
  name: string;
  avatarUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  category: CalendarCategory;
  status: EventStatus;
  color: string;
  location?: string;
  participants: Participant[];
  reminder?: string;
  notes?: string;
  createdBy: string;
}
