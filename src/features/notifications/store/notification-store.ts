import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NotificationItem, NotificationFilter, NotificationSort } from "../types";
import { initialNotifications } from "../mock/notification-mock-data";

interface NotificationState {
  notifications: NotificationItem[];
  selectedNotification: NotificationItem | null;
  searchQuery: string;
  filter: NotificationFilter;
  sortBy: NotificationSort;
  isDetailsOpen: boolean;
  isLoading: boolean;

  setSearchQuery: (query: string) => void;
  setFilter: (filter: NotificationFilter) => void;
  setSortBy: (sort: NotificationSort) => void;
  selectNotification: (item: NotificationItem) => void;
  clearSelectedNotification: () => void;
  openDetailsPanel: (item: NotificationItem) => void;
  closeDetailsPanel: () => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  togglePinNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: initialNotifications,
      selectedNotification: initialNotifications[0],
      searchQuery: "",
      filter: "all",
      sortBy: "newest",
      isDetailsOpen: false,
      isLoading: false,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilter: (filter) => set({ filter }),
      setSortBy: (sortBy) => set({ sortBy }),

      selectNotification: (item) =>
        set((state) => ({
          selectedNotification: item,
          notifications: state.notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        })),

      clearSelectedNotification: () => set({ selectedNotification: null }),

      openDetailsPanel: (item) =>
        set((state) => ({
          selectedNotification: item,
          isDetailsOpen: true,
          notifications: state.notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        })),

      closeDetailsPanel: () => set({ isDetailsOpen: false }),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          selectedNotification: state.selectedNotification?.id === id ? { ...state.selectedNotification, isRead: true } : state.selectedNotification,
        })),

      markAsUnread: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
          selectedNotification: state.selectedNotification?.id === id ? { ...state.selectedNotification, isRead: false } : state.selectedNotification,
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      togglePinNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
          selectedNotification: state.selectedNotification?.id === id ? { ...state.selectedNotification, isPinned: !state.selectedNotification.isPinned } : state.selectedNotification,
        })),

      archiveNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isArchived: true } : n)),
          selectedNotification: state.selectedNotification?.id === id ? null : state.selectedNotification,
        })),

      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          selectedNotification: state.selectedNotification?.id === id ? null : state.selectedNotification,
        })),
    }),
    {
      name: "neurodesk_notifications_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ filter: state.filter, sortBy: state.sortBy }),
    }
  )
);
