import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface QuestProgressProps {
  objectives: string[];
  completedObjectives?: string[];
  className?: string;
}

export const QuestProgress = ({
  objectives,
  completedObjectives = [],
  className,
}: QuestProgressProps) => {
  const completedCount = completedObjectives.length;
  const totalCount = objectives.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Quest Progress
        </span>
        <Badge variant="outline" className="text-xs">
          {completedCount} / {totalCount}
        </Badge>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="space-y-2">
        {objectives.map((objective, idx) => {
          const isCompleted = completedObjectives.includes(objective);
          return (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-2 p-2 rounded-md border transition-all",
                isCompleted
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-background/50 border-border/50"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs flex-1",
                  isCompleted
                    ? "text-green-500 line-through"
                    : "text-foreground"
                )}
              >
                {objective}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};




