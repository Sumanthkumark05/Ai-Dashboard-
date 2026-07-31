"use client";

import * as React from "react";
import {
  User,
  CreditCard,
  Palette,
  Bell,
  Layers,
  Shield,
  Eye,
  Info,
  RotateCcw,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { SettingsSection } from "../types";
import { SearchInput } from "@/components/forms/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SettingsSidebar() {
  const { activeSection, setActiveSection, searchQuery, setSearchQuery, openResetModal } = useSettingsStore();

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "account", label: "Account & Billing", icon: <CreditCard className="h-4 w-4" /> },
    { id: "appearance", label: "Appearance & Theme", icon: <Palette className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "workspace", label: "Workspace Preferences", icon: <Layers className="h-4 w-4" /> },
    { id: "security", label: "Security & Sessions", icon: <Shield className="h-4 w-4" /> },
    { id: "accessibility", label: "Accessibility", icon: <Eye className="h-4 w-4" /> },
    { id: "about", label: "About & License", icon: <Info className="h-4 w-4" /> },
  ];

  const filteredSections = sections.filter((sec) =>
    !searchQuery || sec.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 bg-card border-r border-border select-none">
      <div className="space-y-4">
        {/* Navigation Title */}
        <div className="pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Settings & Preferences</h3>
          <p className="text-[11px] text-muted-foreground">Manage your workspace account preferences</p>
        </div>

        {/* Search Bar */}
        <SearchInput
          placeholder="Filter settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          className="h-8 text-xs"
        />

        {/* Navigation Items */}
        <div className="space-y-1">
          {filteredSections.map((sec) => {
            const isActive = activeSection === sec.id;

            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {sec.icon}
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Preferences Trigger */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          size="xs"
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={openResetModal}
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
        >
          Reset Preferences
        </Button>
      </div>
    </div>
  );
}
