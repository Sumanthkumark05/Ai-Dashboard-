"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input, type InputProps } from "./input";
import { Button } from "@/components/ui/button";

export interface SearchInputProps extends InputProps {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, leftIcon = <Search className="h-4 w-4" />, ...props }, ref) => {
    const hasValue = value !== undefined && value !== "";

    return (
      <Input
        type="search"
        value={value}
        onChange={onChange}
        className={className}
        ref={ref}
        leftIcon={leftIcon}
        rightIcon={
          hasValue && onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={onClear}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
