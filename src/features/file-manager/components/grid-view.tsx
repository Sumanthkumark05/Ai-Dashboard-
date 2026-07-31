"use client";

import * as React from "react";
import { FileItem } from "../types";
import { FileCard } from "./file-card";

export interface GridViewProps {
  files: FileItem[];
}

export function GridView({ files }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}
