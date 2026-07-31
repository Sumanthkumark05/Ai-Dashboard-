"use client";

import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Documents Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise knowledge base, vector embeddings, and indexed documentation.
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Upload Document
        </Button>
      </div>

      <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-3 bg-card">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-base font-semibold text-foreground">Knowledge Repository</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Upload PDF, Markdown, or DOCX files to automatically chunk and embed them for your AI agents.
        </p>
      </div>
    </div>
  );
}
