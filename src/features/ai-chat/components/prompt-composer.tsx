"use client";

import * as React from "react";
import { Paperclip, Image as ImageIcon, ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/feedback/tooltip";
import { toast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";

export interface PromptComposerProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
  onStop?: () => void;
  externalPrompt?: string;
}

const MAX_CHARS = 4000;

export function PromptComposer({ onSend, isGenerating, onStop, externalPrompt }: PromptComposerProps) {
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
      <div className="relative rounded-2xl border border-border bg-card shadow-sm transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything or type '/' for commands..."
          disabled={isGenerating}
          rows={2}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-11 text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50 min-h-[64px] max-h-[180px]"
        />

        {/* Toolbar & Controls Bar */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-auto">
          {/* Attach Buttons */}
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      toast.info("Attach File", {
                        description: "File attachment modal preview.",
                      })
                    }
                    disabled={isGenerating}
                    className="text-muted-foreground hover:text-foreground"
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
                    size="icon-xs"
                    onClick={() =>
                      toast.info("Attach Image", {
                        description: "Image upload vision preview.",
                      })
                    }
                    disabled={isGenerating}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Attach image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach image</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-[10px] text-muted-foreground/70 ml-2 hidden sm:inline-flex items-center gap-1">
              <span>Press</span>
              <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 font-mono text-[9px]">Enter ↵</kbd>
              <span>to send</span>
            </span>
          </div>

          {/* Character Count & Circular Send Button */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] select-none font-mono",
                input.length >= MAX_CHARS ? "text-destructive font-semibold" : "text-muted-foreground/60"
              )}
            >
              {input.length}/{MAX_CHARS}
            </span>

            {isGenerating && onStop ? (
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={onStop}
                className="rounded-full shadow-xs"
                aria-label="Stop generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="icon-sm"
                onClick={handleSubmit}
                disabled={!input.trim() || isGenerating}
                isLoading={isGenerating}
                className="rounded-full shadow-xs"
                aria-label="Send message"
              >
                {!isGenerating && <ArrowUp className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-center text-muted-foreground/70 mt-2">
        NeuroDesk AI can make mistakes. Verify critical code and data analytics output.
      </p>
    </div>
  );
}
