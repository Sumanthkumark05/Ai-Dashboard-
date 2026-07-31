"use client";

import * as React from "react";
import { Code2, Sparkles, ShieldCheck } from "lucide-react";
import { APP_VERSION, APP_BUILD, APP_NAME } from "@/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AboutSection() {
  const techStack = [
    "Next.js 15 (App Router)",
    "React 19",
    "TypeScript",
    "Tailwind CSS",
    "Shadcn UI",
    "Zustand",
    "TanStack Query",
    "Recharts",
    "Framer Motion",
    "Lucide React",
    "next-themes",
  ];

  return (
    <Card className="p-6 space-y-6 select-none">
      <div className="border-b border-border pb-4">
        <h3 className="text-base font-bold text-foreground">About NeuroDesk AI</h3>
        <p className="text-xs text-muted-foreground">Platform release versioning, tech stack components, and open source credits</p>
      </div>

      {/* Version Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground block">{APP_NAME} SaaS Platform</span>
            <span className="text-xs text-muted-foreground">Enterprise Multi-Agent Intelligence Dashboard</span>
          </div>
        </div>

        <div className="text-right">
          <Badge variant="info">{APP_VERSION} Production</Badge>
          <span className="text-[10px] text-muted-foreground font-mono block mt-1">Build {APP_BUILD}</span>
        </div>
      </div>

      {/* Tech Stack Badges */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Code2 className="h-4 w-4 text-primary" />
          Technology Architecture
        </span>
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tech, idx) => (
            <Badge key={idx} variant="outline" size="sm" className="text-[11px] py-0.5">
              {tech}
            </Badge>
          ))}
        </div>
      </div>

      {/* Open Source License & Credits */}
      <div className="space-y-2 pt-2 border-t border-border text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Open Source Licensing & Compliance</span>
        </div>
        <p>
          NeuroDesk AI is built using open-source software libraries under the MIT and Apache 2.0 licenses.
          Special thanks to the Vercel, Tailwind CSS, Shadcn UI, and React communities.
        </p>
      </div>
    </Card>
  );
}
