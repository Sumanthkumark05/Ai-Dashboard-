"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { siteConfig } from "@/config/site";

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-background select-none">
      {/* LEFT COLUMN: Enterprise Brand Hero Panel (Desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 text-white relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Top Brand Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            {siteConfig.name}
          </span>
        </div>

        {/* Hero Value Prop Statement */}
        <div className="space-y-6 z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-md border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Autonomous Enterprise AI Intelligence</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight leading-tight sm:text-4xl text-white">
            Transform enterprise workflows with multi-agent orchestration.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            NeuroDesk AI empowers teams with real-time vector knowledge repositories, automated telemetry analytics, and intelligent dataset processing.
          </p>

          {/* Key Benefit Highlights */}
          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>RAG Vector Search & Document Repository</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Multi-Tenant Workspace & Role-Based Security</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Streaming AI Assistant & Agent Telemetry</span>
            </div>
          </div>
        </div>

        {/* Footer Sub-Banner */}
        <div className="pt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 z-10">
          <span>© {new Date().getFullYear()} {siteConfig.name} Inc.</span>
          <span className="font-mono text-[10px] opacity-70">SOC2 Type II Certified</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Focused Authentication Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile Header Branding */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-2 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </div>

          {/* Header Titles */}
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Main Auth Form Box */}
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
