"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";

import { Message } from "../types";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/feedback/tooltip";
import { toast } from "@/components/feedback/toast";
import { MarkdownRenderer } from "./markdown-renderer";
import { TypingIndicator } from "./typing-indicator";
import { cn } from "@/lib/utils";
import { getInitials } from "@/constants";

export interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const { setMessageFeedback, sendMessage } = useChatStore();
  const [copied, setCopied] = React.useState(false);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setMessageFeedback(message.id, "like");
    toast.success("Feedback submitted", { description: "Thank you for rating this response!" });
  };

  const handleDislike = () => {
    setMessageFeedback(message.id, "dislike");
    toast.info("Feedback submitted", { description: "We will tune our models based on your input." });
  };

  const userInitials = getInitials(user?.name, "AV");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3 sm:gap-4 max-w-4xl mx-auto py-4 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <Avatar size="sm" className="shrink-0 mt-0.5 select-none">
        {isUser ? (
          <>
            <AvatarImage src={user?.avatarUrl} alt={user?.name || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-primary/10 border border-primary/20 text-primary">
            <BrainCircuit className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Card Container */}
      <div className={cn("flex flex-col min-w-0 max-w-[85%] sm:max-w-[88%]", isUser ? "items-end" : "items-start")}>
        {/* Header Metadata */}
        <div className="flex items-center gap-2 mb-1 text-[11px] text-muted-foreground select-none">
          <span className="font-semibold text-foreground">{isUser ? user?.name || "You" : message.model || "NeuroDesk AI"}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Content Bubble */}
        <div
          className={cn(
            "rounded-xl px-4 py-3 shadow-xs transition-all text-sm leading-relaxed overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : "bg-card border border-border text-foreground rounded-tl-xs"
          )}
        >
          {message.content ? (
            isUser ? (
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )
          ) : message.isStreaming ? (
            <TypingIndicator />
          ) : null}
        </div>

        {/* Message Action Bar (AI Messages Only) */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity select-none">
            <TooltipProvider delayDuration={200}>
              {/* Copy */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleCopy}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Copy response"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy</TooltipContent>
              </Tooltip>

              {/* Regenerate */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => sendMessage("Can you regenerate and expand on your previous answer?")}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Regenerate response"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Regenerate</TooltipContent>
              </Tooltip>

              {/* Like */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleLike}
                    className={cn(
                      "h-6 w-6 p-0 text-muted-foreground hover:text-foreground",
                      message.feedback === "like" && "text-success"
                    )}
                    aria-label="Good response"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Good response</TooltipContent>
              </Tooltip>

              {/* Dislike */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleDislike}
                    className={cn(
                      "h-6 w-6 p-0 text-muted-foreground hover:text-foreground",
                      message.feedback === "dislike" && "text-danger"
                    )}
                    aria-label="Poor response"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Poor response</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </motion.div>
  );
}
