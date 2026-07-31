"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SuggestedPrompts } from "./suggested-prompts";

export interface EmptyChatStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export function EmptyChatState({ onSelectPrompt }: EmptyChatStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 text-center px-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm"
      >
        <BrainCircuit className="h-7 w-7" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-2"
      >
        How can {siteConfig.name} help you today?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed"
      >
        Ask questions, generate code snippets, summarize complex documents, or orchestrate autonomous AI agent workflows.
      </motion.p>

      {/* Suggested Prompt Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="w-full"
      >
        <SuggestedPrompts onSelectPrompt={onSelectPrompt} />
      </motion.div>
    </div>
  );
}
