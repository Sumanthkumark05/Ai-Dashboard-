"use client";

import * as React from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/forms/switch";
import { Label } from "@/components/forms/label";
import { toast } from "@/components/feedback/toast";

export function AccessibilitySettings() {
  const { accessibility, updateAccessibility } = useSettingsStore();

  const options: { key: keyof typeof accessibility; label: string; description: string }[] = [
    { key: "highContrast", label: "High Contrast Theme Mode", description: "Increase border contrast and text legibility" },
    { key: "largeText", label: "Large Text Font Scaling", description: "Scale up base typography font sizes by 15%" },
    { key: "keyboardShortcuts", label: "Keyboard Shortcuts (⌘K / Hotkeys)", description: "Enable global command palette and hotkey navigation" },
    { key: "focusHighlight", label: "Focus Ring Outlines", description: "Display high-visibility focus outlines around interactive buttons" },
    { key: "screenReaderOptimisations", label: "Screen Reader Optimizations", description: "Expose explicit ARIA live regions and semantic labels" },
    { key: "reducedMotion", label: "Reduced Motion Animations", description: "Minimize UI transition effects and sliding animations" },
  ];

  return (
    <Card className="p-6 space-y-6 select-none">
      <div className="border-b border-border pb-4">
        <h3 className="text-base font-bold text-foreground">Accessibility & Legibility</h3>
        <p className="text-xs text-muted-foreground">Adjust high contrast standards, keyboard shortcuts, and screen reader labels</p>
      </div>

      <div className="space-y-4">
        {options.map((opt, idx) => (
          <div key={opt.key} className={`flex items-center justify-between ${idx > 0 ? "pt-3 border-t border-border" : ""}`}>
            <div>
              <Label className="font-semibold text-xs">{opt.label}</Label>
              <p className="text-[11px] text-muted-foreground">{opt.description}</p>
            </div>
            <Switch
              checked={!!accessibility[opt.key]}
              onCheckedChange={(checked) => {
                updateAccessibility({ [opt.key]: checked });
                toast.info(`${opt.label} ${checked ? "enabled" : "disabled"}`);
              }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
