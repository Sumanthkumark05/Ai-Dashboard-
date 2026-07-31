"use client";

import * as React from "react";
import { analyticsActivitiesData } from "../mock/analytics-mock-data";
import { AnalyticsActivity } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/display/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/forms/search-input";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/constants";

export function ActivityTable() {
  const [query, setQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 3;

  const filtered = React.useMemo(() => {
    return analyticsActivitiesData.filter(
      (a) =>
        a.user.toLowerCase().includes(query.toLowerCase()) ||
        a.action.toLowerCase().includes(query.toLowerCase()) ||
        a.module.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Recent Telemetry Events</h4>
          <p className="text-xs text-muted-foreground">Real-time system activity logs</p>
        </div>
        <div className="w-full sm:w-64">
          <SearchInput
            placeholder="Search activity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Module</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((act: AnalyticsActivity) => {
            const initials = getInitials(act.user);

            return (
              <TableRow key={act.id}>
                <TableCell className="text-xs text-muted-foreground font-mono">{act.timestamp}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="xs">
                      <AvatarImage src={act.avatarUrl} alt={act.user} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">{act.user}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground">{act.action}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{act.module}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={act.status === "Success" ? "success" : act.status === "Pending" ? "warning" : "destructive"}
                    size="sm"
                  >
                    {act.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
