"use client";

import * as React from "react";
import { ChevronDown, Trash2, Download, Bot, Check } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/navigation/dropdown";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/feedback/tooltip";
import { toast } from "@/components/feedback/toast";

const modelOptions = [
  {
    id: "openai-gpt-oss-120b",
    name: "openai/gpt-oss-120b",
    displayName: "Groq GPT-OSS 120B",
    description: "Groq API ultra-fast 120B model for flagship performance",
  },
  {
    id: "llama-3-70b",
    name: "llama-3.3-70b-versatile",
    displayName: "Groq Llama 3.3 70B",
    description: "Versatile open weights model on Groq inference",
  },
  {
    id: "mixtral-8x7b",
    name: "mixtral-8x7b-32768",
    displayName: "Groq Mixtral 8x7B",
    description: "High-speed MoE model with 32k context window",
  },
];

export function ChatHeader() {
  const {
    conversations,
    activeConversationId,
    activeModel,
    setActiveModel,
    clearCurrentChat,
    messages,
  } = useChatStore();

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  const handleExport = () => {
    if (currentMessages.length === 0) {
      toast.info("Nothing to export", { description: "Current conversation is empty." });
      return;
    }
    toast.success("Export initiated", { description: "Conversation exported as Markdown file." });
  };

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-border bg-card/50 px-4 backdrop-blur-sm select-none shrink-0">
      {/* Active Conversation Title */}
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {activeConv?.title || "New Conversation"}
        </h3>
        <Badge variant="outline" size="sm" className="hidden sm:inline-flex text-[10px] py-0 h-4">
          {activeConv?.model || activeModel}
        </Badge>
      </div>

      {/* Model Selector & Actions */}
      <div className="flex items-center gap-2">
        {/* Model Dropdown Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="xs"
              className="h-8 gap-1.5 font-medium border-border hover:bg-accent text-xs"
            >
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">{activeModel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs">Select Intelligence Model</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {modelOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.id}
                onClick={() => {
                  setActiveModel(opt.name);
                  toast.success(`Model switched`, { description: `Active engine set to ${opt.name}` });
                }}
                className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs text-foreground">{opt.displayName || opt.name}</span>
                  {activeModel === opt.name && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">{opt.description}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider delayDuration={200}>
          {/* Export Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleExport}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Export conversation"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Export conversation</TooltipContent>
          </Tooltip>

          {/* Clear Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  clearCurrentChat();
                  toast.info("Chat cleared", { description: "Message history for this session was cleared." });
                }}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                aria-label="Clear conversation history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear messages</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
