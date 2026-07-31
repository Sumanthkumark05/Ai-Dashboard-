"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedCodeIndex, setCopiedCodeIndex] = React.useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to parse blocks of code and normal text
  const parseContent = (rawText: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      // Push preceding text before code block
      if (match.index > lastIndex) {
        const textSegment = rawText.slice(lastIndex, match.index);
        elements.push(<TextSegment key={`text_${lastIndex}`} text={textSegment} />);
      }

      const language = match[1] || "text";
      const codeSnippet = match[2].trim();
      const currentBlockIndex = blockIndex;

      elements.push(
        <div
          key={`code_${blockIndex}`}
          className="my-4 overflow-hidden rounded-lg border border-border bg-slate-950 text-slate-50 font-mono text-xs shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-slate-400">
            <span className="text-[11px] font-semibold uppercase">{language}</span>
            <Button
              variant="ghost"
              size="xs"
              className="h-6 gap-1 px-2 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              onClick={() => handleCopyCode(codeSnippet, currentBlockIndex)}
            >
              {copiedCodeIndex === currentBlockIndex ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy code</span>
                </>
              )}
            </Button>
          </div>
          <div className="p-4 overflow-x-auto">
            <pre className="leading-relaxed">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </div>
      );

      lastIndex = codeBlockRegex.lastIndex;
      blockIndex++;
    }

    if (lastIndex < rawText.length) {
      elements.push(<TextSegment key={`text_${lastIndex}`} text={rawText.slice(lastIndex)} />);
    }

    return elements;
  };

  return <div className="space-y-3 leading-relaxed text-foreground text-sm">{parseContent(content)}</div>;
}

// Inner helper component for rich text formatting (Headings, Tables, Lists, Inline code)
function TextSegment({ text }: { text: string }) {
  const lines = text.split("\n");
  const parsedLines: React.ReactNode[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table Row Parsing
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Ignore separator row e.g. |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        return;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      // Flush table
      parsedLines.push(
        <div key={`table_${idx}`} className="my-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-foreground font-semibold">
              <tr>
                {tableHeader.map((th, i) => (
                  <th key={i} className="p-2.5">
                    {parseInlineText(th)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/20">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5">
                      {parseInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      parsedLines.push(
        <h3 key={idx} className="text-base font-bold tracking-tight text-foreground mt-4 mb-1">
          {parseInlineText(trimmed.replace("### ", ""))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      parsedLines.push(
        <h2 key={idx} className="text-lg font-bold tracking-tight text-foreground mt-5 mb-2">
          {parseInlineText(trimmed.replace("## ", ""))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      parsedLines.push(
        <h1 key={idx} className="text-xl font-extrabold tracking-tight text-foreground mt-6 mb-2">
          {parseInlineText(trimmed.replace("# ", ""))}
        </h1>
      );
    } else if (trimmed.startsWith("> ")) {
      parsedLines.push(
        <blockquote
          key={idx}
          className="my-3 border-l-2 border-primary pl-4 italic text-muted-foreground bg-muted/20 py-2 rounded-r-md"
        >
          {parseInlineText(trimmed.replace("> ", ""))}
        </blockquote>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      parsedLines.push(
        <div key={idx} className="flex gap-2 ml-2 my-1">
          <span className="font-semibold text-primary">{trimmed.match(/^\d+\./)?.[0]}</span>
          <span>{parseInlineText(trimmed.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      parsedLines.push(
        <div key={idx} className="flex items-start gap-2 ml-2 my-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
          <span>{parseInlineText(trimmed.replace(/^[-*]\s/, ""))}</span>
        </div>
      );
    } else if (trimmed !== "") {
      parsedLines.push(<p key={idx} className="my-1.5">{parseInlineText(line)}</p>);
    }
  });

  return <>{parsedLines}</>;
}

// Inline formatting helper for **bold**, *italic*, and `inline code`
function parseInlineText(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
