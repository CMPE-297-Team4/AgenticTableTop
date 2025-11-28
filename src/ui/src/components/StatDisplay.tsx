import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatDisplayProps {
  label: string;
  value: number;
  modifier?: number;
  className?: string;
  highlight?: boolean;
}

export const StatDisplay = ({
  label,
  value,
  modifier,
  className,
  highlight = false,
}: StatDisplayProps) => {
  const mod = modifier !== undefined ? modifier : Math.floor((value - 10) / 2);
  const modDisplay = mod >= 0 ? `+${mod}` : `${mod}`;

  return (
    <Card
      className={cn(
        "p-2 border transition-all",
        highlight
          ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
          : "border-border/50 bg-card/50 hover:border-border hover:bg-card/70"
      )}
    >
      <CardContent className="p-0 space-y-1">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">{value}</span>
          {modifier !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono px-1.5 py-0",
                mod > 0
                  ? "border-green-500/50 text-green-500 bg-green-500/10"
                  : mod < 0
                  ? "border-red-500/50 text-red-500 bg-red-500/10"
                  : "border-muted-foreground/50"
              )}
            >
              {mod > 0 ? (
                <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
              ) : mod < 0 ? (
                <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              ) : (
                <Minus className="h-2.5 w-2.5 mr-0.5" />
              )}
              {modDisplay}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};




