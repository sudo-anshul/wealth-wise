
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketIndex } from "@/lib/market-constants";

interface IndexCardProps {
  index: MarketIndex;
  onClick: () => void;
  isActive: boolean;
}

export const IndexCard = ({ index, onClick, isActive }: IndexCardProps) => {
  const isPositive = parseFloat(index.change) >= 0;

  return (
    <Card
      className={cn(
        "glass-card p-4 cursor-pointer transition-all duration-200 hover:scale-105",
        isActive && "border-primary"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60">{index.name}</span>
        {isPositive ? (
          <TrendingUp className="h-5 w-5 text-green-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="text-2xl font-semibold mb-1">{index.value}</div>
      <div className={cn(
        "text-sm",
        isPositive ? "text-green-500" : "text-red-500"
      )}>
        {index.change}
      </div>
    </Card>
  );
};
