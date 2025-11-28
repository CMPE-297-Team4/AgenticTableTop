import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Target, Crown, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  type: "quest" | "act" | "level" | "achievement" | "milestone";
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconMap = {
  quest: Target,
  act: BookOpen,
  level: Star,
  achievement: Award,
  milestone: Crown,
};

export const AchievementBadge = ({
  type,
  label,
  className,
  size = "md",
}: AchievementBadgeProps) => {
  const Icon = iconMap[type] || Trophy;
  
  const sizeClasses = {
    sm: "h-3 w-3 text-xs px-1.5 py-0.5",
    md: "h-4 w-4 text-sm px-2 py-1",
    lg: "h-5 w-5 text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20",
        "border-yellow-500/50 text-yellow-500",
        "shadow-lg shadow-yellow-500/20",
        "animate-pulse",
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn("mr-1", size === "sm" ? "h-2.5 w-2.5" : size === "md" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      {label}
    </Badge>
  );
};

