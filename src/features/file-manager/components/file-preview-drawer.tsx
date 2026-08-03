"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
  Film,
  Archive,
  Folder,
  File,
  Download,
  Share2,
  Trash2,
  Star,
  Clock,
  HardDrive,
  User,
} from "lucide-react";

import { useFileStore } from "@/stores/file-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import { getInitials } from "@/constants";

const typeIconMap: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-10 w-10 text-danger" />,
  code: <FileCode className="h-10 w-10 text-info" />,
  doc: <FileText className="h-10 w-10 text-primary" />,
  image: <ImageIcon className="h-10 w-10 text-success" />,
  video: <Film className="h-10 w-10 text-purple-500" />,
  archive: <Archive className="h-10 w-10 text-warning" />,
  folder: <Folder className="h-10 w-10 text-amber-500 fill-amber-500/20" />,
};

export function FilePreviewDrawer() {
  const { selectedFile, isPreviewOpen, closePreviewDrawer, toggleFavoriteFile, deleteFile, downloadFile } = useFileStore();

  if (!selectedFile) return null;

  const handleDownload = async () => {
    try {
      toast.info("Preparing download...", { description: `Downloading ${selectedFile.name}` });
      await downloadFile(selectedFile.id, selectedFile.name);
      toast.success("Download completed", { description: `${selectedFile.name} saved successfully.` });
    } catch (err: unknown) {
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Could not download file payload.",
      });
    }
  };

  if (!selectedFile) return null;

  const icon = typeIconMap[selectedFile.type] || <File className="h-10 w-10 text-muted-foreground" />;
  const initials = getInitials(selectedFile.owner.name);

  return (
    <AnimatePresence>
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreviewDrawer}
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md border-l border-border bg-card p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {selectedFile.extension || selectedFile.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">File Details</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => toggleFavoriteFile(selectedFile.id)}
                    className="h-8 w-8 p-0"
                    aria-label="Toggle favorite"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        selectedFile.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={closePreviewDrawer}
                    className="h-8 w-8 p-0"
                    aria-label="Close drawer"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Large Graphic Preview Container */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 mb-6 text-center">
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-card border border-border shadow-sm">
                  {icon}
                </div>
                <h3 className="text-base font-bold text-foreground max-w-xs break-words">{selectedFile.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{selectedFile.size} • {selectedFile.status}</p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 className="h-3.5 w-3.5" />}
                  onClick={() =>
                    toast.info("Share link copied", { description: "Shareable link generated." })
                  }
                >
                  Share
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    deleteFile(selectedFile.id);
                    toast.info("File deleted");
                  }}
                >
                  Delete
                </Button>
              </div>

              <Separator className="my-4" />

              {/* Metadata Details List */}
              <div className="space-y-4 text-xs">
                <h4 className="font-semibold text-foreground text-sm">Information</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Owner:</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Avatar size="xs">
                      <AvatarImage src={selectedFile.owner.avatarUrl} alt={selectedFile.owner.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span>{selectedFile.owner.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5 text-primary" />
                    <span>Size:</span>
                  </div>
                  <div className="font-medium text-foreground font-mono">{selectedFile.size}</div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Created:</span>
                  </div>
                  <div className="font-medium text-foreground">{selectedFile.createdDate}</div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Modified:</span>
                  </div>
                  <div className="font-medium text-foreground">{selectedFile.modifiedDate}</div>
                </div>

                {/* Description */}
                {selectedFile.description && (
                  <div className="pt-2">
                    <span className="font-semibold text-foreground block mb-1">Description</span>
                    <p className="text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-md border border-border">
                      {selectedFile.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedFile.tags && selectedFile.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="font-semibold text-foreground block mb-1.5">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedFile.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" size="sm" className="text-[10px]">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
              NeuroDesk Cloud Knowledge Base Asset
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
