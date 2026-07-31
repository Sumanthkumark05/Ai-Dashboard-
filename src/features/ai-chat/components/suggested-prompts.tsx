"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { suggestedPrompts } from "../mock/chat-mock-data";
import { SuggestedPrompt } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Suggested Prompts</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestedPrompts.map((item: SuggestedPrompt, index: number) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
          >
            <Card
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-3.5 flex flex-col justify-between hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer group select-none h-full"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <Badge variant="outline" size="sm" className="text-[10px] py-0 h-4">
                    {item.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>

              <div className="flex items-center text-[11px] font-semibold text-primary pt-2.5">
                <span>Use prompt</span>
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
