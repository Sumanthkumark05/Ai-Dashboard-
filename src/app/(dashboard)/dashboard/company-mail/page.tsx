"use client";

import * as React from "react";
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Trash2,
  Archive,
  Star,
  Tag,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Bot,
  Calendar as CalendarIcon,
  CheckCircle2,
  Paperclip,
  Download,
  FileUp,
  Reply,
  ReplyAll,
  Forward,
  LogOut,
  ShieldCheck,
  Building2,
  X,
} from "lucide-react";
import { useMailStore, MailFolder, MailCategory } from "@/features/company-mail/store/mail-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/feedback/toast";

export default function CompanyMailPage() {
  const {
    account,
    isConnected,
    messages,
    selectedMessage,
    activeFolder,
    activeCategory,
    searchQuery,
    isComposeOpen,
    isLoading,
    isAiProcessing,
    aiResult,
    setFolder,
    setCategory,
    setSearchQuery,
    selectMessage,
    openCompose,
    closeCompose,
    connectAccount,
    disconnectAccount,
    fetchMessages,
    sendMessage,
    toggleStar,
    markReadStatus,
    runAIAction,
    saveAttachmentToKnowledge,
  } = useMailStore();

  const { currentWorkspace } = useWorkspaceContextStore();

  const [toInput, setToInput] = React.useState("");
  const [ccInput, setCcInput] = React.useState("");
  const [subjectInput, setSubjectInput] = React.useState("");
  const [bodyInput, setBodyInput] = React.useState("");

  React.useEffect(() => {
    fetchMessages(currentWorkspace?.id);
  }, [activeFolder, activeCategory, currentWorkspace?.id, fetchMessages]);

  const filteredMessages = React.useMemo(() => {
    return messages.filter((m) => {
      if (activeFolder === "unread" && !m.is_unread) return false;
      if (activeFolder === "starred" && !m.is_starred) return false;
      if (activeFolder === "important" && !m.is_important) return false;
      if (activeFolder !== "unread" && activeFolder !== "starred" && activeFolder !== "important") {
        if (m.folder !== activeFolder) return false;
      }
      if (activeCategory !== "all" && m.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.subject.toLowerCase().includes(q) ||
          m.sender_email.toLowerCase().includes(q) ||
          m.sender_name.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, activeFolder, activeCategory, searchQuery]);

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toInput.trim()) {
      toast.error("Recipient required", { description: "Please enter a destination email address." });
      return;
    }
    try {
      await sendMessage({ to: toInput, cc: ccInput, subject: subjectInput, body: bodyInput });
      toast.success("Email Sent!", { description: `Message successfully sent to ${toInput} via Google Workspace API.` });
      setToInput("");
      setCcInput("");
      setSubjectInput("");
      setBodyInput("");
    } catch {
      toast.error("Send Failed", { description: "Could not send email via Google Workspace API." });
    }
  };

  const handleSaveToKnowledge = async (attId: string, filename: string) => {
    try {
      await saveAttachmentToKnowledge(attId);
      toast.success("Saved to Knowledge Repository!", {
        description: `Attachment '${filename}' indexed and saved to Documents.`,
      });
    } catch {
      toast.error("Failed to save attachment");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Company Mail
            </h1>
            <Badge variant="outline" size="sm" className="font-mono text-xs border-primary/30 text-primary">
              Google Workspace
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Secure, passwordless company Gmail synchronization, AI productivity features, and workspace task conversion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fetchMessages(currentWorkspace?.id)} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Sync
          </Button>

          <Button variant="primary" size="sm" onClick={openCompose} leftIcon={<Plus className="h-4 w-4" />}>
            Compose Mail
          </Button>
        </div>
      </div>

      {/* Account Connection Status Banner */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {account?.email || "employee@company.com"}
              </span>
              <Badge variant={isConnected ? "success" : "secondary"} size="xs">
                {isConnected ? "Connected (OAuth 2.0)" : "Disconnected"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Google Workspace Gmail API token active. Passwords are never stored.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Button variant="ghost" size="xs" onClick={disconnectAccount} className="text-xs text-destructive hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Disconnect
            </Button>
          ) : (
            <Button variant="primary" size="xs" onClick={() => connectAccount("user@company.com")}>
              Connect Google Account
            </Button>
          )}
        </div>
      </div>

      {/* Main Mail Interface - 3-Column / Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Folders Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase px-2 pb-2 block">Folders</span>

            {[
              { id: "inbox", label: "Inbox", icon: Inbox, count: messages.filter((m) => m.folder === "inbox").length },
              { id: "unread", label: "Unread", icon: Mail, count: messages.filter((m) => m.is_unread).length },
              { id: "starred", label: "Starred", icon: Star, count: messages.filter((m) => m.is_starred).length },
              { id: "sent", label: "Sent", icon: Send, count: messages.filter((m) => m.folder === "sent").length },
              { id: "drafts", label: "Drafts", icon: FileText, count: 0 },
              { id: "archive", label: "Archive", icon: Archive, count: 0 },
              { id: "trash", label: "Trash", icon: Trash2, count: 0 },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeFolder === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setFolder(item.id as MailFolder)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-accent/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <Badge variant={isActive ? "default" : "secondary"} size="xs">
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Categories Filter Box */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase px-1 block">Categories</span>
            <div className="flex flex-wrap gap-1.5">
              {["all", "primary", "updates", "promotions", "social"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat as MailCategory)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Email List & Reader View */}
        <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Email List Column */}
          <div className={`${selectedMessage ? "lg:col-span-5 hidden lg:block" : "lg:col-span-12"} space-y-3`}>
            {/* Search Bar */}
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails by sender, subject, or snippet..."
                leftIcon={<Search className="h-4 w-4" />}
                className="h-10 text-xs"
              />
            </div>

            {/* Email List Render */}
            {filteredMessages.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground italic">
                No emails found in this folder.
              </div>
            ) : (
              <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                {filteredMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        selectMessage(msg);
                        if (msg.is_unread) markReadStatus(msg.id, false);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : msg.is_unread
                          ? "border-border bg-card font-semibold shadow-2xs"
                          : "border-border/60 bg-card/60 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-bold text-foreground truncate">{msg.sender_name}</span>
                          {msg.is_unread && (
                            <Badge variant="info" size="xs">Unread</Badge>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(msg.id);
                          }}
                          className="text-muted-foreground hover:text-amber-500 transition-colors"
                        >
                          <Star className={`h-3.5 w-3.5 ${msg.is_starred ? "fill-amber-500 text-amber-500" : ""}`} />
                        </button>
                      </div>

                      <h4 className="text-xs font-semibold text-foreground truncate">{msg.subject}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{msg.snippet}</p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/40">
                        <div className="flex items-center gap-2">
                          {msg.has_attachments && (
                            <span className="flex items-center gap-0.5 text-primary">
                              <Paperclip className="h-3 w-3" />
                              Attachment
                            </span>
                          )}
                          {msg.has_calendar_invite && (
                            <span className="flex items-center gap-0.5 text-blue-500">
                              <CalendarIcon className="h-3 w-3" />
                              Invite
                            </span>
                          )}
                        </div>
                        <span className="font-mono">
                          {new Date(msg.received_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Reader View */}
          {selectedMessage && (
            <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="xs" onClick={() => selectMessage(null)} className="lg:hidden">
                      &larr; Back
                    </Button>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {selectedMessage.folder}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="xs" onClick={() => toggleStar(selectedMessage.id)}>
                      <Star className={`h-4 w-4 ${selectedMessage.is_starred ? "fill-amber-500 text-amber-500" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => toast.success("Email archived")}>
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => selectMessage(null)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Email Subject & Sender Info */}
                <div>
                  <h2 className="text-lg font-bold text-foreground leading-snug">{selectedMessage.subject}</h2>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                    <div>
                      <span className="text-xs font-bold text-foreground block">{selectedMessage.sender_name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">&lt;{selectedMessage.sender_email}&gt;</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(selectedMessage.received_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Email HTML Body */}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-xl border border-border/60 bg-muted/20 text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.body_html || selectedMessage.body_text || selectedMessage.snippet }}
                />

                {/* Attachments Section if applicable */}
                {selectedMessage.has_attachments && (
                  <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      Attachments (1)
                    </span>

                    <div className="flex items-center justify-between p-2 rounded-md border border-border bg-card text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">Project_Specification_Draft.pdf</span>
                        <span className="text-[10px] text-muted-foreground font-mono">(1.2 MB)</span>
                      </div>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleSaveToKnowledge(selectedMessage.id, "Project_Specification_Draft.pdf")}
                        leftIcon={<FileUp className="h-3 w-3" />}
                        className="text-[10px]"
                      >
                        Save to Knowledge
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Assistant Actions Panel (gpt-oss-120b) */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">AI Email Assistant (gpt-oss-120b)</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      isLoading={isAiProcessing}
                      onClick={() => runAIAction(selectedMessage.id, "summarize")}
                      className="text-xs bg-card"
                    >
                      Summarize Thread
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      isLoading={isAiProcessing}
                      onClick={() => runAIAction(selectedMessage.id, "generate_reply")}
                      className="text-xs bg-card"
                    >
                      Generate AI Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      isLoading={isAiProcessing}
                      onClick={() => runAIAction(selectedMessage.id, "extract_tasks")}
                      className="text-xs bg-card"
                    >
                      Extract Tasks
                    </Button>
                  </div>

                  {aiResult && (
                    <div className="p-3 rounded-lg border border-primary/30 bg-card text-xs text-foreground space-y-1 font-mono whitespace-pre-wrap">
                      {aiResult}
                    </div>
                  )}
                </div>
              </div>

              {/* Reader Action Footer */}
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button variant="outline" size="sm" leftIcon={<Reply className="h-4 w-4" />} onClick={openCompose}>
                  Reply
                </Button>
                <Button variant="outline" size="sm" leftIcon={<ReplyAll className="h-4 w-4" />} onClick={openCompose}>
                  Reply All
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Forward className="h-4 w-4" />} onClick={openCompose}>
                  Forward
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Mail Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Compose Company Email
              </h3>
              <Button variant="ghost" size="icon-sm" onClick={closeCompose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSendCompose} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">To</label>
                <Input
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="recipient@clientcompany.com"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">CC / BCC (Optional)</label>
                <Input
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  placeholder="manager@company.com"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Subject</label>
                <Input
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Project milestone update..."
                  className="h-9 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Message Body</label>
                <textarea
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  placeholder="Write your email here..."
                  rows={6}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={closeCompose}>
                  Discard
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isLoading} leftIcon={<Send className="h-4 w-4" />}>
                  Send Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
