import { useState, useRef, useEffect } from "react";
import { User, Bot, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { ChatMessage } from "@/components/ai-guidance/ChatMessage";
import { generatePortfolioSummary } from "@/lib/mockPortfolioData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import dotenv from "dotenv";

// Store API keys securely using environment variables
// Load environment variables
dotenv.config();

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_FOUNDARY_KEY = process.env.AZURE_FOUNDARY_KEY!;

// Ensure secrets are loaded correctly
if (!AZURE_OPENAI_ENDPOINT || !AZURE_FOUNDARY_KEY) {
  console.error("Missing OpenAI API configuration. Check your .env file.");
}

const AIGuidance = () => {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const portfolioData = generatePortfolioSummary();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out", description: "See you soon!" });
      navigate("/landing");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again.",
      });
    }
  };

  // Streaming API call to Azure OpenAI
  const fetchRagResponse = async (userQuery: string) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);
  
    try {
      const response = await fetch(AZURE_OPENAI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_FOUNDARY_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an AI investment assistant who excels in the Indian stock market." },
            { role: "user", content: userQuery },
          ],
          max_tokens: 500,
          stream: true, // Streaming enabled
        }),
      });
  
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
  
      if (reader) {
        const newAssistantMessage: { role: "user" | "assistant"; content: string } = {
          role: "assistant",
          content: "",
        };
        setMessages((prevMessages) => [...prevMessages, newAssistantMessage]);
  
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
  
          const chunk = decoder.decode(value, { stream: true });
  
          // Split and process each line of streamed JSON
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const json = JSON.parse(line.replace("data: ", ""));
                const deltaContent = json.choices[0]?.delta?.content || "";
  
                assistantMessage += deltaContent;
  
                setMessages((prevMessages) => {
                  const updatedMessages = [...prevMessages];
                  const lastMessage = updatedMessages[updatedMessages.length - 1];
  
                  if (lastMessage?.role === "assistant") {
                    lastMessage.content = assistantMessage;
                  }
  
                  return [...updatedMessages];
                });
              } catch (error) {
                console.error("Error parsing JSON chunk:", error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    await fetchRagResponse(userMessage);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-lg border-b border-white/10 z-50">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-primary">InvestAI</h1>
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="text-white/80 hover:text-primary transition-colors">
                Markets
              </Link>
              <Link to="/learn" className="text-white/80 hover:text-primary transition-colors">
                Learn
              </Link>
              <Link to="/portfolio" className="text-white/80 hover:text-primary transition-colors">
                Portfolio
              </Link>
              <Link to="/ai-guidance" className="text-primary font-medium">
                AI Guidance
              </Link>
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
                <DropdownMenuItem className="text-sm">Signed in as {user?.email}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <Card className="glass-card p-6 mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Investment Assistant</h2>
                <p className="text-white/60">
                  Ask me anything about your portfolio or investment strategies
                </p>
              </div>
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="glass-card overflow-hidden">
            <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <Bot className="h-12 w-12 mb-4" />
                  <p>Start a conversation with your AI investment assistant</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-white/60">
                      <Bot className="h-5 w-5 animate-pulse" />
                      <p>Thinking...</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your portfolio or investment advice..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  Send
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIGuidance;
