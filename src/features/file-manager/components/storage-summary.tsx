"use client";

import * as React from "react";
import { HardDrive, FileText, Image as ImageIcon, Code, Archive } from "lucide-react";
import { fileStorageSummary } from "../mock/file-mock-data";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/feedback/progress";
import { Badge } from "@/components/ui/badge";

export function StorageSummary() {
  const remainingGB = (fileStorageSummary.totalGB - fileStorageSummary.usedGB).toFixed(1);

  return (
    <Card className="p-5 mb-6 bg-gradient-to-r from-card via-card to-primary/5 border-primary/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Workspace Storage Capacity</h4>
            <p className="text-xs text-muted-foreground">
              {fileStorageSummary.usedGB} GB of {fileStorageSummary.totalGB} GB used ({fileStorageSummary.percentage}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Badge variant="outline" className="gap-1.5 py-1">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Docs: {fileStorageSummary.documentsGB} GB</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1">
            <ImageIcon className="h-3.5 w-3.5 text-success" />
            <span>Media: {fileStorageSummary.mediaGB} GB</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1">
            <Code className="h-3.5 w-3.5 text-info" />
            <span>Code: {fileStorageSummary.codeGB} GB</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1">
            <Archive className="h-3.5 w-3.5 text-warning" />
            <span>Backups: {fileStorageSummary.backupsGB} GB</span>
          </Badge>
        </div>
      </div>

      <Progress value={fileStorageSummary.percentage} className="h-2 mb-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{fileStorageSummary.percentage}% used</span>
        <span className="font-semibold text-foreground">{remainingGB} GB remaining space</span>
      </div>
    </Card>
  );
}
