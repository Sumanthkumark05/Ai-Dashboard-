"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bot, Upload, PlusSquare, UserPlus, BarChart, LucideIcon, ArrowRight } from "lucide-react";
import { quickActions } from "../mock/dashboard-mock-data";
import { QuickActionItem } from "../types";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "./section-header";
import { toast } from "@/components/feedback/toast";

const iconMap: Record<string, LucideIcon> = {
  Bot,
  Upload,
  PlusSquare,
  UserPlus,
  BarChart,
};

export function QuickActions() {
  return (
    <div>
      <SectionHeader
        title="Quick Actions"
        description="Frequently used actions and workflow shortcuts"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {quickActions.map((action: QuickActionItem, index: number) => {
          const IconComponent = iconMap[action.iconName] || Bot;

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              whileHover={{ y: -2 }}
            >
              <Card
                onClick={() =>
                  toast.info(action.title, {
                    description: `Action trigger preview for: ${action.title}`,
                  })
                }
                className="p-4 h-full flex flex-col justify-between hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer group select-none"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <IconComponent className="h-4 w-4" />
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
                  <ArrowRight className="ml-1.0 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
