"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowRight, Paperclip, Calendar as CalendarIcon, Star, CheckCircle2 } from "lucide-react";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { useMailStore } from "@/features/company-mail/store/mail-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function WorkspaceMailTab() {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { messages, selectMessage } = useMailStore();

  const workspaceEmails = React.useMemo(() => {
    if (!currentWorkspace) return messages;
    return messages.filter(
      (m) =>
        m.workspace_id === currentWorkspace.id ||
        (m.subject && m.subject.toLowerCase().includes(currentWorkspace.name.toLowerCase()))
    );
  }, [messages, currentWorkspace]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Workspace Emails &amp; Communications
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synchronized emails, client communications, attachments, and meeting invites for {currentWorkspace?.name || "this workspace"}.
          </p>
        </div>

        <Link href="/dashboard/company-mail">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <span>Open Company Mail</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {workspaceEmails.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl italic">
          No synchronized emails found for this workspace yet.
        </div>
      ) : (
        <div className="space-y-3">
          {workspaceEmails.map((msg) => (
            <div
              key={msg.id}
              onClick={() => selectMessage(msg)}
              className="p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{msg.sender_name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">&lt;{msg.sender_email}&gt;</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(msg.received_at).toLocaleDateString()}
                </span>
              </div>

              <h4 className="text-xs font-bold text-foreground">{msg.subject}</h4>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{msg.snippet}</p>

              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Badge variant="outline" className="text-[10px] uppercase">{msg.category}</Badge>
                {msg.has_attachments && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Paperclip className="h-3 w-3" />
                    Attachment
                  </Badge>
                )}
                {msg.has_calendar_invite && (
                  <Badge variant="info" className="text-[10px] gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Calendar Invite
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
