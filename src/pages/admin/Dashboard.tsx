import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import SkyToggle from "@/components/ui/sky-toggle";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Users, BookOpen, Brain, Key, BarChart3, Shield as ShieldIcon, User, 
  Plus, Pencil, Trash2, KeyRound, RefreshCw, Coins, Upload, Download,
  Check, Settings, LayoutDashboard, GraduationCap, ChevronLeft, ChevronRight,
  Activity, TrendingUp, Clock, Search, MessageSquare, FileText, DollarSign,
  Zap, Globe, Lock, Eye, Building2, Bell, Bot, Layers, Filter, TestTube,
  CheckCircle, XCircle, AlertTriangle, Star, Award, TrendingDown, CircleDot
} from "lucide-react";
import { mockStudents, mockCourses, mockAIModels, mockBatches, mockAPIProviders, mockGuardrails, mockAdmins } from "@/lib/mockData";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [modelCategory, setModelCategory] = useState("all");
  const [modelProvider, setModelProvider] = useState("all");
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showGuardrailDialog, setShowGuardrailDialog] = useState(false);
  const [tokenManagementTab, setTokenManagementTab] = useState("overview");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentCourseFilter, setStudentCourseFilter] = useState("all");

  const modelCategories = ["all", "text", "image", "audio", "video", "code", "multimodal"];
  const providers = ["All Providers", "Anthropic", "Deepseek", "Elevenlabs", "Google", "Groq", "Meta", "Mistral", "Openai"];
  
  const filteredModels = mockAIModels.filter(m => {
    const categoryMatch = modelCategory === "all" || m.category === modelCategory;
    const providerMatch = modelProvider === "all" || m.provider.toLowerCase() === modelProvider.toLowerCase();
    return categoryMatch && providerMatch;
  });

  const filteredStudents = mockStudents.filter(s => {
    const searchMatch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                       s.email.toLowerCase().includes(studentSearchQuery.toLowerCase());
    const courseMatch = studentCourseFilter === "all" || s.course === studentCourseFilter;
    return searchMatch && courseMatch;
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 bg-grid-dots opacity-20" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">GenAI Lab</h1>
                  <p className="text-xs text-muted-foreground">Thrivetogether Institution India</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
                <Bell className="w-5 h-5" />
              </Button>
              
              <SkyToggle checked={isDark} onChange={toggleTheme} />
              
              <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 p-6 space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}</h1>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="glass rounded-xl p-1 inline-flex flex-wrap gap-1">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                  {[
                    { value: "overview", label: "Overview" },
                    { value: "courses", label: "Courses" },
                    { value: "students", label: "Students" },
                    { value: "models", label: "AI Models" },
                    { value: "api-keys", label: "API Keys" },
                    { value: "tokens", label: "Token Management" },
                    { value: "analytics", label: "Usage Analytics" },
                    { value: "guardrails", label: "Guardrails" },
                    { value: "profile", label: "Profile" },
                  ].map((tab) => (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-lg font-medium px-4 py-2 transition-all duration-300"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" className="glass">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Dashboard Overview</h2>
              <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                <CircleDot className="w-3 h-3 mr-1" />
                Offline
              </Badge>
              <Button variant="outline" size="sm" className="ml-auto glass">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Total Students", value: "30", icon: Users },
                { label: "Total Courses", value: "1", icon: BookOpen },
                { label: "AI Models", value: "29", icon: Brain },
              ].map((stat, idx) => (
                <Card key={idx} className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <stat.icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Stats Row */}
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { label: "Active Users", icon: Users, daily: 0, weekly: 0, monthly: 11 },
                { label: "Chats", icon: MessageSquare, daily: 0, weekly: 0, monthly: 776 },
                { label: "Costs", icon: DollarSign, daily: "$0.00", weekly: "$0.00", monthly: "$25.53" },
                { label: "Agents Created", icon: Bot, daily: 0, weekly: 0, monthly: 18 },
                { label: "Agent Sessions", icon: Activity, daily: 0, weekly: 0, monthly: 57 },
              ].map((stat, idx) => (
                <Card key={idx} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{stat.label}</span>
                      <stat.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily</span>
                        <span className="font-medium">{stat.daily}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weekly</span>
                        <span className="font-medium">{stat.weekly}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly</span>
                        <span className="font-medium">{stat.monthly}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top Lists */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Top 3 Most Used Models */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Top 3 Most Used Models
                  </CardTitle>
                  <CardDescription className="text-xs">Based on session count (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { rank: 1, name: "Unknown", sessions: 156, tokens: "18,044" },
                    { rank: 2, name: "Unknown", sessions: 140, tokens: "1,693" },
                    { rank: 3, name: "Unknown", sessions: 124, tokens: "5,848" },
                  ].map((item) => (
                    <div key={item.rank} className="flex items-center gap-3 p-3 glass rounded-xl">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        item.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        item.rank === 2 ? 'bg-slate-400/20 text-slate-400' :
                        'bg-amber-600/20 text-amber-600'
                      }`}>
                        {item.rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sessions} sessions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-400">{item.tokens}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top 5 Engaged Users */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Top 5 Engaged Users
                  </CardTitle>
                  <CardDescription className="text-xs">Based on session and message count (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { rank: 1, name: "Priya Sharma", sessions: 361, messages: 173, tokens: "34,251" },
                    { rank: 2, name: "Arjun Patel", sessions: 124, messages: 4, tokens: "7,587" },
                    { rank: 3, name: "Ayush", sessions: 79, messages: 13, tokens: "2,932" },
                    { rank: 4, name: "Heena Parekh", sessions: 0, messages: 0, tokens: "4,570" },
                  ].map((item) => (
                    <div key={item.rank} className="flex items-center gap-3 p-2 glass rounded-lg">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        item.rank === 2 ? 'bg-slate-400/20 text-slate-400' :
                        item.rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-white/10 text-muted-foreground'
                      }`}>
                        {item.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sessions} sessions • {item.messages} messages</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-cyan-400">{item.tokens}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top 5 Best Users */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-pink-400" />
                    Top 5 Best Users
                  </CardTitle>
                  <CardDescription className="text-xs">Based on average scores (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { rank: 1, name: "Ganesh Gaikwad", sessions: 1, messages: 4, score: "75.0%" },
                    { rank: 2, name: "Shohini Ghosh", sessions: 14, messages: 82, score: "67.9%" },
                    { rank: 3, name: "Heena Parekh", sessions: 26, messages: 112, score: "67.7%" },
                  ].map((item) => (
                    <div key={item.rank} className="flex items-center gap-3 p-2 glass rounded-lg">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        item.rank === 2 ? 'bg-slate-400/20 text-slate-400' :
                        'bg-amber-600/20 text-amber-600'
                      }`}>
                        {item.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sessions} sessions • {item.messages} messages</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-400">{item.score}</p>
                        <p className="text-xs text-muted-foreground">avg score</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* COURSES TAB */}
          <TabsContent value="courses" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Courses Management</h2>
                <p className="text-sm text-muted-foreground">Manage academic courses and batch organizations</p>
              </div>
              <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary glow-primary btn-press">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10">
                  <DialogHeader>
                    <DialogTitle>Add New Course</DialogTitle>
                    <DialogDescription>Create a new course for your institution</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Course Name</Label>
                      <Input placeholder="e.g., Introduction to AI" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Brief description of the course" rows={3} className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label>Instructor</Label>
                      <Input placeholder="e.g., Dr. Sarah Chen" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (Weeks)</Label>
                      <Input type="number" placeholder="8" className="glass" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddCourseDialog(false)} className="glass">Cancel</Button>
                    <Button className="gradient-primary" onClick={() => {
                      toast({ title: "Course created successfully!" });
                      setShowAddCourseDialog(false);
                    }}>Create Course</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Course Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockCourses.map((course, idx) => (
                <Card key={course.id} className="glass-card overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs glass">
                              Batches
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{course.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* STUDENTS TAB */}
          <TabsContent value="students" className="space-y-6 mt-6">
            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Courses", value: "1" },
                { label: "Batches", value: "3" },
                { label: "Students", value: "30" },
              ].map((stat, idx) => (
                <Card key={idx} className="glass-card">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="glass">Add Course</Button>
              <Button variant="outline" className="glass">Add Batch</Button>
            </div>

            {/* Students Management Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Students Management</h2>
                <p className="text-sm text-muted-foreground">Manage student accounts, access, and token limits</p>
              </div>
              <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary glow-primary btn-press">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>Register a new student account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="John Doe" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="john@university.edu" className="glass" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Select>
                          <SelectTrigger className="glass"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {mockCourses.map(course => (
                              <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Batch</Label>
                        <Select>
                          <SelectTrigger className="glass"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {mockBatches.map(batch => (
                              <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Token Limit</Label>
                      <Input type="number" placeholder="100000" defaultValue="100000" className="glass" />
                      <p className="text-xs text-muted-foreground">Maximum tokens the student can use</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddStudentDialog(false)} className="glass">Cancel</Button>
                    <Button className="gradient-primary">Add Student</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search students..." 
                  className="glass pl-9"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                />
              </div>
              <Select value={studentCourseFilter} onValueChange={setStudentCourseFilter}>
                <SelectTrigger className="glass w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {mockCourses.map(course => (
                    <SelectItem key={course.id} value={course.title}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Operations */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bulk Student Operations</CardTitle>
                <CardDescription className="text-xs">Manage multiple students at once</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 glass rounded-xl">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Upload className="w-4 h-4" />
                      <span className="font-medium text-sm">Bulk Import</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Import students from CSV file</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full glass">
                          <Upload className="w-3 h-3 mr-2" />
                          Import CSV
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-white/10">
                        <DialogHeader>
                          <DialogTitle>Import Students from CSV</DialogTitle>
                          <DialogDescription>Upload a CSV file to bulk import students</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Select Batch</Label>
                            <Select>
                              <SelectTrigger className="glass"><SelectValue placeholder="Select batch" /></SelectTrigger>
                              <SelectContent>
                                {mockBatches.map(batch => (
                                  <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Upload CSV File</Label>
                            <Input type="file" accept=".csv" className="glass" />
                            <p className="text-xs text-muted-foreground">CSV should contain: name, email, registration_id columns</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" className="glass">Cancel</Button>
                          <Button className="gradient-primary">Import Students</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="p-4 glass rounded-xl">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Download className="w-4 h-4" />
                      <span className="font-medium text-sm">Export Students</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Export student data</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 glass">
                        <FileText className="w-3 h-3 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 glass">
                        <FileText className="w-3 h-3 mr-1" />
                        JSON
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 glass rounded-xl">
                    <div className="flex items-center gap-2 text-pink-400 mb-2">
                      <Settings className="w-4 h-4" />
                      <span className="font-medium text-sm">Bulk Operations</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Perform operations on multiple students</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full glass">
                          <Settings className="w-3 h-3 mr-2" />
                          Manage Students
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-white/10">
                        <DialogHeader>
                          <DialogTitle>Bulk Student Management</DialogTitle>
                          <DialogDescription>Perform operations on multiple students at once</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Operation</Label>
                            <Select>
                              <SelectTrigger className="glass"><SelectValue placeholder="Select operation" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="update-status">Update Status</SelectItem>
                                <SelectItem value="update-tokens">Update Token Limits</SelectItem>
                                <SelectItem value="reset-passwords">Reset Passwords</SelectItem>
                                <SelectItem value="delete">Delete Students</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Registration IDs</Label>
                            <Textarea 
                              placeholder="Enter Registration IDs (comma separated)&#10;e.g., REG001, REG002, REG003" 
                              rows={4} 
                              className="glass font-mono text-sm" 
                            />
                            <p className="text-xs text-muted-foreground">Enter student registration IDs separated by commas</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" className="glass">Cancel</Button>
                          <Button className="gradient-primary">Execute Operation</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Students ({filteredStudents.length})</h3>
              <Button variant="outline" size="sm" className="glass">
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh
              </Button>
            </div>
            <p className="text-sm text-muted-foreground -mt-4">Manage student accounts, monitor token usage, and control access</p>

            <div className="grid gap-4 md:grid-cols-3">
              {filteredStudents.map((student, idx) => (
                <Card key={student.id} className="glass-card">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-xs text-blue-400">{student.email}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">active</Badge>
                    </div>
                    
                    {/* Course & Batch */}
                    <p className="text-sm font-medium">{student.course || "No Course"}</p>
                    <p className="text-xs text-muted-foreground">{student.batch || "No Batch"}</p>
                    
                    {/* Rank */}
                    <div className="flex items-center gap-2 mt-3 p-2 rounded-lg" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
                      <Award className="w-4 h-4 text-orange-400" />
                      <span className="text-sm">Rank</span>
                      <span className="ml-auto font-bold text-orange-400">#{student.rank || 0}</span>
                      <span className="text-muted-foreground text-sm">/{31}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                          <p className="font-bold text-blue-400">{student.sessions || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Prompts</p>
                          <p className="font-bold text-purple-400">{student.prompts || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
                        <FileText className="w-4 h-4 text-pink-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Artifacts</p>
                          <p className="font-bold text-pink-400">{student.artifacts || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                          <p className="font-bold text-emerald-400">{student.avgScore || 0}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Token Usage */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Token Usage</span>
                        <span>{student.tokensUsed.toLocaleString()}/{student.tokensLimit.toLocaleString()}</span>
                      </div>
                      <Progress value={(student.tokensUsed / student.tokensLimit) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{((student.tokensUsed / student.tokensLimit) * 100).toFixed(1)}% used</p>
                    </div>

                    {/* Last Active */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Last Active: {student.lastActive}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-6 gap-1 mt-4 pt-3 border-t border-white/5">
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" title="Change Course/Batch">
                        <BookOpen className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" title="Edit Credentials">
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" title="Manage Token Limit">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5" title="Reset Password">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5 text-orange-400" title="Unenroll from Course/Batch">
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5 text-red-400" title="Delete Student Account">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI MODELS TAB */}
          <TabsContent value="models" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">AI Models Management</h2>
                <p className="text-sm text-muted-foreground">Configure and manage AI models for your institution</p>
              </div>
              <p className="text-sm text-muted-foreground">Models are globally available. Configure API keys and access controls for your institution.</p>
            </div>

            {/* Category Tabs */}
            <div className="glass rounded-xl p-1 inline-flex gap-1">
              {modelCategories.map((cat) => (
                <Button
                  key={cat}
                  variant={modelCategory === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setModelCategory(cat)}
                  className={modelCategory === cat ? "bg-white/10" : "hover:bg-white/5"}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>

            {/* Provider Filter */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Filter by Provider:</p>
              <div className="flex flex-wrap gap-2">
                {providers.map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    size="sm"
                    onClick={() => setModelProvider(provider === "All Providers" ? "all" : provider)}
                    className={`glass text-xs ${
                      (provider === "All Providers" && modelProvider === "all") || 
                      provider.toLowerCase() === modelProvider.toLowerCase() 
                        ? "bg-primary/20 border-primary/50" 
                        : ""
                    }`}
                  >
                    {provider}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <span>Showing {filteredModels.length} models</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {mockAIModels.filter(m => m.enabled).length} Public
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                {mockAIModels.filter(m => !m.enabled).length} Restricted
              </span>
              <span className="text-muted-foreground">Total: {mockAIModels.length} models available</span>
            </div>

            {/* Model Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredModels.map((model, idx) => (
                <Card key={model.id} className="glass-card overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          model.enabled ? 'bg-emerald-500/20' : 'bg-orange-500/20'
                        }`}>
                          <Brain className={`w-5 h-5 ${model.enabled ? 'text-emerald-400' : 'text-orange-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                      </div>
                      <Badge className={model.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}>
                        {model.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{model.description}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.features?.slice(0, 3).map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                      ))}
                      {(model.features?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">+{(model.features?.length || 0) - 3} more</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-muted-foreground">Access Control:</span>
                      <Badge variant="outline" className={model.enabled ? "text-emerald-400 border-emerald-400/30" : "text-orange-400 border-orange-400/30"}>
                        <Globe className="w-3 h-3 mr-1" />
                        {model.enabled ? "Public" : "Restricted"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <span>{model.requestCount?.toLocaleString()} requests</span>
                      <span>{((model.requestCount || 0) * 2.5).toLocaleString()} tokens</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button size="sm" className={model.enabled ? "gradient-primary" : "glass"}>
                        <TestTube className="w-3 h-3 mr-1" />
                        Test Model
                      </Button>
                      <Button variant="outline" size="sm" className="glass">
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="glass">
                            <Users className="w-3 h-3 mr-1" />
                            Access
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-white/10">
                          <DialogHeader>
                            <DialogTitle>Configure Access - {model.name}</DialogTitle>
                            <DialogDescription>Set access permissions for this AI model</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Course Access</Label>
                              <Select>
                                <SelectTrigger className="glass"><SelectValue placeholder="Select courses" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Courses</SelectItem>
                                  {mockCourses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">Select which courses can access this model</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Batch Access</Label>
                              <Select>
                                <SelectTrigger className="glass"><SelectValue placeholder="Select batches" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Batches</SelectItem>
                                  {mockBatches.map(batch => (
                                    <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">Select which batches can access this model</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Individual Student Access</Label>
                              <Textarea 
                                placeholder="Enter Registration IDs (comma separated)&#10;e.g., REG001, REG002, REG003" 
                                rows={3} 
                                className="glass font-mono text-sm" 
                              />
                              <p className="text-xs text-muted-foreground">Grant access to specific students by their Registration IDs</p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" className="glass">Cancel</Button>
                            <Button className="gradient-primary">Save Access Settings</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" className={model.enabled ? "text-red-400 hover:text-red-400 glass" : "gradient-primary"}>
                        {model.enabled ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* API KEYS TAB */}
          <TabsContent value="api-keys" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">API Key Management</h2>
                <p className="text-sm text-muted-foreground">Configure API keys for all AI model providers</p>
              </div>
              <div className="flex gap-2">
                <Button className="gradient-primary">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test All Keys
                </Button>
                <Button variant="outline" className="glass">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="glass rounded-xl p-1 inline-flex gap-1">
              {["All Providers", "Text Models", "Image Models", "Audio Models"].map((tab) => (
                <Button key={tab} variant="ghost" size="sm" className="hover:bg-white/5">
                  {tab}
                </Button>
              ))}
            </div>

            {/* API Provider Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { name: "OpenAI", types: ["text", "image", "audio"], status: "working", lastTested: "11/26/2025, 2:36:25 PM" },
                { name: "Anthropic", types: ["text"], status: "working", lastTested: "11/13/2025, 5:48:46 PM" },
                { name: "Google AI", types: ["text", "image"], status: "working", lastTested: "11/9/2025, 12:53:49 PM" },
                { name: "Mistral AI", types: ["text"], status: "not-configured", lastTested: null },
                { name: "Meta", types: ["text"], status: "not-configured", lastTested: null },
                { name: "Groq", types: ["text"], status: "not-configured", lastTested: null },
                { name: "DeepSeek", types: ["text", "code"], status: "not-configured", lastTested: null },
                { name: "ElevenLabs", types: ["audio"], status: "working", lastTested: "10/14/2025, 11:18:17 AM" },
                { name: "Microsoft (Azure OpenAI)", types: ["text"], status: "not-configured", lastTested: null },
              ].map((provider, idx) => (
                <Card key={idx} className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          provider.status === "working" ? "bg-blue-500/20" : "bg-white/5"
                        }`}>
                          <Globe className={`w-5 h-5 ${provider.status === "working" ? "text-blue-400" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-xs text-muted-foreground">{provider.types.join(", ")}</p>
                        </div>
                      </div>
                      {provider.status === "working" && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    <Badge className={`mb-3 ${
                      provider.status === "working" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-white/5 text-muted-foreground"
                    }`}>
                      {provider.status === "working" ? "Working" : "Not Configured"}
                    </Badge>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="glass">
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-white/10">
                          <DialogHeader>
                            <DialogTitle>Configure {provider.name}</DialogTitle>
                            <DialogDescription>Enter your API credentials for {provider.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>API Key</Label>
                              <Input 
                                type="password" 
                                placeholder="sk-..." 
                                className="glass font-mono" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Base URL</Label>
                              <Input 
                                type="text" 
                                placeholder={`https://api.${provider.name.toLowerCase().replace(/\s/g, '')}.com/v1`}
                                className="glass font-mono text-sm" 
                              />
                              <p className="text-xs text-muted-foreground">Leave empty to use default endpoint</p>
                            </div>
                          </div>
                          <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" className="glass w-full sm:w-auto">
                              <TestTube className="w-4 h-4 mr-2" />
                              Test Connection
                            </Button>
                            <Button className="gradient-primary w-full sm:w-auto">
                              <Check className="w-4 h-4 mr-2" />
                              Save Configuration
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {provider.status === "working" && (
                        <Button variant="outline" size="sm" className="glass">
                          <TestTube className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                      )}
                    </div>

                    {provider.lastTested && (
                      <p className="text-xs text-muted-foreground mt-3">Last tested: {provider.lastTested}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TOKEN MANAGEMENT TAB */}
          <TabsContent value="tokens" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Token Management</h2>
                <p className="text-sm text-muted-foreground">Manage institutional tokens and allocations</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="glass">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" className="glass">
                  <Users className="w-4 h-4 mr-2" />
                  Allocate Tokens
                </Button>
              </div>
            </div>

            {/* Token Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tokens</p>
                      <p className="text-3xl font-bold text-primary mt-1">162,978</p>
                      <p className="text-sm text-blue-400">81,489 available</p>
                    </div>
                    <Coins className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <Progress value={50} className="h-2 mt-3" />
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                      <p className="text-3xl font-bold mt-1">0</p>
                      <p className="text-sm text-muted-foreground">With token allocations</p>
                    </div>
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Usage</p>
                      <p className="text-3xl font-bold mt-1">0</p>
                      <p className="text-sm text-muted-foreground">Tokens per student/day</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sub Tabs */}
            <div className="glass rounded-xl p-1 inline-flex gap-1">
              {["Overview", "Transactions", "Student Allocations", "Settings"].map((tab) => (
                <Button
                  key={tab}
                  variant={tokenManagementTab === tab.toLowerCase().replace(" ", "-") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTokenManagementTab(tab.toLowerCase().replace(" ", "-"))}
                  className={tokenManagementTab === tab.toLowerCase().replace(" ", "-") ? "bg-white/10" : "hover:bg-white/5"}
                >
                  {tab}
                </Button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Recent Transactions</CardTitle>
                  <CardDescription className="text-xs">Latest token activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No recent transactions
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Usage Analytics</CardTitle>
                  <CardDescription className="text-xs">Token consumption patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Daily Average", value: "5,093 tokens" },
                    { label: "Peak Usage Hour", value: "N/A" },
                    { label: "Most Used Model", value: "DALL-E 3" },
                    { label: "Efficiency Score", value: <Badge className="bg-red-500/20 text-red-400">0%</Badge> },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USAGE ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Usage Analytics</h2>
                <p className="text-sm text-muted-foreground">Monitor student activity and system performance</p>
                <span className="text-xs text-muted-foreground">• Last updated: 3:23:07 PM</span>
              </div>
              <Button variant="outline" className="glass">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { label: "Active Users", value: "0", icon: Users, change: "100.0% from last week", changeType: "neutral" },
                { label: "Daily Prompts", value: "0", icon: MessageSquare, change: "100.0% from yesterday", changeType: "neutral" },
                { label: "Avg Score", value: "0%", icon: TrendingUp, change: "100.0% from last week", changeType: "down" },
                { label: "Token Efficiency", value: "0%", icon: Zap, subtext: "Optimal usage", changeType: "neutral" },
                { label: "Failed/Restricted", value: "0", icon: XCircle, subtext: "System issues", changeType: "neutral" },
              ].map((stat, idx) => (
                <Card key={idx} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <stat.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.change && (
                      <p className={`text-xs mt-1 ${
                        stat.changeType === "up" ? "text-emerald-400" :
                        stat.changeType === "down" ? "text-red-400" :
                        "text-muted-foreground"
                      }`}>
                        {stat.changeType === "down" && <TrendingDown className="w-3 h-3 inline mr-1" />}
                        {stat.change}
                      </p>
                    )}
                    {stat.subtext && (
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Daily Trends (Last 30 Days)
                  </CardTitle>
                  <CardDescription className="text-xs">Token usage and active users over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center glass rounded-xl">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Line chart visualization</p>
                      <p className="text-xs text-muted-foreground mt-1">← Tokens (K) ← Active Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    Model Usage
                  </CardTitle>
                  <CardDescription className="text-xs">Token consumption by AI model</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center glass rounded-xl">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Bar chart visualization</p>
                      <p className="text-xs text-muted-foreground mt-1">Tokens Used by Model</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Provider Distribution */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Provider Distribution
                </CardTitle>
                <CardDescription className="text-xs">Token usage by AI provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-48 h-48 rounded-full border-8 border-blue-500 mx-auto relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">openai: 84.3%</p>
                          <p className="text-xs text-muted-foreground">google: 12.5%</p>
                          <p className="text-xs text-muted-foreground">anthropic: 0.9%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GUARDRAILS TAB */}
          <TabsContent value="guardrails" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Guardrails Management</h2>
                <p className="text-sm text-muted-foreground">Configure AI-powered intent-driven guardrails for your educational institution</p>
              </div>
            </div>

            {/* System Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  System Settings
                </CardTitle>
                <CardDescription className="text-xs">Configure basic guardrails parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Tokens per Request</Label>
                    <Input type="number" defaultValue="2000" className="glass" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Requests per Minute</Label>
                    <Input type="number" defaultValue="15" className="glass" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 glass rounded-xl">
                    <span className="font-medium">AI-Powered Intent Detection</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 glass rounded-xl">
                    <span className="font-medium">Strict Mode</span>
                    <Switch />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="gradient-primary">
                    <Settings className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guardrail Instructions */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldIcon className="w-4 h-4 text-pink-400" />
                      Guardrail Instructions
                    </CardTitle>
                    <CardDescription className="text-xs">AI-powered rules that analyze content intent rather than just keywords</CardDescription>
                  </div>
                  <Dialog open={showGuardrailDialog} onOpenChange={setShowGuardrailDialog}>
                    <DialogTrigger asChild>
                      <Button className="gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Instruction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-white/10">
                      <DialogHeader>
                        <DialogTitle>Add Guardrail Instruction</DialogTitle>
                        <DialogDescription>Create a new AI-powered guardrail rule</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select>
                              <SelectTrigger className="glass"><SelectValue placeholder="Select type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="educational">Educational Integrity</SelectItem>
                                <SelectItem value="content">Content Safety</SelectItem>
                                <SelectItem value="behavioral">Behavioral Guidelines</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Applies To</Label>
                            <Select>
                              <SelectTrigger className="glass"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="prompts">Prompts</SelectItem>
                                <SelectItem value="responses">Responses</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input placeholder="e.g., Safe Learning Environment" className="glass" />
                        </div>
                        <div className="space-y-2">
                          <Label>Instruction</Label>
                          <Textarea placeholder="Describe what should be blocked or encouraged..." rows={4} className="glass" />
                        </div>
                        <div className="space-y-2">
                          <Label>Priority (1-10)</Label>
                          <Input type="number" min={1} max={10} defaultValue={5} className="glass" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGuardrailDialog(false)} className="glass">Cancel</Button>
                        <Button className="gradient-primary">Create</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "Safe Learning Environment", type: "Content Safety", appliesTo: "Both", priority: 10, enabled: true, instruction: "Do not generate any content involving violence, illegal activities, adult content, self-harm, hate speech, or discriminatory material..." },
                  { title: "Personal Information Security", type: "Content Safety", appliesTo: "Both", priority: 9, enabled: true, instruction: "Never request, process, or share personal information including names, addresses, phone numbers, email addresses, student IDs..." },
                  { title: "Respectful Educational Interaction", type: "Behavioral Guidelines", appliesTo: "Both", priority: 8, enabled: true, instruction: "Maintain professional, respectful communication appropriate for educational settings..." },
                ].map((guardrail, idx) => (
                  <div key={idx} className="p-4 glass rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-medium">{guardrail.title}</span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Active</Badge>
                          <Badge variant="outline" className="text-xs">{guardrail.type}</Badge>
                          <Badge variant="outline" className="text-xs">{guardrail.appliesTo}</Badge>
                          <span className="text-xs text-muted-foreground">Priority: {guardrail.priority}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{guardrail.instruction}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={guardrail.enabled} />
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* Institution Logo */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Institution Logo
                </CardTitle>
                <CardDescription className="text-xs">Upload your institution's logo to display it across the platform. Recommended size: 200x200px. Max file size: 5MB.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Upload New Logo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input type="file" className="glass flex-1" accept="image/*" />
                    <Button className="gradient-primary">Upload</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Supported formats: JPG, PNG, SVG, GIF. Max size: 5MB</p>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4 text-pink-400" />
                  Change Password
                </CardTitle>
                <CardDescription className="text-xs">Update your password. Make sure to use a strong password with at least 8 characters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-orange-400">Current Password</Label>
                  <Input type="password" placeholder="Enter your current password" className="glass" />
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-400">New Password</Label>
                  <Input type="password" placeholder="Enter your new password" className="glass" />
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-400">Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm your new password" className="glass" />
                </div>
                <Button className="w-full gradient-primary">Change Password</Button>
              </CardContent>
            </Card>

            {/* Institution Admins */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  Institution Admins
                </CardTitle>
                <CardDescription className="text-xs">Manage admin accounts in your institution. Reset passwords will set them to "GenAIadmin".</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Sanjoy Paul", email: "sanjoy@thrivetogether.in", isPrimary: true },
                  { name: "Veena Patil", email: "veenapatil@thrivetogether.in", isPrimary: false },
                  { name: "Neha Singh", email: "nehasingh@thrivetogether.in", isPrimary: false },
                ].map((admin, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 glass rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{admin.name}</p>
                        {admin.isPrimary && <Badge variant="outline" className="text-xs">(You)</Badge>}
                      </div>
                      <p className="text-sm text-blue-400">{admin.email}</p>
                    </div>
                    <Button variant="outline" size="sm" className="glass">
                      <KeyRound className="w-3 h-3 mr-2" />
                      Reset Password
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
