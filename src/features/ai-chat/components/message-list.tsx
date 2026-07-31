"use client";

import * as React from "react";
import { Message } from "../types";
import { MessageBubble } from "./message-bubble";
import { EmptyChatState } from "./empty-chat-state";

export interface MessageListProps {
  messages: Message[];
  onSelectPrompt: (promptText: string) => void;
}

export function MessageList({ messages, onSelectPrompt }: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyChatState onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((message: Message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
