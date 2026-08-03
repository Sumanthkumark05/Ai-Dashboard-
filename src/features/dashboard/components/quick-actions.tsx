"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bot, Upload, PlusSquare, UserPlus, BarChart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "./section-header";
import Link from "next/link";

const actions = [
  {
    id: "qa_1",
    title: "New AI Chat",
    description: "Launch autonomous agent assistant session",
    icon: Bot,
    actionText: "Start Session",
    href: "/dashboard/ai-assistant",
  },
  {
    id: "qa_2",
    title: "Upload File",
    description: "Import files into workspace storage",
    icon: Upload,
    actionText: "Upload File",
    href: "/dashboard/files",
  },
  {
    id: "qa_3",
    title: "Workspace Pages",
    description: "Document team architecture and specs",
    icon: PlusSquare,
    actionText: "View Pages",
    href: "/dashboard/workspace",
  },
  {
    id: "qa_4",
    title: "Invite Teammate",
    description: "Grant workspace access to team members",
    icon: UserPlus,
    actionText: "Manage Team",
    href: "/dashboard/team",
  },
  {
    id: "qa_5",
    title: "View Analytics",
    description: "Analyze system usage and storage telemetry",
    icon: BarChart,
    actionText: "Open Report",
    href: "/dashboard/analytics",
  },
];

export function QuickActions() {
  return (
    <div>
      <SectionHeader
        title="Quick Actions"
        description="Frequently used actions and workflow shortcuts"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((action, index) => {
          const IconComponent = action.icon;

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              whileHover={{ y: -2 }}
            >
              <Link href={action.href}>
                <Card className="p-4 h-full flex flex-col justify-between hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer group select-none">
                  <div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <IconComponent className="h-5 w-5 shrink-0" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-primary pt-3">
                    <span>{action.actionText}</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
