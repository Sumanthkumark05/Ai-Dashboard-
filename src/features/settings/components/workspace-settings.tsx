"use client";

import * as React from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/forms/switch";
import { Label } from "@/components/forms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { toast } from "@/components/feedback/toast";

export function WorkspaceSettings() {
  const { workspace, updateWorkspace } = useSettingsStore();

  return (
    <Card className="p-6 space-y-6 select-none">
      <div className="border-b border-border pb-4">
        <h3 className="text-base font-bold text-foreground">Workspace Preferences</h3>
        <p className="text-xs text-muted-foreground">Customize default page views, editor formatting, and auto-save options</p>
      </div>

      <div className="space-y-4">
        {/* Default View Selector */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-semibold text-xs">Default Workspace Directory View</Label>
            <p className="text-[11px] text-muted-foreground">Default layout when opening workspace directory</p>
          </div>
          <Select
            value={workspace.defaultView}
            onValueChange={(val) => updateWorkspace({ defaultView: val as "tree" | "list" | "grid" })}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="tree">Tree View</SelectItem>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="grid">Grid View</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Page Selector */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <Label className="font-semibold text-xs">Start Landing Page</Label>
            <p className="text-[11px] text-muted-foreground">Initial dashboard page to load upon user login</p>
          </div>
          <Select
            value={workspace.startPage}
            onValueChange={(val) => updateWorkspace({ startPage: val as "dashboard" | "workspace" | "ai-assistant" })}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Start Page" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="dashboard">Dashboard Home</SelectItem>
              <SelectItem value="workspace">Workspace</SelectItem>
              <SelectItem value="ai-assistant">AI Assistant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto Save Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <Label className="font-semibold text-xs">Auto-Save Document Notes</Label>
            <p className="text-[11px] text-muted-foreground">Automatically persist note edits every 2 seconds</p>
          </div>
          <Switch
            checked={workspace.autoSave}
            onCheckedChange={(checked) => {
              updateWorkspace({ autoSave: checked });
              toast.info(`Auto-save ${checked ? "enabled" : "disabled"}`);
            }}
          />
        </div>

        {/* Line Numbers Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <Label className="font-semibold text-xs">Show Code Line Numbers</Label>
            <p className="text-[11px] text-muted-foreground">Display gutter line numbers inside code blocks</p>
          </div>
          <Switch
            checked={workspace.showLineNumbers}
            onCheckedChange={(checked) => {
              updateWorkspace({ showLineNumbers: checked });
              toast.info(`Line numbers ${checked ? "visible" : "hidden"}`);
            }}
          />
        </div>

        {/* Document Width */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <Label className="font-semibold text-xs">Document Editor Width</Label>
            <p className="text-[11px] text-muted-foreground">Max width boundary for document writing area</p>
          </div>
          <Select
            value={workspace.documentWidth}
            onValueChange={(val) => updateWorkspace({ documentWidth: val as "narrow" | "default" | "full" })}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Width" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="narrow">Narrow (600px)</SelectItem>
              <SelectItem value="default">Default (800px)</SelectItem>
              <SelectItem value="full">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
