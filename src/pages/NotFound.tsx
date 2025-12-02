import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, AlertTriangle, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 bg-grid-dots opacity-30" />
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-[10%] w-[400px] h-[400px] rounded-full blur-[120px] bg-red-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-20 right-[10%] w-[500px] h-[500px] rounded-full blur-[150px] bg-blue-500/15 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] bg-pink-500/10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto animate-scale-in">
        {/* 404 Display */}
        <div className="relative mb-8">
          <div className="text-[180px] md:text-[220px] font-bold leading-none text-gradient opacity-20 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-3xl glass-card glow-accent flex items-center justify-center animate-float">
              <AlertTriangle className="w-16 h-16 text-pink-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="text-foreground">Page </span>
            <span className="text-gradient">not found</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Oops! The page you're looking for seems to have wandered off into the AI void.
          </p>
          <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-muted-foreground">
            <Search className="w-4 h-4" />
            <code className="text-blue-400">{location.pathname}</code>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={() => navigate("/")}
            className="gradient-primary glow-primary btn-press h-12 px-8 text-base font-bold group"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
            <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="glass hover-glow h-12 px-8 text-base font-semibold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 glass-card rounded-2xl p-6">
          <p className="text-sm text-muted-foreground mb-4">Maybe you were looking for:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/student/dashboard")}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Student Dashboard
            </Button>
            <span className="text-white/20">•</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/admin/dashboard")}
              className="text-blue-400 hover:text-blue-300"
            >
              Admin Dashboard
            </Button>
            <span className="text-white/20">•</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/student/signin")}
              className="text-pink-400 hover:text-pink-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
