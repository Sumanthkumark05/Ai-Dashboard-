"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/feedback/tooltip";

export interface EditorToolbarProps {
  onFormat: (command: string, value?: string) => void;
}

export function EditorToolbar({ onFormat }: EditorToolbarProps) {
  const tools = [
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Underline", icon: Underline, command: "underline" },
    { label: "Heading 1", icon: Heading1, command: "formatBlock", value: "<h1>" },
    { label: "Heading 2", icon: Heading2, command: "formatBlock", value: "<h2>" },
    { label: "Heading 3", icon: Heading3, command: "formatBlock", value: "<h3>" },
    { label: "Bullet List", icon: List, command: "insertUnorderedList" },
    { label: "Numbered List", icon: ListOrdered, command: "insertOrderedList" },
    { label: "Quote", icon: Quote, command: "formatBlock", value: "<blockquote>" },
    { label: "Code Block", icon: Code, command: "formatBlock", value: "<pre>" },
    { label: "Divider", icon: Minus, command: "insertHorizontalRule" },
  ];

  return (
    <div className="sticky top-0 z-20 flex items-center gap-1 p-1.5 rounded-lg border border-border bg-card/90 backdrop-blur-xs mb-4 overflow-x-auto shadow-xs select-none">
      <TooltipProvider delayDuration={200}>
        {tools.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onFormat(item.command, item.value)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <IconComp className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
