"use client";

import { HelpCircle, BookOpen, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" /> Help & Knowledge Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Documentation, tutorials, API reference, and direct technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h3 className="text-base font-semibold text-foreground">API & SDK Documentation</h3>
          <p className="text-xs text-muted-foreground">
            Explore guides for integrating NeuroDesk AI models and agentic workflows into your existing applications.
          </p>
          <Button variant="outline" size="sm">
            Read Docs <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h3 className="text-base font-semibold text-foreground">24/7 Enterprise Support</h3>
          <p className="text-xs text-muted-foreground">
            Get instant help from our AI operations engineering team. Dedicated response SLA: &lt; 15 minutes.
          </p>
          <Button variant="primary" size="sm">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
