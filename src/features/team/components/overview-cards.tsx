"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Mail, FolderKanban, ArrowUpRight } from "lucide-react";
import { useTeamStore } from "@/stores/team-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OverviewCards() {
  const { members } = useTeamStore();

  const totalMembers = members.length;
  const onlineMembers = members.filter((m) => m.status === "online").length;
  const pendingInvites = 2;
  const activeProjects = 4;

  const cardsData = [
    {
      title: "Total Workspace Members",
      value: totalMembers.toString(),
      trend: "+2 this month",
      icon: Users,
    },
    {
      title: "Online Currently Active",
      value: onlineMembers.toString(),
      trend: `${Math.round((onlineMembers / (totalMembers || 1)) * 100)}% active`,
      icon: UserCheck,
    },
    {
      title: "Pending Invitations",
      value: pendingInvites.toString(),
      trend: "Awaiting response",
      icon: Mail,
    },
    {
      title: "Active Team Projects",
      value: activeProjects.toString(),
      trend: "4 in progress",
      icon: FolderKanban,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
      {cardsData.map((item, index) => {
        const IconComponent = item.icon;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
          >
            <Card className="p-4 flex flex-col justify-between hover:border-primary/40 transition-all h-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground">{item.title}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <IconComponent className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-foreground">{item.value}</span>
                <Badge variant="outline" size="sm" className="gap-0.5 text-[10px]">
                  <ArrowUpRight className="h-3 w-3 text-success" />
                  <span>{item.trend}</span>
                </Badge>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
