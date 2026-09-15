
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetGroup } from "@/types/portfolio";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data for the performance chart
const generatePerformanceData = () => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  return months.map((month, index) => {
    // Create a performance data point with some randomness
    const baseValue = 1000000 + (index * 50000);
    const randomFactor = 0.9 + (Math.random() * 0.2); // Random factor between 0.9 and 1.1
    
    return {
      month,
      portfolioValue: Math.round(baseValue * randomFactor),
      benchmark: Math.round(baseValue * (0.95 + (Math.random() * 0.1))),
    };
  });
};

interface PerformanceChartProps {
  assetGroups: AssetGroup[];
}

export function PerformanceChart({ assetGroups }: PerformanceChartProps) {
  const data = generatePerformanceData();
  
  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="text-xl">Performance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis
                stroke="rgba(255, 255, 255, 0.5)"
                tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                contentStyle={{ background: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: 'white' }}
              />
              <Line
                type="monotone"
                dataKey="portfolioValue"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Your Portfolio"
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="NIFTY 50"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
