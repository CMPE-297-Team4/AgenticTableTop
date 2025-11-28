/**
 * Enhanced Fantasy Button Component
 * 
 * A gamified button with medieval/fantasy styling, animations,
 * and sound effects for immersive D&D gameplay.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { playSound } from "@/utils/soundEffects";

const fantasyButtonVariants = cva(
  "btn-fantasy relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90 font-fantasy-body !text-primary-foreground",
          accent: "bg-accent text-accent-foreground hover:bg-accent/90 font-fantasy-body !text-accent-foreground",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 font-fantasy-body !text-destructive-foreground",
          outline: "border-2 border-accent/60 bg-transparent hover:bg-accent/10 text-foreground font-fantasy-body",
          ghost: "hover:bg-accent/10 hover:text-accent text-foreground font-fantasy-body",
          rune: "btn-rune bg-primary/20 border-accent/60 font-fantasy-heading",
        },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface FantasyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fantasyButtonVariants> {
  asChild?: boolean;
  playSoundOnHover?: boolean;
  playSoundOnClick?: boolean;
}

const FantasyButton = React.forwardRef<HTMLButtonElement, FantasyButtonProps>(
  (
    {
      className,
      variant,
      size,
      playSoundOnHover = false,
      playSoundOnClick = false,
      onMouseEnter,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (playSoundOnHover && !props.disabled) {
        playSound('button-hover', { volume: 0.2 });
      }
      onMouseEnter?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (playSoundOnClick && !props.disabled) {
        playSound('button-click', { volume: 0.3 });
      }
      onClick?.(e);
    };

    return (
      <button
        className={cn(fantasyButtonVariants({ variant, size, className }))}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
FantasyButton.displayName = "FantasyButton";

export { FantasyButton, fantasyButtonVariants };

