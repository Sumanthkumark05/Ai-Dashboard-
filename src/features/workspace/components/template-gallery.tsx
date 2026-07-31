"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";

export function TemplateGallery() {
  const { createFromTemplate } = useWorkspaceStore();

  const templates = [
    { label: "Meeting Notes", icon: "📝" },
    { label: "Project Plan", icon: "🚀" },
    { label: "Research Notes", icon: "🔬" },
    { label: "Daily Journal", icon: "📔" },
    { label: "Brainstorm", icon: "💡" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 mb-4 select-none no-scrollbar">
      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Templates:
      </span>

      {templates.map((tpl) => (
        <Button
          key={tpl.label}
          variant="outline"
          size="xs"
          onClick={() => createFromTemplate(tpl.label)}
          className="shrink-0 text-xs gap-1.5 h-7 bg-card hover:bg-accent"
        >
          <span>{tpl.icon}</span>
          <span>{tpl.label}</span>
        </Button>
      ))}
    </div>
  );
}
