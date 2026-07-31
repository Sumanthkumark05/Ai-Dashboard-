"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, ChevronLeft, ChevronRight } from "lucide-react";

import { navigationConfig } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { APP_VERSION } from "@/constants";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/feedback/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed: storeIsCollapsed, toggleSidebar } = useSidebarStore();
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Force isCollapsed = false on desktop (>=1024px)
  const isCollapsed = isDesktop ? false : storeIsCollapsed;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out select-none shrink-0 overflow-y-auto overflow-x-hidden",
          isCollapsed ? "w-16 min-w-[64px]" : "w-[260px] min-w-[260px]"
        )}
      >
        {/* Header Branding */}
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border justify-between shrink-0">
          <Link
            href="/dashboard"
            aria-label={siteConfig.name}
            className="flex items-center gap-3 font-semibold overflow-hidden"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-bold tracking-tight text-foreground truncate">
                {siteConfig.name}
              </span>
            )}
          </Link>

          {/* Desktop/Tablet Collapse Toggle */}
          {!isDesktop && (
            <Button
              variant="ghost"
              size="xs"
              onClick={toggleSidebar}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
          {navigationConfig.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && group.groupTitle && (
                <h4 className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.groupTitle}
                </h4>
              )}

              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  const navLinkContent = (
                    <Link
                      href={item.href}
                      aria-label={item.title}
                      className={cn(
                        "relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap overflow-visible transition-colors cursor-pointer group h-[44px]",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                      )}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                      )}

                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />

                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.title}</span>
                      )}

                      {!isCollapsed && item.badge && (
                        <Badge
                          variant={item.badge === "New" ? "success" : "secondary"}
                          size="sm"
                          className="ml-auto text-[10px] px-1.5 py-0 h-4 shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{navLinkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge && <Badge size="sm">{item.badge}</Badge>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.href}>{navLinkContent}</React.Fragment>;
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="p-3 border-t border-sidebar-border text-xs text-muted-foreground text-center shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2">
              <span className="font-mono text-[10px] opacity-70">{APP_VERSION}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
            </div>
          ) : (
            <span className="h-2 w-2 rounded-full bg-success mx-auto block" />
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

