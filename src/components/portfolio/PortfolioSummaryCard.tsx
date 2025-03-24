
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PortfolioSummary } from "@/types/portfolio";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary;
}

export function PortfolioSummaryCard({ summary }: PortfolioSummaryCardProps) {
  const isPositiveReturn = summary.totalReturnsPercentage >= 0;
  
  return (
    <Card className="glass-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Portfolio Summary</CardTitle>
        <Wallet className="h-5 w-5 text-primary" />
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Portfolio Value</h3>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">₹{summary.totalValue.toLocaleString()}</span>
            </div>
            <Progress value={100} className="h-1.5 mt-3" />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">Total Investment</h4>
              <p className="text-lg font-semibold">₹{summary.totalInvestment.toLocaleString()}</p>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">Total Returns</h4>
              <div className="flex items-center gap-1">
                <p className={`text-lg font-semibold ${isPositiveReturn ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositiveReturn ? '+' : ''}₹{summary.totalReturns.toLocaleString()}
                </p>
                
                <div className="flex items-center">
                  {isPositiveReturn ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${isPositiveReturn ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositiveReturn ? '+' : ''}{summary.totalReturnsPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
