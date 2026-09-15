
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetGroup } from "@/types/portfolio";

interface AssetAllocationChartProps {
  assetGroups: AssetGroup[];
}

export function AssetAllocationChart({ assetGroups }: AssetAllocationChartProps) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartData = useMemo(() => 
    assetGroups.map(group => ({
      name: group.label,
      value: group.totalValue,
      color: group.color,
      allocation: group.allocation
    })),
  [assetGroups]);

  // For mobile, show only top 5 allocations and group the rest as "Others"
  const processedData = useMemo(() => {
    if (windowWidth >= 768 || chartData.length <= 5) return chartData;
    
    const topFive = chartData.slice(0, 5);
    const others = chartData.slice(5).reduce(
      (acc, item) => {
        acc.value += item.value;
        return acc;
      },
      { name: 'Others', value: 0, color: '#6B7280', allocation: 0 }
    );
    
    others.allocation = (others.value / assetGroups.reduce((sum, group) => sum + group.totalValue, 0)) * 100;
    
    return [...topFive, others];
  }, [chartData, assetGroups, windowWidth]);

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="text-xl">Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={windowWidth < 768 ? 80 : 100}
                innerRadius={windowWidth < 768 ? 40 : 60}
                paddingAngle={4}
                dataKey="value"
                label={({ allocation }) => `${allocation.toFixed(1)}%`}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
                contentStyle={{ background: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
