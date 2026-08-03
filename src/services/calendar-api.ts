/**
 * calendar-api.ts
 * Frontend service for calendar event management, workspace date sync, and telemetry metrics.
 */

import { apiClient } from "@/lib/api-client";
import { CalendarEvent } from "@/features/calendar/types";

export interface CalendarSummaryTelemetry {
  today_count: number;
  upcoming_meetings: number;
  upcoming_deadlines: number;
  pending_reports: number;
  client_demos: number;
  completed_count: number;
  missed_count: number;
  total_events: number;
  completion_rate: number;
  today_items: Array<{
    id: string;
    title: string;
    event_type: string;
    time?: string;
    status: string;
    color: string;
  }>;
}

export interface ListCalendarEventsParams {
  workspace_id?: string;
  event_type?: string;
  status?: string;
  search?: string;
}

export const calendarApi = {
  /**
   * Fetch calendar events from backend with optional filters
   */
  async getEvents(params?: ListCalendarEventsParams): Promise<{ items: CalendarEvent[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.workspace_id) query.append("workspace_id", params.workspace_id);
      if (params?.event_type) query.append("event_type", params.event_type);
      if (params?.status) query.append("status", params.status);
      if (params?.search) query.append("search", params.search);

      const queryString = query.toString() ? `?${query.toString()}` : "";
      return await apiClient.get<{ items: CalendarEvent[]; total: number }>(`/calendar/events${queryString}`);
    } catch {
      // Fallback empty response for standalone offline mode
      return { items: [], total: 0 };
    }
  },

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return await apiClient.post<CalendarEvent>("/calendar/events", eventData);
  },

  /**
   * Update existing calendar event
   */
  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<{ success: boolean; id: string; status: string }> {
    return await apiClient.patch<{ success: boolean; id: string; status: string }>(`/calendar/events/${id}`, updates);
  },

  /**
   * Delete calendar event
   */
  async deleteEvent(id: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.delete<{ success: boolean; message: string }>(`/calendar/events/${id}`);
  },

  /**
   * Auto-sync workspace dates with calendar
   */
  async syncWorkspace(workspaceId: string): Promise<{ success: boolean; synced_events: string[] }> {
    return await apiClient.post<{ success: boolean; synced_events: string[] }>(`/calendar/sync-workspace/${workspaceId}`, {});
  },

  /**
   * Fetch summary telemetry for Dashboard and Analytics widgets
   */
  async getSummary(): Promise<CalendarSummaryTelemetry> {
    try {
      return await apiClient.get<CalendarSummaryTelemetry>("/calendar/summary");
    } catch {
      return {
        today_count: 0,
        upcoming_meetings: 0,
        upcoming_deadlines: 0,
        pending_reports: 0,
        client_demos: 0,
        completed_count: 0,
        missed_count: 0,
        total_events: 0,
        completion_rate: 100,
        today_items: [],
      };
    }
  },
};
