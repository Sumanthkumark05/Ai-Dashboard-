export type CalendarEventType =
  | "Client Demo"
  | "Client Meeting"
  | "Internal Meeting"
  | "Project Deadline"
  | "Code Review"
  | "Testing"
  | "Deployment"
  | "Report Submission"
  | "Dataset Review"
  | "Document Review"
  | "Custom Event";

export type CalendarCategory = CalendarEventType | "Meeting" | "AI Session" | "Workspace" | "Task" | "Reminder" | "Personal" | "System";

export type CalendarView = "month" | "week" | "day" | "agenda";

export type EventStatus =
  | "Scheduled"
  | "Upcoming"
  | "Completed"
  | "Cancelled"
  | "Missed"
  | "Overdue"
  | "In Progress";

export type EventPriority = "low" | "medium" | "high" | "urgent";

export interface Participant {
  name: string;
  avatarUrl?: string;
}

export interface CalendarEvent {
  id: string;
  workspace_id?: string;
  workspaceName?: string;
  client_name?: string;
  project_name?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_date?: string;
  end_date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  event_type: CalendarEventType | string;
  category: CalendarCategory;
  priority?: EventPriority;
  status: EventStatus;
  color: string;
  location?: string;
  meeting_link?: string;
  participants?: Participant[];
  assigned_members?: string[];
  reminder?: string;
  notes?: string;
  createdBy: string;
  is_auto_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}
