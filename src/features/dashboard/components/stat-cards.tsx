"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Zap, HardDrive, TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { statsData } from "../mock/dashboard-mock-data";
import { StatItem } from "../types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Users,
  DollarSign,
  Zap,
  HardDrive,
};

export function StatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat: StatItem, index: number) => {
        const IconComponent = iconMap[stat.iconName] || Users;

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <Card className="p-5 h-full flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all cursor-pointer select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <IconComponent className="h-4 w-4" />
                </div>
              </div>

              <div className="my-3">
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {stat.value}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div
                  className={cn(
                    "flex items-center gap-1 font-semibold rounded-md px-1.5 py-0.5",
                    stat.isPositive
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  )}
                >
                  {stat.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
                <span className="text-muted-foreground truncate">{stat.description}</span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
