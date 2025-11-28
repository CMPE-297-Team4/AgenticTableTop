/**
 * Enhanced Fantasy Progress Bar Component
 * 
 * Styled like HP/XP/Mana bars from RPG games with
 * flowing gradients, glow effects, and low-health warnings.
 */

import { cn } from "@/lib/utils";
import { Heart, Zap, Star } from "lucide-react";

interface FantasyProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showNumbers?: boolean;
  className?: string;
  variant?: "hp" | "mana" | "xp";
  showIcon?: boolean;
}

export const FantasyProgressBar = ({
  current,
  max,
  label,
  showNumbers = true,
  className,
  variant = "hp",
  showIcon = true,
}: FantasyProgressBarProps) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = percentage < 25;

  const getVariantConfig = () => {
    switch (variant) {
      case "mana":
        return {
          icon: Zap,
          iconColor: "text-blue-400",
          gradient: "from-blue-500 via-blue-400 to-blue-500",
          glow: "shadow-blue-500/50",
          label: label || "Mana",
        };
      case "xp":
        return {
          icon: Star,
          iconColor: "text-yellow-400",
          gradient: "from-yellow-500 via-yellow-400 to-yellow-500",
          glow: "shadow-yellow-500/50",
          label: label || "Experience",
        };
      default:
        return {
          icon: Heart,
          iconColor: percentage > 50 ? "text-green-400" : percentage > 25 ? "text-yellow-400" : "text-red-400",
          gradient: percentage > 50 
            ? "from-green-500 via-green-400 to-green-500"
            : percentage > 25
            ? "from-yellow-500 via-yellow-400 to-yellow-500"
            : "from-red-500 via-red-400 to-red-500",
          glow: percentage > 50 
            ? "shadow-green-500/50"
            : percentage > 25
            ? "shadow-yellow-500/50"
            : "shadow-red-500/50",
          label: label || "Health",
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;

  return (
    <div className={cn("w-full space-y-2", className)}>
      {config.label && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {showIcon && (
              <Icon className={cn("h-4 w-4", config.iconColor)} />
            )}
            <span className="font-fantasy-heading font-semibold text-foreground uppercase tracking-wide">
              {config.label}
            </span>
          </div>
          {showNumbers && (
            <span className="text-muted-foreground font-mono text-sm">
              {current} / {max}
            </span>
          )}
        </div>
      )}
      <div className={cn(
        "progress-fantasy",
        isLow && variant === "hp" && "low-health"
      )}>
        <div
          className={cn(
            "progress-fill bg-gradient-to-r",
            config.gradient,
            `shadow-lg ${config.glow}`
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

