import * as React from "react";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
        <FileQuestion className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The page or resource you are looking for does not exist or has been moved.
        </p>
      </div>

      <Link href="/dashboard">
        <Button variant="primary" size="md" leftIcon={<Home className="h-4 w-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
