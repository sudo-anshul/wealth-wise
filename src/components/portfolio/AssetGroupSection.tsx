
import { AssetGroup } from "@/types/portfolio";
import { AssetCard } from "./AssetCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssetIcon } from "@/lib/mockPortfolioData";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AssetGroupSectionProps {
  group: AssetGroup;
}

export function AssetGroupSection({ group }: AssetGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = getAssetIcon(group.type);
  
  return (
    <Card className="glass-card mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full`} style={{ backgroundColor: `${group.color}20` }}>
            <Icon className="h-5 w-5" style={{ color: group.color }} />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {group.label}
              <Badge className="ml-2" style={{ backgroundColor: group.color }}>
                {group.allocation.toFixed(1)}%
              </Badge>
            </CardTitle>
            <p className="text-sm text-white/60">Total: ₹{group.totalValue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              {group.returnsPercentage > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : group.returnsPercentage < 0 ? (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-500" />
              )}
              <span className={`${group.returnsPercentage > 0 ? 'text-green-500' : group.returnsPercentage < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {group.returnsPercentage > 0 ? '+' : ''}{group.returnsPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            {group.assets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
