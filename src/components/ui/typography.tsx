import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-foreground font-sans antialiased", {
  variants: {
    variant: {
      display: "text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl",
      h1: "text-3xl font-bold tracking-tight sm:text-4xl",
      h2: "text-2xl font-semibold tracking-tight sm:text-3xl",
      h3: "text-xl font-semibold tracking-tight sm:text-2xl",
      h4: "text-lg font-semibold tracking-tight",
      h5: "text-base font-medium tracking-tight",
      h6: "text-sm font-medium tracking-tight",
      "body-large": "text-lg font-normal leading-relaxed text-muted-foreground",
      body: "text-base font-normal leading-normal",
      small: "text-sm font-normal text-muted-foreground",
      caption: "text-xs font-normal text-muted-foreground tracking-wide",
      label: "text-sm font-medium leading-none text-foreground select-none",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

type TypographyElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "label" | "div";

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: TypographyElement;
}

const elementMap: Record<NonNullable<VariantProps<typeof typographyVariants>["variant"]>, TypographyElement> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "body-large": "p",
  body: "p",
  small: "span",
  caption: "span",
  label: "label",
};

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = "body", weight, as, children, ...props }, ref) => {
    const Component = as || (variant ? elementMap[variant] : "p");
    return (
      <Component
        ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement & HTMLLabelElement>}
        className={cn(typographyVariants({ variant, weight }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = "Typography";
