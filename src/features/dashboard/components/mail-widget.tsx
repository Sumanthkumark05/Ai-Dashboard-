"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowRight, Clock, Star, Paperclip } from "lucide-react";
import { useMailStore } from "@/features/company-mail/store/mail-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MailWidget() {
  const { messages, selectMessage, openCompose } = useMailStore();

  const unreadCount = messages.filter((m) => m.is_unread).length;
  const invitesCount = messages.filter((m) => m.has_calendar_invite).length;
  const recentMessages = messages.slice(0, 3);

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Mail className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">Company Mail (Gmail)</CardTitle>
          </div>

          <Link href="/dashboard/company-mail">
            <Button variant="ghost" size="xs" className="gap-1 text-xs text-primary font-medium">
              <span>Inbox</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Telemetry Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg border border-border bg-muted/20">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Unread</span>
              <span className="text-base font-extrabold text-primary">{unreadCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Invites</span>
              <span className="text-base font-extrabold text-blue-500">{invitesCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total</span>
              <span className="text-base font-extrabold text-foreground">{messages.length}</span>
            </div>
          </div>

          {/* Recent Messages List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground block">Recent Emails</span>
              <Button variant="ghost" size="xs" onClick={openCompose} className="h-6 text-[10px] text-primary">
                Quick Reply
              </Button>
            </div>

            {recentMessages.length === 0 ? (
              <div className="p-3 rounded-lg border border-border bg-muted/10 text-xs text-muted-foreground italic text-center">
                No recent emails.
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => selectMessage(msg)}
                  className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-bold text-foreground truncate">{msg.sender_name}</h5>
                      {msg.is_unread && <Badge variant="info" size="xs">New</Badge>}
                    </div>
                    <p className="text-[11px] font-medium text-foreground truncate mt-0.5">{msg.subject}</p>
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {new Date(msg.received_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
