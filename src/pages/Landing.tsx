
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bot, LineChart, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-lg border-b border-white/10 z-50">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gradient">InvestAI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-white/80 hover:text-primary">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
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
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12">
            Make smarter investment decisions with personalized AI guidance. Perfect for both beginners and experienced investors.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
              <Input
                type="text"
                placeholder="Search stocks, mutual funds, or ask investment questions..."
                className="w-full pl-12 pr-4 py-6 bg-white/5 border-white/10 rounded-full text-white"
                onClick={() => navigate('/login')}
                readOnly
              />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="glass-card p-6 animate-float">
              <Bot className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">AI Guidance</h3>
              <p className="text-white/60">Get personalized investment advice powered by advanced AI</p>
            </Card>

            <Card className="glass-card p-6 animate-float" style={{ animationDelay: '0.2s' }}>
              <LineChart className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Market Analysis</h3>
              <p className="text-white/60">Real-time market data and comprehensive analysis tools</p>
            </Card>

            <Card className="glass-card p-6 animate-float" style={{ animationDelay: '0.4s' }}>
              <Wallet className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Portfolio Tracking</h3>
              <p className="text-white/60">Track and manage your investments in one place</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
