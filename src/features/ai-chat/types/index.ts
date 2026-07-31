export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  model?: string;
  feedback?: "like" | "dislike";
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  isPinned: boolean;
  lastUpdated: string;
  model: string;
  messageCount: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export interface SuggestedPrompt {
  id: string;
  title: string;
  prompt: string;
  category: "Coding" | "Writing" | "Analysis" | "Productivity";
}
