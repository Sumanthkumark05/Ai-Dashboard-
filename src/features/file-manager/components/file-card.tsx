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

const typeIconMap: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-6 w-6 text-danger" />,
  code: <FileCode className="h-6 w-6 text-info" />,
  doc: <FileText className="h-6 w-6 text-primary" />,
  image: <ImageIcon className="h-6 w-6 text-success" />,
  video: <Film className="h-6 w-6 text-purple-500" />,
  archive: <Archive className="h-6 w-6 text-warning" />,
  folder: <Folder className="h-6 w-6 text-amber-500 fill-amber-500/20" />,
};

export interface FileCardProps {
  file: FileItem;
}

export function FileCard({ file }: FileCardProps) {
  const { openPreviewDrawer, toggleFavoriteFile, deleteFile, duplicateFile, renameFile } = useFileStore();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState(file.name);

  const icon = typeIconMap[file.type] || <File className="h-6 w-6 text-muted-foreground" />;
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -3 }}
    >
      <Card
        onClick={() => openPreviewDrawer(file)}
        className="p-4 flex flex-col justify-between h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer select-none group relative"
      >
        {/* Header Controls */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
            {icon}
          </div>

          <div className="flex items-center gap-1">
            {/* Star Favorite Toggle */}
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteFile(file.id);
              }}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-warning"
              aria-label={file.isFavorite ? "Unfavorite file" : "Favorite file"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  file.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground opacity-60"
                )}
              />
            </Button>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success("Download started", { description: `Downloading ${file.name}` });
                  }}
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
        <div className="mb-4">
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
              className="w-full text-xs font-semibold rounded border border-primary px-1 py-0.5"
            />
          ) : (
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {file.name}
            </h4>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{file.size}</span>
            <span>•</span>
            <span>{file.modifiedDate}</span>
          </div>
        </div>

        {/* Owner & Status Badge Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            <Avatar size="xs">
              <AvatarImage src={file.owner.avatarUrl} alt={file.owner.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground truncate max-w-[90px]">{file.owner.name}</span>
          </div>

          <Badge variant={file.status === "Synced" ? "success" : "warning"} size="sm" className="text-[10px]">
            {file.status}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}
