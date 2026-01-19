import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, ArrowRight, Sparkles, Lock, Loader2, CheckCircle, XCircle, AlertCircle, Mail, User } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface InviteValidation {
  valid: boolean;
  userId?: string;
  email?: string;
  name?: string;
  registrationId?: string;
  expiresAt?: string;
}

const SetupAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  
  // Validation state
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteValidation | null>(null);
  
  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationError("No invite token provided. Please use the link sent to your email.");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/validate-invite?token=${token}`);
        const data = await response.json();
        
        if (data.success && data.data?.valid) {
          setInviteData(data.data);
        } else {
          setValidationError(data.error || "Invalid or expired invite link.");
        }
      } catch (err) {
        setValidationError("Failed to validate invite link. Please try again later.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Password validation
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?]/.test(password),
      matches: password === confirmPassword && password.length > 0,
    };
  }, [password, confirmPassword]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast({
        title: "Error",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/setup-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Account Setup Complete!",
          description: "You can now login with your email and password.",
        });
        navigate("/student/signin");
      } else {
        toast({
          title: "Setup Failed",
          description: data.error || "Failed to setup account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to setup account. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${valid ? 'text-green-400' : 'text-muted-foreground'}`}>
      {valid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-primary/20">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating your invite link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-destructive/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invalid Invite Link</CardTitle>
            <CardDescription className="text-base mt-2">
              {validationError}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              If you believe this is an error, please contact your administrator to resend the invite.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="gradient-primary text-white"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success - Show password setup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative glass-card border-primary/20">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Welcome to GenAI Lab
          </CardTitle>
          <CardDescription className="text-base">
            Set up your account to get started
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User info from invite */}
          {inviteData && (
            <div className="p-4 rounded-lg bg-muted/30 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{inviteData.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{inviteData.email}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Create Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                disabled={isLoading}
              />
              
              {/* Password requirements */}
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-1 pt-2">
                  <ValidationItem valid={passwordValidation.minLength} text="8+ characters" />
                  <ValidationItem valid={passwordValidation.hasUppercase} text="Uppercase letter" />
                  <ValidationItem valid={passwordValidation.hasLowercase} text="Lowercase letter" />
                  <ValidationItem valid={passwordValidation.hasNumber} text="Number" />
                  <ValidationItem valid={passwordValidation.hasSpecial} text="Special character" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                disabled={isLoading}
              />
              {confirmPassword.length > 0 && (
                <ValidationItem valid={passwordValidation.matches} text="Passwords match" />
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full gradient-primary text-white hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Setup My Account</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            After setup, you can login with your email and the password you just created.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupAccount;
