"use client";

import * as React from "react";
import { Search, LayoutGrid, List, Filter } from "lucide-react";
import { Input } from "@/components/forms/input";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/stores/document-store";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "documentation", label: "Documentation" },
  { value: "research", label: "Research & Specs" },
  { value: "financial", label: "Financial Reports" },
  { value: "legal", label: "Legal & Contracts" },
  { value: "technical", label: "Technical Guides" },
  { value: "uncategorized", label: "Uncategorized" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "ready", label: "Ready / Indexed" },
  { value: "processing", label: "Processing" },
  { value: "uploading", label: "Uploading" },
  { value: "failed", label: "Failed" },
];

interface DocumentToolbarProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export function DocumentToolbar({ viewMode, setViewMode }: DocumentToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  } = useDocumentStore();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
      {/* Search Input */}
      <div className="w-full sm:max-w-xs">
        <Input
          placeholder="Search by title, filename, or category..."
          leftIcon={<Search className="h-4 w-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 text-xs"
        />
      </div>

      {/* Category & Status Filter Dropdowns & View Toggle */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-border p-1 bg-muted/20 shrink-0">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
            title="List View"
            aria-label="List View"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
