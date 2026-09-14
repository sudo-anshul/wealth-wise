
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Asset } from "@/types/portfolio";
import { getAssetIcon } from "@/lib/mockPortfolioData";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const Icon = getAssetIcon(asset.type);
  
  return (
    <Card className="glass-card hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${asset.growth === 'positive' ? 'bg-green-500/10' : asset.growth === 'negative' ? 'bg-red-500/10' : 'bg-gray-500/10'}`}>
            <Icon className={`h-5 w-5 ${asset.growth === 'positive' ? 'text-green-500' : asset.growth === 'negative' ? 'text-red-500' : 'text-gray-500'}`} />
          </div>
          <div>
            <h3 className="font-medium">{asset.name}</h3>
            <p className="text-sm text-white/60">{new Date(asset.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-semibold">₹{asset.value.toLocaleString()}</p>
          
          <div className="flex items-center justify-end gap-1 mt-1">
            {asset.growth === 'positive' ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : asset.growth === 'negative' ? (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            ) : (
              <Minus className="h-3 w-3 text-gray-500" />
            )}
            
            <Badge variant={asset.growth === 'positive' ? 'default' : asset.growth === 'negative' ? 'destructive' : 'outline'} className="text-xs">
              {asset.returnsPercentage > 0 ? '+' : ''}{asset.returnsPercentage.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
