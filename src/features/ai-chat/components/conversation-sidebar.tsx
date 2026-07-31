"use client";

import * as React from "react";
import {
  Plus,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { useChatStore } from "@/stores/chat-store";
import { Conversation } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/navigation/dropdown";
import { toast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";

export function ConversationSidebar() {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    createNewChat,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    searchQuery,
    setSearchQuery,
  } = useChatStore();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedList = filteredConversations.filter((c) => c.isPinned);
  const recentList = filteredConversations.filter((c) => !c.isPinned);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
      toast.success("Conversation renamed");
    }
    setEditingId(null);
  };

  const renderConvItem = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;

    if (editingId === conv.id) {
      return (
        <div key={conv.id} className="p-1">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename(conv.id);
              if (e.key === "Escape") setEditingId(null);
            }}
            onBlur={() => handleSaveRename(conv.id)}
            autoFocus
            className="h-8 text-xs"
          />
        </div>
      );
    }

    return (
      <div
        key={conv.id}
        onClick={() => selectConversation(conv.id)}
        className={cn(
          "group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer select-none",
          isActive
            ? "bg-accent text-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
          {!isCollapsed && <span className="truncate">{conv.title}</span>}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinConversation(conv.id);
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Pin className="mr-2 h-3.5 w-3.5" />
                  <span>{conv.isPinned ? "Unpin" : "Pin thread"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRename(conv);
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Edit2 className="mr-2 h-3.5 w-3.5" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                    toast.info("Thread deleted");
                  }}
                  className="cursor-pointer text-xs text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card/60 backdrop-blur-sm transition-all duration-300 select-none shrink-0",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Header Controls */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Conversations</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-foreground"
            aria-label={isCollapsed ? "Expand threads" : "Collapse threads"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* New Chat Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => createNewChat()}
          className="w-full gap-2 font-semibold shadow-xs"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {!isCollapsed && <span>New Chat</span>}
        </Button>

        {/* Search Input Filter */}
        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Pinned Section */}
        {pinnedList.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <Pin className="h-3 w-3" />
                <span>Pinned</span>
              </div>
            )}
            {pinnedList.map((conv) => renderConvItem(conv))}
          </div>
        )}

        {/* Recent Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Recent
            </div>
          )}
          {recentList.map((conv) => renderConvItem(conv))}
        </div>
      </div>
    </aside>
  );
}
