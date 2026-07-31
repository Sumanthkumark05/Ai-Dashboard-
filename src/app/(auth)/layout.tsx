import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: {
    default: "Sign In",
    template: "%s | NeuroDesk AI",
  },
  description: "Sign in to NeuroDesk AI – your enterprise autonomous AI intelligence dashboard.",
  robots: { index: false, follow: false },
};

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
