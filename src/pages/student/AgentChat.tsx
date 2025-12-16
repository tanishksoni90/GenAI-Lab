import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SkyToggle from "@/components/ui/sky-toggle";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  useAgent, 
  useAgentSessions, 
  useCreateSession, 
  useSession, 
  useSendMessage,
  useDashboardStats
} from "@/hooks/useStudentData";
import { Message, Session } from "@/lib/api";
import { 
  ArrowLeft, Send, Plus, MessageSquare, EyeOff, Bot, 
  Zap, Target, TrendingUp, AlertTriangle,
  Copy, ThumbsUp, ThumbsDown,
  PanelRightClose, PanelRight, Loader2, CheckCircle, FileText
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { calculateRequestCost } from "@/lib/modelPricing";
import { useToast } from "@/hooks/use-toast";

// Local message type for UI state
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  score?: number;
  scoreBreakdown?: Record<string, number>;
  tokensUsed?: number;
  blocked?: boolean;
  blockReason?: string;
  feedback?: {
    strengths?: string[];
    improvements?: string[];
    biggestGap?: string;
    suggestion?: string;
  };
}

const AgentChat = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get session ID from URL
  const sessionIdFromUrl = searchParams.get('session');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionIdFromUrl);
  const sessionCreatedRef = useRef(false);
  
  // Backend API hooks
  const { data: agent, isLoading: agentLoading, error: agentError } = useAgent(agentId || '');
  const { data: agentSessions = [], refetch: refetchSessions } = useAgentSessions(agentId || '');
  const { data: currentSession, refetch: refetchCurrentSession } = useSession(currentSessionId || '');
  const { data: stats } = useDashboardStats();
  const createSessionMutation = useCreateSession();
  const sendMessageMutation = useSendMessage();
  
  // Local UI state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // Get welcome message
  const getWelcomeMessage = (): ChatMessage => ({
    id: "welcome-1",
    role: "assistant",
    content: agent 
      ? `Hello! I'm **${agent.name}**, powered by ${agent.model.name}.\n\n${agent.description || "I'm here to help you with your questions."}\n\n${(agent.knowledgeBase?.length || 0) > 0 ? `📚 I have access to ${agent.knowledgeBase?.length || 0} knowledge base file(s) to help answer your questions.\n\n` : ''}How can I assist you today?`
      : "Hello! How can I help you?",
    timestamp: new Date().toLocaleTimeString(),
  });
  
  // Only set session ID if one exists in URL (don't create new session on load)
  useEffect(() => {
    if (!agent || !agentId) return;
    
    if (sessionIdFromUrl) {
      setCurrentSessionId(sessionIdFromUrl);
      sessionCreatedRef.current = true;
    } else {
      // No session in URL - show welcome message but don't create session yet
      // Session will be created when user sends first message
      setMessages([getWelcomeMessage()]);
    }
  }, [agent?.id, sessionIdFromUrl]);
  
  // Load messages from session
  useEffect(() => {
    if (currentSession && currentSession.messages && currentSession.messages.length > 0) {
      const loadedMessages: ChatMessage[] = currentSession.messages.map((msg: Message) => {
        // Parse feedback if it's a JSON string
        let scoreResult = undefined;
        if (msg.feedback) {
          try {
            scoreResult = typeof msg.feedback === 'string' ? JSON.parse(msg.feedback) : msg.feedback;
          } catch {
            scoreResult = undefined;
          }
        }
        
        // Transform criteria array to scoreBreakdown object
        let scoreBreakdown: Record<string, number> | undefined;
        let criteriaDetails: Array<{ name: string; score: number; maxScore: number; feedback: string }> = [];
        
        if (scoreResult?.criteria && Array.isArray(scoreResult.criteria)) {
          scoreBreakdown = {};
          criteriaDetails = scoreResult.criteria;
          scoreResult.criteria.forEach((criterion: { name: string; score: number; maxScore: number; feedback: string }) => {
            const key = criterion.name.toLowerCase().replace(/\s+/g, '');
            scoreBreakdown![key] = Math.round((criterion.score / criterion.maxScore) * 100);
          });
        }

        // Extract feedback - properly handle Gemini vs rule-based responses
        let feedbackData: { strengths?: string[]; improvements?: string[]; biggestGap?: string; suggestion?: string } | undefined;
        if (scoreResult) {
          const isGemini = scoreResult.analysisSource === 'gemini';
          
          if (isGemini) {
            const highScoreCriteria = criteriaDetails.filter(c => c.score >= c.maxScore * 0.7);
            const lowScoreCriteria = criteriaDetails.filter(c => c.score < c.maxScore * 0.7);
            
            feedbackData = {
              strengths: highScoreCriteria.map(c => `**${c.name}**: ${c.feedback}`),
              improvements: lowScoreCriteria.map(c => `**${c.name}**: ${c.feedback}`),
              suggestion: scoreResult.comparison || scoreResult.feedback,
            };
            
            if (typeof scoreResult.feedback === 'string' && lowScoreCriteria.length > 0) {
              feedbackData.biggestGap = scoreResult.feedback;
            }
          } else {
            feedbackData = {
              strengths: criteriaDetails.filter(c => c.score >= c.maxScore * 0.7).map(c => c.feedback),
              improvements: criteriaDetails.filter(c => c.score < c.maxScore * 0.7).map(c => c.feedback),
              suggestion: scoreResult.comparison || scoreResult.feedback,
            };
          }
        }
        
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString(),
          score: msg.score || undefined,
          tokensUsed: msg.tokens,
          scoreBreakdown,
          feedback: feedbackData,
        };
      });
      setMessages(loadedMessages);
    } else if (agent) {
      setMessages([getWelcomeMessage()]);
    }
  }, [currentSession?.id, agent]);
  
  // Calculate session tokens used
  const sessionTokensUsed = messages.reduce((acc, m) => acc + (m.tokensUsed || 0), 0);
  
  // Filter out current session from sidebar
  const otherSessions = agentSessions.filter((s: Session) => s.id !== currentSessionId);
  
  // Calculate session score
  const userMessages = messages.filter(m => m.role === "user" && m.score !== undefined && m.score > 0);
  const sessionScore = userMessages.length > 0
    ? Math.floor(userMessages.reduce((acc, m) => acc + (m.score || 0), 0) / userMessages.length)
    : 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agent) return;

    // If no session exists, create one first (lazy session creation)
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const newSession = await createSessionMutation.mutateAsync({
          modelId: agent.modelId,
          agentId: agent.id,
          title: `${agent.name} Chat`
        });
        sessionId = newSession.id;
        setCurrentSessionId(newSession.id);
        setSearchParams({ session: newSession.id });
        sessionCreatedRef.current = true;
        refetchSessions();
      } catch {
        toast({
          title: "Error",
          description: "Failed to create session",
          variant: "destructive"
        });
        return;
      }
    }

    const inputTokens = Math.ceil(inputMessage.length / 4);
    const estimatedOutputTokens = 150;
    const userTokenCost = calculateRequestCost(agent.modelId, inputTokens, 0, inputMessage.length);
    const responseTokenCost = calculateRequestCost(agent.modelId, 0, estimatedOutputTokens, inputMessage.length);
    const totalCost = userTokenCost + responseTokenCost;
    
    if (stats && stats.tokens.remaining < totalCost) {
      toast({
        title: "Insufficient Tokens",
        description: "You don't have enough tokens for this request.",
        variant: "destructive"
      });
      return;
    }

    // Create optimistic user message
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
      tokensUsed: userTokenCost,
    };

    setMessages(prev => [...prev, tempUserMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const result = await sendMessageMutation.mutateAsync({
        sessionId: sessionId,
        content: inputMessage
      });
      
      // Parse feedback from the response
      let parsedFeedback = undefined;
      if (result.userMessage.feedback) {
        try {
          parsedFeedback = typeof result.userMessage.feedback === 'string' 
            ? JSON.parse(result.userMessage.feedback) 
            : result.userMessage.feedback;
        } catch {
          parsedFeedback = undefined;
        }
      }
      
      // Transform criteria array to scoreBreakdown object
      // Backend sends: [{name: 'Clarity', score: 20, maxScore: 25, feedback: '...'}, ...]
      // Frontend expects: {clarity: 80, specificity: 75, ...} (percentage values)
      let scoreBreakdown: Record<string, number> | undefined;
      let criteriaDetails: Array<{ name: string; score: number; maxScore: number; feedback: string }> = [];
      const scoreResult = parsedFeedback || result.userMessage.scoreResult;
      
      if (scoreResult?.criteria && Array.isArray(scoreResult.criteria)) {
        scoreBreakdown = {};
        criteriaDetails = scoreResult.criteria;
        scoreResult.criteria.forEach((criterion: { name: string; score: number; maxScore: number; feedback: string }) => {
          const key = criterion.name.toLowerCase().replace(/\s+/g, '');
          scoreBreakdown![key] = Math.round((criterion.score / criterion.maxScore) * 100);
        });
      }

      // Extract feedback - properly handle Gemini vs rule-based responses
      let feedbackData: { strengths?: string[]; improvements?: string[]; biggestGap?: string; suggestion?: string } | undefined;
      if (scoreResult) {
        const isGemini = scoreResult.analysisSource === 'gemini';
        
        if (isGemini) {
          const highScoreCriteria = criteriaDetails.filter(c => c.score >= c.maxScore * 0.7);
          const lowScoreCriteria = criteriaDetails.filter(c => c.score < c.maxScore * 0.7);
          
          feedbackData = {
            strengths: highScoreCriteria.map(c => `**${c.name}**: ${c.feedback}`),
            improvements: lowScoreCriteria.map(c => `**${c.name}**: ${c.feedback}`),
            suggestion: scoreResult.comparison || scoreResult.feedback,
          };
          
          if (typeof scoreResult.feedback === 'string' && lowScoreCriteria.length > 0) {
            feedbackData.biggestGap = scoreResult.feedback;
          }
        } else {
          feedbackData = {
            strengths: criteriaDetails.filter(c => c.score >= c.maxScore * 0.7).map(c => c.feedback),
            improvements: criteriaDetails.filter(c => c.score < c.maxScore * 0.7).map(c => c.feedback),
            suggestion: scoreResult.comparison || scoreResult.feedback,
          };
        }
      }

      // Update with actual server response
      const actualUserMessage: ChatMessage = {
        id: result.userMessage.id,
        role: 'user',
        content: result.userMessage.content,
        timestamp: new Date(result.userMessage.createdAt).toLocaleTimeString(),
        score: scoreResult?.totalScore || result.userMessage.score || undefined,
        scoreBreakdown,
        tokensUsed: result.userMessage.tokens,
        feedback: feedbackData,
      };

      const assistantMessage: ChatMessage = {
        id: result.assistantMessage.id,
        role: 'assistant',
        content: result.assistantMessage.content,
        timestamp: new Date(result.assistantMessage.createdAt).toLocaleTimeString(),
        tokensUsed: result.assistantMessage.tokens,
      };

      // Replace temp message with actual messages
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMessage.id);
        return [...filtered, actualUserMessage, assistantMessage];
      });
      
      // Refetch session to update sidebar counts
      refetchCurrentSession();
      refetchSessions();
      
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    if (!agent) return;
    
    // Reset state for new chat - session will be created lazily on first message
    setMessages([getWelcomeMessage()]);
    setCurrentSessionId(null);
    sessionCreatedRef.current = false;
    setSearchParams({});
  };

  const handleSwitchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSearchParams({ session: sessionId });
  };

  // Loading state
  if (agentLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h2 className="text-xl font-semibold mb-2">Loading Agent...</h2>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (agentError || !agent) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
          <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/student/dashboard?tab=agents')}>
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* LEFT SIDEBAR - Agent Sessions */}
      <div className="w-72 border-r border-white/5 flex flex-col glass relative z-10">
        <div className="p-4 border-b border-white/5 space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/student/dashboard?tab=agents')}
            className="w-full justify-start hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>
          
          <Button 
            className="w-full gradient-accent glow-accent btn-press font-semibold" 
            size="sm"
            onClick={handleNewChat}
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            New Chat
          </Button>
        </div>
        
        {/* Agent Info */}
        <div className="p-4 border-b border-white/5">
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{agent.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge className="gradient-primary text-[10px]">Powered by</Badge>
                  <span className="text-[10px] text-muted-foreground">{agent.model.name}</span>
                </div>
              </div>
            </div>
            {(agent.knowledgeBase?.length || 0) > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  {agent.knowledgeBase?.length || 0} KB file(s)
                </div>
              </div>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-3">Agent Sessions</p>
            
            {/* Current Session */}
            {currentSessionId && (
              <div className="px-2 mb-2">
                <div className="glass-card p-2 rounded-lg border border-primary/30 bg-primary/5">
                  <p className="text-xs font-medium truncate text-primary">Current Session</p>
                  <p className="text-[10px] text-muted-foreground">
                    {messages.filter(m => m.role === 'user').length} prompts • {sessionTokensUsed} tokens
                  </p>
                </div>
              </div>
            )}
            
            {otherSessions.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No previous sessions</p>
                <p className="text-[10px] mt-1">Start chatting to create sessions</p>
              </div>
            ) : (
              otherSessions.slice(0, 10).map((session: Session) => (
                <Button
                  key={session.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-white/5"
                  onClick={() => handleSwitchSession(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{session.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {session.promptCount} prompts • {session.tokensUsed} tokens
                    </p>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Token Balance */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="glass p-3 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> Token Balance
              </span>
              <span className={`text-xs font-semibold ${(stats?.tokens.remaining || 0) < 5000 ? 'text-orange-400' : 'text-blue-400'}`}>
                {(stats?.tokens.remaining || 0).toLocaleString()}
              </span>
            </div>
            <Progress value={stats?.tokens.usagePercent || 0} className="h-1.5" />
          </div>
          <div className="glass p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Session Tokens</span>
              <span className="text-xs font-semibold text-cyan-400">{sessionTokensUsed.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER - Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="border-b border-white/5 glass">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-accent glow-accent flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{agent.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">Powered by</span>
                  <Badge className="gradient-primary text-[10px]">{agent.model.name}</Badge>
                  <Badge className={`text-[10px] ${agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {agent.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-4 mr-4">
                <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs text-muted-foreground">Session Score</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-lg font-bold ${
                        sessionScore >= 80 ? 'text-emerald-400' :
                        sessionScore >= 60 ? 'text-cyan-400' :
                        sessionScore >= 40 ? 'text-orange-400' :
                        'text-pink-400'
                      }`}>{sessionScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                </div>
              </div>
              <SkyToggle checked={isDark} onChange={toggleTheme} />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowArtifacts(!showArtifacts)}
                className="hover:bg-white/5"
              >
                {showArtifacts ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] group ${message.role === "user" ? "order-first" : ""}`}>
                  {message.blocked && (
                    <div className="glass rounded-xl p-3 mb-2 border border-orange-500/30 bg-orange-500/5">
                      <div className="flex items-center gap-2 text-orange-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Prompt Blocked</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{message.blockReason}</p>
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl ${
                    message.role === "user"
                      ? message.blocked 
                        ? "glass-card border border-orange-500/30 bg-orange-500/5"
                        : "glass-card border border-pink-500/30 bg-pink-500/5"
                      : "glass-card"
                  }`}>
                    {message.role === "assistant" ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {message.content}
                      </div>
                    )}
                  </div>

                  <div className={`flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}>
                    <span className="text-xs text-muted-foreground mr-2">{message.timestamp}</span>
                    {message.role === "assistant" && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 hover:bg-white/5"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            toast({ title: "Copied to clipboard" });
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="w-10 h-10 rounded-xl gradient-secondary glow-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">You</span>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                    <span className="text-sm text-muted-foreground">{agent.name} is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 glass p-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl overflow-hidden hover-glow">
              <div className="flex items-end gap-2 p-2">
                <div className="flex-1 min-h-[44px] max-h-32">
                  <textarea
                    placeholder={`Message ${agent.name}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full h-full min-h-[44px] bg-transparent border-none outline-none resize-none text-sm py-3 px-2"
                    rows={1}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  className="btn-press h-10 px-4 gradient-accent glow-accent"
                  disabled={isTyping || !inputMessage.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Prompt Score Analysis */}
      {showArtifacts && (
        <div className="w-96 border-l border-white/5 flex flex-col glass relative z-10 animate-slide-in-right">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-secondary glow-secondary flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Prompt Analysis</h3>
                  <p className="text-xs text-muted-foreground">Learn to write better prompts</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 hover:bg-white/5"
                onClick={() => setShowArtifacts(false)}
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 custom-scrollbar">
            {(() => {
              const latestUserMessage = userMessages[userMessages.length - 1];
              
              if (!latestUserMessage) {
                return (
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 rounded-2xl gradient-accent glow-accent flex items-center justify-center mx-auto mb-4 opacity-50">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm font-medium mb-2">No prompts yet</p>
                    <p className="text-xs text-muted-foreground">Send a message to see your prompt analysis</p>
                  </div>
                );
              }

              return (
                <div className="p-4 space-y-4">
                  {/* Current Score */}
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Prompt Score</p>
                        <p className="text-xs text-muted-foreground mt-1">Prompt #{userMessages.length}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {latestUserMessage.tokensUsed} tokens
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-5xl font-bold ${
                        (latestUserMessage.score || 0) >= 80 ? 'text-emerald-400' :
                        (latestUserMessage.score || 0) >= 60 ? 'text-cyan-400' :
                        (latestUserMessage.score || 0) >= 40 ? 'text-orange-400' :
                        'text-pink-400'
                      }`}>{latestUserMessage.score}</div>
                      <div className="flex-1 space-y-1">
                        {latestUserMessage.scoreBreakdown && Object.entries(latestUserMessage.scoreBreakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 capitalize">{key}</span>
                            <Progress value={value} className="h-1 flex-1" />
                            <span className="text-[10px] font-medium w-6">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs">
                      <span className="text-muted-foreground">Session Average</span>
                      <span className="font-bold">{sessionScore}/100 ({userMessages.length} prompts)</span>
                    </div>
                  </div>

                  {/* Strengths */}
                  {latestUserMessage.feedback?.strengths && (
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-emerald-400">Strengths</h4>
                      </div>
                      <ul className="space-y-2">
                        {latestUserMessage.feedback.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span className="text-muted-foreground">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Biggest Gap / Overall Feedback */}
                  {latestUserMessage.feedback?.biggestGap && (latestUserMessage.score || 0) < 80 && (
                    <div className="glass rounded-xl p-4 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <h4 className="text-sm font-semibold text-orange-400">Overall Feedback</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{latestUserMessage.feedback.biggestGap}</p>
                    </div>
                  )}

                  {/* Improvements / What to Try Next */}
                  {latestUserMessage.feedback?.improvements && latestUserMessage.feedback.improvements.length > 0 && (
                    <div className="glass rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-primary">Areas to Improve</h4>
                      </div>
                      <ul className="space-y-2">
                        {latestUserMessage.feedback.improvements.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <span className="text-primary font-bold">{idx + 1}.</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestion for Improvement */}
                  {latestUserMessage.feedback?.suggestion && (
                    <div className="glass rounded-xl p-4 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold text-cyan-400">Suggestion</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{latestUserMessage.feedback.suggestion}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AgentChat;

