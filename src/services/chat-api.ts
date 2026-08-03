import { apiClient, tokenStorage } from "@/lib/api-client";

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatRequestPayload {
  conversation_id?: string | null;
  message: string;
  model?: string;
  system_prompt?: string;
}

export interface ChatResponsePayload {
  conversation_id: string;
  assistant_message: string;
  usage: TokenUsage;
}

export interface ApiMessage {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  latency_ms?: number;
  created_at?: string;
}

export interface ApiConversation {
  id: string;
  title: string;
  model: string;
  is_pinned: boolean;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  messages?: ApiMessage[];
}

export const chatApi = {
  /**
   * Non-streaming chat endpoint POST /api/v1/chat
   */
  async sendMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
    return apiClient.post<ChatResponsePayload>("/chat", payload);
  },

  /**
   * SSE Streaming chat endpoint POST /api/v1/chat/stream
   */
  async streamMessage(
    payload: ChatRequestPayload,
    callbacks: {
      onInit?: (conversationId: string) => void;
      onToken?: (token: string) => void;
      onUsage?: (usage: TokenUsage) => void;
      onError?: (errorMsg: string) => void;
      onDone?: (conversationId: string, usage?: TokenUsage) => void;
      signal?: AbortSignal;
    }
  ): Promise<void> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch("/api/v1/chat/stream", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: callbacks.signal,
      });

      if (!response.ok) {
        let errorMsg = `Server error ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.message || errorMsg;
        } catch {
          // fallback
        }
        callbacks.onError?.(errorMsg);
        return;
      }

      if (!response.body) {
        callbacks.onError?.("Response body is missing.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === "init") {
              callbacks.onInit?.(data.conversation_id);
            } else if (data.type === "token") {
              callbacks.onToken?.(data.content);
            } else if (data.type === "usage") {
              callbacks.onUsage?.(data.usage);
            } else if (data.type === "error") {
              callbacks.onError?.(data.message || "Streaming error occurred");
              return;
            } else if (data.type === "done") {
              callbacks.onDone?.(data.conversation_id, data.usage);
              return;
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }

      callbacks.onDone?.(payload.conversation_id || "");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        callbacks.onDone?.(payload.conversation_id || "");
        return;
      }
      callbacks.onError?.(err instanceof Error ? err.message : "Network error during streaming.");
    }
  },

  /**
   * Fetch conversation list
   */
  async getConversations(): Promise<ApiConversation[]> {
    return apiClient.get<ApiConversation[]>("/chat/conversations");
  },

  /**
   * Fetch details & messages for a conversation
   */
  async getConversation(id: string): Promise<ApiConversation> {
    return apiClient.get<ApiConversation>(`/chat/conversations/${id}`);
  },

  /**
   * Rename or pin conversation
   */
  async updateConversation(
    id: string,
    data: { title?: string; is_pinned?: boolean }
  ): Promise<ApiConversation> {
    return apiClient.patch<ApiConversation>(`/chat/conversations/${id}`, data);
  },

  /**
   * Delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    return apiClient.delete<void>(`/chat/conversations/${id}`);
  },
};
