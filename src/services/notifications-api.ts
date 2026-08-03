/**
 * notifications-api.ts
 * Manages in-app notifications from the FastAPI backend.
 */

import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const notificationsApi = {
  /**
   * GET /api/v1/notifications?limit=20&offset=0&unread_only=false
   */
  async list(
    limit = 20,
    offset = 0,
    unreadOnly = false
  ): Promise<NotificationsResponse> {
    return apiClient.get<NotificationsResponse>(
      `/notifications?limit=${limit}&offset=${offset}&unread_only=${unreadOnly}`
    );
  },

  /**
   * PATCH /api/v1/notifications/:id/read
   * Marks a single notification as read.
   */
  async markRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`);
  },

  /**
   * POST /api/v1/notifications/mark-all-read
   * Marks all notifications as read for the current user.
   */
  async markAllRead(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/notifications/mark-all-read");
  },

  /**
   * DELETE /api/v1/notifications/:id
   * Deletes a notification.
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/notifications/${id}`);
  },
};
