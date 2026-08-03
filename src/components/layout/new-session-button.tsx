"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function NewSessionButton() {
  return (
    <Button
      variant="primary"
      size="md"
      onClick={() =>
        toast.success("New Session", {
          description: "Initializing new AI intelligence session...",
        })
      }
      leftIcon={<Plus className="h-4 w-4 shrink-0" />}
      aria-label="Create new session"
      className="hidden sm:inline-flex rounded-xl"
    >
      New Session
    </Button>
  );
}
