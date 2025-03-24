
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketChart } from '@/components/market-analysis/MarketChart';
import { IndexCard } from '@/components/market-analysis/IndexCard';
import { marketIndices } from '@/lib/market-constants';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileMenu from '@/components/ProfileMenu';

const MarketAnalysis = () => {
  const [activeIndex, setActiveIndex] = useState('NIFTY50');
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleProfileClick = () => {
    setIsProfileMenuOpen(prev => !prev);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  // Close profile menu when clicking outside
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (isProfileMenuOpen) {
      closeProfileMenu();
    }
  };

  return (
    <div className="min-h-screen" onClick={handleOutsideClick}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-lg border-b z-50">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">InvestAI</h1>
            <Badge variant="outline" className="ml-2">Market Analysis</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full"
              onClick={handleProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>
            {isProfileMenuOpen && (
              <ProfileMenu 
                isOpen={isProfileMenuOpen} 
                onClose={closeProfileMenu} 
              />
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col gap-6">
          {/* Market Overview Section */}
          <section>
            <h1 className="text-3xl font-bold mb-6">Market Analysis</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {marketIndices.map((index) => (
                <IndexCard
                  key={index.id}
                  index={index}
                  onClick={() => setActiveIndex(index.id)}
                  isActive={activeIndex === index.id}
                />
              ))}
            </div>
          </section>

          {/* Chart Section */}
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{activeIndex}</h2>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Live</Badge>
                  <Badge variant="secondary">Real-time</Badge>
                </div>
              </div>
              <Tabs 
                defaultValue="1D" 
                value={activeTimeframe}
                onValueChange={setActiveTimeframe}
                className="w-fit"
              >
                <TabsList>
                  <TabsTrigger value="1D">1D</TabsTrigger>
                  <TabsTrigger value="1W">1W</TabsTrigger>
                  <TabsTrigger value="1M">1M</TabsTrigger>
                  <TabsTrigger value="1Y">1Y</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <MarketChart indexId={activeIndex} />
          </section>
          
          {/* Market Insights */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Market Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Market Sentiment</h3>
                <p className="opacity-70">Current market sentiment is bullish with positive momentum in tech and financial sectors.</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Volume Analysis</h3>
                <p className="opacity-70">Trading volume is 20% higher than the 30-day average, indicating strong market participation.</p>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;
