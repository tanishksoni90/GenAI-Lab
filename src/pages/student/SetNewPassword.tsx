import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { KeyRound, Eye, EyeOff, Shield, CheckCircle, Loader2 } from "lucide-react";

const SetNewPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/student/signin");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Password strength indicators
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  
  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const canSubmit = isPasswordStrong && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Please meet all password requirements");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.setNewPassword({ newPassword });
      
      toast({
        title: "Password Set Successfully",
        description: "Your new password has been saved. You can now use the platform.",
      });

      // Refresh user data to clear mustChangePassword flag
      await refreshUser();
      
      // Redirect to dashboard
      navigate("/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to set new password");
      toast({
        title: "Error",
        description: err.message || "Failed to set new password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-emerald-400" : "text-muted-foreground"}`}>
      {met ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <div className="w-4 h-4 rounded-full border border-muted-foreground" />
      )}
      {text}
    </div>
  );

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
      
      <Card className="w-full max-w-md glass-card relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Set Your New Password</CardTitle>
            <CardDescription className="mt-2">
              Your password has been reset by an administrator. Please set a new secure password to continue.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-6 bg-amber-500/10 border-amber-500/30">
            <KeyRound className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              For your security, you must set a new password. The temporary password provided by admin will no longer work after this.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="p-4 glass rounded-lg space-y-2">
              <p className="text-sm font-medium mb-3">Password Requirements:</p>
              <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
              <PasswordRequirement met={hasUppercase} text="One uppercase letter (A-Z)" />
              <PasswordRequirement met={hasLowercase} text="One lowercase letter (a-z)" />
              <PasswordRequirement met={hasNumber} text="One number (0-9)" />
              <PasswordRequirement met={hasSpecial} text="One special character (!@#$%^&*)" />
              <div className="pt-2 border-t border-white/10 mt-2">
                <PasswordRequirement met={passwordsMatch} text="Passwords match" />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting Password...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Set New Password
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Welcome back, <span className="text-primary font-medium">{user?.name || "Student"}</span>!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetNewPassword;
