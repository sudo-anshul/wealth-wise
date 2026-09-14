
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to login. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 auth-container ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <div className="w-full max-w-md">
        <Link to="/landing" className="text-2xl font-bold text-gradient block text-center mb-8">
          InvestAI
        </Link>
        <div className="glass-card p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
            <p className={theme === 'light' ? 'text-black/60' : 'text-white/60'}>Sign in to continue to InvestAI</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Mail className={`absolute left-3 top-3 ${theme === 'light' ? 'text-black/40' : 'text-white/40'}`} />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 ${theme === 'light' ? 'text-black/40' : 'text-white/40'}`} />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className={`text-center ${theme === 'light' ? 'text-black/60' : 'text-white/60'}`}>
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
