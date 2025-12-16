import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Plus, 
  History, 
  Send, 
  Loader2, 
  Settings2, 
  Image as ImageIcon,
  RefreshCw,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  Check,
  ChevronDown,
  Clock,
  Coins,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { comparisonApi, ComparisonModel, ComparisonResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

// Types
interface Exchange {
  id: string;
  prompt: string;
  responses: Record<string, ModelCardState>;
  timestamp: Date;
}

interface ModelCardState {
  loading: boolean;
  streaming?: boolean;
  streamingContent?: string;
  response?: ComparisonResponse;
  error?: string;
}

interface ModelConfig {
  maxOutputTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface HistorySession {
  id: string;
  title: string;
  category: string;
  modelsUsed: string[];
  lastPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Default model config
const defaultModelConfig: ModelConfig = {
  maxOutputTokens: 4096,
  temperature: 0.70,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// Max output tokens per model
const getMaxOutputTokens = (modelId: string): number => {
  const maxTokensMap: Record<string, number> = {
    'gpt-3.5-turbo': 4096,
    'gpt-4o': 16384,
    'gpt-4o-mini': 16384,
    'gemini-2.5-flash-lite': 65536,
    'gemini-2.0-flash': 8192,
    'claude-sonnet-4.5': 64000,
    'claude-haiku-4.5': 64000,
  };
  return maxTokensMap[modelId] || 4096;
};

export default function Compare() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [phase, setPhase] = useState<"select" | "compare">("select");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelConfigs, setModelConfigs] = useState<Record<string, ModelConfig>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/student/signin');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["comparison-categories"],
    queryFn: comparisonApi.getCategories
  });
  const categories = categoriesData?.data ?? [];
  
  // Fetch models for selected category
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ["comparison-models", selectedCategory],
    queryFn: () => comparisonApi.getModelsByCategory(selectedCategory),
    enabled: !!selectedCategory
  });
  const availableModels = modelsData?.data ?? [];
  
  // Fetch history sessions
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ["comparison-sessions"],
    queryFn: comparisonApi.getSessions,
  });
  const historySessions: HistorySession[] = (historyData?.data ?? []) as HistorySession[];
  
  // Initialize model configs when models are selected
  useEffect(() => {
    selectedModels.forEach(id => {
      if (!modelConfigs[id]) {
        const model = availableModels.find(m => m.id === id);
        const maxTokens = model ? getMaxOutputTokens(model.modelId) : 4096;
        setModelConfigs(prev => ({
          ...prev,
          [id]: { ...defaultModelConfig, maxOutputTokens: maxTokens }
        }));
      }
    });
  }, [selectedModels, availableModels]);
  
  // Auto-scroll each model's chat to bottom
  useEffect(() => {
    Object.values(scrollRefs.current).forEach(ref => {
      if (ref) {
        ref.scrollTop = ref.scrollHeight;
      }
    });
  }, [exchanges]);
  
  // Get selected model details
  const getSelectedModelDetails = (): ComparisonModel[] => {
    return availableModels.filter(m => selectedModels.includes(m.id));
  };
  
  // Toggle model selection
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, modelId];
    });
  };
  
  // Update model config
  const updateModelConfig = (modelId: string, key: keyof ModelConfig, value: number) => {
    setModelConfigs(prev => ({
      ...prev,
      [modelId]: {
        ...(prev[modelId] || defaultModelConfig),
        [key]: value
      }
    }));
  };
  
  // Start comparison phase
  const startComparisonPhase = () => {
    if (selectedModels.length < 2) return;
    setPhase("compare");
    setExchanges([]);
    setCurrentSessionId(null);
  };
  
  // New chat
  const startNewChat = () => {
    setExchanges([]);
    setCurrentSessionId(null);
    setPrompt("");
    refetchHistory();
  };
  
  // Back to model selection
  const backToSelection = () => {
    setPhase("select");
    setExchanges([]);
    setCurrentSessionId(null);
    setPrompt("");
  };
  
  // Send prompt with streaming
  const sendPrompt = async () => {
    if (!prompt.trim() || selectedModels.length < 2 || isSubmitting) return;
    
    const currentPrompt = prompt.trim();
    setPrompt("");
    setIsSubmitting(true);
    
    const newExchangeId = `temp-${Date.now()}`;
    const initialResponses: Record<string, ModelCardState> = {};
    selectedModels.forEach(modelId => {
      initialResponses[modelId] = { loading: true, streaming: false, streamingContent: '' };
    });
    
    const newExchange: Exchange = {
      id: newExchangeId,
      prompt: currentPrompt,
      responses: initialResponses,
      timestamp: new Date()
    };
    
    setExchanges(prev => [...prev, newExchange]);
    
    try {
      const exchangeResult = await comparisonApi.startExchange({
        category: selectedCategory,
        prompt: currentPrompt,
        modelIds: selectedModels,
        comparisonSessionId: currentSessionId || undefined
      });
      
      if (!exchangeResult.success || !exchangeResult.data) {
        throw new Error(exchangeResult.error || "Failed to create exchange");
      }
      
      const { exchangeId, comparisonSessionId } = exchangeResult.data;
      
      if (!currentSessionId) {
        setCurrentSessionId(comparisonSessionId);
      }
      
      setExchanges(prev => prev.map(ex => 
        ex.id === newExchangeId ? { ...ex, id: exchangeId } : ex
      ));
      
      // Stream responses for each model
      selectedModels.forEach(async (modelId) => {
        try {
          // Mark as streaming
          setExchanges(prev => prev.map(ex => {
            if (ex.id === exchangeId || ex.id === newExchangeId) {
              return {
                ...ex,
                id: exchangeId,
                responses: {
                  ...ex.responses,
                  [modelId]: { loading: false, streaming: true, streamingContent: '' }
                }
              };
            }
            return ex;
          }));

          let fullContent = '';
          let finalData: { tokensUsed?: number; responseTimeMs?: number; isMock?: boolean } = {};
          
          // Use streaming API
          for await (const event of comparisonApi.streamSingleModel({
            exchangeId,
            modelId,
            prompt: currentPrompt
          })) {
            if (event.type === 'chunk' && event.content) {
              fullContent += event.content;
              
              // Update streaming content
              setExchanges(prev => prev.map(ex => {
                if (ex.id === exchangeId || ex.id === newExchangeId) {
                  return {
                    ...ex,
                    id: exchangeId,
                    responses: {
                      ...ex.responses,
                      [modelId]: { 
                        loading: false, 
                        streaming: true, 
                        streamingContent: fullContent 
                      }
                    }
                  };
                }
                return ex;
              }));
            } else if (event.type === 'done') {
              finalData = {
                tokensUsed: event.tokensUsed,
                responseTimeMs: event.responseTimeMs,
                isMock: event.isMock
              };
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Stream error');
            }
          }
          
          // Finalize with complete response
          const completeResponse: ComparisonResponse = {
            modelId,
            modelName: availableModels.find(m => m.id === modelId)?.name || '',
            provider: availableModels.find(m => m.id === modelId)?.provider || '',
            response: fullContent,
            tokensUsed: finalData.tokensUsed || 0,
            responseTimeMs: finalData.responseTimeMs || 0,
            score: null,
            isMock: finalData.isMock || false,
            error: null
          };
          
          setExchanges(prev => prev.map(ex => {
            if (ex.id === exchangeId || ex.id === newExchangeId) {
              return {
                ...ex,
                id: exchangeId,
                responses: {
                  ...ex.responses,
                  [modelId]: { loading: false, streaming: false, response: completeResponse }
                }
              };
            }
            return ex;
          }));
          
        } catch (err) {
          setExchanges(prev => prev.map(ex => {
            if (ex.id === exchangeId || ex.id === newExchangeId) {
              return {
                ...ex,
                id: exchangeId,
                responses: {
                  ...ex.responses,
                  [modelId]: { 
                    loading: false, 
                    streaming: false, 
                    error: err instanceof Error ? err.message : "Unknown error" 
                  }
                }
              };
            }
            return ex;
          }));
        }
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start comparison";
      setExchanges(prev => prev.map(ex => {
        if (ex.id === newExchangeId) {
          const errorResponses: Record<string, ModelCardState> = {};
          selectedModels.forEach(modelId => {
            errorResponses[modelId] = { loading: false, streaming: false, error: errorMessage };
          });
          return { ...ex, responses: errorResponses };
        }
        return ex;
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Retry model with streaming
  const retryModel = async (exchangeId: string, modelId: string, exchangePrompt: string) => {
    setExchanges(prev => prev.map(ex => {
      if (ex.id === exchangeId) {
        return {
          ...ex,
          responses: { ...ex.responses, [modelId]: { loading: false, streaming: true, streamingContent: '' } }
        };
      }
      return ex;
    }));
    
    try {
      let fullContent = '';
      let finalData: { tokensUsed?: number; responseTimeMs?: number; isMock?: boolean } = {};
      
      for await (const event of comparisonApi.streamSingleModel({
        exchangeId,
        modelId,
        prompt: exchangePrompt
      })) {
        if (event.type === 'chunk' && event.content) {
          fullContent += event.content;
          
          setExchanges(prev => prev.map(ex => {
            if (ex.id === exchangeId) {
              return {
                ...ex,
                responses: {
                  ...ex.responses,
                  [modelId]: { loading: false, streaming: true, streamingContent: fullContent }
                }
              };
            }
            return ex;
          }));
        } else if (event.type === 'done') {
          finalData = {
            tokensUsed: event.tokensUsed,
            responseTimeMs: event.responseTimeMs,
            isMock: event.isMock
          };
        } else if (event.type === 'error') {
          throw new Error(event.error || 'Stream error');
        }
      }
      
      const completeResponse: ComparisonResponse = {
        modelId,
        modelName: availableModels.find(m => m.id === modelId)?.name || '',
        provider: availableModels.find(m => m.id === modelId)?.provider || '',
        response: fullContent,
        tokensUsed: finalData.tokensUsed || 0,
        responseTimeMs: finalData.responseTimeMs || 0,
        score: null,
        isMock: finalData.isMock || false,
        error: null
      };
      
      setExchanges(prev => prev.map(ex => {
        if (ex.id === exchangeId) {
          return {
            ...ex,
            responses: {
              ...ex.responses,
              [modelId]: { loading: false, streaming: false, response: completeResponse }
            }
          };
        }
        return ex;
      }));
    } catch (err) {
      setExchanges(prev => prev.map(ex => {
        if (ex.id === exchangeId) {
          return {
            ...ex,
            responses: {
              ...ex.responses,
              [modelId]: { loading: false, streaming: false, error: err instanceof Error ? err.message : "Error" }
            }
          };
        }
        return ex;
      }));
    }
  };
  
  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };
  
  // Check if any loading
  const isAnyLoading = exchanges.length > 0 && 
    Object.values(exchanges[exchanges.length - 1].responses).some(s => s.loading);
  
  // Model Config Dialog Component with local state for smooth sliding
  const ModelConfigDialog = ({ model, config }: { model: ComparisonModel; config: ModelConfig }) => {
    // Local state for smooth slider interaction
    const [localConfig, setLocalConfig] = useState(config);
    
    // Sync local state when config prop changes (e.g., dialog reopened)
    useEffect(() => {
      setLocalConfig(config);
    }, [config]);
    
    // Update local state during drag
    const handleSliderChange = (key: keyof ModelConfig, value: number) => {
      setLocalConfig(prev => ({ ...prev, [key]: value }));
    };
    
    // Commit to parent state on release
    const handleSliderCommit = (key: keyof ModelConfig, value: number) => {
      updateModelConfig(model.id, key, value);
    };
    
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{model.provider}</span>
            <span className="text-lg font-bold">/ {model.name}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {model.description || `${model.name} is a powerful language model from ${model.provider}.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Model Info */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Context</span>
              <span className="text-muted-foreground">{model.maxTokens?.toLocaleString() || 'N/A'} tokens</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Config Sliders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Max Output Tokens</Label>
                <span className="text-sm text-muted-foreground">{localConfig.maxOutputTokens.toLocaleString()}</span>
              </div>
              <Slider
                value={[localConfig.maxOutputTokens]}
                onValueChange={([v]) => handleSliderChange('maxOutputTokens', v)}
                onValueCommit={([v]) => handleSliderCommit('maxOutputTokens', v)}
                max={getMaxOutputTokens(model.modelId)}
                min={1}
                step={100}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Temperature</Label>
                <span className="text-sm text-muted-foreground">{localConfig.temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[localConfig.temperature]}
                onValueChange={([v]) => handleSliderChange('temperature', v)}
                onValueCommit={([v]) => handleSliderCommit('temperature', v)}
                max={2}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Top P</Label>
                <span className="text-sm text-muted-foreground">{localConfig.topP.toFixed(2)}</span>
              </div>
              <Slider
                value={[localConfig.topP]}
                onValueChange={([v]) => handleSliderChange('topP', v)}
                onValueCommit={([v]) => handleSliderCommit('topP', v)}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Frequency Penalty</Label>
                <span className="text-sm text-muted-foreground">{localConfig.frequencyPenalty.toFixed(2)}</span>
              </div>
              <Slider
                value={[localConfig.frequencyPenalty]}
                onValueChange={([v]) => handleSliderChange('frequencyPenalty', v)}
                onValueCommit={([v]) => handleSliderCommit('frequencyPenalty', v)}
                max={2}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Presence Penalty</Label>
                <span className="text-sm text-muted-foreground">{localConfig.presencePenalty.toFixed(2)}</span>
              </div>
              <Slider
                value={[localConfig.presencePenalty]}
                onValueChange={([v]) => handleSliderChange('presencePenalty', v)}
                onValueCommit={([v]) => handleSliderCommit('presencePenalty', v)}
                max={2}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    );
  };
  
  // Render Selection Phase
  const renderSelectionPhase = () => (
    <div className="flex-1 flex flex-col p-8">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/student/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Multi-Model Comparison</h1>
            <p className="text-muted-foreground">
              Select a category and choose 2-4 models to compare side by side
            </p>
          </div>
        
        {/* Category Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">1. Select Category</Label>
          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map(category => (
                <Card
                  key={category}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedCategory === category
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedModels([]);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      {selectedCategory === category && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Model Selection */}
        {selectedCategory && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">2. Select Models (2-4)</Label>
              <Badge variant="outline">{selectedModels.length}/4 selected</Badge>
            </div>
            
            {modelsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableModels.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No models available for this category.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableModels.map(model => {
                  const isSelected = selectedModels.includes(model.id);
                  const isDisabled = !isSelected && selectedModels.length >= 4;
                  
                  return (
                    <Card
                      key={model.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected
                          ? "ring-2 ring-primary bg-primary/5"
                          : isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => !isDisabled && toggleModel(model.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-sm text-muted-foreground">{model.provider}</p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Start Button */}
        {selectedModels.length >= 2 && (
          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={startComparisonPhase} className="px-8">
              Start Comparison
            </Button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
  
  // Render Model Column
  const renderModelColumn = (model: ComparisonModel, index: number) => {
    const config = modelConfigs[model.id] || defaultModelConfig;
    
    return (
      <div 
        key={model.id}
        className="flex-1 min-w-0 flex flex-col border-r last:border-r-0 border-border"
      >
        {/* Model Header */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            {/* Model Name */}
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="text-sm font-semibold">{model.name}</span>
              <span className="text-xs text-muted-foreground">({model.provider})</span>
            </div>
            
            {/* Settings (Configure Model) */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Configure model">
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <ModelConfigDialog model={model} config={config} />
            </Dialog>
          </div>
        </div>
        
        {/* Model Info Card (shown when no messages) */}
        {exchanges.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full max-w-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold">{model.provider.charAt(0).toLowerCase()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{model.provider}</span>
                    <span className="text-sm mx-1">/</span>
                    <span className="text-sm font-semibold">{model.name}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {model.description || `Fast and versatile ${model.category.toLowerCase()} model`}
                </p>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Context</span>
                  <span className="text-muted-foreground">{model.maxTokens?.toLocaleString() || 'N/A'} tokens</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Chat Messages */}
        {exchanges.length > 0 && (
          <ScrollArea 
            className="flex-1"
            ref={(el) => { scrollRefs.current[model.id] = el as HTMLDivElement; }}
          >
            <div className="p-4 space-y-4">
              {exchanges.map((exchange) => {
                const state = exchange.responses[model.id] || { loading: true };
                
                return (
                  <div key={exchange.id} className="space-y-3">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%]">
                        <p className="text-sm">{exchange.prompt}</p>
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                        {state.loading ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Connecting...</span>
                          </div>
                        ) : state.streaming ? (
                          <div className="space-y-2">
                            <MarkdownRenderer content={state.streamingContent || ''} />
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                          </div>
                        ) : state.error ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Error</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{state.error}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryModel(exchange.id, model.id, exchange.prompt)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          </div>
                        ) : state.response ? (
                          <div className="space-y-2">
                            <MarkdownRenderer content={state.response.response} />
                            <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {(state.response.responseTimeMs / 1000).toFixed(2)}s
                              </span>
                              <span className="flex items-center gap-1">
                                <Coins className="h-3 w-3" />
                                {state.response.tokensUsed} tokens
                              </span>
                              {state.response.isMock && (
                                <Badge variant="outline" className="text-xs py-0 h-5">Mock</Badge>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };
  
  // Render Compare Phase
  const renderComparePhase = () => {
    const selectedModelDetails = getSelectedModelDetails();
    
    return (
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className={cn(
          "flex flex-col border-r bg-muted/20 transition-all",
          sidebarOpen ? "w-12" : "w-0 overflow-hidden"
        )}>
          <div className="flex flex-col items-center py-4 gap-2">
            {/* Back to Selection */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10"
              onClick={() => setPhase("select")}
              title="Back to Model Selection"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* New Chat */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10"
              onClick={startNewChat}
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </Button>
            
            {/* History */}
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10"
                  title="History"
                >
                  <History className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Comparison History</SheetTitle>
                  <SheetDescription>
                    Your previous comparison sessions
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                  <div className="space-y-2 pr-4">
                    {historySessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No history yet
                      </p>
                    ) : (
                      historySessions.map(session => (
                        <Card 
                          key={session.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            // Load session - for now just close
                            setHistoryOpen(false);
                          }}
                        >
                          <CardContent className="p-3">
                            <p className="font-medium text-sm truncate">
                              {session.lastPrompt || session.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {session.modelsUsed.join(", ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Model Columns */}
          <div className="flex-1 flex min-h-0">
            {selectedModelDetails.map((model, index) => renderModelColumn(model, index))}
          </div>
          
          {/* Common Input at Bottom */}
          <div className="border-t bg-background p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3">
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Input
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isSubmitting || isAnyLoading}
                  className="border-0 bg-transparent focus-visible:ring-0 text-base"
                />
                <Button 
                  size="icon" 
                  className="h-9 w-9 flex-shrink-0 rounded-lg"
                  onClick={sendPrompt}
                  disabled={!prompt.trim() || isSubmitting || isAnyLoading}
                >
                  {isSubmitting || isAnyLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {exchanges.length > 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Turn {exchanges.length + 1} • Models maintain conversation context
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return phase === "select" ? renderSelectionPhase() : renderComparePhase();
}
