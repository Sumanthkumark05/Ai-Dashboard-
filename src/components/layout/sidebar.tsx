"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from "lucide-react";

import { navigationConfig } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { APP_VERSION } from "@/constants";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { getInitials } from "@/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/feedback/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed: storeIsCollapsed, toggleSidebar } = useSidebarStore();
  const { currentWorkspace, fetchWorkspaces } = useWorkspaceContextStore();
  const { user, logout } = useAuthStore();
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const isCollapsed = isDesktop ? false : storeIsCollapsed;
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = getInitials(displayName, "U");

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative hidden md:flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out select-none shrink-0 overflow-y-auto overflow-x-hidden",
          isCollapsed ? "w-[60px] min-w-[60px]" : "w-[240px] min-w-[240px]"
        )}
      >
        {/* ── Logo Header ─────────────────────────────────────────────── */}
        <div className="flex h-14 items-center px-4 border-b border-border justify-between shrink-0">
          <Link
            href="/dashboard"
            aria-label={siteConfig.name}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BrainCircuit className="h-4.5 w-4.5" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-bold tracking-tight text-foreground truncate">
                {siteConfig.name}
              </span>
            )}
          </Link>

          {/* Collapse toggle (tablet only) */}
          {!isDesktop && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* ── Active Workspace Pill ────────────────────────────────────── */}
        {!isCollapsed && currentWorkspace && (
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg border border-border bg-muted/40 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-sm"
                style={{ backgroundColor: currentWorkspace.color || "#2563EB" }}
              >
                {currentWorkspace.icon || "🏢"}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-foreground truncate leading-tight text-[12px]">
                  {currentWorkspace.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  /{currentWorkspace.slug}
                </span>
              </div>
            </div>
            <Badge variant="secondary" size="xs" className="shrink-0 capitalize">
              {(currentWorkspace.role || "owner").toLowerCase()}
            </Badge>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6">
          {navigationConfig.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-0.5">
              {!isCollapsed && group.groupTitle && (
                <h4 className="px-2 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {group.groupTitle}
                </h4>
              )}

              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  const navItem = (
                    <Link
                      href={item.href}
                      aria-label={item.title}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-150 cursor-pointer group h-[36px]",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full bg-primary" />
                      )}

                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />

                      {!isCollapsed && (
                        <span className="flex-1 truncate text-[13px]">{item.title}</span>
                      )}

                      {!isCollapsed && item.badge && (
                        <Badge
                          variant={item.badge === "New" ? "default" : "secondary"}
                          size="xs"
                          className="ml-auto shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge && <Badge size="xs">{item.badge}</Badge>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.href}>{navItem}</React.Fragment>;
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* ── Footer: User Profile ─────────────────────────────────────── */}
        <div className="px-3 py-3 border-t border-border shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
              <Avatar size="sm" className="shrink-0">
                <AvatarImage src={user?.avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[12px] font-semibold text-foreground truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Link href="/dashboard/settings" aria-label="Settings">
                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar size="sm">
                <AvatarImage src={user?.avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Version tag */}
          {!isCollapsed && (
            <div className="flex items-center justify-between mt-2 px-2">
              <span className="text-[10px] font-mono text-muted-foreground/50">{APP_VERSION}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-success" title="System operational" />
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
