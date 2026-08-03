"use client";

import * as React from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  MoreVertical,
  Download,
  Trash2,
  Star,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentItem } from "@/services/documents-api";
import { useDocumentStore } from "@/stores/document-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { formatBytes } from "@/lib/utils";
import { toast } from "@/components/feedback/toast";

export function getDocumentIcon(ext: string, mime: string) {
  const e = (ext || "").toLowerCase();
  const m = (mime || "").toLowerCase();

  if (e === "pdf" || m.includes("pdf")) {
    return { icon: FileText, color: "text-red-500 bg-red-500/10 border-red-500/20" };
  }
  if (["doc", "docx"].includes(e) || m.includes("word")) {
    return { icon: FileText, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
  }
  if (["xls", "xlsx", "csv"].includes(e) || m.includes("excel") || m.includes("csv")) {
    return { icon: FileSpreadsheet, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
  }
  if (["json", "md", "txt", "html", "xml"].includes(e) || m.includes("text") || m.includes("json")) {
    return { icon: FileCode, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
  }
  return { icon: FileText, color: "text-primary bg-primary/10 border-primary/20" };
}

interface DocumentGridViewProps {
  documents: DocumentItem[];
}

export function DocumentGridView({ documents }: DocumentGridViewProps) {
  const { currentWorkspace } = useWorkspaceContextStore();
  const { downloadDocument, deleteDocument, toggleFavorite } = useDocumentStore();
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

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
      toast.success("Document Deleted", { description: `'${doc.title}' removed from Knowledge Repository.` });
    } catch {
      toast.error("Delete Failed", { description: "Could not delete document." });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => {
        const iconConfig = getDocumentIcon(doc.file_extension, doc.mime_type);
        const IconComponent = iconConfig.icon;
        const isMenuOpen = activeMenuId === doc.id;

        return (
          <div
            key={doc.id}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/50 transition-all"
          >
            {/* Card Top Row */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconConfig.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavorite(doc.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-amber-500 transition-colors"
                    title={doc.is_favorite ? "Unfavorite" : "Favorite"}
                  >
                    <Star className={`h-4 w-4 ${doc.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(isMenuOpen ? null : doc.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-7 z-20 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg text-xs"
                        onMouseLeave={() => setActiveMenuId(null)}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            handleDownload(doc);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-foreground hover:bg-accent text-left"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            handleDelete(doc);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-destructive hover:bg-destructive/10 text-left font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Category */}
              <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {doc.title}
              </h3>
              <p className="text-2xs text-muted-foreground truncate mt-0.5 font-mono">
                {doc.original_file_name || doc.file_name}
              </p>
            </div>

            {/* Card Footer Metadata */}
            <div className="mt-4 pt-3 border-t border-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground text-2xs">
                <span>{formatBytes(doc.file_size)}</span>
                <span className="capitalize">{doc.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-3xs px-1.5 py-0.5 flex items-center gap-1 border-primary/20 text-primary">
                  <Sparkles className="h-2.5 w-2.5" /> Indexed
                </Badge>

                {doc.status === "ready" || doc.processing_status === "completed" ? (
                  <span className="text-2xs text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                ) : doc.status === "processing" ? (
                  <span className="text-2xs text-amber-500 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 animate-spin" /> Processing
                  </span>
                ) : (
                  <span className="text-2xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Failed
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
