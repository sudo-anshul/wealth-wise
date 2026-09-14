
import { useState } from 'react';
import { TrendingUp, Search, Bot, LineChart, Wallet, User } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ProfileMenu from '@/components/ProfileMenu';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    setIsProfileMenuOpen(prev => !prev);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  const navigateToAIGuidance = () => {
    navigate('/ai-guidance');
  };

  const navigateToMarketAnalysis = () => {
    navigate('/market-analysis');
  };

  const navigateToPortfolio = () => {
    navigate('/portfolio');
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
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-primary">InvestAI</h1>
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="text-primary font-medium transition-colors">Markets</Link>
              <Link to="/learn" className="hover:text-primary transition-colors">Learn</Link>
              <Link to="/portfolio" className="hover:text-primary transition-colors">Portfolio</Link>
              <Link to="/market-analysis" className="hover:text-primary transition-colors">Market Analysis</Link>
            </div>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your AI-Powered
            <span className="text-gradient"> Financial Assistant</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto mb-12">
            Make smarter investment decisions with personalized AI guidance. Perfect for both beginners and experienced investors.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-40" />
              <Input
                type="text"
                placeholder="Search stocks, mutual funds, or ask investment questions..."
                className="w-full pl-12 pr-4 py-6 bg-black/5 dark:bg-white/5 border rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="glass-card p-6 animate-float cursor-pointer" onClick={navigateToAIGuidance}>
              <Bot className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">AI Guidance</h3>
              <p className="opacity-60">Get personalized investment advice powered by advanced AI</p>
            </Card>

            <Card className="glass-card p-6 animate-float cursor-pointer" style={{ animationDelay: '0.2s' }} onClick={navigateToMarketAnalysis}>
              <LineChart className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Market Analysis</h3>
              <p className="opacity-60">Real-time market data and comprehensive analysis tools</p>
            </Card>

            <Card className="glass-card p-6 animate-float cursor-pointer" style={{ animationDelay: '0.4s' }} onClick={navigateToPortfolio}>
              <Wallet className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Portfolio Tracking</h3>
              <p className="opacity-60">Track and manage your investments in one place</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Market Overview</h2>
            <Button variant="ghost" className="text-primary" onClick={navigateToMarketAnalysis}>
              View All
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'NIFTY 50', value: '22,397.20', change: '-0.33%', isNegative: true },
              { name: 'SENSEX', value: '73,828.91', change: '-0.27%', isNegative: true },
              { name: 'BANK NIFTY', value: '48,060.40', change: '+0.01%', isNegative: false },
              { name: 'USD/INR', value: '87.08', change: '-0.27%', isNegative: true },
            ].map((index) => (
              <Card key={index.name} className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="opacity-60">{index.name}</span>
                  <TrendingUp className={`h-5 w-5 ${index.isNegative ? 'text-red-500' : 'text-green-500'}`} />
                </div>
                <div className="text-2xl font-semibold mb-1">{index.value}</div>
                <div className={`text-sm ${index.isNegative ? 'text-red-500' : 'text-green-500'}`}>
                  {index.change}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
