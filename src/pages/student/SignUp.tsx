import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Sparkles, Mail, Lock, User, Hash, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const StudentSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, error: authError, clearError } = useAuth();
  const [registrationId, setRegistrationId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Password validation
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      matches: password === confirmPassword && password.length > 0,
    };
  }, [password, confirmPassword]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Error",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      return;
    }

    if (!registrationId || !name || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");
    clearError();
    
    try {
      // Use the real backend API via AuthContext
      await register({
        name,
        email,
        password,
        registrationId,
      });
      
      toast({
        title: "Registration successful",
        description: "Welcome to GenAI Lab! Start your prompt engineering journey.",
      });
      // Navigation is handled by AuthContext after successful registration
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${valid ? 'text-green-400' : 'text-muted-foreground'}`}>
      {valid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 py-12">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 bg-grid-dots opacity-30" />
      
      {/* Floating Orbs */}
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full blur-[120px] bg-pink-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] rounded-full blur-[150px] bg-cyan-500/15 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] rounded-full blur-[100px] bg-orange-500/10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <Card className="glass-card border-gradient">
          <CardHeader className="space-y-6 text-center pb-6">
            <div className="w-20 h-20 rounded-3xl gradient-accent glow-accent flex items-center justify-center mx-auto animate-float">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-3">
              <CardTitle className="text-4xl font-bold text-gradient-warm tracking-tight">
                Join the Journey
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Create your account and start learning with AI
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registrationId" className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  Registration ID
                </Label>
                <Input
                  id="registrationId"
                  type="text"
                  placeholder="STU001"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass h-11 transition-all duration-300 focus:scale-[1.02] hover-glow"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  Your unique registration ID provided during enrollment
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass h-11 transition-all duration-300 focus:scale-[1.02] hover-glow"
                />
              </div>

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
                  className="glass h-11 transition-all duration-300 focus:scale-[1.02] hover-glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-pink-400" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass h-11 transition-all duration-300 focus:scale-[1.02] hover-glow"
                />
                {password && (
                  <div className="space-y-1 mt-2 p-2 rounded-lg bg-white/5">
                    <ValidationItem valid={passwordValidation.minLength} text="At least 8 characters" />
                    <ValidationItem valid={passwordValidation.hasUppercase} text="One uppercase letter" />
                    <ValidationItem valid={passwordValidation.hasLowercase} text="One lowercase letter" />
                    <ValidationItem valid={passwordValidation.hasNumber} text="One number" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-pink-400" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass h-11 transition-all duration-300 focus:scale-[1.02] hover-glow"
                />
                {confirmPassword && (
                  <ValidationItem valid={passwordValidation.matches} text="Passwords match" />
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full gradient-accent glow-accent btn-press h-12 text-base font-bold group mt-6" 
                size="lg"
                disabled={isLoading || !isPasswordValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

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
                onClick={() => navigate("/student/signin")} 
                className="text-pink-400 font-semibold hover:text-pink-300 group"
                disabled={isLoading}
              >
                Already have an account? Sign in
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

export default StudentSignUp;
