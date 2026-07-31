"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { EditorToolbar } from "./editor-toolbar";

export function DocumentEditor() {
  const { pages, selectedPageId, updatePageContent } = useWorkspaceStore();
  const editorRef = React.useRef<HTMLDivElement>(null);

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  // Sync initial content to contentEditable container
  React.useEffect(() => {
    if (editorRef.current && selectedPage) {
      if (editorRef.current.innerHTML !== selectedPage.content) {
        editorRef.current.innerHTML = selectedPage.content;
      }
    }
  }, [selectedPageId, selectedPage]);

  if (!selectedPage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground select-none">
        <p className="text-xs">Select a document from the workspace sidebar to view and edit notes.</p>
      </div>
    );
  }

  const handleFormatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      updatePageContent(selectedPage.id, editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      updatePageContent(selectedPage.id, editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16">
      {/* Formatting Toolbar */}
      <EditorToolbar onFormat={handleFormatCommand} />

      {/* Content Editable Canvas Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className="min-h-[450px] p-6 rounded-xl border border-border bg-card shadow-xs focus:outline-hidden text-foreground leading-relaxed text-sm tracking-normal prose dark:prose-invert max-w-none space-y-3"
      />
    </div>
  );
}
