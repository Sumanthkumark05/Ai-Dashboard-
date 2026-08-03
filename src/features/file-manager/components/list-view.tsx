"use client";

import * as React from "react";
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
  Trash2,
} from "lucide-react";

import { FileItem } from "../types";
import { useFileStore } from "@/stores/file-store";
import { getInitials } from "@/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/display/table";
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

const typeIconMap: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-danger" />,
  code: <FileCode className="h-4 w-4 text-info" />,
  doc: <FileText className="h-4 w-4 text-primary" />,
  image: <ImageIcon className="h-4 w-4 text-success" />,
  video: <Film className="h-4 w-4 text-purple-500" />,
  archive: <Archive className="h-4 w-4 text-warning" />,
  folder: <Folder className="h-4 w-4 text-amber-500 fill-amber-500/20" />,
};

export interface ListViewProps {
  files: FileItem[];
}

export function ListView({ files }: ListViewProps) {
  const { openPreviewDrawer, toggleFavoriteFile, deleteFile, duplicateFile, downloadFile } = useFileStore();

  const handleDownloadFile = async (e: React.MouseEvent, fileId: string, fileName: string) => {
    e.stopPropagation();
    try {
      toast.info("Preparing download...", { description: `Downloading ${fileName}` });
      await downloadFile(fileId, fileName);
      toast.success("Download completed", { description: `${fileName} saved successfully.` });
    } catch (err: unknown) {
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Could not download file payload.",
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30px]"></TableHead>
          <TableHead>File Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Last Modified</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file: FileItem) => {
          const icon = typeIconMap[file.type] || <File className="h-4 w-4 text-muted-foreground" />;
          const initials = getInitials(file.owner.name);

          return (
            <TableRow
              key={file.id}
              onClick={() => openPreviewDrawer(file)}
              className="cursor-pointer group"
            >
              {/* Star Favorite */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleFavoriteFile(file.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-warning"
                  aria-label={file.isFavorite ? "Unfavorite" : "Favorite"}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      file.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground opacity-40"
                    )}
                  />
                </Button>
              </TableCell>

              {/* Name & Icon */}
              <TableCell className="font-medium">
                <div className="flex items-center gap-2.5">
                  {icon}
                  <span className="truncate max-w-[200px] sm:max-w-[300px] group-hover:text-primary transition-colors">
                    {file.name}
                  </span>
                </div>
              </TableCell>

              {/* Extension/Type */}
              <TableCell className="text-xs uppercase font-mono text-muted-foreground">
                {file.extension || file.type}
              </TableCell>

              {/* Owner */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar size="xs">
                    <AvatarImage src={file.owner.avatarUrl} alt={file.owner.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{file.owner.name}</span>
                </div>
              </TableCell>

              {/* Size */}
              <TableCell className="text-xs text-muted-foreground font-mono">{file.size}</TableCell>

              {/* Last Modified */}
              <TableCell className="text-xs text-muted-foreground">{file.modifiedDate}</TableCell>

              {/* Status */}
              <TableCell>
                <Badge variant={file.status === "Synced" ? "success" : "warning"} size="sm">
                  {file.status}
                </Badge>
              </TableCell>

              {/* Dropdown Menu Actions */}
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => {
                        duplicateFile(file.id);
                        toast.success("File duplicated");
                      }}
                      className="cursor-pointer text-xs"
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      <span>Duplicate</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDownloadFile(e, file.id, file.name)}
                      className="cursor-pointer text-xs"
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      <span>Download</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        toast.info("Share link copied", { description: "Shareable link generated." })
                      }
                      className="cursor-pointer text-xs"
                    >
                      <Share2 className="mr-2 h-3.5 w-3.5" />
                      <span>Share</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
