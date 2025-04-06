import { useState, useRef, useEffect } from "react";
import { User, Bot, LogOut, Settings } from "lucide-react"; // Make sure lucide-react is installed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext"; // Ensure this path is correct
import { useNavigate, Link } from "react-router-dom"; // Ensure react-router-dom is installed
// import { useToast } from '@/hooks/use-toast'; // Use this path if it's correct for your setup
import { useToast } from "@/components/ui/use-toast"; // Or use this path if toast comes from Shadcn ui directly
import { ChatMessage } from "@/components/ai-guidance/ChatMessage"; // Ensure this component exists
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { query } from "firebase/firestore";

const AIGuidance = () => {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth(); // Make sure AuthProvider is wrapping your app
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize useToast hook

  useEffect(() => {
    // Add initial greeting message from the bot when component mounts
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your AI Financial Advisor. How can I help you with market analysis, investment strategies, or specific stock information today? Please remember, this is for informational purposes only.",
      },
    ]);
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "See you soon!",
      });
      navigate("/landing"); // Ensure '/landing' route exists
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return; // Prevent submission if empty or already loading

    const userMessage = trimmedInput;
    setInput(""); // Clear input immediately
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Call the backend API for the multi-agent system
      const response = await fetch(
        "https://multi-agent-advisor.onrender.com/consult",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: userMessage }), // Send the user input as the prompt
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error(
          "Multi-Agent System Error:",
          data.error || response.statusText
        );
        toast({
          variant: "destructive",
          title: "Error",
          description:
            data.error ||
            "Failed to process your request. Please try again later.",
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm sorry, I encountered an issue processing your request. Please try again later.",
          },
        ]);
      } else {
        // Add the successful response from the multi-agent system to the chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response, // Assuming the API returns the response in a `response` field
          },
        ]);
      }
    } catch (error) {
      console.error("Network Error:", error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description:
          "Failed to communicate with the backend service. Please check your connection and try again.",
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't reach the backend service right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false); // Ensure loading state is reset
    }
  };

  // Example queries (unchanged)
  const exampleQueries = [
    "Analyze market trends for tech sector",
    "What are common strategies for long-term retirement savings?",
    "Explain diversification with examples",
    "Tell me about recent performance for GOOGL and AMZN", // Use common tickers
  ];

  const handleExampleQueryClick = (query: string) => {
    if (isLoading) return; // Don't change input if loading
    setInput(query);
    // Optional: focus the input field after clicking
    // document.getElementById('chat-input')?.focus();
  };

  // Auto-scroll effect (unchanged)
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    // Make sure your CSS/Tailwind setup includes styles for glass-card, text-primary etc.
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {" "}
      {/* Added a background */}
      {/* Navigation (ensure Links point to valid routes) */}
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {" "}
          {/* Added px-4 for padding */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-primary">
              InvestAI
            </Link>{" "}
            {/* Link the title */}
            <div className="hidden md:flex space-x-6">
              {/* Use consistent styling */}
              <Link
                to="/"
                className="text-gray-300 hover:text-primary transition-colors"
              >
                Markets
              </Link>
              <Link
                to="/learn"
                className="text-gray-300 hover:text-primary transition-colors"
              >
                Learn
              </Link>
              <Link
                to="/portfolio"
                className="text-gray-300 hover:text-primary transition-colors"
              >
                Portfolio
              </Link>
              <Link to="/ai-guidance" className="text-primary font-semibold">
                AI Guidance
              </Link>{" "}
              {/* Make current page bold */}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? ( // Show dropdown only if user is logged in
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-white/10"
                  >
                    <User className="h-5 w-5 text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-800 border-gray-700 text-white"
                >
                  {" "}
                  {/* Styled dropdown */}
                  <DropdownMenuItem disabled className="text-sm text-gray-400">
                    {user?.email || "User"}
                  </DropdownMenuItem>
                  {/* Add other items like Settings if needed */}
                  {/* <DropdownMenuItem className="hover:bg-gray-700">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem> */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-red-600/50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                {" "}
                {/* Provide a login link if not logged in */}
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="container mx-auto pt-24 pb-16 px-4">
        {" "}
        {/* Consistent padding */}
        <div className="max-w-4xl mx-auto">
          {/* Chat Area */}
          <Card className="bg-gray-800/60 border border-white/10 overflow-hidden shadow-xl">
            {" "}
            {/* Subtle style */}
            <ScrollArea
              className="h-[calc(100vh-280px)] min-h-[400px] p-4"
              ref={scrollAreaRef}
            >
              {" "}
              {/* Dynamic height */}
              {messages.length === 0 && !isLoading ? ( // Show initial state only if not loading
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                  <Bot className="h-12 w-12 mb-4 text-primary" />
                  <p>
                    Ask about market analysis, investment strategies, or
                    specific stocks.
                  </p>
                  <p className="text-xs mt-2">
                    (e.g., "Compare AAPL and MSFT performance")
                  </p>
                  {/* Display example queries here if preferred over the separate card */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {exampleQueries.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleQueryClick(q)}
                        className="p-2 rounded border border-white/20 hover:bg-white/10 transition-colors text-left text-gray-300"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} /> // Ensure ChatMessage component handles styling
                  ))}
                  {isLoading && (
                    <div className="flex items-center space-x-3 text-gray-400 px-4 py-2">
                      <Bot className="h-5 w-5 text-primary animate-pulse" />
                      <p className="text-sm animate-pulse">Thinking...</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-white/10 bg-gray-800/80"
            >
              <div className="flex space-x-2">
                <Input
                  id="chat-input" // Added ID for potential focus() targeting
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your financial question..."
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-lg" // Style input
                  disabled={isLoading}
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>{" "}
                      {/* Simple loading spinner */}
                      Sending...
                    </>
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Disclaimer (already present in AI response, but can keep a short one here too) */}
          <div className="mt-6 text-xs text-gray-500 text-center px-4">
            <p>
              AI-generated content is for informational purposes only. Always
              consult with a qualified financial professional before making
              investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGuidance;
