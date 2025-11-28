import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
  showNumbers?: boolean;
  className?: string;
  variant?: "default" | "mana" | "xp";
}

export const HealthBar = ({
  current,
  max,
  label,
  showNumbers = true,
  className,
  variant = "default",
}: HealthBarProps) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const getColorClasses = () => {
    switch (variant) {
      case "mana":
        return {
          bg: "bg-blue-500",
          bgLow: "bg-blue-400",
          glow: "shadow-blue-500/50",
        };
      case "xp":
        return {
          bg: "bg-yellow-500",
          bgLow: "bg-yellow-400",
          glow: "shadow-yellow-500/50",
        };
      default:
        return {
          bg: percentage > 50 ? "bg-green-500" : percentage > 25 ? "bg-yellow-500" : "bg-red-500",
          bgLow: percentage > 50 ? "bg-green-400" : percentage > 25 ? "bg-yellow-400" : "bg-red-400",
          glow: percentage > 50 ? "shadow-green-500/50" : percentage > 25 ? "shadow-yellow-500/50" : "shadow-red-500/50",
        };
    }
  };

  const colors = getColorClasses();
  const isLow = percentage < 25;

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {variant === "default" && <Heart className="h-3 w-3 text-red-500" />}
            <span className="font-semibold text-foreground">{label}</span>
          </div>
          {showNumbers && (
            <span className="text-muted-foreground font-mono">
              {current} / {max}
            </span>
          )}
        </div>
      )}
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden border border-border/50">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            colors.bg,
            isLow && "animate-pulse",
            percentage > 0 && `shadow-lg ${colors.glow}`
          )}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 0 && (
            <div className={cn(
              "h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent",
              "animate-shine"
            )} />
          )}
        </div>
        {percentage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] text-destructive font-bold">KO</span>
          </div>
        )}
      </div>
    </div>
  );
};




