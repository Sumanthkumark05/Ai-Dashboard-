"use client";

import * as React from "react";
import { FileCode, FileText, Image as ImageIcon, Archive, File } from "lucide-react";
import { recentFilesData } from "../mock/dashboard-mock-data";
import { RecentFile } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/display/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/constants";

const fileIconMap: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-danger" />,
  code: <FileCode className="h-4 w-4 text-info" />,
  doc: <FileText className="h-4 w-4 text-primary" />,
  image: <ImageIcon className="h-4 w-4 text-success" />,
  archive: <Archive className="h-4 w-4 text-warning" />,
};

export function RecentFiles() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Recent Workspace Files</h4>
          <p className="text-xs text-muted-foreground">Latest documents, code datasets, and model weights</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentFilesData.map((file: RecentFile) => {
            const icon = fileIconMap[file.type] || <File className="h-4 w-4 text-muted-foreground" />;
            const initials = getInitials(file.owner.name);

            return (
              <TableRow key={file.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    {icon}
                    <span className="truncate max-w-[200px] sm:max-w-[280px]">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="xs">
                      <AvatarImage src={file.owner.avatarUrl} alt={file.owner.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{file.owner.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{file.size}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{file.lastModified}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      file.status === "Synced"
                        ? "success"
                        : file.status === "Processing"
                        ? "warning"
                        : "secondary"
                    }
                    size="sm"
                  >
                    {file.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
