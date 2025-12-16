import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import SkyToggle from "@/components/ui/sky-toggle";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  GraduationCap, Brain, Sparkles, Zap, Users, 
  MessageSquare, ArrowRight,
  ChevronRight, Star, Target, Rocket,
  CheckCircle2, Bot, Layers, Lock, 
  Cpu, Wand2, ArrowUpRight
} from "lucide-react";

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const numValue = parseInt(value.replace(/\D/g, ''));
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [numValue]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Floating Orb Component
const FloatingOrb = ({ className, color, delay = 0 }: { className: string; color: string; delay?: number }) => (
  <div 
    className={`absolute rounded-full blur-3xl animate-pulse-glow ${className}`}
    style={{ 
      background: color,
      animationDelay: `${delay}s`
    }}
  />
);

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isDark, toggleTheme } = useTheme();

  // Spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Multiple AI Models",
      description: "Access GPT-4, Claude, Gemini, DALL-E and more in one unified platform",
      gradient: "gradient-primary",
      glow: "glow-primary"
    },
    {
      icon: Lock,
      title: "Smart Guardrails",
      description: "AI-powered safety measures ensure responsible and ethical learning",
      gradient: "gradient-accent",
      glow: "glow-accent"
    },
    {
      icon: Target,
      title: "Prompt Scoring",
      description: "Get real-time feedback on your prompts with scores out of 100",
      gradient: "gradient-secondary",
      glow: "glow-secondary"
    },
    {
      icon: Users,
      title: "Leaderboard Rankings",
      description: "Compete with peers and track your course & institutional rank",
      gradient: "gradient-tertiary",
      glow: "glow-tertiary"
    },
    {
      icon: Bot,
      title: "Custom AI Agents",
      description: "Create personalized AI assistants with your own knowledge base",
      gradient: "gradient-primary",
      glow: "glow-primary"
    },
    {
      icon: Zap,
      title: "Token Management",
      description: "Track your usage with allocated token quotas and real-time balance",
      gradient: "gradient-secondary",
      glow: "glow-secondary"
    }
  ];

  const stats = [
    { value: "500", suffix: "+", label: "Active Students", icon: Users },
    { value: "15", suffix: "+", label: "AI Models", icon: Cpu },
    { value: "10000", suffix: "+", label: "Prompts Scored", icon: Target },
    { value: "98", suffix: "%", label: "Satisfaction", icon: Star }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Data Analytics Trainee",
      content: "The prompt scoring system really helped me understand what makes a good prompt. Went from 45 to 85 average score in just 2 weeks!",
      avatar: "PS",
      gradient: "gradient-primary"
    },
    {
      name: "Arjun Patel",
      role: "AI/ML Intern",
      content: "Being able to try GPT-4, Claude, and Gemini in one place is amazing. The leaderboard keeps me motivated to improve every day.",
      avatar: "AP",
      gradient: "gradient-accent"
    },
    {
      name: "Sneha Reddy",
      role: "GenAI Enthusiast",
      content: "Creating custom AI agents with my own knowledge base was a game-changer. Now I have an assistant that knows my study material!",
      avatar: "SR",
      gradient: "gradient-secondary"
    }
  ];

  const bentoFeatures = [
    {
      title: "Intelligent Conversations",
      description: "Have natural, flowing conversations with AI models that understand context and nuance",
      icon: MessageSquare,
      className: "md:col-span-2 md:row-span-2",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      title: "Image Generation",
      description: "Create visuals with DALL-E 3",
      icon: Layers,
      className: "",
      gradient: "from-pink-500/20 to-rose-500/20"
    },
    {
      title: "Audio Generation",
      description: "Text-to-speech with ElevenLabs",
      icon: Zap,
      className: "",
      gradient: "from-emerald-500/20 to-green-500/20"
    },
    {
      title: "Safe Learning Environment",
      description: "Built-in guardrails protect students while enabling exploration",
      icon: Lock,
      className: "md:col-span-2",
      gradient: "from-orange-500/20 to-amber-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Shader Animation Background */}
      <div className="fixed inset-0 opacity-40">
        <ShaderAnimation />
      </div>
      
      {/* Aurora Background Overlay */}
      <div className="fixed inset-0 bg-aurora opacity-60" />
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-grid-dots opacity-20" />
      
      {/* Floating Orbs */}
      <FloatingOrb className="w-[600px] h-[600px] top-[-200px] left-[-200px]" color="hsl(217 91% 60% / 0.15)" delay={0} />
      <FloatingOrb className="w-[500px] h-[500px] top-[20%] right-[-100px]" color="hsl(172 66% 50% / 0.12)" delay={1} />
      <FloatingOrb className="w-[400px] h-[400px] bottom-[10%] left-[10%]" color="hsl(330 85% 60% / 0.1)" delay={2} />
      <FloatingOrb className="w-[300px] h-[300px] bottom-[-100px] right-[20%]" color="hsl(25 95% 55% / 0.12)" delay={3} />

      {/* Noise Texture */}
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Navigation - Sticky */}
      <nav className="sticky top-0 z-[100] px-6 py-4 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/genai-lab-logo.svg" 
              alt="GenAI Lab Logo" 
              className="w-10 h-10 rounded-xl"
            />
            <span className="text-xl font-bold">GenAI Lab</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <SkyToggle checked={isDark} onChange={toggleTheme} />
            <Button 
              variant="ghost" 
              onClick={() => navigate("/student/signin")} 
              className="text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate("/student/signup")} 
              className="gradient-primary glow-primary btn-press"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative z-10 px-6 pt-24 pb-32"
        style={{
          '--mouse-x': `${mousePosition.x}%`,
          '--mouse-y': `${mousePosition.y}%`,
        } as React.CSSProperties}
      >
        {/* Spotlight */}
        <div className="absolute inset-0 bg-spotlight pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">Master Prompt Engineering with AI</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Main Heading */}
            <h1 className="heading-xl animate-slide-up">
              <span className="text-foreground">Learn AI with</span>
              <br />
              <span className="text-gradient">Intelligent Guidance</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-slide-up stagger-1">
              The premier platform for students to explore AI responsibly. 
              Multiple models, smart guardrails, and real-time prompt scoring.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up stagger-2">
              <Button 
                size="lg" 
                onClick={() => navigate("/student/signup")}
                className="gradient-primary glow-primary btn-press h-14 px-8 text-lg font-semibold group"
              >
                <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Learning Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/student/signin")}
                className="glass hover-glow h-14 px-8 text-lg font-medium group"
              >
                Already have an account? Sign In
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 animate-fade-in stagger-3">
              {[
                "Free allocated tokens",
                "Real-time prompt scoring", 
                "10+ AI models"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
        </div>

          {/* Hero Visual - Bento Grid Preview */}
          <div className="mt-20 animate-slide-up stagger-4">
            <div className="glass-card p-3 max-w-5xl mx-auto glow-border">
              <div className="rounded-xl overflow-hidden bg-background/50 p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Main Chat Area */}
                  <div className="md:col-span-2 glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="h-3 w-32 bg-foreground/20 rounded animate-pulse" />
                        <div className="h-2 w-20 bg-foreground/10 rounded mt-2" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="glass rounded-xl p-4">
                        <div className="h-2 w-full bg-foreground/10 rounded" />
                        <div className="h-2 w-3/4 bg-foreground/10 rounded mt-2" />
                      </div>
                      <div className="glass rounded-xl p-4 ml-12 border-l-2 border-primary">
                        <div className="h-2 w-full bg-primary/20 rounded" />
                        <div className="h-2 w-5/6 bg-primary/15 rounded mt-2" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="glass rounded-2xl p-4 space-y-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Models</div>
                    {['GPT-4', 'Claude 3', 'Gemini Pro'].map((model, i) => (
                      <div 
                        key={model} 
                        className={`glass rounded-xl p-3 flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer ${i === 0 ? 'border border-primary/50' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                        <span className="text-sm font-medium">{model}</span>
                        {i === 0 && <Badge className="ml-auto text-[10px] gradient-primary">Active</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="hidden lg:block">
              <div className="absolute left-[5%] top-[60%] w-16 h-16 rounded-2xl gradient-accent glow-accent flex items-center justify-center animate-float">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute right-[5%] top-[50%] w-14 h-14 rounded-2xl gradient-secondary glow-secondary flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                <Wand2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${
                    idx === 0 ? 'gradient-primary glow-primary' :
                    idx === 1 ? 'gradient-secondary glow-secondary' :
                    idx === 2 ? 'gradient-accent glow-accent' :
                    'gradient-tertiary glow-tertiary'
                  }`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="gradient-accent glow-accent px-4 py-1.5">
              <Zap className="w-3 h-3 mr-1.5" />
              Powerful Features
            </Badge>
            <h2 className="heading-lg">
              Everything you need to <span className="text-gradient">master AI</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for students, trusted by educators. Powerful AI with responsible learning.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            {bentoFeatures.map((feature, idx) => (
              <Card 
                key={idx}
                className={`glass-card card-hover overflow-hidden group ${feature.className}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="relative p-6 h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                    idx === 0 ? 'gradient-primary glow-primary' :
                    idx === 1 ? 'gradient-accent glow-accent' :
                    idx === 2 ? 'gradient-secondary glow-secondary' :
                    'gradient-tertiary glow-tertiary'
                  } group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm flex-grow">{feature.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="glass-card card-hover overflow-hidden group animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl ${feature.gradient} ${feature.glow} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="gradient-secondary glow-secondary px-4 py-1.5">
              <Star className="w-3 h-3 mr-1.5" />
              Student Stories
            </Badge>
            <h2 className="heading-lg">
              Loved by <span className="text-gradient-warm">students</span> everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card 
                key={idx} 
                className="glass-card card-hover animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground/90 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${testimonial.gradient} flex items-center justify-center text-white font-bold`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="gradient-tertiary glow-tertiary px-4 py-1.5">
              <Rocket className="w-3 h-3 mr-1.5" />
              Simple Process
            </Badge>
            <h2 className="heading-lg">
              How it <span className="text-gradient-rainbow">works</span>
            </h2>
            <p className="text-xl text-muted-foreground">Start learning in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Sign Up",
                description: "Register with your Registration ID provided by your institution",
                icon: GraduationCap,
                gradient: "gradient-primary"
              },
              {
                step: "02", 
                title: "Choose AI Model",
                description: "Select from GPT-4, Claude, Gemini, DALL-E, and more",
                icon: Brain,
                gradient: "gradient-secondary"
              },
              {
                step: "03",
                title: "Start Learning",
                description: "Write prompts, get scored, and climb the leaderboard",
                icon: Target,
                gradient: "gradient-accent"
              }
            ].map((item, idx) => (
              <Card key={idx} className="glass-card card-hover group text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="text-6xl font-bold text-foreground/10 mb-4">{item.step}</div>
                  <div className={`w-16 h-16 rounded-2xl ${item.gradient} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10" />
            <div className="absolute inset-0 bg-grid-dots opacity-20" />
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent glow-accent mb-4">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="heading-lg">
                Ready to transform your <span className="text-gradient">learning?</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join students who are mastering prompt engineering and climbing the leaderboard.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/student/signup")}
                  className="gradient-primary glow-primary btn-press h-14 px-10 text-lg font-semibold"
                >
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/student/signin")}
                  className="glass hover-glow h-14 px-10 text-lg"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/genai-lab-logo.svg" 
                alt="GenAI Lab Logo" 
                className="w-10 h-10 rounded-xl"
              />
              <span className="text-xl font-bold">GenAI Lab</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <span className="text-white/10">|</span>
              <a href="/admin/signin" className="hover:text-foreground transition-colors opacity-50 hover:opacity-100">Admin Portal</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 GenAI Lab. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
