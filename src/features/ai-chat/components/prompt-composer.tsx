"use client";

import * as React from "react";
import { Paperclip, Image as ImageIcon, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/feedback/tooltip";
import { toast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";

export interface PromptComposerProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
  externalPrompt?: string;
}

const MAX_CHARS = 4000;

export function PromptComposer({ onSend, isGenerating, externalPrompt }: PromptComposerProps) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      textareaRef.current?.focus();
    }
  }, [externalPrompt]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setInput(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <div className="relative rounded-xl border border-input bg-card shadow-md transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything or type '/' for commands..."
          disabled={isGenerating}
          rows={2}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-12 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 min-h-[70px] max-h-[200px]"
        />

        {/* Toolbar & Controls Bar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-auto">
          {/* File & Image Attach Buttons (UI Only) */}
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      toast.info("Attach File", {
                        description: "File attachment modal preview.",
                      })
                    }
                    disabled={isGenerating}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Attach document"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach file</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      toast.info("Attach Image", {
                        description: "Image upload vision preview.",
                      })
                    }
                    disabled={isGenerating}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Attach image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach image</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline-flex items-center gap-1">
              <span>Press</span>
              <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono text-[9px]">Enter ↵</kbd>
              <span>to send</span>
            </span>
          </div>

          {/* Character Count & Send Button */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] select-none",
                input.length >= MAX_CHARS ? "text-destructive font-semibold" : "text-muted-foreground"
              )}
            >
              {input.length}/{MAX_CHARS}
            </span>

            <Button
              type="button"
              variant="primary"
              size="xs"
              onClick={handleSubmit}
              disabled={!input.trim() || isGenerating}
              isLoading={isGenerating}
              className="h-8 px-3 rounded-lg text-xs font-semibold shadow-sm"
              rightIcon={!isGenerating && <CornerDownLeft className="h-3.5 w-3.5" />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-center text-muted-foreground mt-2">
        NeuroDesk AI can make mistakes. Verify critical facts and code output.
      </p>
    </div>
  );
}
