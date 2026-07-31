"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { getInitials, getTimeGreeting } from "@/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function WelcomeBanner() {
  const { user } = useAuthStore();

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = getTimeGreeting();
  const initials = getInitials(user?.name, "AV");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background p-6 sm:p-8 shadow-sm"
    >
      {/* Subtle Background Glow */}
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10 relative">
        <div className="flex items-start gap-4">
          <Avatar size="lg" status="online" className="ring-2 ring-primary/30">
            <AvatarImage src={user?.avatarUrl} alt={user?.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {greeting}, {user?.name || "Alex Vance"} 👋
              </h2>
              <Badge variant="success" size="sm" className="gap-1">
                <Sparkles className="h-3 w-3" /> System Operational
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Welcome back. Here&apos;s your daily AI intelligence summary and active workspace telemetry.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("System Health Report", {
                description: "All 12 AI Agent microservices running smoothly.",
              })
            }
          >
            System Status
          </Button>
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ArrowUpRight className="h-4 w-4" />}
            onClick={() =>
              toast.info("New Session", {
                description: "Initializing AI Agent Workspace session...",
              })
            }
          >
            New Session
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
