"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, X } from "lucide-react";

import { navigationConfig } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MobileDrawer() {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile } = useSidebarStore();

  React.useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Slide Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 max-w-[80vw] border-r border-border bg-card p-4 shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <span className="text-base font-bold tracking-tight text-foreground">
                    {siteConfig.name}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={closeMobile}
                  className="h-8 w-8 p-0"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Nav Items */}
              <div className="space-y-6 overflow-y-auto max-h-[75vh]">
                {navigationConfig.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-1">
                    <h4 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.groupTitle}
                    </h4>
                    <nav className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMobile}
                            aria-label={item.title}
                            className={cn(
                              "relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap overflow-visible transition-colors cursor-pointer group h-[44px]",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                            )}
                            <Icon
                              className={cn(
                                "h-5 w-5 shrink-0 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                              )}
                            />
                            <span className="flex-1 truncate">{item.title}</span>
                            {item.badge && (
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
                      })}
                    </nav>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground text-center">
              NeuroDesk AI Enterprise Dashboard
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
