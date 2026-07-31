"use client";

import * as React from "react";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { useFileStore } from "@/stores/file-store";
import { SortField, FileTypeFilter } from "../types";
import { SearchInput } from "@/components/forms/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";

export function FileToolbar() {
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortField,
    setSortField,
    sortOrder,
    toggleSortOrder,
  } = useFileStore();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 select-none">
      {/* Search Input Filter */}
      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Search by file name, type, owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
        />
      </div>

      {/* Filter, Sort, View Toggle Controls */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Category Filter */}
        <Select value={filterType} onValueChange={(val) => setFilterType(val as FileTypeFilter)}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="All Assets" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value="folder">Folders</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="pdf">PDF Files</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="code">Code Files</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Field */}
        <Select value={sortField} onValueChange={(val) => setSortField(val as SortField)}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="modifiedDate">Date Modified</SelectItem>
            <SelectItem value="name">File Name</SelectItem>
            <SelectItem value="size">File Size</SelectItem>
            <SelectItem value="type">File Type</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={`Sort order: ${sortOrder}`}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>

        {/* Grid vs List View Toggle */}
        <div className="flex items-center rounded-md border border-input p-0.5 bg-muted/40">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setViewMode("grid")}
            className="h-7 w-7 p-0"
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setViewMode("list")}
            className="h-7 w-7 p-0"
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
