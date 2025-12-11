import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Sparkles, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const StudentSignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the real backend API for authentication
      await login({ email, password });
      toast({
        title: "Login successful",
        description: "Welcome back! Continue your prompt engineering journey.",
      });
      // Navigation is handled automatically by AuthContext based on user role
    } catch (err: any) {
      const errorMessage = err?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 bg-grid-dots opacity-30" />
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-[400px] h-[400px] rounded-full blur-[120px] bg-cyan-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-40 right-20 w-[500px] h-[500px] rounded-full blur-[150px] bg-blue-500/15 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-1/4 w-[350px] h-[350px] rounded-full blur-[100px] bg-pink-500/10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <Card className="glass-card border-gradient">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="w-20 h-20 rounded-3xl gradient-secondary glow-secondary flex items-center justify-center mx-auto animate-float">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-3">
              <CardTitle className="text-4xl font-bold text-gradient tracking-tight">
                Student Portal
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Continue your AI learning journey
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass h-12 text-base transition-all duration-300 focus:scale-[1.02] hover-glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-pink-400" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="glass h-12 text-base transition-all duration-300 focus:scale-[1.02] hover-glow pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full gradient-secondary glow-secondary btn-press h-12 text-base font-bold group mt-8" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Info about registration */}
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
              <p className="font-semibold mb-1">Don't have an account?</p>
              <p>You need to sign up first to access the platform.</p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="text-center">
              <Button 
                variant="link" 
                onClick={() => navigate("/student/signup")} 
                className="text-cyan-400 font-semibold hover:text-cyan-300 group"
                disabled={isLoading}
              >
                Don't have an account? Sign up
                <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Link */}
        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentSignIn;
