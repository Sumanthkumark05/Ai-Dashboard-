import { create } from "zustand";
import { Conversation, Message } from "../types";
import { chatApi } from "@/services/chat-api";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  activeModel: string;
  isGenerating: boolean;
  searchQuery: string;
  abortController: AbortController | null;

  setSearchQuery: (query: string) => void;
  selectConversation: (id: string) => Promise<void>;
  createNewChat: () => string;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  retryLastMessage: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  setActiveModel: (modelId: string) => void;
  setMessageFeedback: (messageId: string, feedback: "like" | "dislike") => void;
  clearCurrentChat: () => void;
  loadConversations: () => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  activeModel: "openai/gpt-oss-120b",
  isGenerating: false,
  searchQuery: "",
  abortController: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadConversations: async () => {
    try {
      const apiConvs = await chatApi.getConversations();
      if (apiConvs && Array.isArray(apiConvs)) {
        const mapped: Conversation[] = apiConvs.map((c) => ({
          id: c.id,
          title: c.title || "Untitled Chat",
          isPinned: c.is_pinned || false,
          lastUpdated: c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
          model: c.model || "openai/gpt-oss-120b",
          messageCount: c.message_count || 0,
        }));
        set({ conversations: mapped });

        // If active conversation set, load its messages
        const currentActive = get().activeConversationId;
        if (currentActive && mapped.some((c) => c.id === currentActive)) {
          await get().selectConversation(currentActive);
        }
      }
    } catch {
      // Keep local state fallback on connection error
    }
  },

  selectConversation: async (id: string) => {
    set({ activeConversationId: id });
    try {
      const details = await chatApi.getConversation(id);
      if (details && details.messages) {
        const mappedMsgs: Message[] = details.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
          model: m.model || get().activeModel,
          isStreaming: false,
        }));

        set((state) => ({
          messages: { ...state.messages, [id]: mappedMsgs },
        }));
      }
    } catch {
      // Local fallback
    }
  },

  createNewChat: () => {
    const newId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: "New Session",
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

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ isGenerating: false, abortController: null });
    }
  },

  sendMessage: async (content: string) => {
    if (!content.trim() || get().isGenerating) return;

    let { activeConversationId } = get();
    if (!activeConversationId) {
      activeConversationId = get().createNewChat();
    }

    const { messages, activeModel, conversations } = get();
    const currentMsgs = messages[activeConversationId] || [];

    const userMsgId = `msg_user_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content,
      timestamp,
      model: activeModel,
    };

    const aiMsgId = `msg_ai_${Date.now()}`;
    const initialAiMsg: Message = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp,
      model: activeModel,
      isStreaming: true,
    };

    const updatedMsgsWithUser = [...currentMsgs, userMsg, initialAiMsg];

    let updatedConvs = conversations;
    if (currentMsgs.length === 0) {
      const autoTitle = content.length > 35 ? `${content.slice(0, 35)}...` : content;
      updatedConvs = conversations.map((c) =>
        c.id === activeConversationId ? { ...c, title: autoTitle, messageCount: 2 } : c
      );
    }

    const abortController = new AbortController();

    set({
      messages: { ...messages, [activeConversationId]: updatedMsgsWithUser },
      conversations: updatedConvs,
      isGenerating: true,
      abortController,
    });

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const backendConvId = isUUID(activeConversationId) ? activeConversationId : null;

    let accumulatedContent = "";

    await chatApi.streamMessage(
      {
        conversation_id: backendConvId,
        message: content,
        model: activeModel,
      },
      {
        signal: abortController.signal,

        onInit: (realConvId) => {
          if (realConvId && realConvId !== activeConversationId) {
            const oldId = activeConversationId!;
            set((state) => {
              const currentOldMsgs = state.messages[oldId] || [];
              const newMsgsState = { ...state.messages, [realConvId]: currentOldMsgs };
              delete newMsgsState[oldId];

              const newConvs = state.conversations.map((c) =>
                c.id === oldId ? { ...c, id: realConvId } : c
              );

              return {
                activeConversationId: realConvId,
                conversations: newConvs,
                messages: newMsgsState,
              };
            });
            activeConversationId = realConvId;
          }
        },

        onToken: (token) => {
          accumulatedContent += token;
          const currentActiveId = get().activeConversationId || activeConversationId;
          if (!currentActiveId) return;
          set((state) => {
            const list = state.messages[currentActiveId] || [];
            const updated = list.map((m: Message) =>
              m.id === aiMsgId ? { ...m, content: accumulatedContent } : m
            );
            return {
              messages: { ...state.messages, [currentActiveId]: updated },
            };
          });
        },

        onError: (errorMsg) => {
          const currentActiveId = get().activeConversationId || activeConversationId;
          if (!currentActiveId) return;
          const finalErrorContent = accumulatedContent.trim()
            ? `${accumulatedContent}\n\n*[Stream Interrupted: ${errorMsg}]*`
            : `⚠️ **AI Service Error**: ${errorMsg}\n\nPlease check your \`GROQ_API_KEY\` configuration in \`backend/.env\` or try again.`;

          set((state) => {
            const list = state.messages[currentActiveId] || [];
            const updated = list.map((m: Message) =>
              m.id === aiMsgId ? { ...m, content: finalErrorContent, isStreaming: false } : m
            );
            return {
              messages: { ...state.messages, [currentActiveId]: updated },
              isGenerating: false,
              abortController: null,
            };
          });
        },

        onDone: () => {
          const currentActiveId = get().activeConversationId || activeConversationId;
          if (!currentActiveId) return;
          set((state) => {
            const list = state.messages[currentActiveId] || [];
            const updated = list.map((m: Message) =>
              m.id === aiMsgId ? { ...m, isStreaming: false } : m
            );
            return {
              messages: { ...state.messages, [currentActiveId]: updated },
              isGenerating: false,
              abortController: null,
            };
          });
        },
      }
    );
  },

  retryLastMessage: async () => {
    const { activeConversationId, messages, isGenerating } = get();
    if (!activeConversationId || isGenerating) return;

    const list = messages[activeConversationId] || [];
    if (list.length === 0) return;

    // Find last user message
    let lastUserMsgContent = "";
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === "user") {
        lastUserMsgContent = list[i].content;
        break;
      }
    }

    if (lastUserMsgContent) {
      await get().sendMessage(lastUserMsgContent);
    }
  },

  deleteConversation: async (id) => {
    try {
      await chatApi.deleteConversation(id);
    } catch {
      // Ignore if offline
    }

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
    });
  },

  renameConversation: async (id, newTitle) => {
    try {
      await chatApi.updateConversation(id, { title: newTitle });
    } catch {
      // Local fallback
    }

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title: newTitle } : c
      ),
    }));
  },

  togglePinConversation: async (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (conv) {
      const newPinned = !conv.isPinned;
      try {
        await chatApi.updateConversation(id, { is_pinned: newPinned });
      } catch {
        // Fallback
      }

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, isPinned: newPinned } : c
        ),
      }));
    }
  },

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
}));
