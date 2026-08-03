"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/display/table";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/forms/search-input";
import { Button } from "@/components/ui/button";
import { dashboardApi, ActivityItem } from "@/services/dashboard-api";

export function ActivityTable() {
  const [query, setQuery] = React.useState("");
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  React.useEffect(() => {
    let cancelled = false;
    dashboardApi.getActivity(50, 0)
      .then((res) => {
        if (!cancelled) setActivities(res.items || []);
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (!query) return activities;
    const q = query.toLowerCase();
    return activities.filter(
      (a) =>
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.action && a.action.toLowerCase().includes(q)) ||
        (a.entity_type && a.entity_type.toLowerCase().includes(q))
    );
  }, [activities, query]);

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

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted/20 animate-pulse rounded" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          No telemetry events recorded yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((act) => (
              <TableRow key={act.id}>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {new Date(act.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground">
                  {act.action}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground uppercase">
                  {act.entity_type || "SYSTEM"}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="success" size="sm">
                    Logged
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
