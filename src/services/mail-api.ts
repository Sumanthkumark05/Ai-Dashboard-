/**
 * mail-api.ts
 * Frontend service for Company Mail & Google Workspace Gmail API integration.
 */

import { apiClient } from "@/lib/api-client";

export interface ConnectedMailAccount {
  id: string;
  email: string;
  google_user_id?: string;
  sync_status: string;
  unread_count: number;
  updated_at?: string;
}

export interface EmailMessageItem {
  id: string;
  workspace_id?: string;
  message_id: string;
  thread_id?: string;
  sender_email: string;
  sender_name: string;
  recipient_emails: string;
  cc_emails?: string;
  subject: string;
  snippet: string;
  body_html?: string;
  body_text?: string;
  folder: "inbox" | "unread" | "starred" | "important" | "sent" | "drafts" | "spam" | "trash" | "archive" | string;
  category: "primary" | "updates" | "promotions" | "social" | string;
  is_unread: boolean;
  is_starred: boolean;
  is_important: boolean;
  has_attachments: boolean;
  has_calendar_invite: boolean;
  received_at: string;
}

export interface MailSummaryTelemetry {
  unread_count: number;
  today_count: number;
  invites_count: number;
  pending_replies: number;
  recent_messages: Array<{
    id: string;
    sender_name: string;
    subject: string;
    snippet: string;
    is_unread: boolean;
    received_at?: string;
  }>;
}

export const mailApi = {
  /**
   * Get Google OAuth 2.0 Authorization URL
   */
  async getAuthUrl(): Promise<{ auth_url: string }> {
    return await apiClient.get<{ auth_url: string }>("/mail/auth-url");
  },

  /**
   * Complete Google OAuth Callback
   */
  async oauthCallback(code: string, email?: string): Promise<{ success: boolean; email: string; is_connected: boolean; message: string }> {
    return await apiClient.post<{ success: boolean; email: string; is_connected: boolean; message: string }>("/mail/oauth-callback", { code, email });
  },

  /**
   * Fetch connected account details
   */
  async getAccount(): Promise<{ is_connected: boolean; account: ConnectedMailAccount | null }> {
    try {
      return await apiClient.get<{ is_connected: boolean; account: ConnectedMailAccount | null }>("/mail/account");
    } catch {
      return { is_connected: false, account: null };
    }
  },

  /**
   * Disconnect company Gmail account
   */
  async disconnect(): Promise<{ success: boolean; message: string }> {
    return await apiClient.post<{ success: boolean; message: string }>("/mail/disconnect");
  },

  /**
   * Fetch synchronized emails
   */
  async getMessages(params?: { folder?: string; category?: string; search?: string; workspace_id?: string }): Promise<{ items: EmailMessageItem[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.folder) query.append("folder", params.folder);
      if (params?.category) query.append("category", params.category);
      if (params?.search) query.append("search", params.search);
      if (params?.workspace_id) query.append("workspace_id", params.workspace_id);

      const qStr = query.toString() ? `?${query.toString()}` : "";
      return await apiClient.get<{ items: EmailMessageItem[]; total: number }>(`/mail/messages${qStr}`);
    } catch {
      return { items: [], total: 0 };
    }
  },

  /**
   * Send Email / Reply
   */
  async sendEmail(payload: { to: string; subject: string; body: string; cc?: string; bcc?: string; thread_id?: string }): Promise<{ success: boolean; message_id: string }> {
    return await apiClient.post<{ success: boolean; message_id: string }>("/mail/send", payload);
  },

  /**
   * Perform AI Productivity Action using openai/gpt-oss-120b
   */
  async performAIAction(messageId: string, action: "summarize" | "generate_reply" | "extract_tasks"): Promise<{ action: string; result?: string; tasks?: any[] }> {
    return await apiClient.post<{ action: string; result?: string; tasks?: any[] }>(`/mail/messages/${messageId}/ai-action`, { action });
  },

  /**
   * Save Email Attachment to Knowledge Repository (Documents)
   */
  async saveAttachmentToDocuments(attachmentId: string): Promise<{ success: boolean; document_id: string; message: string }> {
    return await apiClient.post<{ success: boolean; document_id: string; message: string }>(`/mail/attachments/${attachmentId}/save-to-documents`);
  },

  /**
   * Get Summary Telemetry for Dashboard & Widgets
   */
  async getSummary(): Promise<MailSummaryTelemetry> {
    try {
      return await apiClient.get<MailSummaryTelemetry>("/mail/summary");
    } catch {
      return {
        unread_count: 0,
        today_count: 0,
        invites_count: 0,
        pending_replies: 0,
        recent_messages: [],
      };
    }
  },
};
