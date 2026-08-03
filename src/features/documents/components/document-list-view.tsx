"use client";

import * as React from "react";
import { Download, Trash2, Star, Sparkles, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocumentItem } from "@/services/documents-api";
import { useDocumentStore } from "@/stores/document-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { formatBytes } from "@/lib/utils";
import { getDocumentIcon } from "./document-grid-view";
import { toast } from "@/components/feedback/toast";

interface DocumentListViewProps {
  documents: DocumentItem[];
}

export function DocumentListView({ documents }: DocumentListViewProps) {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { downloadDocument, deleteDocument, toggleFavorite } = useDocumentStore();

  const handleDownload = async (doc: DocumentItem) => {
    try {
      toast.info("Downloading Document", { description: `Preparing '${doc.original_file_name || doc.title}'...` });
      await downloadDocument(doc.id, doc.original_file_name || doc.file_name, currentWorkspace?.id);
    } catch {
      toast.error("Download Failed", { description: "Could not retrieve document file." });
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    try {
      await deleteDocument(doc.id, currentWorkspace?.id);
      toast.success("Document Deleted", { description: `'${doc.title}' removed.` });
    } catch {
      toast.error("Delete Failed", { description: "Could not delete document." });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
            <tr>
              <th className="p-3 w-8 text-center"></th>
              <th className="p-3">Document Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Size</th>
              <th className="p-3">AI Processing</th>
              <th className="p-3">Uploaded Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((doc) => {
              const iconConfig = getDocumentIcon(doc.file_extension, doc.mime_type);
              const IconComponent = iconConfig.icon;

              return (
                <tr key={doc.id} className="hover:bg-accent/40 transition-colors group">
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleFavorite(doc.id)}
                      className="text-muted-foreground hover:text-amber-500"
                    >
                      <Star className={`h-4 w-4 ${doc.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${iconConfig.color} shrink-0`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-2xs text-muted-foreground font-mono truncate max-w-xs">
                          {doc.original_file_name || doc.file_name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 capitalize text-muted-foreground font-medium">
                    {doc.category || "Uncategorized"}
                  </td>

                  <td className="p-3 font-mono text-muted-foreground">
                    {formatBytes(doc.file_size)}
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-3xs px-1.5 py-0.5 border-primary/20 text-primary">
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Vector Indexed
                      </Badge>
                      {doc.status === "ready" || doc.processing_status === "completed" ? (
                        <span className="text-2xs text-emerald-500 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-2xs text-amber-500 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3 animate-spin" /> Processing
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-muted-foreground">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Recently"}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
