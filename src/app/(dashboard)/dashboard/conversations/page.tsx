"use client";

import { MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/forms/input";

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Active Conversations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review conversation logs, sentiment analysis, and multi-agent interaction threads.
        </p>
      </div>

      <div className="max-w-md">
        <Input placeholder="Search conversation threads..." leftIcon={<Search className="h-4 w-4" />} />
      </div>

      <div className="space-y-3">
        {[
          { id: "conv-101", title: "Quarterly Financial Analysis Thread", user: "Finance Agent", time: "10 mins ago" },
          { id: "conv-102", title: "Customer Support Resolution #4902", user: "Support Bot", time: "1 hour ago" },
          { id: "conv-103", title: "Code Refactoring Architecture Sync", user: "Dev Ops Assistant", time: "3 hours ago" },
        ].map((conv) => (
          <div key={conv.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{conv.title}</p>
                <p className="text-xs text-muted-foreground">{conv.user} • {conv.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
