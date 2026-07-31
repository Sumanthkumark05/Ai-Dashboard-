"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { siteConfig } from "@/config/site";

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 select-none">
      {/* Background Accent Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-15 pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md space-y-6 z-10"
      >
        {/* Company Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm"
          >
            <BrainCircuit className="h-6 w-6" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {siteConfig.name}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Auth Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-md"
        >
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
