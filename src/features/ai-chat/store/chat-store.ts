import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Conversation, Message } from "../types";
import { initialConversations, initialMessagesMap, mockAIResponses } from "../mock/chat-mock-data";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  activeModel: string;
  isGenerating: boolean;
  searchQuery: string;

  setSearchQuery: (query: string) => void;
  selectConversation: (id: string) => void;
  createNewChat: () => string;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePinConversation: (id: string) => void;
  setActiveModel: (modelId: string) => void;
  setMessageFeedback: (messageId: string, feedback: "like" | "dislike") => void;
  clearCurrentChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: initialConversations,
      activeConversationId: "conv_1",
      messages: initialMessagesMap,
      activeModel: "NeuroDesk GPT-4o",
      isGenerating: false,
      searchQuery: "",

      setSearchQuery: (query) => set({ searchQuery: query }),

      selectConversation: (id) => set({ activeConversationId: id }),

      createNewChat: () => {
        const newId = `conv_${Date.now()}`;
        const newConv: Conversation = {
          id: newId,
          title: "New Conversation",
          isPinned: false,
          lastUpdated: "Just now",
          model: get().activeModel,
          messageCount: 0,
        };

        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: newId,
          messages: { ...state.messages, [newId]: [] },
        }));

        return newId;
      },

      sendMessage: async (content) => {
        const { activeConversationId, messages, activeModel, conversations } = get();
        if (!activeConversationId) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const userMsg: Message = {
          id: `msg_user_${Date.now()}`,
          role: "user",
          content,
          timestamp,
          model: activeModel,
        };

        const currentMsgs = messages[activeConversationId] || [];
        const updatedMsgsWithUser = [...currentMsgs, userMsg];

        // Auto update conversation title if first message
        let updatedConvs = conversations;
        if (currentMsgs.length === 0) {
          const autoTitle = content.length > 30 ? `${content.slice(0, 30)}...` : content;
          updatedConvs = conversations.map((c) =>
            c.id === activeConversationId ? { ...c, title: autoTitle, messageCount: 1 } : c
          );
        }

        set({
          messages: { ...messages, [activeConversationId]: updatedMsgsWithUser },
          conversations: updatedConvs,
          isGenerating: true,
        });

        // Simulate streaming delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Select response template based on content keywords
        const isCodePrompt = /code|react|function|typescript|component|html/i.test(content);
        const fullAIContent = isCodePrompt ? mockAIResponses.coding : mockAIResponses.default;

        const aiMsgId = `msg_ai_${Date.now()}`;
        const aiMsg: Message = {
          id: aiMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          model: activeModel,
          isStreaming: true,
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [activeConversationId]: [...(state.messages[activeConversationId] || []), aiMsg],
          },
        }));

        // Token by token streaming simulation
        const tokens = fullAIContent.split(" ");
        let streamedText = "";

        for (let i = 0; i < tokens.length; i++) {
          streamedText += (i === 0 ? "" : " ") + tokens[i];

          set((state) => {
            const list = state.messages[activeConversationId] || [];
            const updatedList = list.map((m) =>
              m.id === aiMsgId ? { ...m, content: streamedText } : m
            );
            return {
              messages: { ...state.messages, [activeConversationId]: updatedList },
            };
          });

          await new Promise((r) => setTimeout(r, 25));
        }

        // Finalize streaming
        set((state) => {
          const list = state.messages[activeConversationId] || [];
          const updatedList = list.map((m) =>
            m.id === aiMsgId ? { ...m, isStreaming: false } : m
          );
          return {
            messages: { ...state.messages, [activeConversationId]: updatedList },
            isGenerating: false,
          };
        });
      },

      deleteConversation: (id) =>
        set((state) => {
          const newConvs = state.conversations.filter((c) => c.id !== id);
          const newMsgs = { ...state.messages };
          delete newMsgs[id];
          const newActive = state.activeConversationId === id ? newConvs[0]?.id || null : state.activeConversationId;
          return {
            conversations: newConvs,
            messages: newMsgs,
            activeConversationId: newActive,
          };
        }),

      renameConversation: (id, newTitle) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title: newTitle } : c
          ),
        })),

      togglePinConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
          ),
        })),

      setActiveModel: (modelId) => set({ activeModel: modelId }),

      setMessageFeedback: (messageId, feedback) =>
        set((state) => {
          const activeId = state.activeConversationId;
          if (!activeId) return state;
          const list = state.messages[activeId] || [];
          const updated = list.map((m) => (m.id === messageId ? { ...m, feedback } : m));
          return {
            messages: { ...state.messages, [activeId]: updated },
          };
        }),

      clearCurrentChat: () =>
        set((state) => {
          const activeId = state.activeConversationId;
          if (!activeId) return state;
          return {
            messages: { ...state.messages, [activeId]: [] },
          };
        }),
    }),
    {
      name: "neurodesk_chat_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        activeModel: state.activeModel,
      }),
    }
  )
);
