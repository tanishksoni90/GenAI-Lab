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
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { 
  useDashboardStats, 
  useRecentSessions, 
  useChatbots, 
  useCreateChatbot,
  useUpdateChatbot,
  useDeleteChatbot,
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
  ChevronLeft, CreditCard, Check, Loader2, RefreshCw, Eye, Copy
} from "lucide-react";
// Note: Assignments feature not yet implemented - no mock data needed

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
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useDashboardStats();
  const { data: recentSessions = [], isLoading: isSessionsLoading, refetch: refetchSessions } = useRecentSessions(10);
  const { data: chatbotsData = [], isLoading: isChatbotsLoading, refetch: refetchChatbots } = useChatbots();
  const { data: artifactsData, isLoading: isArtifactsLoading, refetch: refetchArtifacts } = useArtifacts();
  const { data: modelsData = [], isLoading: isModelsLoading, refetch: refetchModels } = useModels();
  const { data: guardrailsData = [], refetch: refetchGuardrails } = useGuardrails();
  
  // Leaderboard data
  const [leaderboardView, setLeaderboardView] = useState<"institutional" | "course">("institutional");
  
  // Get enrolled course from dashboard data for leaderboard filtering
  const enrolledCourseId = dashboardData?.user?.course?.id;
  
  // Pass courseId only when viewing course leaderboard
  const leaderboardCourseId = leaderboardView === 'course' ? enrolledCourseId : undefined;
  
  const { data: rawLeaderboardData, isLoading: isLeaderboardLoading, refetch: refetchLeaderboard, error: leaderboardError } = useLeaderboard(
    leaderboardView, 
    leaderboardCourseId
  );
  
  // Ensure leaderboardData is always an array
  // Handle both cases: rawLeaderboardData could be the array directly OR an object {leaderboard: [...], type: "..."}
  const leaderboardData = Array.isArray(rawLeaderboardData) 
    ? rawLeaderboardData 
    : (rawLeaderboardData?.leaderboard && Array.isArray(rawLeaderboardData.leaderboard)) 
      ? rawLeaderboardData.leaderboard 
      : [];

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async (section?: string) => {
    setIsRefreshing(true);
    try {
      if (section) {
        switch (section) {
          case 'overview':
            await Promise.all([refetchDashboard(), refetchSessions()]);
            break;
          case 'models':
            await refetchModels();
            break;
          case 'chatbots':
            await refetchChatbots();
            break;
          case 'leaderboard':
            await refetchLeaderboard();
            break;
          case 'artifacts':
            await refetchArtifacts();
            break;
          default:
            await Promise.all([
              refetchDashboard(),
              refetchSessions(),
              refetchChatbots(),
              refetchArtifacts(),
              refetchModels(),
              refetchLeaderboard(),
            ]);
        }
      } else {
        await Promise.all([
          refetchDashboard(),
          refetchSessions(),
          refetchChatbots(),
          refetchArtifacts(),
          refetchModels(),
          refetchLeaderboard(),
        ]);
      }
      toast({
        title: 'Refreshed',
        description: section ? `${section.charAt(0).toUpperCase() + section.slice(1)} data updated` : 'All data refreshed',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Mutations
  const createChatbotMutation = useCreateChatbot();
  const updateChatbotMutation = useUpdateChatbot();
  const deleteChatbotMutation = useDeleteChatbot();
  const deleteArtifactMutation = useDeleteArtifact();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/student/signin');
    }
  }, [isAuthenticated, navigate]);

  // Derived data from API responses
  const userName = user?.name || dashboardData?.user?.name || 'Student';
  const userId = user?.id || dashboardData?.user?.id;
  
  // Get enrolled course from dashboard data
  const enrolledCourse = dashboardData?.user?.course || null;
  
  // Find user's rank from leaderboard data
  const userRankInLeaderboard = leaderboardData.find(entry => entry.id === userId)?.rank;
  
  const stats = {
    tokenBalance: dashboardData?.tokens?.remaining || 0,
    tokenQuota: dashboardData?.tokens?.quota || 50000,
    totalTokensUsed: dashboardData?.tokens?.used || 0,
    totalSessions: dashboardData?.stats?.sessions || 0,
    todayModelSessions: recentSessions.filter(s => {
      const today = new Date().toDateString();
      return new Date(s.createdAt).toDateString() === today && !s.chatbotId;
    }).length,
    totalChatbotsCreated: chatbotsData.length,
    weeklyPrompts: dashboardData?.stats?.prompts || 0,
    totalPrompts: dashboardData?.stats?.prompts || 0,
    avgPromptScore: dashboardData?.stats?.avgScore || 0,
    currentStreak: 0, // TODO: Add to backend
    courseRank: userRankInLeaderboard || 0,
    institutionalRank: userRankInLeaderboard || 0,
    totalInCourse: leaderboardData.length,
    totalInInstitution: leaderboardData.length,
    // Calculate active days from recent sessions
    activeDays: recentSessions.map(s => s.createdAt),
  };
  const sessions = recentSessions;
  const chatbots = chatbotsData;
  const artifacts = artifactsData?.data || [];
  const models = modelsData;

  // Filter sessions by type
  const getModelSessions = () => sessions.filter(s => !s.chatbotId);
  const getChatbotSessions = (chatbotId: string) => sessions.filter(s => s.chatbotId === chatbotId);

  // Leaderboard helpers  
  const getCourseLeaderboard = () => leaderboardData;
  const getInstitutionalLeaderboard = () => leaderboardData;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedArtifactType, setSelectedArtifactType] = useState<"all" | "image" | "code" | "text" | "audio">("all");
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [showArtifactPreview, setShowArtifactPreview] = useState(false);
  const [isCreateChatbotOpen, setIsCreateChatbotOpen] = useState(false);
  const [isEditChatbotOpen, setIsEditChatbotOpen] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<any>(null);
  const [isCreateGuardrailOpen, setIsCreateGuardrailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [selectedModelCategory, setSelectedModelCategory] = useState<"text" | "image" | "audio" | "video" | "code" | "multimodal">(
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
  
  // Create Chatbot Form State
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotModel, setChatbotModel] = useState("");
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

  // Handle file upload for editing chatbot KB
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingChatbot) return;
    
    const currentFiles = editingChatbot.knowledgeBase || [];
    const currentSize = editingChatbot.knowledgeBaseSize || 0;
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
    
    setEditingChatbot({
      ...editingChatbot, 
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
      description: "Your custom guardrail has been added to the chatbot",
    });
  };

  const handleCreateChatbot = async () => {
    if (!chatbotName || !chatbotModel) {
      toast({
        title: "Missing required fields",
        description: "Please provide a name and select an AI model",
        variant: "destructive",
      });
      return;
    }
    
    // Get the model name from the backend models data
    const selectedModelData = models.find(m => m.id === chatbotModel);
    const modelName = selectedModelData?.name || chatbotModel;
    
    // Prepare guardrail IDs for the backend
    const guardrailIds = selectedGuardrails.filter(id => !id.startsWith('custom-'));
    
    try {
      await createChatbotMutation.mutateAsync({
        name: chatbotName,
        description: chatbotDescription,
        modelId: chatbotModel,
        behaviorPrompt,
        strictMode,
        knowledgeBase: knowledgeBaseFiles.map(f => f.name),
        guardrailIds,
      });
      
      toast({
        title: "Chatbot created successfully!",
        description: `${chatbotName} is ready to use`,
      });
      
      // Reset form
      setChatbotName("");
      setChatbotDescription("");
      setChatbotModel("");
      setSelectedGuardrails([]);
      setBehaviorPrompt("");
      setStrictMode(false);
      setKnowledgeBaseFiles([]);
      setCustomGuardrails([]);
      setIsCreateChatbotOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to create chatbot",
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
  
  // Enabled models for chatbot creation dropdowns
  const enabledModels = models.filter(m => m.isActive);
  
  // Count unread notifications
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Dynamic stats based on real user data
  const quickStats = [
    { 
      label: "Learning Credits", 
      value: stats.tokenBalance.toLocaleString(),
      max: stats.tokenQuota.toLocaleString(),
      percentage: (stats.tokenBalance / stats.tokenQuota) * 100,
      icon: Zap, 
      gradient: "gradient-primary",
      glow: "glow-primary",
      color: "text-blue-400",
      description: "credits remaining"
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
      label: "AI Chatbots Created", 
      value: stats.totalChatbotsCreated,
      icon: Bot, 
      gradient: "gradient-success",
      color: "text-emerald-400",
      description: "total chatbots"
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
            <div className="flex items-center gap-3">
              <img 
                src="/genai-lab-logo.svg" 
                alt="GenAI Lab Logo" 
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <h1 className="text-xl font-bold">Welcome back, {userName}!</h1>
                <p className="text-sm text-muted-foreground">Continue your AI journey</p>
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
                { value: "chatbots", icon: Bot, label: "Chatbots" },
                { value: "compare", icon: Zap, label: "Compare" },
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="glass" onClick={() => handleRefresh('overview')} disabled={isRefreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    {sessions.length > 0 && (
                      <Button variant="outline" className="glass hover-glow" onClick={() => setActiveTab('models')}>
                        Start New
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
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
                      onClick={() => setIsCreateChatbotOpen(true)}
                    >
                      <Bot className="w-5 h-5 mr-3" />
                      Create AI Chatbot
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
                        className={`flex items-center gap-3 p-3 rounded-xl glass ${userId === entry.id ? 'border border-primary/50' : ''}`}
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
                    <Button variant="outline" size="sm" className="glass" onClick={() => handleRefresh('models')} disabled={isRefreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
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
                  <TabsList className="glass mb-6 p-1 rounded-xl h-auto flex-wrap">
                    {[
                      { value: "text", label: "Text", icon: MessageSquare },
                      { value: "image", label: "Image", icon: ImageIcon },
                      { value: "audio", label: "Audio", icon: Activity },
                      { value: "video", label: "Video", icon: Play },
                      { value: "code", label: "Code", icon: Code },
                      { value: "multimodal", label: "Multimodal", icon: Layers },
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

          {/* AI CHATBOTS TAB */}
          <TabsContent value="chatbots" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                  </div>
                      AI Chatbots
                    </CardTitle>
                    <CardDescription className="mt-2">Your personalized AI assistants</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="glass" onClick={() => handleRefresh('chatbots')} disabled={isRefreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button 
                      className="gradient-accent glow-accent btn-press font-semibold"
                      onClick={() => setIsCreateChatbotOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Chatbot
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Dialog moved outside of tabs for accessibility */}
              <Dialog open={isCreateChatbotOpen} onOpenChange={setIsCreateChatbotOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] p-0 glass-card border-white/10">
                      <DialogHeader className="p-6 pb-4 border-b border-white/5">
                        <DialogTitle className="text-2xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          Create AI Chatbot
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
                                <Label htmlFor="chatbot-name">Chatbot Name *</Label>
                                <Input 
                                  id="chatbot-name" 
                                  placeholder="e.g., Python Tutor, Math Helper" 
                                  className="glass mt-1.5"
                                  value={chatbotName}
                                  onChange={(e) => setChatbotName(e.target.value)}
                                />
                        </div>
                        <div>
                          <Label htmlFor="chatbot-desc">Description</Label>
                                <Textarea 
                                  id="chatbot-desc" 
                                  rows={2} 
                                  placeholder="Describe what this chatbot helps with..." 
                                  className="glass mt-1.5"
                                  value={chatbotDescription}
                                  onChange={(e) => setChatbotDescription(e.target.value)}
                                />
                        </div>
                        <div>
                                <Label htmlFor="chatbot-model">AI Model *</Label>
                                <Select value={chatbotModel} onValueChange={setChatbotModel}>
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
                                placeholder="Define how your chatbot should behave...

Example: You are a friendly Python tutor. Explain concepts step-by-step with code examples. Always encourage the student and provide hints before giving answers." 
                                className="glass font-mono text-sm"
                                value={behaviorPrompt}
                                onChange={(e) => setBehaviorPrompt(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                This prompt guides the chatbot's personality and teaching style
                              </p>
                        </div>
                            
                            {/* Strict Mode */}
                            <div className="flex items-center justify-between p-4 rounded-xl glass">
                              <div className="flex items-center gap-3">
                                {strictMode ? <Lock className="w-5 h-5 text-orange-400" /> : <Unlock className="w-5 h-5 text-cyan-400" />}
                                <div>
                                  <Label className="font-medium">Strict Mode</Label>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {strictMode ? "Chatbot strictly follows behavior prompt" : "Chatbot has flexibility in responses"}
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
                                    <DialogDescription>Create your own guardrail rule for this chatbot</DialogDescription>
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
                              {/* Existing Guardrails from Backend */}
                              {guardrailsData.map(g => (
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
                        <Button variant="outline" onClick={() => setIsCreateChatbotOpen(false)} className="glass">Cancel</Button>
                        <Button className="gradient-accent glow-accent" onClick={handleCreateChatbot}>
                          <Bot className="w-4 h-4 mr-2" />
                          Create Chatbot
                        </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              
              <CardContent>
                {chatbots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl gradient-accent glow-accent flex items-center justify-center mx-auto mb-4 opacity-50">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No AI Chatbots Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">Create your first AI chatbot to get started</p>
                    <Button className="gradient-accent glow-accent" onClick={() => setIsCreateChatbotOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Chatbot
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {chatbots.map((chatbot, idx) => (
                      <Card 
                        key={chatbot.id} 
                        className="glass-card card-hover overflow-hidden group animate-scale-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <CardContent className="p-5 space-y-4">
                          {/* Header with name */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Bot className="w-5 h-5 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">{chatbot.name}</h3>
                            </div>
                            <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Active
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground line-clamp-2">{chatbot.description || 'No description'}</p>
                          
                          {/* Model Badge */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {chatbot.model?.name || 'Unknown Model'}
                            </Badge>
                            {chatbot.knowledgeBase && chatbot.knowledgeBase.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                {chatbot.knowledgeBase.length} files
                              </Badge>
                            )}
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{chatbot.sessionsCount}</span>
                              <span className="text-xs text-muted-foreground">Sessions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm font-medium text-emerald-400">{chatbot.tokensUsed.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground">Tokens</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium">{chatbot.messagesCount}</span>
                              <span className="text-xs text-muted-foreground">Messages</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="glass"
                              onClick={() => navigate(`/student/chatbot-chat/${chatbot.id}`)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Test
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass"
                              onClick={() => {
                                setEditingChatbot(chatbot);
                                setIsEditChatbotOpen(true);
                              }}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="glass text-red-400 hover:text-red-400 hover:bg-red-500/10"
                              disabled={deleteChatbotMutation.isPending}
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${chatbot.name}"?`)) {
                                  try {
                                    await deleteChatbotMutation.mutateAsync(chatbot.id);
                                    toast({
                                      title: "Chatbot deleted",
                                      description: `${chatbot.name} has been deleted.`,
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Failed to delete chatbot",
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

          {/* COMPARE TAB */}
          <TabsContent value="compare" className="mt-6">
            <Card className="glass-card">
              <CardContent className="p-8">
                <div className="text-center max-w-xl mx-auto">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Multi-Model Comparison</h2>
                  <p className="text-muted-foreground mb-6">
                    Compare responses from multiple AI models side-by-side. Select models from the same category and see how they respond to your prompts differently.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { icon: MessageSquare, label: "Text Models", color: "text-blue-400" },
                      { icon: ImageIcon, label: "Image Models", color: "text-purple-400" },
                      { icon: Volume2, label: "Audio Models", color: "text-green-400" },
                      { icon: Code, label: "Code Models", color: "text-cyan-400" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="gradient-primary glow-primary font-semibold px-8"
                    onClick={() => navigate('/student/compare')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Open Compare Tool
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEADERBOARD TAB */}
          <TabsContent value="leaderboard" className="mt-6">
            <Card className="bg-white dark:bg-slate-900 shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Student Leaderboard</h2>
                        <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                          {leaderboardView === "institutional" ? "Institution" : "Course"} ({leaderboardData.length})
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Top performers based on prompt evaluation scores</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={leaderboardView === "institutional" ? "default" : "outline"}
                      size="sm" 
                      className={leaderboardView === "institutional" ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
                      onClick={() => setLeaderboardView("institutional")}
                    >
                      Institution
                    </Button>
                    <Button 
                      variant={leaderboardView === "course" ? "default" : "outline"}
                      size="sm" 
                      className={leaderboardView === "course" ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
                      onClick={() => setLeaderboardView("course")}
                    >
                      Course
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRefresh('leaderboard')} disabled={isRefreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {/* Course selector when in course view */}
                {leaderboardView === "course" && (
                  <div className="mt-4">
                    <Select value={enrolledCourse?.id || ""} disabled>
                      <SelectTrigger className="w-64 bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Select a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {enrolledCourse && (
                          <SelectItem value={enrolledCourse.id}>{enrolledCourse.name}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {leaderboardData.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                      <h3 className="font-semibold text-lg mb-2 text-slate-600 dark:text-slate-400">No rankings yet</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {leaderboardView === "course" && !enrolledCourse 
                          ? "You are not enrolled in any course" 
                          : "Start using AI models to appear on the leaderboard"}
                      </p>
                    </div>
                  ) : (
                    leaderboardData.map((entry, idx) => {
                      const isCurrentUser = userId === entry.id;
                      const skillLevel = entry.avgScore >= 90 ? 'Expert' : 
                                        entry.avgScore >= 75 ? 'Advanced' : 
                                        entry.avgScore >= 50 ? 'Proficient' : 'Beginner';
                      const skillColor = entry.avgScore >= 90 ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' : 
                                        entry.avgScore >= 75 ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 
                                        entry.avgScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 
                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
                      const initials = entry.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      
                      return (
                        <div 
                          key={entry.id || entry.rank} 
                          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                            isCurrentUser 
                              ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30' 
                              : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Rank */}
                          <div className="w-10 flex justify-center">
                            {entry.rank === 1 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-white" />
                              </div>
                            ) : entry.rank === 2 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center">
                                <Medal className="w-4 h-4 text-white" />
                              </div>
                            ) : entry.rank === 3 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                                <Medal className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-slate-400 dark:text-slate-500">#{entry.rank}</span>
                            )}
                          </div>
                          
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            entry.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            entry.rank === 2 ? 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                            'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400'
                          }`}>
                            {initials}
                          </div>
                          
                          {/* Name and stats */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800 dark:text-white">{entry.name}</span>
                              {entry.rank <= 3 && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs">
                                  Top {entry.rank}
                                </Badge>
                              )}
                              {isCurrentUser && (
                                <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">(You)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                              <span>{entry.sessions} prompts</span>
                              <span>•</span>
                              <span>{entry.tokensUsed?.toLocaleString() || 0} tokens</span>
                              <span>•</span>
                              <Badge className={`${skillColor} text-xs font-medium`}>
                                {skillLevel}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Score */}
                          <div className={`text-xl font-bold ${
                            entry.avgScore >= 90 ? 'text-violet-600 dark:text-violet-400' :
                            entry.avgScore >= 75 ? 'text-blue-600 dark:text-blue-400' :
                            entry.avgScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
                            'text-slate-600 dark:text-slate-400'
                          }`}>
                            {entry.avgScore}%
                          </div>
                        </div>
                      );
                    })
                  )}
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="glass" onClick={() => handleRefresh('artifacts')} disabled={isRefreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <ToggleGroup 
                      type="single" 
                      value={selectedArtifactType} 
                      onValueChange={(value) => value && setSelectedArtifactType(value as any)}
                      className="glass rounded-xl p-1"
                    >
                      <ToggleGroupItem value="all" className="data-[state=on]:gradient-secondary data-[state=on]:text-white rounded-lg px-4">All</ToggleGroupItem>
                      <ToggleGroupItem value="image" className="data-[state=on]:gradient-accent data-[state=on]:text-white rounded-lg px-4" title="Images">
                        <ImageIcon className="w-4 h-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="code" className="data-[state=on]:gradient-primary data-[state=on]:text-white rounded-lg px-4" title="Code">
                        <Code className="w-4 h-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="text" className="data-[state=on]:gradient-tertiary data-[state=on]:text-white rounded-lg px-4" title="Text">
                        <FileText className="w-4 h-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="audio" className="data-[state=on]:bg-emerald-500 data-[state=on]:text-white rounded-lg px-4" title="Audio">
                        <Volume2 className="w-4 h-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
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
                          {/* Content Preview */}
                          <div 
                            className="mb-3 p-2 rounded-lg bg-muted/30 max-h-20 overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setSelectedArtifact(artifact);
                              setShowArtifactPreview(true);
                            }}
                          >
                            {artifact.type === 'image' && artifact.content.match(/^https?:\/\/|^data:image/) ? (
                              <img 
                                src={artifact.content} 
                                alt={artifact.title || 'Image'} 
                                className="w-full h-16 object-cover rounded"
                              />
                            ) : artifact.type === 'code' ? (
                              <pre className="text-[10px] text-muted-foreground font-mono overflow-hidden whitespace-pre-wrap line-clamp-3">
                                {artifact.content.slice(0, 200)}
                              </pre>
                            ) : (
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {artifact.content.slice(0, 150)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">{artifact.session?.model?.name || 'Unknown'}</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{artifact.type}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="glass"
                              onClick={() => {
                                setSelectedArtifact(artifact);
                                setShowArtifactPreview(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 glass"
                              onClick={() => {
                                // For HTTP images, open in new tab
                                if (artifact.type === 'image' && artifact.content.match(/^https?:\/\//)) {
                                  window.open(artifact.content, '_blank');
                                } else if (artifact.type === 'image' && artifact.content.startsWith('data:image/')) {
                                  // Handle base64 data URLs for images
                                  const a = document.createElement('a');
                                  a.href = artifact.content;
                                  a.download = `${artifact.title || 'image'}.png`;
                                  a.click();
                                } else if (artifact.type === 'audio' && artifact.content.startsWith('data:audio/')) {
                                  // Handle base64 data URLs for audio
                                  const a = document.createElement('a');
                                  a.href = artifact.content;
                                  a.download = `${artifact.title || 'audio'}.mp3`;
                                  a.click();
                                } else {
                                  // For text/code, download as file
                                  const blob = new Blob([artifact.content], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${artifact.title || 'artifact'}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              }}
                            >
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

          {/* Artifact Preview Dialog */}
          <Dialog open={showArtifactPreview} onOpenChange={setShowArtifactPreview}>
            <DialogContent className="glass-card max-w-3xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedArtifact?.type === 'image' ? 'gradient-accent glow-accent' :
                    selectedArtifact?.type === 'code' ? 'gradient-primary glow-primary' :
                    selectedArtifact?.type === 'audio' ? 'gradient-success' :
                    'gradient-secondary glow-secondary'
                  }`}>
                    {selectedArtifact?.type === 'image' ? <ImageIcon className="w-5 h-5 text-white" /> :
                     selectedArtifact?.type === 'code' ? <Code className="w-5 h-5 text-white" /> :
                     selectedArtifact?.type === 'audio' ? <Volume2 className="w-5 h-5 text-white" /> :
                     <FileText className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <DialogTitle>{selectedArtifact?.title || 'Untitled Artifact'}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{selectedArtifact?.session?.model?.name || 'Unknown Model'}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{selectedArtifact?.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedArtifact?.createdAt && new Date(selectedArtifact.createdAt).toLocaleString()}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] mt-4">
                {selectedArtifact?.type === 'image' && selectedArtifact.content.match(/^https?:\/\/|^data:image/) ? (
                  <img 
                    src={selectedArtifact.content} 
                    alt={selectedArtifact.title || 'Image'} 
                    className="w-full rounded-lg"
                  />
                ) : selectedArtifact?.type === 'code' ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    {/* Header with language and copy button */}
                    <div className={`flex items-center justify-between px-4 py-2 border-b ${
                      isDark 
                        ? 'bg-zinc-800/80 border-white/10' 
                        : 'bg-gray-100 border-gray-200'
                    }`}>
                      <span className={`text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-zinc-400' : 'text-gray-500'
                      }`}>
                        {/* Try to detect language from content */}
                        {(() => {
                          const content = selectedArtifact.content.toLowerCase();
                          if (content.includes('def ') || content.includes('import ') && content.includes(':')) return 'python';
                          if (content.includes('function ') || content.includes('const ') || content.includes('let ')) return 'javascript';
                          if (content.includes('<html') || content.includes('<div')) return 'html';
                          if (content.includes('interface ') || content.includes(': string') || content.includes(': number')) return 'typescript';
                          return 'code';
                        })()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs transition-colors ${
                          isDark 
                            ? 'hover:bg-white/10 text-zinc-400 hover:text-white' 
                            : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                        }`}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedArtifact.content);
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy code
                      </Button>
                    </div>
                    <SyntaxHighlighter
                      language={(() => {
                        const content = selectedArtifact.content.toLowerCase();
                        if (content.includes('def ') || (content.includes('import ') && content.includes(':'))) return 'python';
                        if (content.includes('function ') || content.includes('const ') || content.includes('let ')) return 'javascript';
                        if (content.includes('<html') || content.includes('<div')) return 'html';
                        if (content.includes('interface ') || content.includes(': string') || content.includes(': number')) return 'typescript';
                        return 'text';
                      })()}
                      style={isDark ? oneDark : oneLight}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: isDark ? 'rgb(24 24 27 / 0.8)' : 'rgb(249 250 251)',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Andale Mono", monospace',
                        }
                      }}
                    >
                      {selectedArtifact.content}
                    </SyntaxHighlighter>
                  </div>
                ) : selectedArtifact?.type === 'audio' && selectedArtifact.content.match(/^https?:\/\/|^data:audio/) ? (
                  <audio controls className="w-full">
                    <source src={selectedArtifact.content} />
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <MarkdownRenderer content={selectedArtifact?.content || ''} />
                  </div>
                )}
              </ScrollArea>
              <DialogFooter className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="glass"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedArtifact?.content || '');
                    toast({ title: "Copied to clipboard" });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  className="glass"
                  onClick={() => {
                    if (selectedArtifact?.type === 'image' && selectedArtifact.content.match(/^https?:\/\//)) {
                      window.open(selectedArtifact.content, '_blank');
                    } else if (selectedArtifact?.type === 'image' && selectedArtifact.content.startsWith('data:image/')) {
                      // Handle base64 data URLs for images
                      const a = document.createElement('a');
                      a.href = selectedArtifact.content;
                      a.download = `${selectedArtifact.title || 'image'}.png`;
                      a.click();
                    } else if (selectedArtifact?.type === 'audio' && selectedArtifact.content.startsWith('data:audio/')) {
                      // Handle base64 data URLs for audio
                      const a = document.createElement('a');
                      a.href = selectedArtifact.content;
                      a.download = `${selectedArtifact.title || 'audio'}.mp3`;
                      a.click();
                    } else if (selectedArtifact) {
                      // For text/code, download as file
                      const blob = new Blob([selectedArtifact.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedArtifact.title || 'artifact'}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

          {/* COURSES TAB */}
          <TabsContent value="courses" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Course</h2>
                  <p className="text-muted-foreground">Track your learning progress</p>
                </div>
              </div>
              {enrolledCourse ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card 
                    className="glass-card card-hover overflow-hidden group animate-scale-in"
                  >
                    <div className="h-1.5 w-full gradient-primary" />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform gradient-primary glow-primary">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant="outline" className="text-xs">Enrolled</Badge>
                      </div>
                      <CardTitle className="mt-4">{enrolledCourse.name}</CardTitle>
                      <CardDescription>Your current enrolled course</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        <span>Active Enrollment</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="glass-card border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Course Enrolled</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      You are not currently enrolled in any course. Please contact your administrator.
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        </TabsContent>
        </Tabs>

        {/* Global Create Chatbot Dialog - rendered outside tabs for accessibility from Quick Actions */}
        <Dialog open={isCreateChatbotOpen} onOpenChange={setIsCreateChatbotOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 glass-card border-white/10">
            <DialogHeader className="p-6 pb-4 border-b border-white/5">
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                Create AI Chatbot
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
                      <Label htmlFor="chatbot-name-global">Chatbot Name *</Label>
                      <Input 
                        id="chatbot-name-global" 
                        placeholder="e.g., Python Tutor, Math Helper" 
                        className="glass mt-1.5"
                        value={chatbotName}
                        onChange={(e) => setChatbotName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chatbot-desc-global">Description</Label>
                      <Textarea 
                        id="chatbot-desc-global" 
                        rows={2} 
                        placeholder="Describe what this chatbot helps with..." 
                        className="glass mt-1.5"
                        value={chatbotDescription}
                        onChange={(e) => setChatbotDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chatbot-model-global">AI Model *</Label>
                      <Select value={chatbotModel} onValueChange={setChatbotModel}>
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
                      placeholder="Define how your chatbot should behave..."
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
                          {strictMode ? "Chatbot strictly follows behavior prompt" : "Chatbot has flexibility"}
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
              <Button variant="outline" onClick={() => setIsCreateChatbotOpen(false)} className="glass">Cancel</Button>
              <Button className="gradient-accent glow-accent" onClick={handleCreateChatbot}>
                <Bot className="w-4 h-4 mr-2" />
                Create Chatbot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Chatbot Dialog */}
        <Dialog open={isEditChatbotOpen} onOpenChange={(open) => {
          setIsEditChatbotOpen(open);
          if (!open) setEditingChatbot(null);
        }}>
          <DialogContent className="max-w-lg glass-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                Edit Chatbot
              </DialogTitle>
              <DialogDescription>
                Update your AI chatbot's configuration
              </DialogDescription>
            </DialogHeader>
            
            {editingChatbot && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Chatbot Name</Label>
                  <Input 
                    value={editingChatbot.name}
                    onChange={(e) => setEditingChatbot({...editingChatbot, name: e.target.value})}
                    className="glass"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    value={editingChatbot.description}
                    onChange={(e) => setEditingChatbot({...editingChatbot, description: e.target.value})}
                    className="w-full min-h-[80px] p-3 rounded-xl glass text-sm resize-none"
                    placeholder="What does this chatbot do?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Behavior Prompt</Label>
                  <textarea
                    value={editingChatbot.behaviorPrompt}
                    onChange={(e) => setEditingChatbot({...editingChatbot, behaviorPrompt: e.target.value})}
                    className="w-full min-h-[80px] p-3 rounded-xl glass text-sm resize-none"
                    placeholder="Instructions for how the chatbot should behave..."
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl glass">
                  <div>
                    <Label>Strict Mode</Label>
                    <p className="text-xs text-muted-foreground">Enforce stricter guardrail checking</p>
                  </div>
                  <Switch 
                    checked={editingChatbot.strictMode}
                    onCheckedChange={(checked) => setEditingChatbot({...editingChatbot, strictMode: checked})}
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
                  {(editingChatbot.knowledgeBase || []).length > 0 ? (
                    <div className="space-y-1">
                      {(editingChatbot.knowledgeBase || []).map((file, idx) => (
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
                              const newFiles = (editingChatbot.knowledgeBase || []).filter((_, i) => i !== idx);
                              setEditingChatbot({...editingChatbot, knowledgeBase: newFiles});
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
                {(editingChatbot.guardrails || []).length > 0 && (
                  <div className="p-3 rounded-xl glass">
                    <Label className="text-xs text-muted-foreground">Guardrails ({(editingChatbot.guardrails || []).length})</Label>
                    <div className="mt-2 space-y-1">
                      {(editingChatbot.guardrails || []).map((g, idx) => (
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
              <Button variant="outline" onClick={() => setIsEditChatbotOpen(false)} className="glass">
                Cancel
              </Button>
              <Button 
                className="gradient-accent glow-accent"
                disabled={updateChatbotMutation.isPending}
                onClick={async () => {
                  if (editingChatbot) {
                    try {
                      await updateChatbotMutation.mutateAsync({
                        id: editingChatbot.id,
                        data: {
                          name: editingChatbot.name,
                          description: editingChatbot.description,
                          behaviorPrompt: editingChatbot.behaviorPrompt,
                          strictMode: editingChatbot.strictMode,
                          knowledgeBase: editingChatbot.knowledgeBase,
                          status: editingChatbot.status,
                        }
                      });
                      toast({
                        title: "Chatbot updated",
                        description: `${editingChatbot.name} has been updated successfully.`,
                      });
                      setIsEditChatbotOpen(false);
                      setEditingChatbot(null);
                    } catch (error: any) {
                      toast({
                        title: "Failed to update chatbot",
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
