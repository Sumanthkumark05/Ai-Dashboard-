"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Settings, Check, Building2 } from "lucide-react";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/navigation/dropdown";
import { toast } from "@/components/feedback/toast";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    fetchWorkspaces,
    setCreateModalOpen,
  } = useWorkspaceContextStore();

  React.useEffect(() => {
    fetchWorkspaces();

    const handleWorkspaceChanged = () => {
      fetchWorkspaces();
    };

    window.addEventListener("neurodesk:workspace_changed", handleWorkspaceChanged);
    return () => {
      window.removeEventListener("neurodesk:workspace_changed", handleWorkspaceChanged);
    };
  }, [fetchWorkspaces]);

  const activeWs = currentWorkspace || workspaces[0];

  const handleSelectWorkspace = async (id: string, name: string) => {
    if (activeWs?.id === id) return;
    await setCurrentWorkspace(id);
    toast.success("Workspace Switched", {
      description: `Active context set to '${name}'. All modules updated.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Switch active workspace"
          className="flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-3 hover:bg-accent/60 transition-colors cursor-pointer select-none shrink-0 max-w-[200px] sm:max-w-[240px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white shadow-2xs"
            style={{ backgroundColor: activeWs?.color || "#3B82F6" }}
          >
            {activeWs?.icon || "💼"}
          </div>

          <span className="text-xs font-semibold text-foreground truncate flex-1 text-left">
            {activeWs?.name || "Select Workspace"}
          </span>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold flex items-center justify-between">
          <span>Workspaces</span>
          <span className="text-[10px] font-mono opacity-70">{workspaces.length} Available</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup className="max-h-60 overflow-y-auto">
          {workspaces.map((ws) => {
            const isSelected = activeWs?.id === ws.id;
            return (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id, ws.name)}
                className="flex items-center justify-between cursor-pointer py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-medium shadow-2xs"
                    style={{ backgroundColor: ws.color ? `${ws.color}25` : "#3B82F625", color: ws.color || "#3B82F6" }}
                  >
                    {ws.icon || "💼"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">{ws.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate font-mono">
                      {ws.role || "Member"} • {ws.member_count || 1} members
                    </span>
                  </div>
                </div>

                {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setCreateModalOpen(true)}
            className="cursor-pointer text-primary font-medium flex items-center gap-2 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workspace</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push("/dashboard/workspace-manager")}
            className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2 py-2"
          >
            <Building2 className="h-4 w-4" />
            <span>Manage Workspaces</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
