"use client";

import * as React from "react";
import { toast } from "@/components/feedback/toast";

export function SystemStatus() {
  const [isOperational, setIsOperational] = React.useState(true);

  const toggleStatus = () => {
    setIsOperational((prev) => !prev);
    toast.info("System Status Toggled", {
      description: `System state set to ${!isOperational ? "Operational" : "Maintenance Mode"}.`,
    });
  };

  return (
    <button
      type="button"
      onClick={toggleStatus}
      aria-label={`System Status: ${isOperational ? "Operational" : "Maintenance"}`}
      className="relative hidden xl:flex h-10 items-center gap-2.5 px-3.5 rounded-xl border border-border/60 bg-card/50 hover:bg-card/90 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer select-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
        {isOperational && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isOperational ? "bg-success" : "bg-warning"
          }`}
        />
      </span>
      <span className="text-foreground font-semibold text-xs whitespace-nowrap">
        {isOperational ? "System Operational" : "Maintenance"}
      </span>
    </button>
  );
}

