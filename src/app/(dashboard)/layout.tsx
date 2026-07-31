import type { Metadata } from "next";
import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | NeuroDesk AI",
  },
  description: "NeuroDesk AI enterprise dashboard – manage AI agents, analytics, files, team, and workspace.",
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
