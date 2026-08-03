"use client";

import * as React from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Download,
  Database,
  LayoutGrid,
  List,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/forms/input";
import { toast } from "@/components/feedback/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/display/table";
import { DatasetItem, datasetsApi } from "@/services/datasets-api";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { useDatasetStore } from "@/stores/dataset-store";
import { DatasetUploadModal } from "@/components/workspace/dataset-upload-modal";

export default function DatasetsPage() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContextStore();

  const {
    datasets,
    setDatasets,
    removeDataset,
    searchQuery,
    setSearchQuery,
    selectedFormat,
    setSelectedFormat,
    viewMode,
    setViewMode,
    setUploadModalOpen,
  } = useDatasetStore();

  // 1. React Query Integration: Fetch datasets from PostgreSQL
  const { data: queryData, isLoading, isError, error } = useQuery({
    queryKey: ["datasets", currentWorkspace?.id],
    queryFn: async () => {
      const res = await datasetsApi.listDatasets(currentWorkspace?.id);
      return res.items || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  // Sync React Query data into Zustand store whenever query succeeds
  React.useEffect(() => {
    if (queryData) {
      setDatasets(queryData);
    }
  }, [queryData, setDatasets]);

  // Handle error reporting
  React.useEffect(() => {
    if (isError && error) {
      toast.error("Failed to load datasets", {
        description: error instanceof Error ? error.message : "Error fetching workspace datasets.",
      });
    }
  }, [isError, error]);

  const handleDeleteDataset = async (id: string, name: string) => {
    try {
      await datasetsApi.deleteDataset(id, currentWorkspace?.id);

      // Immediately update Zustand store
      removeDataset(id);

      // Invalidate React Query cache
      await queryClient.invalidateQueries({ queryKey: ["datasets"] });
      await queryClient.invalidateQueries({ queryKey: ["workspace-storage"] });
      await queryClient.invalidateQueries({ queryKey: ["dataset-stats"] });

      toast.info("Dataset Deleted", { description: `'${name}' removed from workspace.` });
    } catch (err: unknown) {
      toast.error("Delete Failed", { description: err instanceof Error ? err.message : "Error deleting dataset." });
    }
  };

  const handleDownloadDataset = (name: string) => {
    toast.success("Download started", { description: `Downloading ${name}` });
  };

  // Filter datasets by search query and format filter
  const filteredDatasets = (datasets || []).filter((ds: DatasetItem) => {
    const matchesSearch =
      !searchQuery ||
      ds.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (ds.description && ds.description.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (ds.file_name && ds.file_name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    const matchesFormat =
      selectedFormat === "all" || (ds.dataset_type || "").toLowerCase() === selectedFormat.toLowerCase();

    return matchesSearch && matchesFormat;
  });

  const totalStorageBytes = (datasets || []).reduce((acc: number, d: DatasetItem) => acc + (d.file_size || 0), 0);
  const totalRecords = (datasets || []).reduce((acc: number, d: DatasetItem) => acc + (d.record_count || 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in select-none">
      {/* Upload Modal Component */}
      <DatasetUploadModal />

      {/* Header & Overview Banner */}
      <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary text-2xl shadow-xs">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Datasets & RAG Knowledge Base</h1>
              <p className="text-xs text-muted-foreground">
                Workspace /{currentWorkspace?.slug || "default"} • Direct AI vector training & tabular data repository.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="rounded-xl shadow-xs cursor-pointer"
            >
              Upload Dataset
            </Button>
          </div>
        </div>

        {/* Workspace Analytics Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs">
            <div className="text-muted-foreground text-[10px] uppercase font-semibold">Total Datasets</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{datasets.length}</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs">
            <div className="text-muted-foreground text-[10px] uppercase font-semibold">Indexed Records</div>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">{totalRecords.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs">
            <div className="text-muted-foreground text-[10px] uppercase font-semibold">Storage Used</div>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">
              {(totalStorageBytes / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs">
            <div className="text-muted-foreground text-[10px] uppercase font-semibold">RAG Pipeline</div>
            <div className="text-xl font-bold text-success mt-0.5 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full sm:w-80">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets by name, description, or filename..."
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="text-xs"
            />
          </div>

          {/* Format Selector & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border overflow-x-auto">
              {["all", "csv", "json", "parquet", "pdf", "docx", "xlsx", "zip", "txt", "png"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                    selectedFormat === fmt
                      ? "bg-card text-foreground shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-card text-foreground shadow-2xs border border-border" : "text-muted-foreground"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list" ? "bg-card text-foreground shadow-2xs border border-border" : "text-muted-foreground"
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Datasets Display */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading workspace datasets from PostgreSQL...</div>
      ) : filteredDatasets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">No datasets found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Upload CSV, JSON, Parquet, PDF, DOCX, XLSX, ZIP, or PNG datasets for vector training & analytics.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="rounded-xl shadow-xs"
          >
            Upload First Dataset
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasets.map((ds: DatasetItem) => (
            <div
              key={ds.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 shadow-2xs space-y-3 group transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-500 shrink-0" />
                  <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                    {ds.name}
                  </h3>
                </div>
                <Badge variant="outline" size="sm" className="font-mono text-[10px] uppercase shrink-0">
                  {ds.dataset_type}
                </Badge>
              </div>

              <p className="text-[11px] text-muted-foreground line-clamp-2">{ds.description || "No description provided."}</p>

              <div className="flex items-center justify-between pt-3 border-t border-border text-[10px] text-muted-foreground font-mono">
                <span>{(ds.file_size / 1024).toFixed(1)} KB</span>
                <span>{ds.record_count > 0 ? `${ds.record_count.toLocaleString()} records` : ds.file_name}</span>
              </div>

              <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDownloadDataset(ds.name)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span>Download</span>
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDeleteDataset(ds.id, ds.name)}
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Columns</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDatasets.map((ds: DatasetItem) => (
                <TableRow key={ds.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      <span>{ds.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs uppercase font-mono">{ds.dataset_type}</TableCell>
                  <TableCell className="text-xs font-mono">{(ds.file_size / 1024).toFixed(1)} KB</TableCell>
                  <TableCell className="text-xs font-mono">{ds.record_count}</TableCell>
                  <TableCell className="text-xs font-mono">{ds.column_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDownloadDataset(ds.name)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDeleteDataset(ds.id, ds.name)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
