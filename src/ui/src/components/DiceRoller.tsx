import { useState, useEffect } from "react";
import { D20 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiceRollerProps {
  diceType?: string;
  result?: number;
  onRoll?: () => void;
  rolling?: boolean;
  className?: string;
}

export const DiceRoller = ({ 
  diceType = "d20", 
  result, 
  onRoll, 
  rolling = false,
  className 
}: DiceRollerProps) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayResult, setDisplayResult] = useState<number | null>(result || null);
  const [rollHistory, setRollHistory] = useState<number[]>([]);

  useEffect(() => {
    if (result !== undefined) {
      setIsRolling(true);
      // Animate rolling
      const rollInterval = setInterval(() => {
        setDisplayResult(Math.floor(Math.random() * 20) + 1);
      }, 100);

      setTimeout(() => {
        clearInterval(rollInterval);
        setDisplayResult(result);
        setIsRolling(false);
        if (result) {
          setRollHistory(prev => [result, ...prev].slice(0, 5));
        }
      }, 1500);
    }
  }, [result]);

  const diceSize = parseInt(diceType.replace('d', '')) || 20;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        onClick={onRoll}
        disabled={rolling || isRolling}
        className={cn(
          "relative w-16 h-16 rounded-lg border-2 border-primary/50 bg-gradient-to-br from-primary/20 to-primary/10",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 hover:border-primary hover:shadow-lg hover:shadow-primary/50",
          "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          (isRolling || rolling) && "animate-spin"
        )}
      >
        <D20 className="h-8 w-8 text-primary" />
        {displayResult !== null && !isRolling && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground drop-shadow-lg">
              {displayResult}
            </span>
          </div>
        )}
        {(isRolling || rolling) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-primary animate-pulse">
              ...
            </span>
          </div>
        )}
      </button>
      {displayResult !== null && !isRolling && (
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{displayResult}</div>
          <div className="text-xs text-muted-foreground">{diceType}</div>
        </div>
      )}
      {rollHistory.length > 0 && (
        <div className="flex gap-1 mt-2">
          {rollHistory.slice(0, 3).map((roll, idx) => (
            <div
              key={idx}
              className="w-6 h-6 rounded bg-muted text-xs flex items-center justify-center text-muted-foreground"
            >
              {roll}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};




