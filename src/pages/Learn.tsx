import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, GraduationCap, TrendingUp, ChevronRight, Gamepad, Trophy, IndianRupee, Search, Lightbulb, LogOut, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';

const Learn = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "See you soon!",
      });
      navigate('/landing');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again.",
      });
    }
  };

  // Mock data for courses
  const basicCourses = [
    {
      title: "Stock Market Basics",
      description: "Learn the fundamentals of the Indian stock market, key terminology, and how to get started.",
      level: "Beginner",
      duration: "2 hours",
      icon: Book,
      progress: 0
    },
    {
      title: "Understanding NSE & BSE",
      description: "Explore India's primary stock exchanges and how they function in the economy.",
      level: "Beginner",
      duration: "1.5 hours",
      icon: IndianRupee,
      progress: 0
    },
    {
      title: "Stock Analysis Fundamentals",
      description: "Learn how to analyze stocks using fundamental indicators and financial statements.",
      level: "Intermediate",
      duration: "3 hours",
      icon: TrendingUp,
      progress: 0
    }
  ];

  const advancedCourses = [
    {
      title: "Technical Analysis Mastery",
      description: "Master chart patterns, indicators and technical analysis for better trading decisions.",
      level: "Advanced",
      duration: "4 hours",
      icon: TrendingUp,
      progress: 0
    },
    {
      title: "Options Trading Strategies",
      description: "Learn advanced options strategies tailored for the Indian derivatives market.",
      level: "Advanced",
      duration: "5 hours",
      icon: Lightbulb,
      progress: 0
    }
  ];

  const games = [
    {
      title: "Market Simulator",
      description: "Practice trading in a risk-free environment with virtual money on real market data.",
      level: "All Levels",
      duration: "Unlimited",
      icon: Gamepad,
      badge: "Popular"
    },
    {
      title: "Stock Picking Challenge",
      description: "Compete with others to build the best performing portfolio over different time periods.",
      level: "Intermediate",
      duration: "Weekly Challenges",
      icon: Trophy,
      badge: "New"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation - reuse from Index.tsx */}
      <nav className="fixed top-0 w-full backdrop-blur-lg border-b border-white/10 z-50">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-primary">InvestAI</h1>
            <div className="hidden md:flex space-x-6">
              <a href="/" className="text-white/80 hover:text-primary transition-colors">Home</a>
              <a href="/learn" className="text-primary font-medium">Learn</a>
              <a href="#" className="text-white/80 hover:text-primary transition-colors">Portfolio</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <User className="h-5 w-5 text-white/80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-sm">
                  Signed in as {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Master the <span className="text-gradient">Indian Markets</span>
            </h1>
            <p className="text-lg text-white/60 mb-8">
              Comprehensive courses and interactive games designed to help you understand and navigate the Indian stock market with confidence.
            </p>

            {/* Search Bar */}
            <div className="relative mb-12">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
              <Input
                type="text"
                placeholder="Search courses, topics, or lessons..."
                className="w-full pl-12 py-6 bg-white/5 border-white/10 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Course Tabs */}
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="courses" className="text-sm md:text-base">
                <Book className="mr-2 h-4 w-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="games" className="text-sm md:text-base">
                <Gamepad className="mr-2 h-4 w-4" />
                Gamified Learning
              </TabsTrigger>
              <TabsTrigger value="webinars" className="text-sm md:text-base">
                <GraduationCap className="mr-2 h-4 w-4" />
                Webinars
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses" className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Beginner Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {basicCourses.map((course, index) => (
                    <Card key={index} className="glass-card hover-scale">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <course.icon className="h-10 w-10 text-primary mb-2" />
                          <Badge variant="outline" className="text-xs">{course.level}</Badge>
                        </div>
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        <CardDescription className="text-white/60">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-white/60">
                          <span>{course.duration}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button className="w-full bg-primary/10 hover:bg-primary/20 text-primary">
                          Start Course
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-6">Advanced Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {advancedCourses.map((course, index) => (
                    <Card key={index} className="glass-card hover-scale">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <course.icon className="h-10 w-10 text-primary mb-2" />
                          <Badge variant="outline" className="text-xs bg-primary/20 text-primary border-primary/20">
                            {course.level}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        <CardDescription className="text-white/60">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-white/60">
                          <span>{course.duration}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button className="w-full bg-primary/10 hover:bg-primary/20 text-primary">
                          Start Course
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="games" className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Interactive Games & Challenges</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {games.map((game, index) => (
                    <Card key={index} className="glass-card hover-scale">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <game.icon className="h-10 w-10 text-primary mb-2" />
                          <Badge variant={game.badge === "New" ? "default" : "secondary"} className="text-xs">
                            {game.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{game.title}</CardTitle>
                        <CardDescription className="text-white/60">
                          {game.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-white/60">
                          <span>{game.duration}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button className="w-full">
                          Play Now
                          <Gamepad className="h-4 w-4 ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="webinars" className="space-y-8">
              <div className="text-center py-16">
                <GraduationCap className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Coming Soon!</h3>
                <p className="text-white/60 max-w-md mx-auto">
                  Live webinars with market experts will be available soon. Subscribe to get notified.
                </p>
                <Button className="mt-6">Get notified</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-20 px-4 bg-white/5">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Your Learning Path</h2>
          </div>
          
          <Card className="glass-card p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-primary/20 rounded-full p-6">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Start your investment journey</h3>
                <p className="text-white/60 mb-4">
                  We've designed a personalized learning path to help you become a confident investor in the Indian stock market.
                </p>
                <Button>View Recommended Path</Button>
              </div>
            </div>
          </Card>
          
          <Card className="glass-card p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Track Your Progress</CardTitle>
              <CardDescription className="text-white/60">
                Complete courses to earn certificates and track your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '25%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">0/12 courses completed</span>
                <span className="text-white/60">25% complete</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Learn;
