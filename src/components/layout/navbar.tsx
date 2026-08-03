"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/sidebar-store";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { SearchBar } from "./search-bar";
import { NewSessionButton } from "./new-session-button";
import { SystemStatus } from "./system-status";
import { NotificationBadge } from "./notification-badge";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Navbar() {
  const { toggleMobile } = useSidebarStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/85 px-4 lg:px-6 backdrop-blur-xl transition-all select-none gap-4 shrink-0">
      {/* Create Workspace Modal Container */}
      <CreateWorkspaceModal />

      {/* LEFT SECTION: Title, Workspace Switcher & Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0 min-w-0">
        {/* Mobile Hamburger Trigger */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMobile}
          className="md:hidden text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher />

        {/* Path Breadcrumbs */}
        <DashboardBreadcrumb />
      </div>

      {/* CENTER SECTION: Search Bar */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-md lg:max-w-lg mx-auto">
        <SearchBar />
      </div>

      {/* RIGHT SECTION: Controls & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* New Session Button */}
        <NewSessionButton />

        {/* System Status Indicator */}
        <SystemStatus />

        {/* Notifications */}
        <NotificationBadge />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
