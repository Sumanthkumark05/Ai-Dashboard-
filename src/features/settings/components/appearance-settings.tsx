"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/forms/switch";
import { Label } from "@/components/forms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { toast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { appearance, updateAppearance } = useSettingsStore();

  const handleThemeChange = (selectedTheme: "light" | "dark" | "system") => {
    setTheme(selectedTheme);
    updateAppearance({ theme: selectedTheme });
    toast.success(`Theme set to ${selectedTheme}`, {
      description: "Applied theme mode live across the application dashboard.",
    });
  };

  return (
    <Card className="p-6 space-y-6 select-none">
      <div className="border-b border-border pb-4">
        <h3 className="text-base font-bold text-foreground">Appearance & Theme Preferences</h3>
        <p className="text-xs text-muted-foreground">Customize your visual interface theme, contrast, and layout density</p>
      </div>

      {/* Theme Selection Grid */}
      <div className="space-y-3">
        <Label>Interface Theme</Label>

        <div className="grid grid-cols-3 gap-3">
          {/* Light Theme Pill */}
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer",
              theme === "light"
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <Sun className="h-6 w-6 mb-2 text-amber-500" />
            <span className="text-xs font-semibold text-foreground">Light Mode</span>
          </button>

          {/* Dark Theme Pill */}
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer",
              theme === "dark"
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <Moon className="h-6 w-6 mb-2 text-purple-400" />
            <span className="text-xs font-semibold text-foreground">Dark Mode</span>
          </button>

          {/* System Theme Pill */}
          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer",
              theme === "system"
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <Laptop className="h-6 w-6 mb-2 text-info" />
            <span className="text-xs font-semibold text-foreground">System Default</span>
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        {/* Compact Layout Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-semibold text-xs">Compact Layout Mode</Label>
            <p className="text-[11px] text-muted-foreground">Reduce vertical padding across tables and card widgets</p>
          </div>
          <Switch
            checked={appearance.compactLayout}
            onCheckedChange={(checked) => {
              updateAppearance({ compactLayout: checked });
              toast.info(`Compact layout ${checked ? "enabled" : "disabled"}`);
            }}
          />
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <Label className="font-semibold text-xs">Reduced Motion Animations</Label>
            <p className="text-[11px] text-muted-foreground">Disable sliding drawer animations and smooth transitions</p>
          </div>
          <Switch
            checked={appearance.reducedMotion}
            onCheckedChange={(checked) => {
              updateAppearance({ reducedMotion: checked });
              toast.info(`Reduced motion ${checked ? "enabled" : "disabled"}`);
            }}
          />
        </div>

        {/* Sidebar Default State */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <Label className="font-semibold text-xs">Sidebar Default State</Label>
            <p className="text-[11px] text-muted-foreground">Default sidebar state when launching workspace</p>
          </div>
          <Select
            value={appearance.sidebarDefaultState}
            onValueChange={(val) => updateAppearance({ sidebarDefaultState: val as "expanded" | "collapsed" })}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="expanded">Expanded</SelectItem>
              <SelectItem value="collapsed">Collapsed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
