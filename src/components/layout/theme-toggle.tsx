"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/navigation/dropdown";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground shrink-0">
        <Sun className="h-4 w-4" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Toggle display theme"
          className="relative flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 shrink-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Light</span>
          {theme === "light" && <Check className="ml-auto h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Dark</span>
          {theme === "dark" && <Check className="ml-auto h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          <Laptop className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>System</span>
          {theme === "system" && <Check className="ml-auto h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


