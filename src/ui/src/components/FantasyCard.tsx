/**
 * Enhanced Fantasy Card Component
 * 
 * A gamified card with parchment texture, medieval borders,
 * scroll animations, and magical effects.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FantasyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "parchment" | "scroll" | "quest" | "inventory";
  withRunes?: boolean;
  animated?: boolean;
}

const FantasyCard = React.forwardRef<HTMLDivElement, FantasyCardProps>(
  ({ className, variant = "default", withRunes = false, animated = false, children, ...props }, ref) => {
    const baseClasses = "rounded-lg border text-card-foreground shadow-sm transition-all";
    
    const variantClasses = {
      default: "card-fantasy bg-card border-accent/40",
      parchment: "card-fantasy parchment-bg border-accent/40",
      scroll: "card-fantasy border-scroll bg-card/95",
      quest: "card-quest bg-card/90",
      inventory: "inventory-panel bg-card/95",
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      withRunes && "rune-border",
      animated && variant === "scroll" && "scroll-unfurl",
      className
    );

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);
FantasyCard.displayName = "FantasyCard";

const FantasyCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b border-accent/20", className)}
    {...props}
  />
));
FantasyCardHeader.displayName = "FantasyCardHeader";

const FantasyCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-fantasy-body text-glow-primary leading-none tracking-tight font-semibold",
      className
    )}
    {...props}
  />
));
FantasyCardTitle.displayName = "FantasyCardTitle";

const FantasyCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-fantasy-body", className)}
    {...props}
  />
));
FantasyCardDescription.displayName = "FantasyCardDescription";

const FantasyCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
FantasyCardContent.displayName = "FantasyCardContent";

const FantasyCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 border-t border-accent/20", className)}
    {...props}
  />
));
FantasyCardFooter.displayName = "FantasyCardFooter";

export {
  FantasyCard,
  FantasyCardHeader,
  FantasyCardFooter,
  FantasyCardTitle,
  FantasyCardDescription,
  FantasyCardContent,
};

