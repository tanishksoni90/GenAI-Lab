import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import SkyToggle from "@/components/ui/sky-toggle";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { 
  useDashboardStats, 
  useRecentSessions, 
  useAgents, 
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useArtifacts,
  useDeleteArtifact,
  useLeaderboard,
  useModels,
  useGuardrails
} from "@/hooks/useStudentData";
import { 
  ArrowLeft, MessageSquare, TrendingUp, Trophy, BookOpen, FileText, Settings, 
  CheckCircle, Clock, AlertCircle, Plus, Bot, Image as ImageIcon, Code, 
  Download, Trash2, Edit, Play, Medal, Sparkles, AlertTriangle, Calendar, 
  Zap, Activity, Target, Award, Bell, Brain, ChevronRight, Flame, 
  GraduationCap, LayoutGrid, Upload, X, FileUp, Shield, Search,
  ArrowUpRight, Layers, User, LogOut, Cpu, Lock, Unlock, Info, Volume2,
  ChevronLeft, CreditCard, Check, Loader2
} from "lucide-react";
import { mockEnrolledCourses, mockAssignments, mockGuardrails } from "@/lib/mockData";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Keep UserContext for local-only features (notifications UI state)
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    clearUserData,
  } = useUser();

  // Backend API data via React Query
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardStats();
  const { data: recentSessions = [], isLoading: isSessionsLoading } = useRecentSessions(10);
  const { data: agentsData = [], isLoading: isAgentsLoading } = useAgents();
  const { data: artifactsData, isLoading: isArtifactsLoading } = useArtifacts();
  const { data: modelsData = [], isLoading: isModelsLoading } = useModels();
  const { data: guardrailsData = [] } = useGuardrails();
  
  // Leaderboard data
  const [leaderboardView, setLeaderboardView] = useState<"institutional" | "course">("institutional");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useLeaderboard(
    leaderboardView, 
    leaderboardView === 'course' && selectedCourse !== 'all' ? selectedCourse : undefined
  );

  // Mutations
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();
  const deleteAgentMutation = useDeleteAgent();
  const deleteArtifactMutation = useDeleteArtifact();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/student/signin');
    }
  }, [isAuthenticated, navigate]);

  // Derived data from API responses
  const userName = user?.name || dashboardData?.user?.name || 'Student';
  
  // Find user's rank from leaderboard data
  const userRankInLeaderboard = leaderboardData?.leaderboard?.find(entry => entry.id === user?.id)?.rank;
  
  const stats = {
    tokenBalance: dashboardData?.tokens?.remaining || 0,
    tokenQuota: dashboardData?.tokens?.quota || 50000,
    totalTokensUsed: dashboardData?.tokens?.used || 0,
    totalSessions: dashboardData?.stats?.sessions || 0,
    todayModelSessions: recentSessions.filter(s => {
      const today = new Date().toDateString();
      return new Date(s.createdAt).toDateString() === today && !s.agentId;
    }).length,
    totalAgentsCreated: agentsData.length,
    weeklyPrompts: dashboardData?.stats?.prompts || 0,
    totalPrompts: dashboardData?.stats?.prompts || 0,
    avgPromptScore: dashboardData?.stats?.avgScore || 0,
    currentStreak: 0, // TODO: Add to backend
    courseRank: userRankInLeaderboard || 0,
    institutionalRank: userRankInLeaderboard || 0,
    totalInCourse: leaderboardData?.leaderboard?.length || 0,
    totalInInstitution: leaderboardData?.leaderboard?.length || 0,
    // Calculate active days from recent sessions
    activeDays: recentSessions.map(s => s.createdAt),
  };
  const sessions = recentSessions;
  const agents = agentsData;
  const artifacts = artifactsData?.data || [];
  const models = modelsData;

  // Filter sessions by type
  const getModelSessions = () => sessions.filter(s => !s.agentId);
  const getAgentSessions = (agentId: string) => sessions.filter(s => s.agentId === agentId);

  // Leaderboard helpers  
  const getCourseLeaderboard = () => leaderboardData?.leaderboard || [];
  const getInstitutionalLeaderboard = () => leaderboardData?.leaderboard || [];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedArtifactType, setSelectedArtifactType] = useState<"all" | "image" | "code" | "document">("all");
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [isCreateGuardrailOpen, setIsCreateGuardrailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [selectedModelCategory, setSelectedModelCategory] = useState<"text" | "image" | "audio" | "video" | "other">(
    (searchParams.get('category') as any) || "text"
  );
  
  // Handle URL params for tab/category navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    const category = searchParams.get('category');
    if (tab) setActiveTab(tab);
    if (category) setSelectedModelCategory(category as any);
  }, [searchParams]);
  
  // Model search state
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  
  // Create Agent Form State
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentModel, setAgentModel] = useState("");
  const [selectedGuardrails, setSelectedGuardrails] = useState<string[]>([]);
  const [behaviorPrompt, setBehaviorPrompt] = useState("");
  const [strictMode, setStrictMode] = useState(false);
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<File[]>([]);
  
  // Custom Guardrail Form State
  const [customGuardrailTitle, setCustomGuardrailTitle] = useState("");
  const [customGuardrailType, setCustomGuardrailType] = useState<string>("custom");
  const [customGuardrailAppliesTo, setCustomGuardrailAppliesTo] = useState<"prompt" | "response" | "both">("both");
  const [customGuardrailInstruction, setCustomGuardrailInstruction] = useState("");
  const [customGuardrailPriority, setCustomGuardrailPriority] = useState(5);
  const [customGuardrails, setCustomGuardrails] = useState<Array<{ id: string; type: string; title: string; appliesTo: string; instruction: string; priority: number }>>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles: File[] = [];
    let totalSize = knowledgeBaseFiles.reduce((acc, f) => acc + f.size, 0);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (totalSize + file.size > 10 * 1024 * 1024) {
        toast({
          title: "File size limit exceeded",
          description: "Total knowledge base size cannot exceed 10MB",
          variant: "destructive",
        });
        break;
      }
      newFiles.push(file);
      totalSize += file.size;
    }
    
    setKnowledgeBaseFiles([...knowledgeBaseFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setKnowledgeBaseFiles(knowledgeBaseFiles.filter((_, i) => i !== index));
  };

  // Handle file upload for editing agent KB
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingAgent) return;
    
    const currentFiles = editingAgent.knowledgeBase || [];
    const currentSize = editingAgent.knowledgeBaseSize || 0;
    const newFileNames: string[] = [];
    let totalSize = currentSize;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (totalSize + file.size > 10 * 1024 * 1024) {
        toast({
          title: "File size limit exceeded",
          description: "Total knowledge base size cannot exceed 10MB",
          variant: "destructive",
        });
        break;
      }
      newFileNames.push(file.name);
      totalSize += file.size;
    }
    
    setEditingAgent({
      ...editingAgent, 
      knowledgeBase: [...currentFiles, ...newFileNames],
      knowledgeBaseSize: totalSize
    });
    
    // Reset input
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const handleAddCustomGuardrail = () => {
    if (!customGuardrailTitle || !customGuardrailInstruction) return;
    
    const newGuardrail: { id: string; type: string; title: string; appliesTo: string; instruction: string; priority: number } = {
      id: `custom-${Date.now()}`,
      type: customGuardrailType,
      title: customGuardrailTitle,
      appliesTo: customGuardrailAppliesTo as string,
      instruction: customGuardrailInstruction,
      priority: customGuardrailPriority,
    };
    
    setCustomGuardrails([...customGuardrails, newGuardrail]);
    setSelectedGuardrails([...selectedGuardrails, newGuardrail.id]);
    setCustomGuardrailTitle("");
    setCustomGuardrailType("custom");
    setCustomGuardrailAppliesTo("both");
    setCustomGuardrailInstruction("");
    setCustomGuardrailPriority(5);
    setIsCreateGuardrailOpen(false);
    
    toast({
      title: "Custom guardrail created",
      description: "Your custom guardrail has been added to the agent",
    });
  };

  const handleCreateAgent = async () => {
    if (!agentName || !agentModel) {
      toast({
        title: "Missing required fields",
        description: "Please provide a name and select an AI model",
        variant: "destructive",
      });
      return;
    }
    
    // Get the model name from the backend models data
    const selectedModelData = models.find(m => m.id === agentModel);
    const modelName = selectedModelData?.name || agentModel;
    
    // Prepare guardrail IDs for the backend
    const guardrailIds = selectedGuardrails.filter(id => !id.startsWith('custom-'));
    
    try {
      await createAgentMutation.mutateAsync({
        name: agentName,
        description: agentDescription,
        modelId: agentModel,
        behaviorPrompt,
        strictMode,
        knowledgeBase: knowledgeBaseFiles.map(f => f.name),
        guardrailIds,
      });
      
      toast({
        title: "Agent created successfully!",
        description: `${agentName} is ready to use`,
      });
      
      // Reset form
      setAgentName("");
      setAgentDescription("");
      setAgentModel("");
      setSelectedGuardrails([]);
      setBehaviorPrompt("");
      setStrictMode(false);
      setKnowledgeBaseFiles([]);
      setCustomGuardrails([]);
      setIsCreateAgentOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to create agent",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const toggleGuardrail = (guardrailId: string) => {
    setSelectedGuardrails(prev => 
      prev.includes(guardrailId) 
        ? prev.filter(id => id !== guardrailId)
        : [...prev, guardrailId]
    );
  };

  const getTotalFileSize = () => {
    const bytes = knowledgeBaseFiles.reduce((acc, f) => acc + f.size, 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter artifacts based on type
  const filteredArtifacts = selectedArtifactType === "all" 
    ? artifacts 
    : artifacts.filter(a => a.type === selectedArtifactType);

  // Map backend models to frontend display format with search filtering
  const modelsByCategory = models
    .filter(m => m.category === selectedModelCategory)
    .filter(m => {
      if (!modelSearchQuery.trim()) return true;
      const query = modelSearchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query) ||
        (m.description || '').toLowerCase().includes(query)
      );
    })
    .map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      description: m.description || '',
      category: m.category,
      enabled: m.isActive ?? true,
      features: [] as string[], // Backend doesn't provide features yet
      tokensPerRequest: m.inputCost || 1.0
    }));
  
  // Enabled models for agent creation dropdowns
  const enabledModels = models.filter(m => m.isActive);
  
  // Count unread notifications
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Dynamic stats based on real user data
  const quickStats = [
    { 
      label: "Token Balance", 
      value: stats.tokenBalance.toLocaleString(),
      max: stats.tokenQuota.toLocaleString(),
      percentage: (stats.tokenBalance / stats.tokenQuota) * 100,
      icon: Zap, 
      gradient: "gradient-primary",
      glow: "glow-primary",
      color: "text-blue-400",
      description: "tokens remaining"
    },
    { 
      label: "Avg. Prompt Score", 
      value: stats.avgPromptScore.toString(),
      suffix: "/100",
      trend: stats.avgPromptScore > 60 ? "+5%" : undefined,
      icon: Target, 
      gradient: "gradient-secondary",
      glow: "glow-secondary",
      color: "text-cyan-400",
      description: "across all sessions"
    },
    { 
      label: "Today's Model Sessions", 
      value: stats.todayModelSessions,
      icon: MessageSquare, 
      gradient: "gradient-accent",
      glow: "glow-accent",
      color: "text-pink-400",
      description: "created today"
    },
    { 
      label: "AI Agents Created", 
      value: stats.totalAgentsCreated,
      icon: Bot, 
      gradient: "gradient-success",
      color: "text-emerald-400",
      description: "total agents"
    },
    { 
      label: "Course Rank", 
      value: `#${stats.courseRank}`,
      subtext: `of ${stats.totalInCourse} in course`,
      icon: Trophy, 
      gradient: "gradient-tertiary",
      glow: "glow-tertiary",
      color: "text-orange-400",
      description: "in your batch"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 bg-grid-dots opacity-20" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")} 
                className="hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-secondary glow-secondary flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              <div>
                  <h1 className="text-xl font-bold">Welcome back, {userName}!</h1>
                  <p className="text-sm text-muted-foreground">Continue your AI journey</p>
              </div>
            </div>
            </div>
            
            <div className="flex items-center gap-3">
              <SkyToggle checked={isDark} onChange={toggleTheme} />
              
              {/* Notifications Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center animate-pulse">
                        {unreadNotifications}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 glass-card border-white/10 p-0" align="end">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      {unreadNotifications > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={markAllNotificationsRead}
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No notifications yet
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {notifications.slice(0, 10).map(notif => (
                          <div 
                            key={notif.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              notif.read ? 'opacity-60' : 'bg-white/5'
                            } hover:bg-white/10`}
                            onClick={() => markNotificationRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                notif.type === 'streak' ? 'gradient-accent' :
                                notif.type === 'success' ? 'gradient-success' :
                                notif.type === 'warning' ? 'bg-orange-500/20' :
                                'gradient-primary'
                              }`}>
                                {notif.type === 'streak' ? <Flame className="w-4 h-4 text-white" /> :
                                 notif.type === 'success' ? <Check className="w-4 h-4 text-white" /> :
                                 <Bell className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{notif.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              
              {/* Profile Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{userName}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-56 glass-card border-white/10 p-2" align="end">
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start hover:bg-white/5"
                      onClick={() => {
                        toast({
                          title: "Buy Tokens",
                          description: "Token purchase feature coming soon!",
                        });
                      }}
                    >
                      <CreditCard className="w-4 h-4 mr-3 text-emerald-400" />
                      Buy Tokens
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start hover:bg-white/5"
                      onClick={() => navigate('/student/profile')}
                    >
                      <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                      Settings
                    </Button>
                    <Separator className="my-1 bg-white/10" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        clearUserData();
                        navigate('/');
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
        </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 p-6 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickStats.map((stat, idx) => (
            <Card 
              key={idx}
              className="glass-card card-hover overflow-hidden group animate-fade-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2.5 rounded-xl ${stat.gradient} ${stat.glow}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  {stat.trend && (
                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.trend}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                    {stat.suffix && <span className="text-sm text-muted-foreground">{stat.suffix}</span>}
                    {stat.max && <span className="text-sm text-muted-foreground">/ {stat.max}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                {stat.percentage !== undefined && (
                  <div className="mt-3">
                    <Progress value={stat.percentage} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="glass rounded-2xl p-1.5 inline-flex flex-wrap gap-1">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              {[
                { value: "overview", icon: LayoutGrid, label: "Overview" },
                { value: "models", icon: Brain, label: "AI Models" },
                { value: "agents", icon: Bot, label: "Agents" },
                { value: "leaderboard", icon: Trophy, label: "Leaderboard" },
                { value: "artifacts", icon: Layers, label: "Artifacts" },
              ].map((tab) => (
            <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:gradient-primary data-[state=active]:glow-primary data-[state=active]:text-white rounded-xl font-medium px-4 py-2.5 transition-all duration-300 gap-2"
            >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
              ))}
          </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Sessions */}
              <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Recent Sessions</h2>
                    <p className="text-muted-foreground">Continue where you left off</p>
                    </div>
                  {sessions.length > 0 && (
                    <Button variant="outline" className="glass hover-glow" onClick={() => setActiveTab('models')}>
                      Start New
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  </div>
                
                <div className="grid gap-4">
                  {getModelSessions().length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold text-lg mb-2">No sessions yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start your first chat session with any AI model to begin learning
                        </p>
                        <Button 
                          className="gradient-primary glow-primary btn-press"
                          onClick={() => setActiveTab('models')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Start First Session
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    getModelSessions().slice(0, 5).map((session, idx) => (
                      <Card 
                        key={session.id}
                        className="glass-card card-hover cursor-pointer group overflow-hidden animate-scale-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                        onClick={() => navigate(`/student/chat/${session.modelId}?session=${session.id}`)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                              session.model?.category === 'image' ? 'gradient-accent glow-accent' :
                              session.model?.category === 'audio' ? 'gradient-success' :
                              idx % 2 === 0 ? 'gradient-primary glow-primary' :
                              'gradient-secondary glow-secondary'
                            }`}>
                              {session.model?.category === 'image' ? <ImageIcon className="w-6 h-6 text-white" /> :
                               session.model?.category === 'audio' ? <Volume2 className="w-6 h-6 text-white" /> :
                               <MessageSquare className="w-6 h-6 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                                    {session.title || 'Untitled Session'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(session.updatedAt).toLocaleString()}
                                  </p>
                                </div>
                                <Badge className={`text-xs flex-shrink-0 ${
                                  session.model?.category === 'image' ? 'gradient-accent' :
                                  session.model?.category === 'audio' ? 'gradient-success' :
                                  'gradient-primary'
                                }`}>
                                  {session.model?.name || 'Unknown'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <MessageSquare className="w-4 h-4 text-blue-400" />
                                  <span>{session.promptCount} prompts</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Zap className="w-4 h-4 text-cyan-400" />
                                  <span>{session.tokensUsed.toLocaleString()} tokens</span>
                                </div>
                                {session.avgScore > 0 && (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Target className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">{session.avgScore}%</span>
                                  </div>
                                )}
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="sm" className="gradient-primary glow-primary btn-press">
                                    Continue
                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                    </div>
                  </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="glass-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-pink-400" />
                      Quick Actions
                    </CardTitle>
                </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start gradient-primary glow-primary btn-press h-12"
                      onClick={() => setIsCreateAgentOpen(true)}
                    >
                      <Bot className="w-5 h-5 mr-3" />
                      Create AI Agent
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start glass hover-glow h-12 group"
                      onClick={() => navigate("/student/chat/dalle-3")}
                    >
                      <ImageIcon className="w-5 h-5 mr-3 text-pink-400" />
                      Generate Image
                      <Badge className="ml-auto text-[10px] gradient-accent">DALL-E 3</Badge>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start glass hover-glow h-12 group"
                      onClick={() => navigate("/student/chat/elevenlabs")}
                    >
                      <Volume2 className="w-5 h-5 mr-3 text-emerald-400" />
                      Generate Audio
                      <Badge className="ml-auto text-[10px] gradient-success">ElevenLabs</Badge>
                    </Button>
                </CardContent>
              </Card>

                {/* Activity Calendar */}
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-orange-400 font-medium">
                            {stats.currentStreak} day streak
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                </CardHeader>
                  <CardContent className="pt-0">
                    {/* Week days header */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground font-medium py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid - Dynamic based on current month */}
                    {(() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth();
                      const today = now.getDate();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDayOfWeek = new Date(year, month, 1).getDay();
                      
                      // Get active days for this month from stats
                      const activeDaysInMonth = stats.activeDays
                        .filter(d => {
                          const date = new Date(d);
                          return date.getFullYear() === year && date.getMonth() === month;
                        })
                        .map(d => new Date(d).getDate());
                      
                      // Build calendar grid
                      const weeks: (number | null)[][] = [];
                      let currentWeek: (number | null)[] = [];
                      
                      // Add empty cells for days before the 1st
                      for (let i = 0; i < firstDayOfWeek; i++) {
                        currentWeek.push(null);
                      }
                      
                      // Add all days
                      for (let day = 1; day <= daysInMonth; day++) {
                        currentWeek.push(day);
                        if (currentWeek.length === 7) {
                          weeks.push(currentWeek);
                          currentWeek = [];
                        }
                      }
                      
                      // Fill remaining cells
                      while (currentWeek.length > 0 && currentWeek.length < 7) {
                        currentWeek.push(null);
                      }
                      if (currentWeek.length > 0) {
                        weeks.push(currentWeek);
                      }
                      
                      return weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7 gap-1 mb-1">
                          {week.map((day, dayIdx) => (
                            <div
                              key={dayIdx}
                              className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${
                                day === null 
                                  ? 'opacity-0' 
                                  : day === today
                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold ring-2 ring-cyan-400/50'
                                    : activeDaysInMonth.includes(day)
                                      ? 'bg-gradient-to-br from-emerald-500/80 to-green-600/80 text-white'
                                      : day > today
                                        ? 'text-muted-foreground/30'
                                        : 'text-muted-foreground hover:bg-white/5'
                              }`}
                            >
                              {day !== null && (
                                activeDaysInMonth.includes(day) && day !== today ? (
                                  <div className="relative">
                                    <span>{day}</span>
                                    <Flame className="w-2 h-2 absolute -top-1 -right-2 text-orange-400" />
                                  </div>
                                ) : (
                                  <span>{day}</span>
                                )
                              )}
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                    
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-[10px]">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded bg-gradient-to-br from-cyan-500 to-blue-500" />
                        <span className="text-muted-foreground">Today</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded bg-gradient-to-br from-emerald-500 to-green-600" />
                        <span className="text-muted-foreground">Active</span>
                      </div>
                    </div>
                </CardContent>
              </Card>

                {/* Leaderboard Preview */}
                <Card className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        Top Performers
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                  </div>
                </CardHeader>
                  <CardContent className="space-y-3">
                    {getCourseLeaderboard().slice(0, 3).map((entry, idx) => (
                      <div 
                        key={entry.rank}
                        className={`flex items-center gap-3 p-3 rounded-xl glass ${user?.id === entry.id ? 'border border-primary/50' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                          entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                          entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                          'glass'
                        }`}>
                          {entry.rank}
                      </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entry.name}</div>
                          <div className="text-xs text-muted-foreground">{entry.sessions} sessions • {entry.tokensUsed} tokens</div>
                        </div>
                        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                          {entry.avgScore}%
                        </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
              </div>
            </div>
          </TabsContent>

          {/* AI MODELS TAB */}
          <TabsContent value="models" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-primary glow-primary flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      AI Models
                    </CardTitle>
                    <CardDescription className="mt-2">Choose from our curated collection</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Search models..." 
                        className="bg-transparent border-none outline-none text-sm w-40" 
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedModelCategory} onValueChange={(v) => setSelectedModelCategory(v as any)}>
                  <TabsList className="glass mb-6 p-1 rounded-xl h-auto">
                    {[
                      { value: "text", label: "Text", icon: MessageSquare },
                      { value: "image", label: "Image", icon: ImageIcon },
                      { value: "audio", label: "Audio", icon: Activity },
                      { value: "video", label: "Video", icon: Play },
                      { value: "other", label: "Other", icon: Layers },
                    ].map((cat) => (
                      <TabsTrigger 
                        key={cat.value}
                        value={cat.value} 
                        className="data-[state=active]:gradient-secondary data-[state=active]:text-white rounded-lg px-4 py-2 gap-2"
                      >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {modelsByCategory.map((model, idx) => (
                      <Card 
                        key={model.id} 
                        className={`glass-card overflow-hidden group transition-all duration-300 animate-scale-in ${
                          !model.enabled ? 'opacity-50 grayscale' : 'card-hover'
                        }`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                              idx % 4 === 0 ? 'gradient-primary glow-primary' :
                              idx % 4 === 1 ? 'gradient-secondary glow-secondary' :
                              idx % 4 === 2 ? 'gradient-accent glow-accent' :
                              'gradient-tertiary glow-tertiary'
                            }`}>
                              <Cpu className="w-6 h-6 text-white" />
                            </div>
                            <Badge className={`text-xs ${
                              idx % 3 === 0 ? 'gradient-primary' :
                              idx % 3 === 1 ? 'gradient-accent' :
                              'gradient-secondary'
                            }`}>{model.provider}</Badge>
                          </div>
                          <CardTitle className="text-lg mt-3">{model.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">{model.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {model.features?.slice(0, 3).map((feature, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {feature}
                            </Badge>
                            ))}
                          </div>
                          <Separator className="bg-white/10" />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Zap className="w-4 h-4 text-blue-400" />
                              {model.tokensPerRequest}t/req
                            </span>
                            <Button 
                              size="sm"
                              className="gradient-primary glow-primary btn-press font-semibold" 
                              disabled={!model.enabled} 
                              onClick={() => navigate(`/student/chat/${model.id}`)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI AGENTS TAB */}
          <TabsContent value="agents" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                  </div>
                      AI Agents
                    </CardTitle>
                    <CardDescription className="mt-2">Your personalized AI assistants</CardDescription>
                  </div>
                  <Button 
                    className="gradient-accent glow-accent btn-press font-semibold"
                    onClick={() => setIsCreateAgentOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                      </Button>
                </div>
              </CardHeader>
              
              {/* Dialog moved outside of tabs for accessibility */}
              <Dialog open={isCreateAgentOpen} onOpenChange={setIsCreateAgentOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] p-0 glass-card border-white/10">
                      <DialogHeader className="p-6 pb-4 border-b border-white/5">
                        <DialogTitle className="text-2xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          Create AI Agent
                        </DialogTitle>
                        <DialogDescription>Build a personalized AI assistant for your learning</DialogDescription>
                    </DialogHeader>
                      
                      <ScrollArea className="max-h-[60vh]">
                        <div className="p-6 space-y-6">
                          {/* Basic Information */}
                      <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-pink-400" />
                              Basic Information
                            </h3>
                            <div className="grid gap-4">
                        <div>
                                <Label htmlFor="agent-name">Agent Name *</Label>
                                <Input 
                                  id="agent-name" 
                                  placeholder="e.g., Python Tutor, Math Helper" 
                                  className="glass mt-1.5"
                                  value={agentName}
                                  onChange={(e) => setAgentName(e.target.value)}
                                />
                        </div>
                        <div>
                          <Label htmlFor="agent-desc">Description</Label>
                                <Textarea 
                                  id="agent-desc" 
                                  rows={2} 
                                  placeholder="Describe what this agent helps with..." 
                                  className="glass mt-1.5"
                                  value={agentDescription}
                                  onChange={(e) => setAgentDescription(e.target.value)}
                                />
                        </div>
                        <div>
                                <Label htmlFor="agent-model">AI Model *</Label>
                                <Select value={agentModel} onValueChange={setAgentModel}>
                                  <SelectTrigger className="glass mt-1.5">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                    {enabledModels.map(m => (
                                      <SelectItem key={m.id} value={m.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{m.name}</span>
                                          <Badge variant="outline" className="text-[10px]">{m.provider}</Badge>
                                        </div>
                                      </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                              </div>
                        </div>
                      </div>

                          <Separator className="bg-white/10" />

                          {/* Behavior Prompt */}
                      <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Brain className="w-4 h-4 text-cyan-400" />
                              Behavior Prompt
                            </h3>
                        <div>
                              <Textarea 
                                rows={4} 
                                placeholder="Define how your agent should behave...

Example: You are a friendly Python tutor. Explain concepts step-by-step with code examples. Always encourage the student and provide hints before giving answers." 
                                className="glass font-mono text-sm"
                                value={behaviorPrompt}
                                onChange={(e) => setBehaviorPrompt(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                This prompt guides the agent's personality and teaching style
                              </p>
                        </div>
                            
                            {/* Strict Mode */}
                            <div className="flex items-center justify-between p-4 rounded-xl glass">
                              <div className="flex items-center gap-3">
                                {strictMode ? <Lock className="w-5 h-5 text-orange-400" /> : <Unlock className="w-5 h-5 text-cyan-400" />}
                                <div>
                                  <Label className="font-medium">Strict Mode</Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {strictMode ? "Agent strictly follows behavior prompt" : "Agent has flexibility in responses"}
                                  </p>
                              </div>
                            </div>
                              <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                        </div>
                      </div>

                          <Separator className="bg-white/10" />

                          {/* Guardrails */}
                      <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Shield className="w-4 h-4 text-orange-400" />
                                Guardrails
                              </h3>
                              <Dialog open={isCreateGuardrailOpen} onOpenChange={setIsCreateGuardrailOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="glass text-xs">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Custom
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-card border-white/10 sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Sparkles className="w-5 h-5 text-pink-400" />
                                      Add Custom Guardrail
                                    </DialogTitle>
                                    <DialogDescription>Create your own guardrail rule for this agent</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    {/* Type Badge - Always Custom */}
                                    <div className="flex items-center gap-2 p-3 rounded-lg glass">
                                      <Badge className="gradient-accent">Custom Type</Badge>
                                      <span className="text-xs text-muted-foreground">Pre-configured types are available from the list below</span>
                                    </div>

                                    {/* Applies To */}
                        <div>
                                      <Label>Applies To</Label>
                                      <Select value={customGuardrailAppliesTo} onValueChange={(v) => setCustomGuardrailAppliesTo(v as any)}>
                                        <SelectTrigger className="glass mt-1.5">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="prompt">Prompt Only</SelectItem>
                                          <SelectItem value="response">Response Only</SelectItem>
                                          <SelectItem value="both">Both</SelectItem>
                                        </SelectContent>
                                      </Select>
                        </div>

                                    {/* Title */}
                                    <div>
                                      <Label>Title</Label>
                                      <Input 
                                        placeholder="e.g., Safe Learning Environment" 
                                        className="glass mt-1.5"
                                        value={customGuardrailTitle}
                                        onChange={(e) => setCustomGuardrailTitle(e.target.value)}
                                      />
                                    </div>

                                    {/* Instruction */}
                                    <div>
                                      <Label>Instruction</Label>
                        <Textarea 
                                        rows={3}
                                        placeholder="Describe what should be blocked or encouraged..."
                                        className="glass mt-1.5"
                                        value={customGuardrailInstruction}
                                        onChange={(e) => setCustomGuardrailInstruction(e.target.value)}
                        />
                      </div>

                                    {/* Priority */}
                                    <div>
                                      <Label>Priority (1-10)</Label>
                                      <Input 
                                        type="number"
                                        min={1}
                                        max={10}
                                        className="glass mt-1.5"
                                        value={customGuardrailPriority}
                                        onChange={(e) => setCustomGuardrailPriority(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">Higher priority guardrails are checked first</p>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateGuardrailOpen(false)} className="glass">Cancel</Button>
                                    <Button className="gradient-accent" onClick={handleAddCustomGuardrail}>Create</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                              {/* Existing Guardrails */}
                              {mockGuardrails.map(g => (
                                <div 
                                  key={g.id} 
                                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                    selectedGuardrails.includes(g.id) 
                                      ? 'glass border border-primary/50 bg-primary/5' 
                                      : 'glass hover:bg-white/5'
                                  }`}
                                  onClick={() => toggleGuardrail(g.id)}
                                >
                                  <Checkbox checked={selectedGuardrails.includes(g.id)} className="mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{g.title}</span>
                                      <Badge variant="outline" className={`text-[10px] ${
                                        g.type === 'content-safety' ? 'border-red-500/50 text-red-400' :
                                        g.type === 'educational-integrity' ? 'border-yellow-500/50 text-yellow-400' :
                                        'border-blue-500/50 text-blue-400'
                                      }`}>{g.type}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{g.instruction}</p>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Custom Guardrails */}
                              {customGuardrails.map(g => (
                                <div 
                                  key={g.id} 
                                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                    selectedGuardrails.includes(g.id) 
                                      ? 'glass border border-pink-500/50 bg-pink-500/5' 
                                      : 'glass hover:bg-white/5'
                                  }`}
                                  onClick={() => toggleGuardrail(g.id)}
                                >
                                  <Checkbox checked={selectedGuardrails.includes(g.id)} className="mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-sm">{g.title}</span>
                                      <Badge className="gradient-accent text-[10px]">Custom</Badge>
                                      <Badge variant="outline" className="text-[10px]">
                                        {g.appliesTo === 'both' ? 'Both' : g.appliesTo === 'prompt' ? 'Prompt' : 'Response'}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] border-cyan-500/50 text-cyan-400">
                                        P{g.priority}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{g.instruction}</p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 hover:bg-red-500/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomGuardrails(customGuardrails.filter(cg => cg.id !== g.id));
                                      setSelectedGuardrails(selectedGuardrails.filter(id => id !== g.id));
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedGuardrails.length} guardrail{selectedGuardrails.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>

                          <Separator className="bg-white/10" />

                      {/* Knowledge Base */}
                      <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <FileUp className="w-4 h-4 text-emerald-400" />
                              Knowledge Base
                            </h3>
                            <div 
                              className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <input 
                                ref={fileInputRef}
                                type="file" 
                                multiple 
                                className="hidden" 
                                accept=".pdf,.txt,.md,.doc,.docx,.json"
                                onChange={handleFileUpload}
                              />
                              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                              <p className="text-sm font-medium">Click to upload files</p>
                              <p className="text-xs text-muted-foreground mt-1">PDF, TXT, MD, DOC, JSON up to 10MB total</p>
                        </div>
                            
                            {knowledgeBaseFiles.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{knowledgeBaseFiles.length} file(s) uploaded</span>
                                  <span className="text-muted-foreground">{getTotalFileSize()} / 10 MB</span>
                          </div>
                                <Progress value={(knowledgeBaseFiles.reduce((acc, f) => acc + f.size, 0) / (10 * 1024 * 1024)) * 100} className="h-1.5" />
                                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                  {knowledgeBaseFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg glass text-xs">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                        <span className="truncate">{file.name}</span>
                                        <span className="text-muted-foreground flex-shrink-0">
                                          ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                        </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 hover:bg-red-500/20 flex-shrink-0"
                                        onClick={() => removeFile(idx)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                      </div>
                                  ))}
                    </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                      
                      <DialogFooter className="p-6 pt-4 border-t border-white/5 gap-2">
                        <Button variant="outline" onClick={() => setIsCreateAgentOpen(false)} className="glass">Cancel</Button>
                        <Button className="gradient-accent glow-accent" onClick={handleCreateAgent}>
                          <Bot className="w-4 h-4 mr-2" />
                          Create Agent
                        </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              
              <CardContent>
                {agents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl gradient-accent glow-accent flex items-center justify-center mx-auto mb-4 opacity-50">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No AI Agents Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">Create your first AI agent to get started</p>
                    <Button className="gradient-accent glow-accent" onClick={() => setIsCreateAgentOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Agent
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent, idx) => (
                      <Card 
                        key={agent.id} 
                        className="glass-card card-hover overflow-hidden group animate-scale-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <CardContent className="p-5 space-y-4">
                          {/* Header with name */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Bot className="w-5 h-5 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">{agent.name}</h3>
                            </div>
                            <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Active
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground line-clamp-2">{agent.description || 'No description'}</p>
                          
                          {/* Model Badge */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {agent.model?.name || 'Unknown Model'}
                            </Badge>
                            {agent.knowledgeBase && agent.knowledgeBase.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                {agent.knowledgeBase.length} files
                              </Badge>
                            )}
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{agent.sessionsCount}</span>
                              <span className="text-xs text-muted-foreground">Sessions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm font-medium text-emerald-400">{agent.tokensUsed.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground">Tokens</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium">{agent.messagesCount}</span>
                              <span className="text-xs text-muted-foreground">Messages</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="glass"
                              onClick={() => navigate(`/student/agent-chat/${agent.id}`)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Test
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass"
                              onClick={() => {
                                setEditingAgent(agent);
                                setIsEditAgentOpen(true);
                              }}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass text-red-400 hover:text-red-400 hover:bg-red-500/10"
                              disabled={deleteAgentMutation.isPending}
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${agent.name}"?`)) {
                                  try {
                                    await deleteAgentMutation.mutateAsync(agent.id);
                                    toast({
                                      title: "Agent deleted",
                                      description: `${agent.name} has been deleted.`,
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Failed to delete agent",
                                      description: error.message,
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEADERBOARD TAB */}
          <TabsContent value="leaderboard" className="mt-6">
            <Card className="glass-card">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-tertiary glow-tertiary flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                </div>
                      Leaderboard
                    </CardTitle>
                    <CardDescription className="mt-2">Compare your prompt engineering skills with peers</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Leaderboard View Toggle */}
                    <ToggleGroup type="single" value={leaderboardView} onValueChange={(v) => v && setLeaderboardView(v as any)}>
                      <ToggleGroupItem value="institutional" className="glass data-[state=on]:gradient-primary data-[state=on]:text-white">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Institutional
                  </ToggleGroupItem>
                      <ToggleGroupItem value="course" className="glass data-[state=on]:gradient-secondary data-[state=on]:text-white">
                        <BookOpen className="w-4 h-4 mr-2" />
                    Course
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
                </div>
                
                {/* Course selector when in course view */}
                {leaderboardView === "course" && (
                  <div className="mt-4 flex items-center gap-3">
                    <Label className="text-sm text-muted-foreground">Select Course:</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="glass w-64">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {mockEnrolledCourses.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </CardHeader>
            <CardContent>
                {/* View Info Banner */}
                <div className="glass rounded-xl p-4 mb-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    leaderboardView === "institutional" ? "gradient-primary" : "gradient-secondary"
                  }`}>
                    {leaderboardView === "institutional" ? (
                      <GraduationCap className="w-5 h-5 text-white" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {leaderboardView === "institutional" ? "Institutional Rankings" : "Course Rankings"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leaderboardView === "institutional" 
                        ? "Rankings across all courses in the institution" 
                        : selectedCourse === "all" 
                          ? "Rankings within all enrolled courses" 
                          : `Rankings within ${mockEnrolledCourses.find(c => c.id === selectedCourse)?.title || "selected course"}`
                      }
                    </p>
                  </div>
                  <Badge className="ml-auto glass text-sm px-4 py-2">
                    <Flame className="w-4 h-4 mr-2 text-orange-400" />
                    Your Rank: #{leaderboardView === "institutional" ? stats.institutionalRank : stats.courseRank}
                  </Badge>
                </div>

              <div className="space-y-3">
                  {(leaderboardView === "institutional" ? getInstitutionalLeaderboard() : getCourseLeaderboard()).map((entry, idx) => (
                    <div 
                      key={entry.rank} 
                      className={`glass p-5 rounded-2xl card-hover animate-scale-in ${
                        user?.id === entry.id ? 'border border-primary/50 bg-primary/5' : ''
                      }`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
                          entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white glow-tertiary' : 
                          entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                          entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 
                          'glass'
                        }`}>
                          {entry.rank <= 3 ? <Medal className="w-6 h-6" /> : `#${entry.rank}`}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{entry.name}</p>
                            {user?.id === entry.id && (
                              <Badge className="gradient-primary text-xs">You</Badge>
                            )}
                        </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{entry.sessions} sessions</span>
                            <span>•</span>
                            <span>{entry.tokensUsed.toLocaleString()} tokens</span>
                      </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cyan-400">{entry.avgScore}</div>
                          <p className="text-xs text-muted-foreground">avg score</p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* ARTIFACTS TAB */}
          <TabsContent value="artifacts" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-secondary glow-secondary flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      Artifacts
                    </CardTitle>
                    <CardDescription className="mt-2">Your generated content</CardDescription>
                  </div>
                  <ToggleGroup 
                    type="single" 
                    value={selectedArtifactType} 
                    onValueChange={(value) => value && setSelectedArtifactType(value as any)}
                    className="glass rounded-xl p-1"
                  >
                    <ToggleGroupItem value="all" className="data-[state=on]:gradient-secondary data-[state=on]:text-white rounded-lg px-4">All</ToggleGroupItem>
                    <ToggleGroupItem value="image" className="data-[state=on]:gradient-accent data-[state=on]:text-white rounded-lg px-4">
                      <ImageIcon className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="code" className="data-[state=on]:gradient-primary data-[state=on]:text-white rounded-lg px-4">
                      <Code className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="document" className="data-[state=on]:gradient-tertiary data-[state=on]:text-white rounded-lg px-4">
                      <FileText className="w-4 h-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardHeader>
            <CardContent>
                {filteredArtifacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold text-lg mb-2">No artifacts yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Artifacts are created when you generate images, save code snippets, or export content from your chat sessions.
                    </p>
                    <Button 
                      className="gradient-primary glow-primary btn-press"
                      onClick={() => setActiveTab('models')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start a Session
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredArtifacts.map((artifact, idx) => (
                      <Card 
                        key={artifact.id} 
                        className="glass-card card-hover overflow-hidden group animate-scale-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              artifact.type === 'image' ? 'gradient-accent glow-accent' :
                              artifact.type === 'code' ? 'gradient-primary glow-primary' :
                              artifact.type === 'audio' ? 'gradient-success' :
                              'gradient-secondary glow-secondary'
                            }`}>
                              {artifact.type === 'image' ? <ImageIcon className="w-5 h-5 text-white" /> :
                               artifact.type === 'code' ? <Code className="w-5 h-5 text-white" /> :
                               artifact.type === 'audio' ? <Volume2 className="w-5 h-5 text-white" /> :
                               <FileText className="w-5 h-5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{artifact.title || 'Untitled'}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(artifact.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">{artifact.session?.model?.name || 'Unknown'}</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{artifact.type}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 glass">
                              <Download className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="glass text-red-400 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteArtifactMutation.mutate(artifact.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

          {/* COURSES TAB */}
          <TabsContent value="courses" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Courses</h2>
                  <p className="text-muted-foreground">Track your learning progress</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockEnrolledCourses.map((course, idx) => (
                  <Card 
                    key={course.id} 
                    className="glass-card card-hover overflow-hidden group animate-scale-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={`h-1.5 w-full ${
                      idx === 0 ? 'gradient-primary' :
                      idx === 1 ? 'gradient-secondary' :
                      'gradient-accent'
                    }`} />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                          idx === 0 ? 'gradient-primary glow-primary' :
                          idx === 1 ? 'gradient-secondary glow-secondary' :
                          'gradient-accent glow-accent'
                        }`}>
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant="outline" className="text-xs">{course.duration}</Badge>
                      </div>
                      <CardTitle className="mt-4">{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={`font-semibold ${
                          idx === 0 ? 'text-blue-400' :
                          idx === 1 ? 'text-cyan-400' :
                          'text-pink-400'
                        }`}>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{course.instructor}</span>
                      </div>
                    </CardContent>
              </Card>
            ))}
              </div>
          </div>
        </TabsContent>

          {/* ASSIGNMENTS TAB */}
          <TabsContent value="assignments" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-tertiary glow-tertiary flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Assignments
                </CardTitle>
                <CardDescription className="mt-2">Your pending and completed tasks</CardDescription>
              </CardHeader>
            <CardContent>
                <div className="space-y-3">
                  {mockAssignments.map((assignment, idx) => (
                    <div 
                      key={assignment.id}
                      className="glass p-5 rounded-2xl card-hover animate-scale-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          assignment.status === 'graded' ? 'gradient-success' :
                          assignment.status === 'submitted' ? 'gradient-primary glow-primary' :
                          'gradient-tertiary glow-tertiary'
                        }`}>
                          {assignment.status === 'graded' ? <CheckCircle className="w-6 h-6 text-white" /> :
                           assignment.status === 'submitted' ? <Clock className="w-6 h-6 text-white" /> :
                           <AlertCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">{assignment.course}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${
                            assignment.status === 'graded' ? 'bg-emerald-500/20 text-emerald-400' :
                            assignment.status === 'submitted' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {assignment.status === 'graded' ? assignment.grade : assignment.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">Due: {assignment.dueDate}</p>
                        </div>
                      </div>
                </div>
              ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        {/* Global Create Agent Dialog - rendered outside tabs for accessibility from Quick Actions */}
        <Dialog open={isCreateAgentOpen} onOpenChange={setIsCreateAgentOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 glass-card border-white/10">
            <DialogHeader className="p-6 pb-4 border-b border-white/5">
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                Create AI Agent
              </DialogTitle>
              <DialogDescription>Build a personalized AI assistant for your learning</DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh]">
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    Basic Information
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="agent-name-global">Agent Name *</Label>
                      <Input 
                        id="agent-name-global" 
                        placeholder="e.g., Python Tutor, Math Helper" 
                        className="glass mt-1.5"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-desc-global">Description</Label>
                      <Textarea 
                        id="agent-desc-global" 
                        rows={2} 
                        placeholder="Describe what this agent helps with..." 
                        className="glass mt-1.5"
                        value={agentDescription}
                        onChange={(e) => setAgentDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-model-global">AI Model *</Label>
                      <Select value={agentModel} onValueChange={setAgentModel}>
                        <SelectTrigger className="glass mt-1.5">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {enabledModels.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center gap-2">
                                <span>{m.name}</span>
                                <Badge variant="outline" className="text-[10px]">{m.provider}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Behavior Prompt */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    Behavior Prompt
                  </h3>
                  <div>
                    <Textarea 
                      rows={4} 
                      placeholder="Define how your agent should behave..."
                      className="glass font-mono text-sm"
                      value={behaviorPrompt}
                      onChange={(e) => setBehaviorPrompt(e.target.value)}
                    />
                  </div>
                  
                  {/* Strict Mode */}
                  <div className="flex items-center justify-between p-4 rounded-xl glass">
                    <div className="flex items-center gap-3">
                      {strictMode ? <Lock className="w-5 h-5 text-orange-400" /> : <Unlock className="w-5 h-5 text-cyan-400" />}
                      <div>
                        <Label className="font-medium">Strict Mode</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {strictMode ? "Agent strictly follows behavior prompt" : "Agent has flexibility"}
                        </p>
                      </div>
                    </div>
                    <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Knowledge Base */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-emerald-400" />
                    Knowledge Base
                  </h3>
                  <div 
                    className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      multiple 
                      className="hidden" 
                      accept=".pdf,.txt,.md,.doc,.docx,.json"
                      onChange={handleFileUpload}
                    />
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Click to upload files</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, TXT, MD, DOC, JSON up to 10MB total</p>
                  </div>
                  
                  {knowledgeBaseFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{knowledgeBaseFiles.length} file(s) uploaded</span>
                        <span className="text-muted-foreground">{getTotalFileSize()} / 10 MB</span>
                      </div>
                      <Progress value={(knowledgeBaseFiles.reduce((acc, f) => acc + f.size, 0) / (10 * 1024 * 1024)) * 100} className="h-1.5" />
                      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {knowledgeBaseFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg glass text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-muted-foreground flex-shrink-0">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 hover:bg-red-500/20 flex-shrink-0"
                              onClick={() => removeFile(idx)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="p-6 pt-4 border-t border-white/5 gap-2">
              <Button variant="outline" onClick={() => setIsCreateAgentOpen(false)} className="glass">Cancel</Button>
              <Button className="gradient-accent glow-accent" onClick={handleCreateAgent}>
                <Bot className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Agent Dialog */}
        <Dialog open={isEditAgentOpen} onOpenChange={(open) => {
          setIsEditAgentOpen(open);
          if (!open) setEditingAgent(null);
        }}>
          <DialogContent className="max-w-lg glass-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                Edit Agent
              </DialogTitle>
              <DialogDescription>
                Update your AI agent's configuration
              </DialogDescription>
            </DialogHeader>
            
            {editingAgent && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input 
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({...editingAgent, name: e.target.value})}
                    className="glass"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    value={editingAgent.description}
                    onChange={(e) => setEditingAgent({...editingAgent, description: e.target.value})}
                    className="w-full min-h-[80px] p-3 rounded-xl glass text-sm resize-none"
                    placeholder="What does this agent do?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Behavior Prompt</Label>
                  <textarea
                    value={editingAgent.behaviorPrompt}
                    onChange={(e) => setEditingAgent({...editingAgent, behaviorPrompt: e.target.value})}
                    className="w-full min-h-[80px] p-3 rounded-xl glass text-sm resize-none"
                    placeholder="Instructions for how the agent should behave..."
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl glass">
                  <div>
                    <Label>Strict Mode</Label>
                    <p className="text-xs text-muted-foreground">Enforce stricter guardrail checking</p>
                  </div>
                  <Switch 
                    checked={editingAgent.strictMode}
                    onCheckedChange={(checked) => setEditingAgent({...editingAgent, strictMode: checked})}
                  />
                </div>
                
                {/* Knowledge Base - Editable */}
                <div className="p-3 rounded-xl glass space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Knowledge Base Files</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Add Files
                    </Button>
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleEditFileUpload}
                      className="hidden"
                      multiple
                      accept=".pdf,.txt,.md,.json"
                    />
                  </div>
                  {(editingAgent.knowledgeBase || []).length > 0 ? (
                    <div className="space-y-1">
                      {(editingAgent.knowledgeBase || []).map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 group">
                          <div className="flex items-center gap-2 text-xs">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="truncate max-w-[180px]">{file}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400"
                            onClick={() => {
                              const newFiles = (editingAgent.knowledgeBase || []).filter((_, i) => i !== idx);
                              setEditingAgent({...editingAgent, knowledgeBase: newFiles});
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No files uploaded</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">Max 10MB total. Supported: PDF, TXT, MD, JSON</p>
                </div>
                
                {/* Guardrails Info (read-only) */}
                {(editingAgent.guardrails || []).length > 0 && (
                  <div className="p-3 rounded-xl glass">
                    <Label className="text-xs text-muted-foreground">Guardrails ({(editingAgent.guardrails || []).length})</Label>
                    <div className="mt-2 space-y-1">
                      {(editingAgent.guardrails || []).map((g, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] mr-1">
                          {g.title || g.name || g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsEditAgentOpen(false)} className="glass">
                Cancel
              </Button>
              <Button 
                className="gradient-accent glow-accent"
                disabled={updateAgentMutation.isPending}
                onClick={async () => {
                  if (editingAgent) {
                    try {
                      await updateAgentMutation.mutateAsync({
                        id: editingAgent.id,
                        data: {
                          name: editingAgent.name,
                          description: editingAgent.description,
                          behaviorPrompt: editingAgent.behaviorPrompt,
                          strictMode: editingAgent.strictMode,
                          knowledgeBase: editingAgent.knowledgeBase,
                          status: editingAgent.status,
                        }
                      });
                      toast({
                        title: "Agent updated",
                        description: `${editingAgent.name} has been updated successfully.`,
                      });
                      setIsEditAgentOpen(false);
                      setEditingAgent(null);
                    } catch (error: any) {
                      toast({
                        title: "Failed to update agent",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentDashboard;
