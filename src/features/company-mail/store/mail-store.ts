import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ConnectedMailAccount, EmailMessageItem, mailApi } from "@/services/mail-api";

export type MailFolder = "inbox" | "unread" | "starred" | "important" | "sent" | "drafts" | "spam" | "trash" | "archive";
export type MailCategory = "all" | "primary" | "updates" | "promotions" | "social";

interface MailState {
  account: ConnectedMailAccount | null;
  isConnected: boolean;
  messages: EmailMessageItem[];
  selectedMessage: EmailMessageItem | null;
  activeFolder: MailFolder;
  activeCategory: MailCategory;
  searchQuery: string;
  isComposeOpen: boolean;
  isLoading: boolean;
  isAiProcessing: boolean;
  aiResult: string | null;

  setFolder: (folder: MailFolder) => void;
  setCategory: (category: MailCategory) => void;
  setSearchQuery: (query: string) => void;
  selectMessage: (msg: EmailMessageItem | null) => void;
  openCompose: () => void;
  closeCompose: () => void;

  fetchAccount: () => Promise<void>;
  connectAccount: (email?: string) => Promise<void>;
  disconnectAccount: () => Promise<void>;
  fetchMessages: (workspaceId?: string) => Promise<void>;
  sendMessage: (payload: { to: string; subject: string; body: string; cc?: string; bcc?: string }) => Promise<void>;
  toggleStar: (id: string) => void;
  markReadStatus: (id: string, isUnread: boolean) => void;
  runAIAction: (id: string, action: "summarize" | "generate_reply" | "extract_tasks") => Promise<string | any[]>;
  saveAttachmentToKnowledge: (attId: string) => Promise<void>;
}

export const useMailStore = create<MailState>()(
  persist(
    (set, get) => ({
      account: {
        id: "acc_demo_1",
        email: "employee@company.com",
        google_user_id: "goog_89210381",
        sync_status: "active",
        unread_count: 2,
        updated_at: new Date().toISOString(),
      },
      isConnected: true,
      messages: [
        {
          id: "msg_1",
          workspace_id: "ws_neurodesk",
          message_id: "msg_google_101",
          thread_id: "th_101",
          sender_email: "john.smith@abctechnologies.com",
          sender_name: "John Smith",
          recipient_emails: "employee@company.com",
          subject: "Weekly Demo Schedule & Architecture Review",
          snippet: "Hi Team, Please review the updated demo schedule for Friday...",
          body_html: "<h2>Weekly Demo Schedule</h2><p>Hi Team,</p><p>Please review the updated client demo schedule for this Friday at 10:00 AM. Google Meet link is attached below.</p><p>Best regards,<br/>John Smith</p>",
          folder: "inbox",
          category: "primary",
          is_unread: true,
          is_starred: true,
          is_important: true,
          has_attachments: true,
          has_calendar_invite: true,
          received_at: new Date().toISOString(),
        },
        {
          id: "msg_2",
          workspace_id: "ws_neurodesk",
          message_id: "msg_google_102",
          thread_id: "th_102",
          sender_email: "manager@company.com",
          sender_name: "Engineering Manager",
          recipient_emails: "employee@company.com",
          subject: "Q3 AI SaaS Product Roadmap Approval",
          snippet: "Awesome progress on the Analytics & Calendar telemetry integration...",
          body_html: "<h2>Roadmap Signoff</h2><p>Awesome progress on the Analytics & Calendar telemetry integration. Let's make sure the Company Mail module is deployed seamlessly.</p>",
          folder: "inbox",
          category: "updates",
          is_unread: true,
          is_starred: false,
          is_important: true,
          has_attachments: false,
          has_calendar_invite: false,
          received_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
      ],
      selectedMessage: null,
      activeFolder: "inbox",
      activeCategory: "all",
      searchQuery: "",
      isComposeOpen: false,
      isLoading: false,
      isAiProcessing: false,
      aiResult: null,

      setFolder: (folder) => set({ activeFolder: folder }),
      setCategory: (category) => set({ activeCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectMessage: (msg) => set({ selectedMessage: msg, aiResult: null }),
      openCompose: () => set({ isComposeOpen: true }),
      closeCompose: () => set({ isComposeOpen: false }),

      fetchAccount: async () => {
        try {
          const res = await mailApi.getAccount();
          if (res.is_connected && res.account) {
            set({ isConnected: true, account: res.account });
          }
        } catch {
          // Keep persisted state
        }
      },

      connectAccount: async (email) => {
        set({ isLoading: true });
        try {
          const res = await mailApi.oauthCallback("demo_code", email || "user@company.com");
          if (res.success) {
            set({
              isConnected: true,
              account: {
                id: `acc_${Date.now()}`,
                email: res.email,
                sync_status: "active",
                unread_count: 2,
                updated_at: new Date().toISOString(),
              },
              isLoading: false,
            });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      disconnectAccount: async () => {
        set({ isLoading: true });
        try {
          await mailApi.disconnect();
          set({ isConnected: false, account: null, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchMessages: async (workspaceId) => {
        set({ isLoading: true });
        try {
          const res = await mailApi.getMessages({
            folder: get().activeFolder,
            category: get().activeCategory,
            search: get().searchQuery,
            workspace_id: workspaceId,
          });

          if (res.items && res.items.length > 0) {
            set({ messages: res.items, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      sendMessage: async (payload) => {
        set({ isLoading: true });
        try {
          await mailApi.sendEmail(payload);
          const newMsg: EmailMessageItem = {
            id: `msg_${Date.now()}`,
            message_id: `msg_sent_${Date.now()}`,
            sender_email: get().account?.email || "me@company.com",
            sender_name: "Me",
            recipient_emails: payload.to,
            subject: payload.subject,
            snippet: payload.body.slice(0, 100),
            body_html: `<p>${payload.body}</p>`,
            folder: "sent",
            category: "primary",
            is_unread: false,
            is_starred: false,
            is_important: false,
            has_attachments: false,
            has_calendar_invite: false,
            received_at: new Date().toISOString(),
          };

          set((state) => ({
            messages: [newMsg, ...state.messages],
            isComposeOpen: false,
            isLoading: false,
          }));
        } catch {
          set({ isLoading: false });
        }
      },

      toggleStar: (id) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, is_starred: !m.is_starred } : m)),
          selectedMessage: state.selectedMessage?.id === id ? { ...state.selectedMessage, is_starred: !state.selectedMessage.is_starred } : state.selectedMessage,
        })),

      markReadStatus: (id, isUnread) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, is_unread: isUnread } : m)),
          selectedMessage: state.selectedMessage?.id === id ? { ...state.selectedMessage, is_unread: isUnread } : state.selectedMessage,
        })),

      runAIAction: async (id, action) => {
        set({ isAiProcessing: true, aiResult: null });
        try {
          const res = await mailApi.performAIAction(id, action);
          const textRes = res.result || JSON.stringify(res.tasks, null, 2);
          set({ isAiProcessing: false, aiResult: textRes });
          return res.result || res.tasks || "Action completed";
        } catch {
          set({ isAiProcessing: false });
          return "AI processing failed.";
        }
      },

      saveAttachmentToKnowledge: async (attId) => {
        try {
          await mailApi.saveAttachmentToDocuments(attId);
        } catch {
          // Handled
        }
      },
    }),
    {
      name: "neurodesk_company_mail_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeFolder: state.activeFolder,
        activeCategory: state.activeCategory,
        isConnected: state.isConnected,
        account: state.account,
      }),
    }
  )
);
