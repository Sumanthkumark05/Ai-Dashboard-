import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CalendarEvent, CalendarView, CalendarCategory } from "../types";
import { initialCalendarEvents } from "../mock/calendar-mock-data";

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string;
  selectedEvent: CalendarEvent | null;
  currentView: CalendarView;
  searchQuery: string;
  categoryFilter: string;
  currentMonth: number;
  currentYear: number;
  isDrawerOpen: boolean;
  isDialogOpen: boolean;
  isLoading: boolean;

  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  setToday: () => void;
  selectEvent: (event: CalendarEvent) => void;
  clearSelectedEvent: () => void;
  openDrawer: (event: CalendarEvent) => void;
  closeDrawer: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  addEvent: (eventData: Omit<CalendarEvent, "id" | "createdBy" | "color">) => void;
  deleteEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: initialCalendarEvents,
      selectedDate: "2026-07-29",
      selectedEvent: initialCalendarEvents[0],
      currentView: "month",
      searchQuery: "",
      categoryFilter: "all",
      currentMonth: 6, // July (0-indexed)
      currentYear: 2026,
      isDrawerOpen: false,
      isDialogOpen: false,
      isLoading: false,

      setView: (view) => set({ currentView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategoryFilter: (category) => set({ categoryFilter: category }),

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
          currentMonth: 6,
          currentYear: 2026,
          selectedDate: "2026-07-29",
        }),

      selectEvent: (event) => set({ selectedEvent: event }),
      clearSelectedEvent: () => set({ selectedEvent: null }),

      openDrawer: (event) => set({ selectedEvent: event, isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      openDialog: () => set({ isDialogOpen: true }),
      closeDialog: () => set({ isDialogOpen: false }),

      addEvent: (eventData) => {
        const categoryColorMap: Record<CalendarCategory, string> = {
          Meeting: "#3b82f6",
          "AI Session": "#8b5cf6",
          Workspace: "#10b981",
          Task: "#f59e0b",
          Reminder: "#ec4899",
          Personal: "#06b6d4",
          System: "#64748b",
        };

        const newEvent: CalendarEvent = {
          ...eventData,
          id: `evt_${Date.now()}`,
          color: categoryColorMap[eventData.category] || "#3b82f6",
          createdBy: "Alex Vance",
        };

        set((state) => ({
          events: [newEvent, ...state.events],
          selectedDate: eventData.date,
        }));
      },

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
          isDrawerOpen: state.selectedEvent?.id === id ? false : state.isDrawerOpen,
        })),
    }),
    {
      name: "neurodesk_calendar_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ currentView: state.currentView, selectedDate: state.selectedDate }),
    }
  )
);
