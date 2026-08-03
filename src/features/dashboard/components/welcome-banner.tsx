"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { getInitials, getTimeGreeting } from "@/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useDashboardStore } from "@/stores/dashboard-store";

export function WelcomeBanner() {
  const { user } = useAuthStore();
  const { summary } = useDashboardStore();

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = getTimeGreeting();
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = getInitials(displayName, "US");

  const subtitle = summary?.intelligenceSummary || "Welcome back. Here's your workspace telemetry and active AI assistant status.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs select-none"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <Avatar size="lg" status="online" className="ring-2 ring-primary/20 shrink-0">
            <AvatarImage src={user?.avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {greeting}, {displayName} 👋
              </h2>
              <Badge variant="success" size="xs" className="gap-1">
                <Sparkles className="h-3 w-3" /> System Operational
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              {subtitle}
            </p>
            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>


        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </Link>
          <Link href="/dashboard/ai-assistant">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
            >
              New AI Session
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
