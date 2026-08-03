import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CalendarEvent, CalendarView, CalendarEventType, EventStatus } from "../types";
import { calendarApi } from "@/services/calendar-api";

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string;
  selectedEvent: CalendarEvent | null;
  currentView: CalendarView;
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  workspaceFilter: string;
  currentMonth: number;
  currentYear: number;
  isDrawerOpen: boolean;
  isDialogOpen: boolean;
  isLoading: boolean;
  error: string | null;

  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setStatusFilter: (status: string) => void;
  setWorkspaceFilter: (wsId: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  setToday: () => void;
  selectEvent: (event: CalendarEvent) => void;
  clearSelectedEvent: () => void;
  openDrawer: (event: CalendarEvent) => void;
  closeDrawer: () => void;
  openDialog: () => void;
  closeDialog: () => void;

  fetchEvents: (workspaceId?: string) => Promise<void>;
  addEvent: (eventData: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  markEventStatus: (id: string, status: EventStatus) => Promise<void>;
  syncWorkspaceDates: (workspaceId: string) => Promise<void>;
}

const EVENT_COLOR_MAP: Record<string, string> = {
  "Client Demo": "#3b82f6",       // Blue
  "Client Meeting": "#10b981",    // Green
  "Internal Meeting": "#059669",  // Emerald
  "Project Deadline": "#ef4444",  // Red
  "Code Review": "#f59e0b",       // Orange
  "Testing": "#d97706",           // Amber
  "Deployment": "#8b5cf6",        // Purple
  "Report Submission": "#6366f1", // Indigo
  "Dataset Review": "#06b6d4",    // Cyan
  "Document Review": "#0d9488",   // Teal
  "Custom Event": "#64748b",      // Slate
};

const todayStr = new Date().toISOString().split("T")[0];
const now = new Date();

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      selectedDate: todayStr,
      selectedEvent: null,
      currentView: "month",
      searchQuery: "",
      categoryFilter: "all",
      statusFilter: "all",
      workspaceFilter: "all",
      currentMonth: now.getMonth(),
      currentYear: now.getFullYear(),
      isDrawerOpen: false,
      isDialogOpen: false,
      isLoading: false,
      error: null,

      setView: (view) => set({ currentView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategoryFilter: (category) => set({ categoryFilter: category }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setWorkspaceFilter: (wsId) => set({ workspaceFilter: wsId }),

      prevMonth: () =>
        set((state) => {
          let newMonth = state.currentMonth - 1;
          let newYear = state.currentYear;
          if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
          }
          return { currentMonth: newMonth, currentYear: newYear };
        }),

      nextMonth: () =>
        set((state) => {
          let newMonth = state.currentMonth + 1;
          let newYear = state.currentYear;
          if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
          }
          return { currentMonth: newMonth, currentYear: newYear };
        }),

      setToday: () =>
        set({
          currentMonth: new Date().getMonth(),
          currentYear: new Date().getFullYear(),
          selectedDate: new Date().toISOString().split("T")[0],
        }),

      selectEvent: (event) => set({ selectedEvent: event }),
      clearSelectedEvent: () => set({ selectedEvent: null }),

      openDrawer: (event) => set({ selectedEvent: event, isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      openDialog: () => set({ isDialogOpen: true }),
      closeDialog: () => set({ isDialogOpen: false }),

      fetchEvents: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
          const res = await calendarApi.getEvents({
            workspace_id: workspaceId || get().workspaceFilter,
            event_type: get().categoryFilter,
            status: get().statusFilter,
            search: get().searchQuery,
          });

          if (res.items && res.items.length > 0) {
            set({ events: res.items, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      addEvent: async (eventData) => {
        const evType = (eventData.event_type || eventData.category || "Custom Event") as CalendarEventType;
        const color = EVENT_COLOR_MAP[evType] || "#3b82f6";
        const date = eventData.date || eventData.start_date || new Date().toISOString().split("T")[0];

        const newEvent: CalendarEvent = {
          id: `evt_${Date.now()}`,
          title: eventData.title || "Untitled Event",
          description: eventData.description || "",
          date,
          start_date: date,
          end_date: eventData.end_date || date,
          time: eventData.time || eventData.startTime || "09:00",
          startTime: eventData.startTime || eventData.time || "09:00 AM",
          endTime: eventData.endTime || "10:00 AM",
          event_type: evType,
          category: evType,
          priority: eventData.priority || "medium",
          status: eventData.status || "Scheduled",
          color,
          location: eventData.location || "",
          meeting_link: eventData.meeting_link || "",
          client_name: eventData.client_name || "",
          project_name: eventData.project_name || "",
          workspace_id: eventData.workspace_id,
          workspaceName: eventData.workspaceName || "Active Workspace",
          notes: eventData.notes || "",
          createdBy: "Workspace Member",
        };

        set((state) => ({
          events: [newEvent, ...state.events],
          selectedDate: date,
        }));

        try {
          await calendarApi.createEvent(newEvent);
        } catch {
          // Saved locally in Zustand state
        }
      },

      updateEvent: async (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          selectedEvent: state.selectedEvent?.id === id ? { ...state.selectedEvent, ...updates } : state.selectedEvent,
        }));

        try {
          await calendarApi.updateEvent(id, updates);
        } catch {
          // Updated locally in Zustand state
        }
      },

      deleteEvent: async (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
          isDrawerOpen: state.selectedEvent?.id === id ? false : state.isDrawerOpen,
        }));

        try {
          await calendarApi.deleteEvent(id);
        } catch {
          // Deleted locally in Zustand state
        }
      },

      markEventStatus: async (id, status) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, status } : e)),
          selectedEvent: state.selectedEvent?.id === id ? { ...state.selectedEvent, status } : state.selectedEvent,
        }));

        try {
          await calendarApi.updateEvent(id, { status });
        } catch {
          // Updated locally
        }
      },

      syncWorkspaceDates: async (workspaceId) => {
        try {
          await calendarApi.syncWorkspace(workspaceId);
          await get().fetchEvents(workspaceId);
        } catch {
          // Handled
        }
      },
    }),
    {
      name: "neurodesk_calendar_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentView: state.currentView,
        selectedDate: state.selectedDate,
        events: state.events,
      }),
    }
  )
);
