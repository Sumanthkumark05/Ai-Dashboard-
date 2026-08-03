"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Shield,
  HardDrive,
  Sparkles,
  FileText,
  AlertTriangle,
  Save,
  UserPlus,
  Trash2,
  Check,
  ChevronLeft,
} from "lucide-react";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/feedback/toast";
import { workspaceApi, WorkspaceMember } from "@/services/workspace-api";

type SettingsTab = "general" | "members" | "storage" | "danger";

const ICON_OPTIONS = ["💼", "🚀", "🧪", "⚡", "📁", "🧠", "🎯", "🔒", "🌐", "💡"];
const COLOR_OPTIONS = ["#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B", "#6366F1", "#06B6D4", "#64748B"];
const ROLES = ["OWNER", "ADMIN", "EDITOR", "MEMBER", "VIEWER"];

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.id as string;

  const { workspaces, updateWorkspace, deleteWorkspace, fetchWorkspaces } = useWorkspaceContextStore();

  const [activeTab, setActiveTab] = React.useState<SettingsTab>("general");
  const [members, setMembers] = React.useState<WorkspaceMember[]>([]);

  // Form states
  const targetWs = workspaces.find((w) => w.id === workspaceId);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState("💼");
  const [color, setColor] = React.useState("#3B82F6");
  const [storageLimit, setStorageLimit] = React.useState(10240);
  const [isSaving, setIsSaving] = React.useState(false);



  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("MEMBER");

  React.useEffect(() => {
    if (targetWs) {
      setName(targetWs.name || "");
      setDescription(targetWs.description || "");
      setIcon(targetWs.icon || "💼");
      setColor(targetWs.color || "#3B82F6");
      setStorageLimit(targetWs.storage_limit || 10240);
    }
  }, [targetWs]);

  // Load members
  React.useEffect(() => {
    if (workspaceId) {
      workspaceApi.getMembers(workspaceId).then(setMembers).catch(() => {});
    }
  }, [workspaceId]);

  if (!targetWs) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-foreground">Workspace Not Found</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard/workspace-manager")}>
          Back to Workspaces
        </Button>
      </div>
    );
  }

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateWorkspace(workspaceId, {
        name,
        description,
        icon,
        color,
        storage_limit: storageLimit,
      });
      toast.success("Settings Saved!", { description: "Workspace metadata has been updated." });
    } catch (err: unknown) {
      toast.error("Failed to save settings", {
        description: err instanceof Error ? err.message : "An error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      const newMember = await workspaceApi.addMember(workspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMembers((prev) => [...prev, newMember]);
      toast.success("Member Invited!", { description: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail("");
      setIsInviteOpen(false);
    } catch (err: unknown) {
      toast.error("Invite Failed", {
        description: err instanceof Error ? err.message : "Could not add member.",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm("Remove this member from the workspace?")) {
      try {
        await workspaceApi.removeMember(workspaceId, memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success("Member Removed");
      } catch (err: unknown) {
        toast.error("Error removing member");
      }
    }
  };

  const handleDeleteWorkspace = async () => {
    if (confirm(`CRITICAL: Are you sure you want to permanently delete workspace '${targetWs.name}'?`)) {
      try {
        await deleteWorkspace(workspaceId);
        toast.success("Workspace Deleted");
        router.push("/dashboard/workspace-manager");
      } catch (err: unknown) {
        toast.error("Delete Failed");
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => router.push("/dashboard/workspace-manager")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Workspaces
          </Button>

          <span className="text-muted-foreground">/</span>

          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h1 className="text-xl font-bold text-foreground">{targetWs.name} Settings</h1>
          </div>
        </div>

        <Badge variant="outline" size="sm" className="font-mono text-xs">
          /{targetWs.slug}
        </Badge>
      </div>

      {/* Main Settings Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Settings Sidebar Navigation Tabs */}
        <div className="md:col-span-3 space-y-1">
          {[
            { id: "general", label: "General Settings", icon: Building2 },
            { id: "members", label: "Members & Roles", icon: Users },
            { id: "storage", label: "Storage & Limits", icon: HardDrive },
            { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? tab.danger
                      ? "bg-destructive/15 text-destructive font-bold"
                      : "bg-primary/10 text-primary font-bold shadow-2xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content Area */}
        <div className="md:col-span-9 border border-border rounded-2xl bg-card p-6 shadow-xs">
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <form onSubmit={handleSaveGeneral} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground">General Workspace Metadata</h3>
                <p className="text-xs text-muted-foreground">Configure display name, color theme, and description.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Workspace Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Workspace Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent p-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>

                {/* Icon Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Workspace Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={`h-9 w-9 rounded-xl text-base flex items-center justify-center border transition-all cursor-pointer ${
                          icon === i ? "border-primary bg-primary/15 shadow-xs scale-105" : "border-border hover:bg-accent"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Color Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Theme Accent Color</label>
                  <div className="flex items-center gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                          color === c ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: MEMBERS & ROLES */}
          {activeTab === "members" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Workspace Members</h3>
                  <p className="text-xs text-muted-foreground">Manage collaborator roles and send workspace invitations.</p>
                </div>

                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => setIsInviteOpen(true)}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Invite Member
                </Button>
              </div>

              {/* Members List Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-foreground font-semibold">
                    <tr>
                      <th className="p-3">Member User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          No additional members found in this workspace.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/20">
                          <td className="p-3 font-mono font-medium text-foreground">{m.user_id}</td>
                          <td className="p-3">
                            <Badge variant="secondary" size="sm" className="font-bold text-[10px]">
                              {m.role}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[11px] text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                              Active
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleRemoveMember(m.id)}
                              className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Invite Modal Dialog */}
              {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                  <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Invite Member to Workspace</h3>
                    <form onSubmit={handleInviteMember} className="space-y-3">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@neurodesk.ai"
                        required
                      />

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Role</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-border">
                        <Button variant="outline" size="xs" onClick={() => setIsInviteOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="xs" leftIcon={<UserPlus className="h-3.5 w-3.5" />}>
                          Send Invitation
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STORAGE & LIMITS */}
          {activeTab === "storage" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground">Storage Allocation & Quota</h3>
                <p className="text-xs text-muted-foreground">Monitor storage consumption across datasets, documents, and uploads.</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Used Storage</span>
                  <span className="font-mono text-primary">{targetWs.storage_used || 0} MB / {storageLimit} MB</span>
                </div>

                {/* Storage Bar */}
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all rounded-full"
                    style={{ width: `${Math.min(100, ((targetWs.storage_used || 0) / storageLimit) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE */}

          {activeTab === "danger" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
                <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Delete Workspace</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this workspace and all associated documents, AI conversations, and datasets.
                </p>
                <Button variant="destructive" size="xs" onClick={handleDeleteWorkspace} leftIcon={<Trash2 className="h-4 w-4" />}>
                  Delete Workspace
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
