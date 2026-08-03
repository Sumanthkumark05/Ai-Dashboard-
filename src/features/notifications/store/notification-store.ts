import { create } from "zustand";
import { NotificationItem, NotificationFilter, NotificationSort, NotificationCategory, NotificationPriority } from "../types";
import { notificationsApi } from "@/services/notifications-api";

interface NotificationState {
  notifications: NotificationItem[];
  selectedNotification: NotificationItem | null;
  searchQuery: string;
  filter: NotificationFilter;
  sortBy: NotificationSort;
  isDetailsOpen: boolean;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: NotificationFilter) => void;
  setSortBy: (sort: NotificationSort) => void;
  selectNotification: (item: NotificationItem) => void;
  clearSelectedNotification: () => void;
  openDetailsPanel: (item: NotificationItem) => void;
  closeDetailsPanel: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => Promise<void>;
  togglePinNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  selectedNotification: null,
  searchQuery: "",
  filter: "all",
  sortBy: "newest",
  isDetailsOpen: false,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsApi.list(50, 0, false);
      const mapped: NotificationItem[] = (res.items || []).map((n) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        category: (n.type === "system" ? "System" : n.type === "error" ? "Security" : "General") as NotificationCategory,
        priority: (n.type === "error" ? "High" : n.type === "warning" ? "Medium" : "Low") as NotificationPriority,
        timestamp: n.created_at ? new Date(n.created_at).toLocaleString() : "Recently",
        isRead: n.is_read,
        isPinned: false,
        isArchived: false,
        group: "Today",
        actionUrl: n.action_url,
      }));
      set({
        notifications: mapped,
        selectedNotification: mapped[0] || null,
      });
    } catch {
      set({ notifications: [], selectedNotification: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),

  selectNotification: (item) => {
    set((state) => ({
      selectedNotification: item,
      notifications: state.notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    }));
    get().markAsRead(item.id);
  },

  clearSelectedNotification: () => set({ selectedNotification: null }),

  openDetailsPanel: (item) => {
    set((state) => ({
      selectedNotification: item,
      isDetailsOpen: true,
      notifications: state.notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    }));
    get().markAsRead(item.id);
  },

  closeDetailsPanel: () => set({ isDetailsOpen: false }),

  markAsRead: async (id) => {
    try {
      await notificationsApi.markRead(id);
    } catch {
      // fallback
    }
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      selectedNotification: state.selectedNotification?.id === id ? { ...state.selectedNotification, isRead: true } : state.selectedNotification,
    }));
  },

  markAsUnread: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      selectedNotification: state.selectedNotification?.id === id ? { ...state.selectedNotification, isRead: false } : state.selectedNotification,
    })),

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllRead();
    } catch {
      // fallback
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

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

  deleteNotification: async (id) => {
    try {
      await notificationsApi.delete(id);
    } catch {
      // fallback
    }
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      selectedNotification: state.selectedNotification?.id === id ? null : state.selectedNotification,
    }));
  },
}));
