import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: consistent height, premium transitions, accessible focus
  "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.97] gap-2 shrink-0 box-border leading-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent hover:border-border",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted/60 hover:border-border/80 shadow-xs",
        ghost:
          "text-foreground hover:bg-muted/70 hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline !p-0 !h-auto !min-h-0 gap-1 shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        success:
          "bg-success text-success-foreground hover:bg-success/90 shadow-sm",
      },
      size: {
        xs:       "h-7  min-h-[28px] rounded-lg   px-2.5 py-0 text-xs  font-medium",
        sm:       "h-8  min-h-[32px] rounded-lg   px-3.5 py-0 text-xs  font-medium",
        default:  "h-9  min-h-[36px] rounded-lg   px-4   py-0 text-sm  font-medium",
        md:       "h-9  min-h-[36px] rounded-lg   px-4   py-0 text-sm  font-medium",
        lg:       "h-11 min-h-[44px] rounded-xl   px-5   py-0 text-sm  font-semibold",
        xl:       "h-12 min-h-[48px] rounded-xl   px-6   py-0 text-base font-semibold",
        "icon-xs":  "h-7  w-7  min-h-[28px] min-w-[28px] !p-0 rounded-md  shrink-0 gap-0",
        "icon-sm":  "h-8  w-8  min-h-[32px] min-w-[32px] !p-0 rounded-lg  shrink-0 gap-0",
        icon:       "h-9  w-9  min-h-[36px] min-w-[36px] !p-0 rounded-lg  shrink-0 gap-0",
        "icon-lg":  "h-10 w-10 min-h-[40px] min-w-[40px] !p-0 rounded-xl  shrink-0 gap-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex items-center shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };
