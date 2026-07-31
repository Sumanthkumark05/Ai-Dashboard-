"use client";

import * as React from "react";
import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 p-2 text-muted-foreground select-none">
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
        className="h-2 w-2 rounded-full bg-primary"
      />
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
        className="h-2 w-2 rounded-full bg-primary"
      />
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        className="h-2 w-2 rounded-full bg-primary"
      />
    </div>
  );
}
