"use client";

import { Cpu, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIModelsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" /> AI Models & Deployments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your fine-tuned foundation models, endpoints, and neural weights.
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Active Fleet: 8 Models
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["NeuroLLM-70B v2.4", "NeuroVision-Ultra", "Agentic-Coder-Pro"].map((name, i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{name}</span>
              <span className="h-2 w-2 rounded-full bg-success inline-block" />
            </div>
            <p className="text-xs text-muted-foreground">
              Latency: {120 + i * 25}ms • Throughput: 4.2k tok/s
            </p>
            <div className="pt-2 flex justify-between items-center text-xs font-mono text-muted-foreground border-t border-border">
              <span>Status: Ready</span>
              <span>v{1 + i}.0</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
