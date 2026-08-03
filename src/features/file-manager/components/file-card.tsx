"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Film,
  Archive,
  Folder,
  File,
  Star,
  MoreVertical,
  Download,
  Share2,
  Copy,
  Edit2,
  Trash2,
} from "lucide-react";

import { FileItem } from "../types";
import { useFileStore } from "@/stores/file-store";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/navigation/dropdown";
import { toast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import { getInitials } from "@/constants";

const typeIconMap: Record<string, { icon: React.ReactNode; bgClass: string }> = {
  pdf: {
    icon: <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />,
    bgClass: "bg-red-50 dark:bg-red-950/40 border-red-200/50 dark:border-red-900/50",
  },
  code: {
    icon: <FileCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    bgClass: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-900/50",
  },
  doc: {
    icon: <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
    bgClass: "bg-sky-50 dark:bg-sky-950/40 border-sky-200/50 dark:border-sky-900/50",
  },
  image: {
    icon: <ImageIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/50",
  },
  video: {
    icon: <Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    bgClass: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/50 dark:border-purple-900/50",
  },
  archive: {
    icon: <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    bgClass: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/50",
  },
  folder: {
    icon: <Folder className="h-5 w-5 text-amber-500 fill-amber-500/20" />,
    bgClass: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/50",
  },
};

export interface FileCardProps {
  file: FileItem;
}

export function FileCard({ file }: FileCardProps) {
  const { openPreviewDrawer, toggleFavoriteFile, deleteFile, duplicateFile, renameFile, downloadFile } = useFileStore();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState(file.name);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.info("Preparing download...", { description: `Downloading ${file.name}` });
      await downloadFile(file.id, file.name);
      toast.success("Download completed", { description: `${file.name} saved successfully.` });
    } catch (err: unknown) {
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Could not download file payload.",
      });
    }
  };

  const typeConfig = typeIconMap[file.type] || {
    icon: <File className="h-5 w-5 text-muted-foreground" />,
    bgClass: "bg-muted border-border",
  };
  const initials = getInitials(file.owner.name);

  const handleSaveRename = () => {
    if (newName.trim()) {
      renameFile(file.id, newName.trim());
      toast.success("File renamed");
    }
    setIsRenaming(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -2 }}
    >
      <Card
        onClick={() => openPreviewDrawer(file)}
        className="p-4 flex flex-col justify-between h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer select-none group relative"
      >
        {/* Header Controls */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", typeConfig.bgClass)}>
            {typeConfig.icon}
          </div>

          <div className="flex items-center gap-0.5">
            {/* Star Favorite Toggle */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteFile(file.id);
              }}
              className="text-muted-foreground hover:text-amber-500"
              aria-label={file.isFavorite ? "Unfavorite file" : "Favorite file"}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  file.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50"
                )}
              />
            </Button>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Edit2 className="mr-2 h-3.5 w-3.5" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateFile(file.id);
                    toast.success("File duplicated");
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownload}
                  className="cursor-pointer text-xs"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info("Share link copied", { description: "Shareable workspace link created." });
                  }}
                  className="cursor-pointer text-xs"
                >
                  <Share2 className="mr-2 h-3.5 w-3.5" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.id);
                    toast.info("File deleted");
                  }}
                  className="cursor-pointer text-xs text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* File Name & Metadata */}
        <div className="mb-3">
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              onBlur={handleSaveRename}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="w-full text-xs font-semibold rounded-md border border-primary px-2 py-1 bg-background"
            />
          ) : (
            <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {file.name}
            </h4>
          )}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
            <span>{file.size}</span>
            <span>•</span>
            <span>{file.modifiedDate}</span>
          </div>
        </div>

        {/* Owner & Status Badge Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5">
            <Avatar size="xs">
              <AvatarImage src={file.owner.avatarUrl} alt={file.owner.name} />
              <AvatarFallback className="text-[9px] font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-[11px] truncate max-w-[85px]">{file.owner.name}</span>
          </div>

          <Badge variant={file.status === "Synced" ? "success" : "warning"} size="xs">
            {file.status}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}
