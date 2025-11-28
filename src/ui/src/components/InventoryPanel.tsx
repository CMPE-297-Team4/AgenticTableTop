/**
 * Inventory-Style Menu Component
 * 
 * A gamified panel component styled like an RPG inventory,
 * with item slots, hover effects, and category organization.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { FantasyCard } from "./FantasyCard";

export interface InventoryItem {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  quantity?: number;
  onClick?: () => void;
}

export interface InventoryCategory {
  name: string;
  items: InventoryItem[];
}

interface InventoryPanelProps {
  categories: InventoryCategory[];
  className?: string;
  onItemClick?: (item: InventoryItem) => void;
}

const rarityColors = {
  common: "border-gray-500/50 text-gray-400",
  uncommon: "border-green-500/50 text-green-400",
  rare: "border-blue-500/50 text-blue-400",
  epic: "border-purple-500/50 text-purple-400",
  legendary: "border-yellow-500/50 text-yellow-400",
};

const rarityGlows = {
  common: "shadow-gray-500/20",
  uncommon: "shadow-green-500/30",
  rare: "shadow-blue-500/40",
  epic: "shadow-purple-500/50",
  legendary: "shadow-yellow-500/60",
};

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  categories,
  className,
  onItemClick,
}) => {
  return (
    <FantasyCard variant="inventory" className={cn("w-full", className)}>
      <div className="p-6 space-y-6">
        {categories.map((category, categoryIdx) => (
          <div key={categoryIdx} className="space-y-3">
            <h3 className="font-fantasy-heading text-lg text-accent border-b border-accent/30 pb-2">
              {category.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "inventory-item",
                    item.rarity && rarityColors[item.rarity],
                    item.rarity && rarityGlows[item.rarity],
                    "cursor-pointer"
                  )}
                  onClick={() => {
                    item.onClick?.();
                    onItemClick?.(item);
                  }}
                  title={item.description || item.name}
                >
                  <div className="flex flex-col items-center gap-2 p-2">
                    {item.icon && (
                      <div className="text-3xl">{item.icon}</div>
                    )}
                    <div className="text-xs font-fantasy-body text-center">
                      {item.name}
                    </div>
                    {item.quantity !== undefined && item.quantity > 1 && (
                      <div className="absolute top-1 right-1 bg-accent/80 text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.quantity}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </FantasyCard>
  );
};

