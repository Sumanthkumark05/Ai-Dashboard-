"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  Settings,
  UserPlus,
  Trash2,
  ExternalLink,
  Archive,
  Users,
  HardDrive,
  Calendar,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/forms/input";
import { toast } from "@/components/feedback/toast";
import { Workspace } from "@/services/workspace-api";

export default function WorkspaceManagerPage() {
  const router = useRouter();
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    fetchWorkspaces,
    deleteWorkspace,
    setCreateModalOpen,
    isLoading,
  } = useWorkspaceContextStore();

  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const filteredWorkspaces = React.useMemo(() => {
    if (!search.trim()) return workspaces;
    const q = search.toLowerCase();
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        w.slug.toLowerCase().includes(q)
    );
  }, [workspaces, search]);

  const handleOpenWorkspace = async (ws: Workspace) => {
    await setCurrentWorkspace(ws.id);
    toast.success(`Switched to '${ws.name}'`);
    router.push("/dashboard/workspace");
  };

  const handleDelete = async (ws: Workspace) => {
    if (confirm(`Are you sure you want to delete workspace '${ws.name}'? This action cannot be undone.`)) {
      try {
        await deleteWorkspace(ws.id);
        toast.success(`Workspace '${ws.name}' deleted.`);
      } catch (err: unknown) {
        toast.error("Failed to delete workspace", {
          description: err instanceof Error ? err.message : "An error occurred.",
        });
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace Manager</h1>
            <Badge variant="outline" size="sm" className="font-mono text-xs">
              {workspaces.length} Total
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your isolated tenant workspaces, member access, storage limits, and AI model configurations.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          className="rounded-xl shadow-sm self-start sm:self-auto"
        >
          Create Workspace
        </Button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces by name or slug..."
            leftIcon={<Search className="h-4 w-4" />}
            className="h-10 text-xs"
          />
        </div>
      </div>

      {/* Workspaces Grid View */}
      {isLoading && workspaces.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl border border-border bg-card/40 animate-pulse" />
          ))}
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No workspaces found</h3>
          <p className="text-xs text-muted-foreground max-w-md">
            {search ? "No workspaces match your search query." : "No workspaces found. Create your first workspace."}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkspaces.map((ws) => {
            const isActive = currentWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                className={`relative group rounded-2xl border bg-card p-5 shadow-xs transition-all flex flex-col justify-between hover:shadow-md ${
                  isActive ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                }`}
              >
                {/* Active Indicator Badge */}
                {isActive && (
                  <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                    Active Context
                  </span>
                )}

                <div className="space-y-3">
                  {/* Top Logo & Title */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-xs"
                      style={{
                        backgroundColor: ws.color ? `${ws.color}20` : "#3B82F620",
                        borderColor: ws.color ? `${ws.color}40` : "#3B82F640",
                        borderWidth: 1,
                      }}
                    >
                      {ws.icon || "💼"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground truncate">{ws.name}</h3>
                        <Badge variant="secondary" size="sm" className="text-[10px] uppercase font-bold py-0 h-4">
                          {ws.role || "OWNER"}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                        /{ws.slug}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[36px]">
                    {ws.description || "No description provided for this workspace environment."}
                  </p>

                  {/* Metadata Indicators */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{ws.member_count || 1} Members</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-info" />
                      <span>{ws.storage_used || 0} / {ws.storage_limit || 10240} MB</span>
                    </div>

                    <div className="flex items-center gap-1.5 col-span-2">
                      <Sparkles className="h-3.5 w-3.5 text-warning" />
                      <span className="truncate">{ws.default_model || "openai/gpt-oss-120b"}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border">
                  <Button
                    variant={isActive ? "primary" : "outline"}
                    size="xs"
                    onClick={() => handleOpenWorkspace(ws)}
                    leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                    className="flex-1 font-semibold"
                  >
                    {isActive ? "Opened" : "Open Workspace"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => router.push(`/dashboard/workspace-manager/${ws.id}/settings`)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Workspace Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDelete(ws)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Delete Workspace"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
