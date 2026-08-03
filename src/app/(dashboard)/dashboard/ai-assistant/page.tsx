"use client";

import * as React from "react";
import { useChatStore } from "@/stores/chat-store";
import { ConversationSidebar } from "@/features/ai-chat/components/conversation-sidebar";
import { ChatHeader } from "@/features/ai-chat/components/chat-header";
import { MessageList } from "@/features/ai-chat/components/message-list";
import { PromptComposer } from "@/features/ai-chat/components/prompt-composer";

export default function AIAssistantPage() {
  const {
    messages,
    activeConversationId,
    sendMessage,
    stopGeneration,
    isGenerating,
    loadConversations,
  } = useChatStore();
  const [selectedPromptText, setSelectedPromptText] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  const handleSend = async (content: string) => {
    setSelectedPromptText(undefined);
    await sendMessage(content);
  };

  const handleSelectPrompt = (promptText: string) => {
    setSelectedPromptText(promptText);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Left Conversation Threads Sidebar */}
      <ConversationSidebar />

      {/* Main Chat Workspace Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-background/50">
        {/* Top Chat Header */}
        <ChatHeader />

        {/* Scrollable Message List */}
        <MessageList
          messages={currentMessages}
          onSelectPrompt={handleSelectPrompt}
        />

        {/* Bottom Prompt Composer */}
        <PromptComposer
          onSend={handleSend}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          externalPrompt={selectedPromptText}
        />
      </div>
    </div>
  );
}
