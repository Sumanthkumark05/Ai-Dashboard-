"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { useTeamStore } from "@/stores/team-store";
import { SearchInput } from "@/components/forms/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";

export function SearchFilters() {
  const {
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
  } = useTeamStore();

  const handleReset = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 select-none">
      {/* Search Input */}
      <div className="w-full sm:w-72">
        <SearchInput
          placeholder="Search member name, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
        />
      </div>

      {/* Role, Department & Status Filters */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Owner">Owner</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Member">Member</SelectItem>
            <SelectItem value="Viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Depts</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Growth">Growth</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="away">Away</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset */}
        <Button
          variant="ghost"
          size="xs"
          onClick={handleReset}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Reset filters"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
