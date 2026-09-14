
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';

interface MarketChartProps {
  indexId: string;
}

// Generate mock data for different indices
const generateMockData = (indexId: string) => {
  const baseValue = {
    'NIFTY50': 22397,
    'SENSEX': 73828,
    'BANKNIFTY': 48060,
    'USDINR': 87.08
  }[indexId] || 10000;
  
  const data = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60000);
    const hourFormatted = time.getHours().toString().padStart(2, '0');
    const minuteFormatted = time.getMinutes().toString().padStart(2, '0');
    
    const randomFactor = Math.random() * 0.02 - 0.01; // -1% to +1%
    const value = baseValue * (1 + randomFactor);
    
    data.push({
      timestamp: `${hourFormatted}:${minuteFormatted}`,
      value: value.toFixed(2)
    });
  }
  
  return data;
};

export const MarketChart = ({ indexId }: MarketChartProps) => {
  const [data, setData] = useState<any[]>([]);

  // Load mock data on component mount and when indexId changes
  useEffect(() => {
    // Generate initial data
    const initialData = generateMockData(indexId);
    setData(initialData);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      const lastPoint = data[data.length - 1];
      if (!lastPoint) return;
      
      const now = new Date();
      const hourFormatted = now.getHours().toString().padStart(2, '0');
      const minuteFormatted = now.getMinutes().toString().padStart(2, '0');
      
      const lastValue = parseFloat(lastPoint.value);
      const randomChange = (Math.random() * 0.005 - 0.0025) * lastValue;
      const newValue = lastValue + randomChange;
      
      const newData = [...data.slice(1), {
        timestamp: `${hourFormatted}:${minuteFormatted}`,
        value: newValue.toFixed(2)
      }];
      
      setData(newData);
    }, 5000);
    
    console.log(`Connected to mock data stream for ${indexId}`);
    
    return () => {
      clearInterval(interval);
      console.log(`Disconnected from mock data stream for ${indexId}`);
    };
  }, [indexId]);

  return (
    <div className="w-full h-[400px]">
      <ChartContainer
        config={{
          line: {
            theme: {
              light: "rgba(0, 220, 130, 1)",
              dark: "rgba(0, 220, 130, 1)",
            },
          },
          area: {
            theme: {
              light: "rgba(0, 220, 130, 0.1)",
              dark: "rgba(0, 220, 130, 0.1)",
            },
          },
        }}
      >
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0, 220, 130, 0.2)" />
              <stop offset="100%" stopColor="rgba(0, 220, 130, 0)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <ChartTooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgba(0, 220, 130, 1)"
            fill="url(#gradient)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
