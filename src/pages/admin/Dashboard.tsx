import { useState, useEffect } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SkyToggle from "@/components/ui/sky-toggle";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Users, BookOpen, Brain, Key, BarChart3, Shield as ShieldIcon, User, 
  Plus, Pencil, Trash2, KeyRound, RefreshCw, Coins, Upload, Download,
  Check, Settings, LayoutDashboard, GraduationCap, ChevronLeft, ChevronRight,
  Activity, TrendingUp, Clock, Search, MessageSquare, FileText, DollarSign,
  Zap, Globe, Lock, Eye, Building2, Bell, Bot, Layers, Filter, TestTube,
  CheckCircle, XCircle, AlertTriangle, Star, Award, TrendingDown, CircleDot, Loader2,
  LogOut, UserCircle, UserMinus
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { modelsApi, authApi, adminApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  useAdminStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useResetStudentPassword,
  useBulkOperation,
  useImportStudents,
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useBatches,
  useCreateBatch,
  useDeleteBatch,
  useAdminAnalytics,
  useAPIKeys,
  useUpdateAPIKey,
  useTestAPIKey,
  useDeleteAPIKey,
  useCreateModel,
  useDeleteModel,
  useToggleModelActive,
  useTestModel,
  useUpdateModel,
  useAddModelAccess,
  useRemoveModelAccess,
  useGuardrails,
  useCreateGuardrail,
  useUpdateGuardrail,
  useDeleteGuardrail,
  useSettings,
  useUpdateSettings,
  adminKeys,
} from "@/hooks/useAdminData";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Tab states - ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState("overview");
  const [modelCategory, setModelCategory] = useState("all");
  const [modelProvider, setModelProvider] = useState("all");
  const [tokenManagementTab, setTokenManagementTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Dialog states
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showGuardrailDialog, setShowGuardrailDialog] = useState(false);
  const [showEditCourseDialog, setShowEditCourseDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showConfigureApiKeyDialog, setShowConfigureApiKeyDialog] = useState(false);
  const [showEditGuardrailDialog, setShowEditGuardrailDialog] = useState(false);
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);
  const [configureModelId, setConfigureModelId] = useState<string | null>(null);
  const [accessModelId, setAccessModelId] = useState<string | null>(null);
  const [modelConfig, setModelConfig] = useState({ maxTokens: 4096, description: "" });
  const [modelAccessForm, setModelAccessForm] = useState({ courseId: "", batchId: "", studentIds: "" });
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "",
    modelId: "",
    category: "text",
    description: "",
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    isActive: false,
  });
  
  // Filter states
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentCourseFilter, setStudentCourseFilter] = useState("all");
  const [studentPage, setStudentPage] = useState(1);
  const [apiKeyFilter, setApiKeyFilter] = useState<"all" | "configured" | "not-configured">("all");
  
  // Form states
  const [newCourse, setNewCourse] = useState({ name: "", description: "", instructor: "", duration: 8 });
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [newBatch, setNewBatch] = useState({ courseId: "", name: "" });
  const [selectedCourseForBatches, setSelectedCourseForBatches] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", registrationId: "", courseId: "", batchId: "", tokenLimit: 100000 });
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [bulkOperation, setBulkOperation] = useState({ operation: "", registrationIds: "", value: "" });
  const [importData, setImportData] = useState({ batchId: "", file: null as File | null });
  const [newGuardrail, setNewGuardrail] = useState({ type: "", title: "", instruction: "", appliesTo: "both", priority: 5 });
  const [editingGuardrail, setEditingGuardrail] = useState<any>(null);
  const [apiKeyConfig, setApiKeyConfig] = useState({ provider: "", apiKey: "", baseUrl: "" });
  const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: "", apiKey: "", baseUrl: "" });
  const [deleteProviderId, setDeleteProviderId] = useState<string | null>(null);
  const [resetPasswordStudentId, setResetPasswordStudentId] = useState<string | null>(null);
  const [unenrollStudentId, setUnenrollStudentId] = useState<string | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [deleteGuardrailId, setDeleteGuardrailId] = useState<string | null>(null);
  const [tokenQuotaStudent, setTokenQuotaStudent] = useState<{ id: string; name: string; tokenQuota: number } | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // Query Hooks - Data fetching
  const { data: coursesData, isLoading: coursesLoading, refetch: refetchCourses } = useCourses();
  const { data: batchesData, isLoading: batchesLoading, refetch: refetchBatches } = useBatches();
  const { data: studentsData, isLoading: studentsLoading, refetch: refetchStudents } = useAdminStudents({
    page: studentPage,
    limit: 50,
    courseId: studentCourseFilter !== "all" ? studentCourseFilter : undefined,
    search: studentSearchQuery || undefined,
  });
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAdminAnalytics();
  const { data: apiKeysData, isLoading: apiKeysLoading, refetch: refetchApiKeys } = useAPIKeys();
  const { data: guardrailsData, isLoading: guardrailsLoading, refetch: refetchGuardrails } = useGuardrails();
  const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useSettings();
  const { data: modelsData, isLoading: modelsLoading, refetch: refetchModels } = useQuery({
    queryKey: ['admin', 'models'],
    queryFn: async () => {
      const response = await adminApi.getAllModels();
      return response.data;
    },
  });

  // Mutation Hooks
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const createBatchMutation = useCreateBatch();
  const deleteBatchMutation = useDeleteBatch();
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const resetPasswordMutation = useResetStudentPassword();
  const bulkOperationMutation = useBulkOperation();
  const importStudentsMutation = useImportStudents();
  const updateApiKeyMutation = useUpdateAPIKey();
  const testApiKeyMutation = useTestAPIKey();
  const deleteApiKeyMutation = useDeleteAPIKey();
  const createModelMutation = useCreateModel();
  const deleteModelMutation = useDeleteModel();
  const toggleModelMutation = useToggleModelActive();
  const testModelMutation = useTestModel();
  const updateModelMutation = useUpdateModel();
  const addModelAccessMutation = useAddModelAccess();
  const removeModelAccessMutation = useRemoveModelAccess();
  const createGuardrailMutation = useCreateGuardrail();
  const updateGuardrailMutation = useUpdateGuardrail();
  const deleteGuardrailMutation = useDeleteGuardrail();
  const updateSettingsMutation = useUpdateSettings();

  // Derived data - extract arrays from API response objects
  const courses = Array.isArray(coursesData?.data) ? coursesData.data : ((coursesData?.data as any)?.courses || []);
  const batches = Array.isArray(batchesData?.data) ? batchesData.data : ((batchesData?.data as any)?.batches || []);
  const students = Array.isArray(studentsData?.data) ? studentsData.data : ((studentsData?.data as any)?.students || []);
  const analytics = analyticsData?.data;
  const apiKeys = Array.isArray(apiKeysData?.data) ? apiKeysData.data : ((apiKeysData?.data as any)?.keys || []);
  const guardrails = Array.isArray(guardrailsData?.data) ? guardrailsData.data : ((guardrailsData?.data as any)?.guardrails || []);
  const models = modelsData?.models || [];

  const modelCategories = ["all", "text", "image", "audio", "video", "code", "multimodal"];
  const providers = ["All Providers", "Anthropic", "Deepseek", "Elevenlabs", "Google", "Groq", "Meta", "Mistral", "Openai"];
  
  const filteredModels = models.filter((m: any) => {
    const categoryMatch = modelCategory === "all" || m.category === modelCategory;
    const providerMatch = modelProvider === "all" || m.provider?.toLowerCase() === modelProvider.toLowerCase();
    return categoryMatch && providerMatch;
  });

  const filteredStudents = students.filter((s: any) => {
    const searchMatch = !studentSearchQuery || 
      s.name?.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
      s.email?.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.registrationId?.toLowerCase().includes(studentSearchQuery.toLowerCase());
    return searchMatch;
  });

  // Handlers
  const handleCreateCourse = async () => {
    await createCourseMutation.mutateAsync(newCourse);
    setShowAddCourseDialog(false);
    setNewCourse({ name: "", description: "", instructor: "", duration: 8 });
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;
    // Only send editable fields to avoid Prisma nested relation errors
    const { name, description, instructor, duration } = editingCourse;
    await updateCourseMutation.mutateAsync({ 
      id: editingCourse.id, 
      data: { name, description, instructor, duration } 
    });
    setShowEditCourseDialog(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      await deleteCourseMutation.mutateAsync(id);
    }
  };

  const handleCreateBatch = async () => {
    await createBatchMutation.mutateAsync(newBatch);
    setShowBatchDialog(false);
    setNewBatch({ courseId: "", name: "" });
  };

  const handleDeleteBatch = async (id: string) => {
    if (confirm("Are you sure you want to delete this batch?")) {
      await deleteBatchMutation.mutateAsync(id);
    }
  };

  const handleCreateStudent = async () => {
    await createStudentMutation.mutateAsync({
      ...newStudent,
      courseId: newStudent.courseId || undefined,
      batchId: newStudent.batchId || undefined,
      tokenLimit: newStudent.tokenLimit,
    });
    setShowAddStudentDialog(false);
    setNewStudent({ name: "", email: "", registrationId: "", courseId: "", batchId: "", tokenLimit: 100000 });
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    await updateStudentMutation.mutateAsync({
      id: editingStudent.id,
      data: {
        name: editingStudent.name,
        email: editingStudent.email,
        courseId: editingStudent.courseId || null,
        batchId: editingStudent.batchId || null,
        tokenQuota: editingStudent.tokenQuota,
        isActive: editingStudent.isActive,
      }
    });
    setShowEditStudentDialog(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: string) => {
    setDeleteStudentId(id);
  };

  const confirmDeleteStudent = async () => {
    if (deleteStudentId) {
      await deleteStudentMutation.mutateAsync({ id: deleteStudentId, permanent: true });
      setDeleteStudentId(null);
    }
  };

  const handleResetPassword = async (id: string) => {
    setResetPasswordStudentId(id);
  };

  const confirmResetPassword = async () => {
    if (resetPasswordStudentId) {
      await resetPasswordMutation.mutateAsync(resetPasswordStudentId);
      setResetPasswordStudentId(null);
    }
  };

  const handleUnenrollStudent = async () => {
    if (unenrollStudentId) {
      await updateStudentMutation.mutateAsync({
        id: unenrollStudentId,
        data: { courseId: null, batchId: null }
      });
      setUnenrollStudentId(null);
    }
  };

  const handleUpdateTokenQuota = async () => {
    if (tokenQuotaStudent) {
      await updateStudentMutation.mutateAsync({
        id: tokenQuotaStudent.id,
        data: { tokenQuota: tokenQuotaStudent.tokenQuota }
      });
      setTokenQuotaStudent(null);
      toast({ title: "Success", description: "Token quota updated successfully" });
    }
  };

  const handleBulkOperation = async () => {
    const registrationIds = bulkOperation.registrationIds.split(",").map(id => id.trim()).filter(Boolean);
    if (registrationIds.length === 0) {
      toast({ title: "Error", description: "Please enter registration IDs", variant: "destructive" });
      return;
    }
    await bulkOperationMutation.mutateAsync({
      operation: bulkOperation.operation as any,
      registrationIds,
      value: bulkOperation.value || undefined,
    });
    setShowBulkDialog(false);
    setBulkOperation({ operation: "", registrationIds: "", value: "" });
  };

  const handleImportStudents = async () => {
    if (!importData.file) {
      toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" });
      return;
    }
    // Parse CSV file
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const students = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        return {
          name: values[headers.indexOf("name")] || "",
          email: values[headers.indexOf("email")] || "",
          registrationId: values[headers.indexOf("registration_id")] || values[headers.indexOf("registrationid")] || "",
        };
      }).filter(s => s.email && s.name && s.registrationId);
      
      await importStudentsMutation.mutateAsync({
        students,
        batchId: importData.batchId || undefined,
      });
      setShowImportDialog(false);
      setImportData({ batchId: "", file: null });
    };
    reader.readAsText(importData.file);
  };

  const handleUpdateApiKey = async () => {
    await updateApiKeyMutation.mutateAsync({
      provider: apiKeyConfig.provider,
      data: {
        apiKey: apiKeyConfig.apiKey,
        baseUrl: apiKeyConfig.baseUrl || undefined,
      }
    });
    setShowConfigureApiKeyDialog(false);
    setApiKeyConfig({ provider: "", apiKey: "", baseUrl: "" });
  };

  const handleAddProvider = async () => {
    if (!newProvider.name || !newProvider.apiKey) {
      toast({ title: "Error", description: "Provider name and API key are required", variant: "destructive" });
      return;
    }
    await updateApiKeyMutation.mutateAsync({
      provider: newProvider.name.toLowerCase().replace(/\s+/g, '-'),
      data: {
        apiKey: newProvider.apiKey,
        baseUrl: newProvider.baseUrl || undefined,
      }
    });
    setShowAddProviderDialog(false);
    setNewProvider({ name: "", apiKey: "", baseUrl: "" });
    toast({ title: "Success", description: `Provider "${newProvider.name}" added successfully` });
  };

  const handleTestApiKey = async (provider: string) => {
    await testApiKeyMutation.mutateAsync(provider);
  };

  const handleCreateGuardrail = async () => {
    await createGuardrailMutation.mutateAsync(newGuardrail);
    setShowGuardrailDialog(false);
    setNewGuardrail({ type: "", title: "", instruction: "", appliesTo: "both", priority: 5 });
  };

  const handleUpdateGuardrail = async () => {
    if (!editingGuardrail) return;
    await updateGuardrailMutation.mutateAsync({
      id: editingGuardrail.id,
      data: {
        type: editingGuardrail.type,
        title: editingGuardrail.title,
        instruction: editingGuardrail.instruction,
        appliesTo: editingGuardrail.appliesTo,
        priority: editingGuardrail.priority,
      },
    });
    setShowEditGuardrailDialog(false);
    setEditingGuardrail(null);
  };

  const handleDeleteGuardrail = async () => {
    if (!deleteGuardrailId) return;
    await deleteGuardrailMutation.mutateAsync(deleteGuardrailId);
    setDeleteGuardrailId(null);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Please fill in all password fields", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: "Success", description: "Password changed successfully" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to change password", 
        variant: "destructive" 
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRefresh = async (section?: string) => {
    setIsRefreshing(true);
    try {
      if (section) {
        // Refresh specific section
        switch (section) {
          case 'courses':
            await Promise.all([refetchCourses(), refetchBatches()]);
            break;
          case 'students':
            await refetchStudents();
            break;
          case 'analytics':
            await refetchAnalytics();
            break;
          case 'apiKeys':
            await refetchApiKeys();
            break;
          case 'guardrails':
            await refetchGuardrails();
            break;
          case 'models':
            await refetchModels();
            break;
          default:
            await Promise.all([
              refetchCourses(),
              refetchBatches(),
              refetchStudents(),
              refetchAnalytics(),
              refetchApiKeys(),
              refetchGuardrails(),
              refetchModels(),
            ]);
        }
      } else {
        // Refresh all
        queryClient.invalidateQueries({ queryKey: adminKeys.all });
        await Promise.all([
          refetchCourses(),
          refetchBatches(),
          refetchStudents(),
          refetchAnalytics(),
          refetchApiKeys(),
          refetchGuardrails(),
          refetchModels(),
        ]);
      }
      toast({
        title: 'Refreshed',
        description: section ? `${section.charAt(0).toUpperCase() + section.slice(1)} data updated successfully` : 'All data refreshed successfully',
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

  // Protect admin route - redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/admin/signin');
      } else if (user?.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate, toast]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

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
                <img 
                  src="/genai-lab-logo.svg" 
                  alt="GenAI Lab Logo" 
                  className="w-8 h-8 rounded-lg"
                />
                <div>
                  <h1 className="text-lg font-bold">GenAI Lab</h1>
                  <p className="text-xs text-muted-foreground">Thrivetogether Institution India</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 glass" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Notifications</h4>
                    <Separator />
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <p className="text-sm font-medium">New student registered</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                      <div className="p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <p className="text-sm font-medium">API key usage alert</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                      <div className="p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <p className="text-sm font-medium">System update available</p>
                        <p className="text-xs text-muted-foreground">3 hours ago</p>
                      </div>
                    </div>
                    <Separator />
                    <Button variant="ghost" size="sm" className="w-full text-xs">View all notifications</Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <SkyToggle checked={isDark} onChange={toggleTheme} />
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || 'admin@genailab.com'}</p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || 'admin@genailab.com'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab('profile')} className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('api-keys')} className="cursor-pointer">
                    <Key className="mr-2 h-4 w-4" />
                    <span>API Keys</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      logout();
                      toast({
                        title: 'Logged out',
                        description: 'You have been successfully logged out.',
                      });
                    }} 
                    className="cursor-pointer text-red-400 focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <Button variant="outline" className="glass" onClick={() => handleRefresh()} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Dashboard Overview</h2>
              {analyticsLoading ? (
                <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Loading
                </Badge>
              ) : (
                <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                  <CircleDot className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              )}
              <Button variant="outline" size="sm" className="ml-auto glass" onClick={() => handleRefresh('analytics')} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Total Students", value: analytics?.overview?.totalStudents?.toString() || "0", icon: Users },
                { label: "Total Courses", value: courses.length?.toString() || "0", icon: BookOpen },
                { label: "AI Models", value: models.length?.toString() || "0", icon: Brain },
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
                { 
                  label: "Active Users", 
                  icon: Users, 
                  daily: analytics?.activeUsers?.daily || 0, 
                  weekly: analytics?.activeUsers?.weekly || 0, 
                  monthly: analytics?.activeUsers?.monthly || analytics?.overview?.activeStudents || 0 
                },
                { 
                  label: "Sessions", 
                  icon: MessageSquare, 
                  daily: analytics?.sessions?.daily || 0, 
                  weekly: analytics?.sessions?.weekly || 0, 
                  monthly: analytics?.sessions?.monthly || analytics?.overview?.totalSessions || 0 
                },
                { 
                  label: "Costs (USD)", 
                  icon: DollarSign, 
                  daily: `$${(analytics?.costs?.daily || 0).toFixed(4)}`, 
                  weekly: `$${(analytics?.costs?.weekly || 0).toFixed(4)}`, 
                  monthly: `$${(analytics?.costs?.monthly || 0).toFixed(4)}`,
                  isCurrency: true
                },
                { 
                  label: "Tokens Used", 
                  icon: Bot, 
                  daily: (analytics?.tokensUsed?.daily || 0).toLocaleString(), 
                  weekly: (analytics?.tokensUsed?.weekly || 0).toLocaleString(), 
                  monthly: (analytics?.tokensUsed?.monthly || analytics?.overview?.totalTokensUsed || 0).toLocaleString() 
                },
                { 
                  label: "Chatbots Created", 
                  icon: Activity, 
                  daily: analytics?.chatbotsCreated?.daily || 0, 
                  weekly: analytics?.chatbotsCreated?.weekly || 0, 
                  monthly: analytics?.chatbotsCreated?.monthly || analytics?.chatbotsCreated?.total || 0 
                },
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
                  {(analytics?.modelUsage?.slice(0, 3) || []).map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 glass rounded-xl">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-400' :
                        'bg-amber-600/20 text-amber-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.model?.name || item.modelId || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{item._count || 0} sessions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-400">{(item._sum?.tokensUsed || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.modelUsage || analytics.modelUsage.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No model usage data</p>
                  )}
                </CardContent>
              </Card>

              {/* Top 5 Engaged Users */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Top 5 Engaged Users
                  </CardTitle>
                  <CardDescription className="text-xs">Based on session and token count (last 30 days)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(analytics?.topPerformers?.slice(0, 5) || []).map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 glass rounded-lg">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-400' :
                        index === 2 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-white/10 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sessionsCount || 0} sessions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-cyan-400">{(item.tokenUsed || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.topPerformers || analytics.topPerformers.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No user data</p>
                  )}
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
                  {(analytics?.topPerformers?.filter((p: any) => p.avgScore > 0).sort((a: any, b: any) => b.avgScore - a.avgScore).slice(0, 5) || []).map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 glass rounded-lg">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-400' :
                        'bg-amber-600/20 text-amber-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sessionsCount || 0} sessions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-400">{item.avgScore?.toFixed(1) || 0}%</p>
                        <p className="text-xs text-muted-foreground">avg score</p>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.topPerformers || analytics.topPerformers.filter((p: any) => p.avgScore > 0).length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No score data</p>
                  )}
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
              <div className="flex gap-2">
                <Button variant="outline" className="glass" onClick={() => handleRefresh('courses')} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
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
                      <Input 
                        placeholder="e.g., Introduction to AI" 
                        className="glass" 
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Brief description of the course" 
                        rows={3} 
                        className="glass" 
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instructor</Label>
                      <Input 
                        placeholder="e.g., Dr. Sarah Chen" 
                        className="glass" 
                        value={newCourse.instructor}
                        onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (Weeks)</Label>
                      <Input 
                        type="number" 
                        placeholder="8" 
                        className="glass" 
                        value={newCourse.duration}
                        onChange={(e) => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) || 8 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddCourseDialog(false)} className="glass">Cancel</Button>
                    <Button 
                      className="gradient-primary" 
                      onClick={handleCreateCourse}
                      disabled={createCourseMutation.isPending || !newCourse.name}
                    >
                      {createCourseMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Create Course
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {/* Loading State */}
            {coursesLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Course Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: any) => (
                <Card key={course.id} className="glass-card overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold">{course.name}</h3>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs glass"
                                  onClick={() => setSelectedCourseForBatches(course.id)}
                                >
                                  Batches ({course._count?.batches || 0})
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="glass-card border-white/10">
                                <DialogHeader>
                                  <DialogTitle>Manage Batches - {course.name}</DialogTitle>
                                  <DialogDescription>View and manage batches for this course</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  {/* Add New Batch */}
                                  <div className="flex gap-2">
                                    <Input 
                                      placeholder="New batch name" 
                                      className="glass flex-1"
                                      value={newBatch.courseId === course.id ? newBatch.name : ""}
                                      onChange={(e) => setNewBatch({ courseId: course.id, name: e.target.value })}
                                    />
                                    <Button 
                                      className="gradient-primary"
                                      onClick={handleCreateBatch}
                                      disabled={createBatchMutation.isPending || !newBatch.name || newBatch.courseId !== course.id}
                                    >
                                      {createBatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                  {/* Existing Batches */}
                                  <div className="space-y-2">
                                    {batches.filter((b: any) => b.courseId === course.id).map((batch: any) => (
                                      <div key={batch.id} className="flex items-center justify-between p-3 glass rounded-lg">
                                        <div>
                                          <p className="font-medium">{batch.name}</p>
                                          <p className="text-xs text-muted-foreground">{batch._count?.students || 0} students</p>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-red-400"
                                          onClick={() => handleDeleteBatch(batch.id)}
                                          disabled={deleteBatchMutation.isPending}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    {batches.filter((b: any) => b.courseId === course.id).length === 0 && (
                                      <p className="text-center text-muted-foreground py-4">No batches yet</p>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingCourse({ ...course });
                                setShowEditCourseDialog(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-400"
                              onClick={() => handleDeleteCourse(course.id)}
                              disabled={deleteCourseMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{course.description || "No description"}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {course.instructor && <span>Instructor: {course.instructor}</span>}
                          {course.duration && <span>{course.duration} weeks</span>}
                          <span>{course._count?.students || 0} students</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!coursesLoading && courses.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No courses yet. Create your first course!</p>
                </div>
              )}
            </div>

            {/* Edit Course Dialog */}
            <Dialog open={showEditCourseDialog} onOpenChange={setShowEditCourseDialog}>
              <DialogContent className="glass-card border-white/10">
                <DialogHeader>
                  <DialogTitle>Edit Course</DialogTitle>
                  <DialogDescription>Update course information</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Course Name</Label>
                    <Input 
                      placeholder="e.g., Introduction to AI" 
                      className="glass" 
                      value={editingCourse?.name || ""}
                      onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Brief description of the course" 
                      rows={3} 
                      className="glass" 
                      value={editingCourse?.description || ""}
                      onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instructor</Label>
                    <Input 
                      placeholder="e.g., Dr. Sarah Chen" 
                      className="glass" 
                      value={editingCourse?.instructor || ""}
                      onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Weeks)</Label>
                    <Input 
                      type="number" 
                      placeholder="8" 
                      className="glass" 
                      value={editingCourse?.duration || 8}
                      onChange={(e) => setEditingCourse({ ...editingCourse, duration: parseInt(e.target.value) || 8 })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditCourseDialog(false)} className="glass">Cancel</Button>
                  <Button 
                    className="gradient-primary" 
                    onClick={handleUpdateCourse}
                    disabled={updateCourseMutation.isPending}
                  >
                    {updateCourseMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* STUDENTS TAB */}
          <TabsContent value="students" className="space-y-6 mt-6">
            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Courses", value: courses.length.toString() },
                { label: "Batches", value: batches.length.toString() },
                { label: "Students", value: (studentsData?.pagination?.total || students.length).toString() },
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
              <Button variant="outline" className="glass" onClick={() => setShowAddCourseDialog(true)}>Add Course</Button>
              <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="glass">Add Batch</Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10">
                  <DialogHeader>
                    <DialogTitle>Add New Batch</DialogTitle>
                    <DialogDescription>Create a new batch for a course</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select value={newBatch.courseId} onValueChange={(value) => setNewBatch({ ...newBatch, courseId: value })}>
                        <SelectTrigger className="glass"><SelectValue placeholder="Select course" /></SelectTrigger>
                        <SelectContent>
                          {courses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Batch Name</Label>
                      <Input 
                        placeholder="e.g., Batch 2024-A" 
                        className="glass" 
                        value={newBatch.name}
                        onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBatchDialog(false)} className="glass">Cancel</Button>
                    <Button 
                      className="gradient-primary"
                      onClick={handleCreateBatch}
                      disabled={createBatchMutation.isPending || !newBatch.courseId || !newBatch.name}
                    >
                      {createBatchMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Create Batch
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                      <Input 
                        placeholder="John Doe" 
                        className="glass" 
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        type="email" 
                        placeholder="john@university.edu" 
                        className="glass" 
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Registration ID</Label>
                      <Input 
                        placeholder="REG001" 
                        className="glass" 
                        value={newStudent.registrationId}
                        onChange={(e) => setNewStudent({ ...newStudent, registrationId: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Select value={newStudent.courseId || "none"} onValueChange={(value) => setNewStudent({ ...newStudent, courseId: value === "none" ? "" : value, batchId: "" })}>
                          <SelectTrigger className="glass"><SelectValue placeholder="Select Course" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select a Course</SelectItem>
                            {courses.map((course: any) => (
                              <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Batch</Label>
                        <Select value={newStudent.batchId || "none"} onValueChange={(value) => setNewStudent({ ...newStudent, batchId: value === "none" ? "" : value })}>
                          <SelectTrigger className="glass"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select a Batch</SelectItem>
                            {batches.filter((b: any) => !newStudent.courseId || b.courseId === newStudent.courseId).map((batch: any) => (
                              <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Token Limit</Label>
                      <Input 
                        type="number" 
                        placeholder="100000" 
                        value={newStudent.tokenLimit}
                        onChange={(e) => setNewStudent({ ...newStudent, tokenLimit: parseInt(e.target.value) || 100000 })}
                        className="glass" 
                      />
                      <p className="text-xs text-muted-foreground">Maximum tokens the student can use</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddStudentDialog(false)} className="glass">Cancel</Button>
                    <Button 
                      className="gradient-primary"
                      onClick={handleCreateStudent}
                      disabled={createStudentMutation.isPending || !newStudent.name || !newStudent.email || !newStudent.registrationId}
                    >
                      {createStudentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Add Student
                    </Button>
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
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
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
                    <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
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
                            <Label>Select Batch (Optional)</Label>
                            <Select value={importData.batchId || "none"} onValueChange={(value) => setImportData({ ...importData, batchId: value === "none" ? "" : value })}>
                              <SelectTrigger className="glass"><SelectValue placeholder="Select batch" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Batch</SelectItem>
                                {batches.map((batch: any) => (
                                  <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Upload CSV File</Label>
                            <Input 
                              type="file" 
                              accept=".csv" 
                              className="glass" 
                              onChange={(e) => setImportData({ ...importData, file: e.target.files?.[0] || null })}
                            />
                            <p className="text-xs text-muted-foreground">CSV should contain: name, email, registration_id columns</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" className="glass" onClick={() => setShowImportDialog(false)}>Cancel</Button>
                          <Button 
                            className="gradient-primary"
                            onClick={handleImportStudents}
                            disabled={importStudentsMutation.isPending || !importData.file}
                          >
                            {importStudentsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Import Students
                          </Button>
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
                    <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
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
                            <Select value={bulkOperation.operation || "none"} onValueChange={(value) => setBulkOperation({ ...bulkOperation, operation: value === "none" ? "" : value })}>
                              <SelectTrigger className="glass"><SelectValue placeholder="Select operation" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select an Operation</SelectItem>
                                <SelectItem value="update_status">Update Status</SelectItem>
                                <SelectItem value="update_tokens">Update Token Limits</SelectItem>
                                <SelectItem value="reset_passwords">Reset Passwords</SelectItem>
                                <SelectItem value="delete">Delete Students</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {bulkOperation.operation === "update_status" && (
                            <div className="space-y-2">
                              <Label>Set Status</Label>
                              <Select value={bulkOperation.value || "none"} onValueChange={(value) => setBulkOperation({ ...bulkOperation, value: value === "none" ? "" : value })}>
                                <SelectTrigger className="glass"><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Select Status</SelectItem>
                                  <SelectItem value="true">Active</SelectItem>
                                  <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          {bulkOperation.operation === "update_tokens" && (
                            <div className="space-y-2">
                              <Label>New Token Limit</Label>
                              <Input 
                                type="number" 
                                placeholder="100000" 
                                className="glass"
                                value={bulkOperation.value}
                                onChange={(e) => setBulkOperation({ ...bulkOperation, value: e.target.value })}
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Registration IDs</Label>
                            <Textarea 
                              placeholder="Enter Registration IDs (comma separated)&#10;e.g., REG001, REG002, REG003" 
                              rows={4} 
                              className="glass font-mono text-sm" 
                              value={bulkOperation.registrationIds}
                              onChange={(e) => setBulkOperation({ ...bulkOperation, registrationIds: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Enter student registration IDs separated by commas</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" className="glass" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
                          <Button 
                            className="gradient-primary"
                            onClick={handleBulkOperation}
                            disabled={bulkOperationMutation.isPending || !bulkOperation.operation || !bulkOperation.registrationIds}
                          >
                            {bulkOperationMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Execute Operation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Students ({studentsData?.pagination?.total || filteredStudents.length})</h3>
              <Button variant="outline" size="sm" className="glass" onClick={() => handleRefresh('students')} disabled={isRefreshing}>
                <RefreshCw className={`w-3 h-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-sm text-muted-foreground -mt-4">Manage student accounts, monitor token usage, and control access</p>

            {studentsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {filteredStudents.map((student: any) => (
                <Card key={student.id} className="glass-card">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-xs text-blue-400">{student.email}</p>
                        <p className="text-xs text-muted-foreground">{student.registrationId}</p>
                      </div>
                      <Badge className={student.isActive ? "bg-emerald-500/20 text-emerald-400 text-xs" : "bg-red-500/20 text-red-400 text-xs"}>
                        {student.isActive ? "active" : "inactive"}
                      </Badge>
                    </div>
                    
                    {/* Course & Batch */}
                    <p className="text-sm font-medium">{student.course?.name || "No Course"}</p>
                    <p className="text-xs text-muted-foreground">{student.batch?.name || "No Batch"}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                          <p className="font-bold text-blue-400">{student._count?.modelSessions ?? student._count?.sessions ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                        <Bot className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Chatbots</p>
                          <p className="font-bold text-purple-400">{student._count?.chatbots || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
                        <FileText className="w-4 h-4 text-pink-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Artifacts</p>
                          <p className="font-bold text-pink-400">{student._count?.artifacts || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <Star className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Avg. Score</p>
                          <p className="font-bold text-emerald-400">{student.avgScore !== null && student.avgScore !== undefined ? `${student.avgScore.toFixed(1)}%` : "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Token Usage */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Token Usage</span>
                        <span>{(student.tokenUsed || 0).toLocaleString()}/{(student.tokenQuota || 0).toLocaleString()}</span>
                      </div>
                      <Progress value={student.tokenQuota > 0 ? ((student.tokenUsed || 0) / student.tokenQuota) * 100 : 0} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {student.tokenQuota > 0 ? (((student.tokenUsed || 0) / student.tokenQuota) * 100).toFixed(1) : 0}% used
                      </p>
                    </div>

                    {/* Last Active */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Last Login: {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString() : "Never"}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-5 gap-1 mt-4 pt-3 border-t border-white/5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 hover:bg-white/5" 
                        title="Edit Student"
                        onClick={() => {
                          setEditingStudent({
                            ...student,
                            courseId: student.course?.id || "",
                            batchId: student.batch?.id || "",
                          });
                          setShowEditStudentDialog(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 hover:bg-white/5" 
                        title="Reset Password"
                        onClick={() => handleResetPassword(student.id)}
                        disabled={resetPasswordMutation.isPending}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 hover:bg-white/5" 
                        title={student.isActive ? "Deactivate" : "Activate"}
                        onClick={() => updateStudentMutation.mutate({ id: student.id, data: { isActive: !student.isActive } })}
                      >
                        {student.isActive ? <XCircle className="w-4 h-4 text-orange-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 hover:bg-white/5" 
                        title="Unenroll from Course/Batch"
                        onClick={() => setUnenrollStudentId(student.id)}
                        disabled={updateStudentMutation.isPending || (!student.course && !student.batch)}
                      >
                        <UserMinus className="w-4 h-4 text-yellow-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 hover:bg-white/5 text-red-400" 
                        title="Delete Student"
                        onClick={() => handleDeleteStudent(student.id)}
                        disabled={deleteStudentMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!studentsLoading && filteredStudents.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </div>
              )}
            </div>

            {/* Edit Student Dialog */}
            <Dialog open={showEditStudentDialog} onOpenChange={setShowEditStudentDialog}>
              <DialogContent className="glass-card border-white/10">
                <DialogHeader>
                  <DialogTitle>Edit Student</DialogTitle>
                  <DialogDescription>Update student information</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      placeholder="John Doe" 
                      className="glass" 
                      value={editingStudent?.name || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      placeholder="john@university.edu" 
                      className="glass" 
                      value={editingStudent?.email || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select 
                        value={editingStudent?.courseId || "none"} 
                        onValueChange={(value) => setEditingStudent({ ...editingStudent, courseId: value === "none" ? "" : value, batchId: "" })}
                      >
                        <SelectTrigger className="glass"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Course</SelectItem>
                          {courses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Batch</Label>
                      <Select 
                        value={editingStudent?.batchId || "none"} 
                        onValueChange={(value) => setEditingStudent({ ...editingStudent, batchId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger className="glass"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Batch</SelectItem>
                          {batches.filter((b: any) => !editingStudent?.courseId || b.courseId === editingStudent.courseId).map((batch: any) => (
                            <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Token Limit</Label>
                    <Input 
                      type="number" 
                      placeholder="100000" 
                      value={editingStudent?.tokenQuota || 100000}
                      onChange={(e) => setEditingStudent({ ...editingStudent, tokenQuota: parseInt(e.target.value) || 100000 })}
                      className="glass" 
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 glass rounded-xl">
                    <span className="font-medium">Active Status</span>
                    <Switch 
                      checked={editingStudent?.isActive || false}
                      onCheckedChange={(checked) => setEditingStudent({ ...editingStudent, isActive: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditStudentDialog(false)} className="glass">Cancel</Button>
                  <Button 
                    className="gradient-primary"
                    onClick={handleUpdateStudent}
                    disabled={updateStudentMutation.isPending}
                  >
                    {updateStudentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* AI MODELS TAB */}
          <TabsContent value="models" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">AI Models Management</h2>
                <p className="text-sm text-muted-foreground">Configure and manage AI models for your institution</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="glass" onClick={() => handleRefresh('models')} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button className="gradient-primary glow-primary" onClick={() => setShowAddModelDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              </div>
            </div>

            {/* Add Model Dialog */}
            <Dialog open={showAddModelDialog} onOpenChange={setShowAddModelDialog}>
              <DialogContent className="glass-card border-white/10 max-w-xl">
                <DialogHeader>
                  <DialogTitle>Add New AI Model</DialogTitle>
                  <DialogDescription>Add a new AI model to the platform. Models are inactive by default.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Model Name *</Label>
                      <Input 
                        placeholder="e.g., GPT-4 Turbo" 
                        className="glass"
                        value={newModel.name}
                        onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provider *</Label>
                      <Select value={newModel.provider} onValueChange={(v) => setNewModel({ ...newModel, provider: v })}>
                        <SelectTrigger className="glass"><SelectValue placeholder="Select provider" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OpenAI">OpenAI</SelectItem>
                          <SelectItem value="Anthropic">Anthropic</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Groq">Groq</SelectItem>
                          <SelectItem value="Mistral">Mistral</SelectItem>
                          <SelectItem value="Meta">Meta</SelectItem>
                          <SelectItem value="Deepseek">Deepseek</SelectItem>
                          <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Model ID *</Label>
                      <Input 
                        placeholder="e.g., gpt-4-turbo" 
                        className="glass font-mono text-sm"
                        value={newModel.modelId}
                        onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">The API identifier for this model</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={newModel.category} onValueChange={(v) => setNewModel({ ...newModel, category: v })}>
                        <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="multimodal">Multimodal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Brief description of the model capabilities..." 
                      className="glass"
                      rows={2}
                      value={newModel.description}
                      onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                    />
                  </div>
                  {/* Cost info hint */}
                  <div className="p-3 glass rounded-lg text-xs text-muted-foreground">
                    💡 <span className="font-medium">Pricing Guide:</span> {
                      newModel.category === 'audio' 
                        ? 'Audio models are typically priced per minute of audio. Only one cost field is needed.' 
                        : newModel.category === 'video' 
                          ? 'Video models are typically priced per second of video. Only one cost field is needed.'
                          : newModel.category === 'image' 
                            ? 'Image models are priced per image generated. Only one cost field is needed.'
                            : 'Text/Code/Multimodal models are priced per million tokens for both input and output separately.'
                    }
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {newModel.category === 'audio' 
                          ? 'Cost (per minute)' 
                          : newModel.category === 'video' 
                            ? 'Cost (per second)' 
                            : newModel.category === 'image' 
                              ? 'Cost (per image)' 
                              : 'Input Cost (per 1M tokens)'}
                      </Label>
                      <Input 
                        type="number" 
                        step="0.001"
                        placeholder="0.00" 
                        className="glass"
                        value={newModel.inputCost}
                        onChange={(e) => setNewModel({ ...newModel, inputCost: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {newModel.category === 'audio' || newModel.category === 'video' || newModel.category === 'image'
                          ? 'N/A' 
                          : 'Output Cost (per 1M tokens)'}
                      </Label>
                      <Input 
                        type="number" 
                        step="0.001"
                        placeholder="0.00" 
                        className="glass"
                        disabled={newModel.category === 'image' || newModel.category === 'audio' || newModel.category === 'video'}
                        value={newModel.category === 'image' || newModel.category === 'audio' || newModel.category === 'video' ? 0 : newModel.outputCost}
                        onChange={(e) => setNewModel({ ...newModel, outputCost: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {newModel.category === 'video' 
                          ? 'Max Duration (sec)' 
                          : newModel.category === 'audio'
                            ? 'Max Duration (min)'
                            : newModel.category === 'image' 
                              ? 'Max Images/Request' 
                              : 'Max Tokens'}
                      </Label>
                      <Input 
                        type="number" 
                        placeholder={newModel.category === 'image' ? "4" : newModel.category === 'audio' ? "60" : newModel.category === 'video' ? "60" : "4096"}
                        className="glass"
                        value={newModel.maxTokens}
                        onChange={(e) => setNewModel({ ...newModel, maxTokens: parseInt(e.target.value) || 4096 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <div>
                      <Label>Activate Immediately</Label>
                      <p className="text-xs text-muted-foreground">Make this model available to students right away</p>
                    </div>
                    <Switch 
                      checked={newModel.isActive}
                      onCheckedChange={(checked) => setNewModel({ ...newModel, isActive: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="glass" onClick={() => setShowAddModelDialog(false)}>Cancel</Button>
                  <Button 
                    className="gradient-primary"
                    onClick={() => {
                      if (!newModel.name || !newModel.provider || !newModel.modelId) {
                        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
                        return;
                      }
                      createModelMutation.mutate(newModel);
                      setShowAddModelDialog(false);
                      setNewModel({ name: "", provider: "", modelId: "", category: "text", description: "", inputCost: 0, outputCost: 0, maxTokens: 4096, isActive: false });
                    }}
                    disabled={createModelMutation.isPending}
                  >
                    {createModelMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Model
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                {models.filter((m: any) => m.isActive).length} Active
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                {models.filter((m: any) => !m.isActive).length} Inactive
              </span>
              <span className="text-muted-foreground">Total: {models.length} models available</span>
            </div>

            {modelsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Model Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredModels.map((model: any) => (
                <Card key={model.id} className="glass-card overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          model.isActive ? 'bg-emerald-500/20' : 'bg-orange-500/20'
                        }`}>
                          <Brain className={`w-5 h-5 ${model.isActive ? 'text-emerald-400' : 'text-orange-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={model.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}>
                          {model.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => setDeleteModelId(model.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{model.description || "No description"}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="text-xs">{model.category}</Badge>
                      {model.contextWindow && (
                        <Badge variant="outline" className="text-xs">{(model.contextWindow / 1000).toFixed(0)}K context</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-muted-foreground">Access Control:</span>
                      <Badge variant="outline" className={model.isActive ? "text-emerald-400 border-emerald-400/30" : "text-orange-400 border-orange-400/30"}>
                        <Globe className="w-3 h-3 mr-1" />
                        {model.isActive ? "Public" : "Restricted"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button 
                        size="sm" 
                        className={model.isActive ? "gradient-primary" : "glass"}
                        onClick={() => testModelMutation.mutate(model.id)}
                        disabled={testModelMutation.isPending}
                      >
                        {testModelMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <TestTube className="w-3 h-3 mr-1" />}
                        Test Model
                      </Button>
                      <Dialog open={configureModelId === model.id} onOpenChange={(open) => !open && setConfigureModelId(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="glass"
                            onClick={() => {
                              setConfigureModelId(model.id);
                              setModelConfig({ maxTokens: model.maxTokens || 4096, description: model.description || "" });
                            }}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-white/10">
                          <DialogHeader>
                            <DialogTitle>Configure {model.name}</DialogTitle>
                            <DialogDescription>Update model settings and parameters</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Max Tokens</Label>
                              <Input 
                                type="number" 
                                value={modelConfig.maxTokens}
                                onChange={(e) => setModelConfig({ ...modelConfig, maxTokens: parseInt(e.target.value) || 4096 })}
                                className="glass"
                              />
                              <p className="text-xs text-muted-foreground">Maximum tokens per response</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea 
                                value={modelConfig.description}
                                onChange={(e) => setModelConfig({ ...modelConfig, description: e.target.value })}
                                placeholder="Model description..."
                                rows={3}
                                className="glass"
                              />
                            </div>
                            <div className="p-3 glass rounded-lg">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Provider:</span>
                                <span>{model.provider}</span>
                              </div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Model ID:</span>
                                <span className="font-mono text-xs">{model.modelId}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Category:</span>
                                <span>{model.category}</span>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" className="glass" onClick={() => setConfigureModelId(null)}>Cancel</Button>
                            <Button 
                              className="gradient-primary"
                              onClick={() => {
                                updateModelMutation.mutate({ modelId: model.id, data: modelConfig });
                                setConfigureModelId(null);
                              }}
                              disabled={updateModelMutation.isPending}
                            >
                              {updateModelMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Dialog open={accessModelId === model.id} onOpenChange={(open) => !open && setAccessModelId(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="glass"
                            onClick={() => {
                              setAccessModelId(model.id);
                              setModelAccessForm({ courseId: "", batchId: "", studentIds: "" });
                            }}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Access
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-white/10">
                          <DialogHeader>
                            <DialogTitle>Configure Access - {model.name}</DialogTitle>
                            <DialogDescription>Set access permissions for this AI model. Leave empty for public access.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Course Access</Label>
                              <Select 
                                value={modelAccessForm.courseId}
                                onValueChange={(value) => setModelAccessForm({ ...modelAccessForm, courseId: value === "all" ? "" : value })}
                              >
                                <SelectTrigger className="glass"><SelectValue placeholder="Select course (optional)" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Courses (Public)</SelectItem>
                                  {courses.map((course: any) => (
                                    <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">Restrict to specific course</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Batch Access</Label>
                              <Select
                                value={modelAccessForm.batchId}
                                onValueChange={(value) => setModelAccessForm({ ...modelAccessForm, batchId: value === "all" ? "" : value })}
                              >
                                <SelectTrigger className="glass"><SelectValue placeholder="Select batch (optional)" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Batches</SelectItem>
                                  {batches.map((batch: any) => (
                                    <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">Restrict to specific batch</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Individual Student Access</Label>
                              <Textarea 
                                placeholder="Enter Registration IDs (comma separated)&#10;e.g., REG001, REG002, REG003" 
                                rows={3} 
                                className="glass font-mono text-sm"
                                value={modelAccessForm.studentIds}
                                onChange={(e) => setModelAccessForm({ ...modelAccessForm, studentIds: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">Grant access to specific students</p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" className="glass" onClick={() => setAccessModelId(null)}>Cancel</Button>
                            <Button 
                              className="gradient-primary"
                              onClick={() => {
                                // Add access rules
                                if (modelAccessForm.courseId) {
                                  addModelAccessMutation.mutate({ modelId: model.id, courseId: modelAccessForm.courseId });
                                }
                                if (modelAccessForm.batchId) {
                                  addModelAccessMutation.mutate({ modelId: model.id, batchId: modelAccessForm.batchId });
                                }
                                if (modelAccessForm.studentIds) {
                                  const ids = modelAccessForm.studentIds.split(',').map(id => id.trim()).filter(Boolean);
                                  ids.forEach(studentId => {
                                    addModelAccessMutation.mutate({ modelId: model.id, studentId });
                                  });
                                }
                                setAccessModelId(null);
                                toast({ title: "Success", description: "Access settings saved" });
                              }}
                              disabled={addModelAccessMutation.isPending}
                            >
                              {addModelAccessMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Save Access Settings
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={model.isActive ? "text-red-400 hover:text-red-400 glass" : "gradient-primary"}
                        onClick={() => toggleModelMutation.mutate(model.id)}
                        disabled={toggleModelMutation.isPending}
                      >
                        {toggleModelMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                        {model.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!modelsLoading && filteredModels.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No models found</p>
                </div>
              )}
            </div>

            {/* Delete Model Confirmation Dialog */}
            <AlertDialog open={!!deleteModelId} onOpenChange={(open) => !open && setDeleteModelId(null)}>
              <AlertDialogContent className="glass-card border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete AI Model?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this model from the platform. Models with existing sessions cannot be deleted - deactivate them instead. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => {
                      if (deleteModelId) {
                        deleteModelMutation.mutate(deleteModelId);
                        setDeleteModelId(null);
                      }
                    }}
                  >
                    {deleteModelMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Delete Model
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* API KEYS TAB */}
          <TabsContent value="api-keys" className="space-y-6 mt-6">
            {/* Info Card */}
            <Card className="glass-card border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-400 mb-1">About API Keys</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure API keys for AI providers to enable students to interact with various AI models. 
                      Each provider requires its own API key which you can obtain from their respective platforms. 
                      Your keys are securely stored and used only for making API calls on behalf of your institution.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">API Key Management</h2>
                <p className="text-sm text-muted-foreground">Configure API keys for all AI model providers</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="glass"
                  onClick={() => setShowAddProviderDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Provider
                </Button>
                <Button 
                  className="gradient-primary"
                  onClick={() => apiKeys.filter((key: any) => key.apiKey && key.isActive).forEach((key: any) => handleTestApiKey(key.provider))}
                  disabled={!apiKeys.some((key: any) => key.apiKey && key.isActive)}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test All Keys
                </Button>
                <Button variant="outline" className="glass" onClick={() => handleRefresh('apiKeys')} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Add Provider Dialog */}
            <Dialog open={showAddProviderDialog} onOpenChange={setShowAddProviderDialog}>
              <DialogContent className="glass-card border-white/10">
                <DialogHeader>
                  <DialogTitle>Add Custom Provider</DialogTitle>
                  <DialogDescription>Add a new AI provider to your platform</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Provider Name</Label>
                    <Input 
                      placeholder="e.g., Cohere, Together AI, Perplexity" 
                      className="glass" 
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">This will be displayed as the provider name</p>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      className="glass font-mono" 
                      value={newProvider.apiKey}
                      onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL (Required for custom providers)</Label>
                    <Input 
                      type="text" 
                      placeholder="https://api.provider.com/v1" 
                      className="glass font-mono text-sm" 
                      value={newProvider.baseUrl}
                      onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">The API endpoint URL for this provider</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="glass" onClick={() => {
                    setShowAddProviderDialog(false);
                    setNewProvider({ name: "", apiKey: "", baseUrl: "" });
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    className="gradient-primary"
                    onClick={handleAddProvider}
                    disabled={updateApiKeyMutation.isPending || !newProvider.name || !newProvider.apiKey}
                  >
                    {updateApiKeyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Provider
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Filter Tabs */}
            <div className="glass rounded-xl p-1 inline-flex gap-1">
              {[
                { value: "all", label: "All Providers" },
                { value: "configured", label: "Configured" },
                { value: "not-configured", label: "Not Configured" },
              ].map((tab) => (
                <Button 
                  key={tab.value} 
                  variant="ghost" 
                  size="sm" 
                  className={apiKeyFilter === tab.value ? "bg-white/10" : "hover:bg-white/5"}
                  onClick={() => setApiKeyFilter(tab.value as typeof apiKeyFilter)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {apiKeysLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* API Provider Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {apiKeys
                .filter((apiKey: any) => {
                  if (apiKeyFilter === "configured") return apiKey.apiKey && apiKey.isActive;
                  if (apiKeyFilter === "not-configured") return !apiKey.apiKey || !apiKey.isActive;
                  return true;
                })
                .map((apiKey: any) => {
                  // Provider-specific styling
                  const providerConfig: Record<string, { color: string; description: string }> = {
                    openai: { color: "text-emerald-400", description: "GPT-4, GPT-3.5, DALL-E, Whisper" },
                    google: { color: "text-blue-400", description: "Gemini Pro, Gemini Flash" },
                    anthropic: { color: "text-orange-400", description: "Claude 3, Claude 2" },
                    elevenlabs: { color: "text-purple-400", description: "Text-to-Speech, Voice Clone" },
                    groq: { color: "text-red-400", description: "LLaMA, Mixtral (Fast inference)" },
                    mistral: { color: "text-cyan-400", description: "Mistral Large, Medium, Small" },
                  };
                  const config = providerConfig[apiKey.provider.toLowerCase()] || { color: "text-gray-400", description: "AI Provider" };
                  
                  return (
                <Card key={apiKey.id} className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          apiKey.apiKey && apiKey.isActive ? "bg-blue-500/20" : "bg-white/5"
                        }`}>
                          <Globe className={`w-5 h-5 ${apiKey.apiKey && apiKey.isActive ? config.color : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold capitalize">{apiKey.provider}</h3>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      {apiKey.apiKey && apiKey.isActive && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    <Badge className={`mb-3 ${
                      apiKey.apiKey && apiKey.isActive
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-white/5 text-muted-foreground"
                    }`}>
                      {apiKey.apiKey ? (apiKey.isActive ? "Active" : "Inactive") : "Not Configured"}
                    </Badge>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="glass"
                            onClick={() => setApiKeyConfig({ provider: apiKey.provider, apiKey: "", baseUrl: apiKey.baseUrl || "" })}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-white/10">
                          <DialogHeader>
                            <DialogTitle>Configure {apiKey.provider}</DialogTitle>
                            <DialogDescription>Enter your API credentials for {apiKey.provider}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>API Key</Label>
                              <Input 
                                type="password" 
                                placeholder={apiKey.apiKey ? "••••••••••••" : "sk-..."} 
                                className="glass font-mono" 
                                value={apiKeyConfig.provider === apiKey.provider ? apiKeyConfig.apiKey : ""}
                                onChange={(e) => setApiKeyConfig({ ...apiKeyConfig, provider: apiKey.provider, apiKey: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Base URL (Optional)</Label>
                              <Input 
                                type="text" 
                                placeholder={`https://api.${apiKey.provider.toLowerCase()}.com/v1`}
                                className="glass font-mono text-sm" 
                                value={apiKeyConfig.provider === apiKey.provider ? apiKeyConfig.baseUrl : apiKey.baseUrl || ""}
                                onChange={(e) => setApiKeyConfig({ ...apiKeyConfig, baseUrl: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">Leave empty to use default endpoint</p>
                            </div>
                          </div>
                          <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              className="glass w-full sm:w-auto"
                              onClick={() => handleTestApiKey(apiKey.provider)}
                              disabled={testApiKeyMutation.isPending}
                            >
                              {testApiKeyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                              Test Connection
                            </Button>
                            <Button 
                              className="gradient-primary w-full sm:w-auto"
                              onClick={handleUpdateApiKey}
                              disabled={updateApiKeyMutation.isPending || !apiKeyConfig.apiKey}
                            >
                              {updateApiKeyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                              Save Configuration
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {apiKey.apiKey && apiKey.isActive && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass"
                          onClick={() => handleTestApiKey(apiKey.provider)}
                          disabled={testApiKeyMutation.isPending}
                        >
                          {testApiKeyMutation.isPending ? <Loader2 className="w-3 h-3" /> : <TestTube className="w-3 h-3 mr-1" />}
                          Test
                        </Button>
                      )}
                      {!apiKey.isDefault && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => setDeleteProviderId(apiKey.provider)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {apiKey.updatedAt && (
                        <p className="text-xs text-muted-foreground">Last updated: {new Date(apiKey.updatedAt).toLocaleDateString()}</p>
                      )}
                      {!apiKey.isDefault && (
                        <Badge variant="outline" className="text-xs">Custom</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                  );
                })}
              {!apiKeysLoading && apiKeys.filter((apiKey: any) => {
                  if (apiKeyFilter === "configured") return apiKey.apiKey && apiKey.isActive;
                  if (apiKeyFilter === "not-configured") return !apiKey.apiKey || !apiKey.isActive;
                  return true;
                }).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {apiKeyFilter === "configured" ? "No configured API keys" : 
                     apiKeyFilter === "not-configured" ? "All API keys are configured" : 
                     "No API keys found"}
                  </p>
                </div>
              )}
            </div>

            {/* Delete Provider Confirmation */}
            <AlertDialog open={!!deleteProviderId} onOpenChange={(open) => !open && setDeleteProviderId(null)}>
              <AlertDialogContent className="glass-card border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Provider?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the custom provider "{deleteProviderId}" and its API key configuration.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      if (deleteProviderId) {
                        deleteApiKeyMutation.mutate(deleteProviderId);
                        setDeleteProviderId(null);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteApiKeyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Delete Provider
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
          {/* TOKEN MANAGEMENT TAB */}
          <TabsContent value="tokens" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Token Management</h2>
                <p className="text-sm text-muted-foreground">Manage institutional tokens and allocations</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="glass" onClick={() => handleRefresh()} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                      <p className="text-sm text-muted-foreground">Total Tokens Used</p>
                      <p className="text-3xl font-bold text-primary mt-1">
                        {analyticsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (analytics?.overview?.totalTokensUsed || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-400">Across all students</p>
                    </div>
                    <Coins className="w-6 h-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                      <p className="text-3xl font-bold mt-1">
                        {analyticsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : analytics?.overview?.activeStudents || 0}
                      </p>
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
                      <p className="text-3xl font-bold mt-1">
                        {analyticsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                          analytics?.overview?.activeStudents > 0 
                            ? Math.round((analytics?.overview?.totalTokensUsed || 0) / analytics.overview.activeStudents).toLocaleString()
                            : 0
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">Tokens per active student</p>
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

            {/* Overview Sub-Tab */}
            {tokenManagementTab === "overview" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base">Token Usage by Period</CardTitle>
                    <CardDescription className="text-xs">Breakdown of token consumption (Chat + Compare)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <div>
                        <p className="text-sm text-muted-foreground">Today</p>
                        <p className="text-lg font-bold text-blue-400">{(analytics?.tokensUsed?.daily || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Chat: {(analytics?.tokensUsed?.sessions?.daily || 0).toLocaleString()} | Compare: {(analytics?.tokensUsed?.comparisons?.daily || 0).toLocaleString()}</p>
                      </div>
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                      <div>
                        <p className="text-sm text-muted-foreground">This Week</p>
                        <p className="text-lg font-bold text-purple-400">{(analytics?.tokensUsed?.weekly || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Chat: {(analytics?.tokensUsed?.sessions?.weekly || 0).toLocaleString()} | Compare: {(analytics?.tokensUsed?.comparisons?.weekly || 0).toLocaleString()}</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                      <div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-lg font-bold text-emerald-400">{(analytics?.tokensUsed?.monthly || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Chat: {(analytics?.tokensUsed?.sessions?.monthly || 0).toLocaleString()} | Compare: {(analytics?.tokensUsed?.comparisons?.monthly || 0).toLocaleString()}</p>
                      </div>
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base">Usage Analytics</CardTitle>
                    <CardDescription className="text-xs">Token consumption patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Daily Average</span>
                      <span className="font-medium">{analytics?.overview?.activeStudents && analytics.overview.activeStudents > 0 
                        ? Math.round((analytics?.tokensUsed?.daily || 0) / analytics.overview.activeStudents).toLocaleString() 
                        : 0} tokens/user</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Most Used Model</span>
                      <span className="font-medium">
                        {analytics?.modelUsage && analytics.modelUsage.length > 0 
                          ? analytics.modelUsage.sort((a, b) => (b._sum?.tokensUsed || 0) - (a._sum?.tokensUsed || 0))[0]?.model?.name || "N/A"
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Chat Sessions</span>
                      <span className="font-medium">{(analytics?.overview?.totalSessions || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Compare Sessions</span>
                      <span className="font-medium">{(analytics?.overview?.totalComparisonSessions || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Compare Tokens</span>
                      <span className="font-medium">{(analytics?.tokensUsed?.comparisons?.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Usage Rate</span>
                      <Badge className={analytics?.overview?.activeStudents && analytics.overview.activeStudents > 0 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/20 text-red-400"}>
                        {analytics?.overview?.totalStudents && analytics.overview.totalStudents > 0 
                          ? Math.round((analytics?.overview?.activeStudents || 0) / analytics.overview.totalStudents * 100) 
                          : 0}% active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Transactions Sub-Tab */}
            {tokenManagementTab === "transactions" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Recent Token Transactions</CardTitle>
                  <CardDescription className="text-xs">History of token allocations and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {students && students.length > 0 ? (
                    <div className="space-y-3">
                      {students
                        .filter(s => s.tokenUsed > 0)
                        .sort((a, b) => b.tokenUsed - a.tokenUsed)
                        .slice(0, 10)
                        .map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 rounded-lg glass">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{student.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.registrationId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">{student.tokenUsed.toLocaleString()} used</p>
                              <p className="text-xs text-muted-foreground">of {student.tokenQuota.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      {students.filter(s => s.tokenUsed > 0).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Coins className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p>No token usage recorded yet</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Coins className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No transactions available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Student Allocations Sub-Tab */}
            {tokenManagementTab === "student-allocations" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Student Token Allocations</CardTitle>
                  <CardDescription className="text-xs">View and manage individual student token quotas</CardDescription>
                </CardHeader>
                <CardContent>
                  {students && students.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg glass">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{student.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.course?.name || "No Course"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{student.tokenUsed.toLocaleString()} / {student.tokenQuota.toLocaleString()}</p>
                              <Progress 
                                value={student.tokenQuota > 0 ? (student.tokenUsed / student.tokenQuota) * 100 : 0} 
                                className="h-1.5 w-24 mt-1" 
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setTokenQuotaStudent({ 
                                id: student.id, 
                                name: student.name, 
                                tokenQuota: student.tokenQuota 
                              })}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No students found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Settings Sub-Tab */}
            {tokenManagementTab === "settings" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base">Token Settings</CardTitle>
                  <CardDescription className="text-xs">Configure default token allocation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg glass">
                        <div>
                          <p className="font-medium">Default Token Quota</p>
                          <p className="text-sm text-muted-foreground">Initial token allocation for new students</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={settingsData?.defaultTokenQuota || 100000}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value) || 100000;
                              if (value !== settingsData?.defaultTokenQuota) {
                                updateSettingsMutation.mutate({ defaultTokenQuota: value });
                              }
                            }}
                            className="w-32 text-right glass"
                          />
                          <span className="text-sm text-muted-foreground">tokens</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg glass">
                        <div>
                          <p className="font-medium">Auto-Refill</p>
                          <p className="text-sm text-muted-foreground">Automatically refill tokens monthly</p>
                        </div>
                        <Switch 
                          checked={settingsData?.autoRefill || false}
                          onCheckedChange={(checked) => {
                            updateSettingsMutation.mutate({ autoRefill: checked });
                          }}
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg glass">
                        <div>
                          <p className="font-medium">Low Balance Alert</p>
                          <p className="text-sm text-muted-foreground">Alert when student reaches 10% quota</p>
                        </div>
                        <Switch 
                          checked={settingsData?.lowBalanceAlert || false}
                          onCheckedChange={(checked) => {
                            updateSettingsMutation.mutate({ lowBalanceAlert: checked });
                          }}
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg glass">
                        <div>
                          <p className="font-medium">Hard Limit Enforcement</p>
                          <p className="text-sm text-muted-foreground">Block usage when quota is exhausted</p>
                        </div>
                        <Switch 
                          checked={settingsData?.hardLimitEnforcement ?? true}
                          onCheckedChange={(checked) => {
                            updateSettingsMutation.mutate({ hardLimitEnforcement: checked });
                          }}
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* USAGE ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Usage Analytics</h2>
                <p className="text-sm text-muted-foreground">Monitor student activity and system performance</p>
                <span className="text-xs text-muted-foreground">• Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <Button variant="outline" className="glass" onClick={() => handleRefresh('analytics')} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-5">
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Active Users</span>
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{analytics?.overview?.activeStudents || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Currently active students</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total Cost (USD)</span>
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">${(analytics?.costs?.total || 0).toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈ ₹{(analytics?.costs?.inrEquivalent?.total || (analytics?.costs?.total || 0) * 84).toFixed(2)} INR
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total Sessions</span>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{(analytics?.overview?.totalSessions || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Chat: {(analytics?.overview?.totalSessions || 0).toLocaleString()} | Compare: {(analytics?.overview?.totalComparisonSessions || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Tokens Used</span>
                        <Zap className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{(analytics?.overview?.totalTokensUsed || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total consumption</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total Students</span>
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{analytics?.overview?.totalStudents || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Registered students</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Daily Activity (Last 30 Days)
                  </CardTitle>
                  <CardDescription className="text-xs">Login and session activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-auto">
                    {analytics?.dailyActivity && analytics.dailyActivity.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.dailyActivity.slice(0, 10).map((activity: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 glass rounded-lg">
                            <span className="text-sm text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </span>
                            <span className="font-medium">{activity._count} activities</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center glass rounded-xl">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No activity data yet</p>
                        </div>
                      </div>
                    )}
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
                  <div className="h-64 overflow-auto">
                    {analytics?.modelUsage && analytics.modelUsage.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.modelUsage.map((usage: any, idx: number) => (
                          <div key={idx} className="p-3 glass rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{usage.model?.name || 'Unknown Model'}</span>
                              <Badge variant="outline" className="text-xs">{usage.model?.provider || 'N/A'}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{usage._count} sessions</span>
                              <span>{(usage._sum?.tokensUsed || 0).toLocaleString()} tokens</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center glass rounded-xl">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No model usage data</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-xs">Students with highest activity</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.topPerformers && analytics.topPerformers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topPerformers.map((student: any, idx: number) => (
                      <div key={student.id} className="flex items-center justify-between p-3 glass rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.registrationId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{student.modelSessionsCount ?? student.sessionsCount} sessions</p>
                          <p className="text-xs text-muted-foreground">{(student.tokenUsed || 0).toLocaleString()} tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No student activity yet
                  </div>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          {/* GUARDRAILS TAB */}
          <TabsContent value="guardrails" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Guardrails Management</h2>
                <p className="text-sm text-muted-foreground">Configure AI-powered intent-driven guardrails for your educational institution</p>
              </div>
              <Button variant="outline" className="glass" onClick={() => handleRefresh('guardrails')} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                {settingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Tokens per Request</Label>
                        <Input 
                          type="number" 
                          defaultValue={settingsData?.maxTokensPerRequest || 2000} 
                          className="glass"
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 2000;
                            if (value !== settingsData?.maxTokensPerRequest) {
                              updateSettingsMutation.mutate({ maxTokensPerRequest: value });
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Maximum tokens allowed in a single AI request</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Requests per Minute</Label>
                        <Input 
                          type="number" 
                          defaultValue={settingsData?.maxRequestsPerMinute || 15} 
                          className="glass"
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 15;
                            if (value !== settingsData?.maxRequestsPerMinute) {
                              updateSettingsMutation.mutate({ maxRequestsPerMinute: value });
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Rate limit for AI requests per user per minute</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 glass rounded-xl">
                        <div>
                          <span className="font-medium">AI-Powered Intent Detection</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Uses AI to analyze the intent behind prompts rather than simple keyword matching. 
                            Helps detect sophisticated attempts to bypass guardrails.
                          </p>
                        </div>
                        <Switch 
                          checked={settingsData?.aiIntentDetection ?? true}
                          onCheckedChange={(checked) => updateSettingsMutation.mutate({ aiIntentDetection: checked })}
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 glass rounded-xl">
                        <div>
                          <span className="font-medium">Strict Mode</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            When enabled, any content that might potentially violate guardrails is blocked. 
                            When disabled, only clear violations are blocked (more permissive).
                          </p>
                        </div>
                        <Switch 
                          checked={settingsData?.strictMode ?? false}
                          onCheckedChange={(checked) => updateSettingsMutation.mutate({ strictMode: checked })}
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>
                    </div>
                  </>
                )}
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
                            <Select value={newGuardrail.type || "none"} onValueChange={(value) => setNewGuardrail({ ...newGuardrail, type: value === "none" ? "" : value })}>
                              <SelectTrigger className="glass"><SelectValue placeholder="Select type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select Type</SelectItem>
                                <SelectItem value="educational">Educational Integrity</SelectItem>
                                <SelectItem value="content">Content Safety</SelectItem>
                                <SelectItem value="behavioral">Behavioral Guidelines</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Applies To</Label>
                            <Select value={newGuardrail.appliesTo || "both"} onValueChange={(value) => setNewGuardrail({ ...newGuardrail, appliesTo: value })}>
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
                          <Input 
                            placeholder="e.g., Safe Learning Environment" 
                            className="glass" 
                            value={newGuardrail.title}
                            onChange={(e) => setNewGuardrail({ ...newGuardrail, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Instruction</Label>
                          <Textarea 
                            placeholder="Describe what should be blocked or encouraged..." 
                            rows={4} 
                            className="glass" 
                            value={newGuardrail.instruction}
                            onChange={(e) => setNewGuardrail({ ...newGuardrail, instruction: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priority (1-10)</Label>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10} 
                            value={newGuardrail.priority}
                            onChange={(e) => setNewGuardrail({ ...newGuardrail, priority: parseInt(e.target.value) || 5 })}
                            className="glass" 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGuardrailDialog(false)} className="glass">Cancel</Button>
                        <Button 
                          className="gradient-primary"
                          onClick={handleCreateGuardrail}
                          disabled={createGuardrailMutation.isPending || !newGuardrail.title || !newGuardrail.instruction || !newGuardrail.type}
                        >
                          {createGuardrailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Guardrail Dialog */}
                  <Dialog open={showEditGuardrailDialog} onOpenChange={(open) => {
                    setShowEditGuardrailDialog(open);
                    if (!open) setEditingGuardrail(null);
                  }}>
                    <DialogContent className="glass-card border-white/10">
                      <DialogHeader>
                        <DialogTitle>Edit Guardrail Instruction</DialogTitle>
                        <DialogDescription>Update the AI-powered guardrail rule</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select 
                              value={editingGuardrail?.type || "none"} 
                              onValueChange={(value) => setEditingGuardrail({ ...editingGuardrail, type: value === "none" ? "" : value })}
                            >
                              <SelectTrigger className="glass"><SelectValue placeholder="Select type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select Type</SelectItem>
                                <SelectItem value="educational">Educational Integrity</SelectItem>
                                <SelectItem value="content">Content Safety</SelectItem>
                                <SelectItem value="behavioral">Behavioral Guidelines</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Applies To</Label>
                            <Select 
                              value={editingGuardrail?.appliesTo || "both"} 
                              onValueChange={(value) => setEditingGuardrail({ ...editingGuardrail, appliesTo: value })}
                            >
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
                          <Input 
                            placeholder="e.g., Safe Learning Environment" 
                            className="glass" 
                            value={editingGuardrail?.title || ""}
                            onChange={(e) => setEditingGuardrail({ ...editingGuardrail, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Instruction</Label>
                          <Textarea 
                            placeholder="Describe what should be blocked or encouraged..." 
                            rows={4} 
                            className="glass" 
                            value={editingGuardrail?.instruction || ""}
                            onChange={(e) => setEditingGuardrail({ ...editingGuardrail, instruction: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priority (1-10)</Label>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10} 
                            value={editingGuardrail?.priority || 5}
                            onChange={(e) => setEditingGuardrail({ ...editingGuardrail, priority: parseInt(e.target.value) || 5 })}
                            className="glass" 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setShowEditGuardrailDialog(false);
                          setEditingGuardrail(null);
                        }} className="glass">Cancel</Button>
                        <Button 
                          className="gradient-primary"
                          onClick={handleUpdateGuardrail}
                          disabled={updateGuardrailMutation.isPending || !editingGuardrail?.title || !editingGuardrail?.instruction || !editingGuardrail?.type}
                        >
                          {updateGuardrailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Guardrail Confirmation */}
                  <AlertDialog open={!!deleteGuardrailId} onOpenChange={(open) => !open && setDeleteGuardrailId(null)}>
                    <AlertDialogContent className="glass-card border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Guardrail?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this guardrail instruction.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteGuardrail}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {deleteGuardrailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {guardrailsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {guardrails.map((guardrail: any) => (
                  <div key={guardrail.id} className="p-4 glass rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-medium">{guardrail.title}</span>
                          <Badge className={guardrail.enabled ? "bg-emerald-500/20 text-emerald-400 text-xs" : "bg-red-500/20 text-red-400 text-xs"}>
                            {guardrail.enabled ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{guardrail.type}</Badge>
                          <Badge variant="outline" className="text-xs">{guardrail.appliesTo}</Badge>
                          <span className="text-xs text-muted-foreground">Priority: {guardrail.priority}</span>
                          {guardrail.isSystem && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs">System</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{guardrail.instruction}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={guardrail.enabled} 
                          onCheckedChange={(checked) => updateGuardrailMutation.mutate({ id: guardrail.id, data: { enabled: checked } })}
                        />
                        {!guardrail.isSystem && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingGuardrail(guardrail);
                                setShowEditGuardrailDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-400"
                              onClick={() => setDeleteGuardrailId(guardrail.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
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
                    <Button className="gradient-primary" onClick={() => toast({ title: "Coming Soon", description: "Logo upload feature will be available soon" })}>Upload</Button>
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
                  <Input 
                    type="password" 
                    placeholder="Enter your current password" 
                    className="glass"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-400">New Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Enter your new password" 
                    className="glass"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-400">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Confirm your new password" 
                    className="glass"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full gradient-primary" 
                  onClick={handleChangePassword}
                  disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Institution Admins */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  Institution Admins
                </CardTitle>
                <CardDescription className="text-xs">Current admin account for your institution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {user && (
                  <div className="flex items-center justify-between p-4 glass rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        <Badge variant="outline" className="text-xs">(You)</Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Primary Admin</Badge>
                      </div>
                      <p className="text-sm text-blue-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{user.role}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={!!resetPasswordStudentId} onOpenChange={(open) => !open && setResetPasswordStudentId(null)}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Student Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset this student's password? A new password will be generated and the student will need to use it to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetPassword}
              disabled={resetPasswordMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unenroll Student Confirmation Dialog */}
      <AlertDialog open={!!unenrollStudentId} onOpenChange={(open) => !open && setUnenrollStudentId(null)}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unenroll this student from their current course and batch? They will no longer be associated with any course or batch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnenrollStudent}
              disabled={updateStudentMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {updateStudentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unenrolling...
                </>
              ) : (
                "Unenroll Student"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Student Confirmation Dialog */}
      <AlertDialog open={!!deleteStudentId} onOpenChange={(open) => !open && setDeleteStudentId(null)}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone. All associated data including sessions, chatbots, and artifacts will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteStudent}
              disabled={deleteStudentMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteStudentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Student"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Token Quota Dialog */}
      <Dialog open={!!tokenQuotaStudent} onOpenChange={(open) => !open && setTokenQuotaStudent(null)}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Token Quota</DialogTitle>
            <DialogDescription>
              Update token allocation for {tokenQuotaStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Token Quota</Label>
              <Input
                type="number"
                value={tokenQuotaStudent?.tokenQuota || 0}
                onChange={(e) => setTokenQuotaStudent(prev => prev ? { ...prev, tokenQuota: parseInt(e.target.value) || 0 } : null)}
                className="glass"
              />
              <p className="text-xs text-muted-foreground">
                Enter the new token limit for this student
              </p>
            </div>
            <div className="flex gap-2">
              {[50000, 100000, 250000, 500000].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="glass text-xs"
                  onClick={() => setTokenQuotaStudent(prev => prev ? { ...prev, tokenQuota: preset } : null)}
                >
                  {(preset / 1000)}K
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="glass" onClick={() => setTokenQuotaStudent(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTokenQuota}
              disabled={updateStudentMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateStudentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Quota"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
